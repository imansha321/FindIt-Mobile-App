const express = require('express');
const { body, validationResult } = require('express-validator');
const { v4: uuidv4 } = require('uuid');
const nodemailer = require('nodemailer');

const { query } = require('../config/database');
const { protect } = require('../middleware/auth');

const router = express.Router();

// Configure email transporter
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

// @desc    Send notification
// @route   POST /api/notifications/send
// @access  Private
router.post('/send', protect, [
  body('recipient_id').isUUID().withMessage('Valid recipient ID is required'),
  body('type').isIn(['item_found', 'item_claimed', 'bounty_paid', 'general']).withMessage('Invalid notification type'),
  body('title').isString().withMessage('Title is required'),
  body('message').isString().withMessage('Message is required'),
  body('item_id').optional().isUUID().withMessage('Valid item ID is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { recipient_id, type, title, message, item_id } = req.body;

    // Get recipient details
    const recipientResult = await query(
      'SELECT id, name, email FROM users WHERE id = $1',
      [recipient_id]
    );

    if (recipientResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Recipient not found'
      });
    }

    const recipient = recipientResult.rows[0];

    // Create notification record
    const notificationId = uuidv4();
    await query(
      `INSERT INTO notifications (
        id, sender_id, recipient_id, type, title, message, 
        item_id, read_status, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())`,
      [
        notificationId,
        req.user.id,
        recipient_id,
        type,
        title,
        message,
        item_id || null,
        false
      ]
    );

    // Send email notification
    if (recipient.email) {
      const mailOptions = {
        from: process.env.SMTP_USER,
        to: recipient.email,
        subject: `FindIt: ${title}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #FFD700;">FindIt Notification</h2>
            <h3>${title}</h3>
            <p>${message}</p>
            ${item_id ? `<p><a href="${process.env.FRONTEND_URL}/item/${item_id}" style="color: #FFD700;">View Item</a></p>` : ''}
            <hr>
            <p style="font-size: 12px; color: #666;">
              You received this notification from FindIt. 
              <a href="${process.env.FRONTEND_URL}/notifications" style="color: #FFD700;">Manage notifications</a>
            </p>
          </div>
        `
      };

      try {
        await transporter.sendMail(mailOptions);
        console.log('Email notification sent to:', recipient.email);
      } catch (emailError) {
        console.error('Email notification failed:', emailError);
        // Don't fail the request if email fails
      }
    }

    res.json({
      success: true,
      data: {
        notification_id: notificationId,
        sent_at: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Send notification error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error while sending notification'
    });
  }
});

// @desc    Get user notifications
// @route   GET /api/notifications
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const { page = 1, limit = 20, unread_only = false } = req.query;
    const offset = (page - 1) * limit;

    let whereConditions = ['recipient_id = $1'];
    let values = [req.user.id];
    let paramCount = 2;

    if (unread_only === 'true') {
      whereConditions.push(`read_status = $${paramCount}`);
      values.push(false);
      paramCount++;
    }

    const whereClause = whereConditions.join(' AND ');

    // Get total count
    const countResult = await query(
      `SELECT COUNT(*) FROM notifications WHERE ${whereClause}`,
      values
    );

    const totalNotifications = parseInt(countResult.rows[0].count);
    const totalPages = Math.ceil(totalNotifications / limit);

    // Get notifications with pagination
    const notificationsResult = await query(
      `SELECT n.*, u.name as sender_name, i.title as item_title
       FROM notifications n
       LEFT JOIN users u ON n.sender_id = u.id
       LEFT JOIN items i ON n.item_id = i.id
       WHERE ${whereClause}
       ORDER BY n.created_at DESC
       LIMIT $${paramCount} OFFSET $${paramCount + 1}`,
      [...values, limit, offset]
    );

    res.json({
      success: true,
      data: {
        notifications: notificationsResult.rows,
        pagination: {
          current_page: parseInt(page),
          total_pages: totalPages,
          total_notifications: totalNotifications,
          notifications_per_page: parseInt(limit)
        }
      }
    });
  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error while fetching notifications'
    });
  }
});

// @desc    Mark notification as read
// @route   PUT /api/notifications/:id/read
// @access  Private
router.put('/:id/read', protect, async (req, res) => {
  try {
    const { id } = req.params;

    const result = await query(
      `UPDATE notifications SET read_status = $1, updated_at = NOW() 
       WHERE id = $2 AND recipient_id = $3 
       RETURNING *`,
      [true, id, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Notification not found'
      });
    }

    res.json({
      success: true,
      data: {
        notification: result.rows[0]
      }
    });
  } catch (error) {
    console.error('Mark notification read error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error while marking notification as read'
    });
  }
});

// @desc    Mark all notifications as read
// @route   PUT /api/notifications/read-all
// @access  Private
router.put('/read-all', protect, async (req, res) => {
  try {
    await query(
      `UPDATE notifications SET read_status = $1, updated_at = NOW() 
       WHERE recipient_id = $2 AND read_status = $3`,
      [true, req.user.id, false]
    );

    res.json({
      success: true,
      message: 'All notifications marked as read'
    });
  } catch (error) {
    console.error('Mark all notifications read error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error while marking all notifications as read'
    });
  }
});

// @desc    Delete notification
// @route   DELETE /api/notifications/:id
// @access  Private
router.delete('/:id', protect, async (req, res) => {
  try {
    const { id } = req.params;

    const result = await query(
      'DELETE FROM notifications WHERE id = $1 AND recipient_id = $2 RETURNING *',
      [id, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Notification not found'
      });
    }

    res.json({
      success: true,
      message: 'Notification deleted successfully'
    });
  } catch (error) {
    console.error('Delete notification error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error while deleting notification'
    });
  }
});

// @desc    Get notification count
// @route   GET /api/notifications/count
// @access  Private
router.get('/count', protect, async (req, res) => {
  try {
    const result = await query(
      'SELECT COUNT(*) as total, COUNT(CASE WHEN read_status = false THEN 1 END) as unread FROM notifications WHERE recipient_id = $1',
      [req.user.id]
    );

    res.json({
      success: true,
      data: {
        total: parseInt(result.rows[0].total),
        unread: parseInt(result.rows[0].unread)
      }
    });
  } catch (error) {
    console.error('Get notification count error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error while fetching notification count'
    });
  }
});

// @desc    Send item found notification
// @route   POST /api/notifications/item-found
// @access  Private
router.post('/item-found', protect, [
  body('item_id').isUUID().withMessage('Valid item ID is required'),
  body('message').optional().isString().withMessage('Message must be a string')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { item_id, message } = req.body;

    // Get item details
    const itemResult = await query(
      'SELECT i.*, u.name as owner_name FROM items i LEFT JOIN users u ON i.user_id = u.id WHERE i.id = $1',
      [item_id]
    );

    if (itemResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Item not found'
      });
    }

    const item = itemResult.rows[0];

    // Send notification to item owner
    const notificationData = {
      recipient_id: item.user_id,
      type: 'item_found',
      title: 'Item Found!',
      message: message || `Your ${item.item_type} item "${item.title}" has been found!`,
      item_id: item_id
    };

    // Create notification
    const notificationId = uuidv4();
    await query(
      `INSERT INTO notifications (
        id, sender_id, recipient_id, type, title, message, 
        item_id, read_status, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())`,
      [
        notificationId,
        req.user.id,
        item.user_id,
        notificationData.type,
        notificationData.title,
        notificationData.message,
        item_id,
        false
      ]
    );

    // Send email to item owner
    if (item.owner_name) {
      const mailOptions = {
        from: process.env.SMTP_USER,
        to: item.owner_email,
        subject: `FindIt: Your ${item.item_type} item has been found!`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #FFD700;">Great News!</h2>
            <h3>Your ${item.item_type} item has been found!</h3>
            <p><strong>Item:</strong> ${item.title}</p>
            <p><strong>Category:</strong> ${item.category}</p>
            <p><strong>Location:</strong> ${item.location || 'Not specified'}</p>
            ${message ? `<p><strong>Message from finder:</strong> ${message}</p>` : ''}
            <p><a href="${process.env.FRONTEND_URL}/item/${item_id}" style="color: #FFD700;">View Item Details</a></p>
            <hr>
            <p style="font-size: 12px; color: #666;">
              This notification was sent from FindIt. 
              <a href="${process.env.FRONTEND_URL}/notifications" style="color: #FFD700;">Manage notifications</a>
            </p>
          </div>
        `
      };

      try {
        await transporter.sendMail(mailOptions);
        console.log('Item found email sent to:', item.owner_email);
      } catch (emailError) {
        console.error('Item found email failed:', emailError);
      }
    }

    res.json({
      success: true,
      message: 'Item found notification sent successfully',
      data: {
        notification_id: notificationId
      }
    });
  } catch (error) {
    console.error('Item found notification error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error while sending item found notification'
    });
  }
});

module.exports = router; 