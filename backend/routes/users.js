const express = require('express');
const { body, validationResult } = require('express-validator');
const { v4: uuidv4 } = require('uuid');

const { query } = require('../config/database');
const { protect } = require('../middleware/auth');

const router = express.Router();

// @desc    Get user profile
// @route   GET /api/users/profile
// @access  Private
router.get('/profile', protect, async (req, res) => {
  try {
    const result = await query(
      'SELECT id, name, email, phone, created_at, updated_at FROM users WHERE id = $1',
      [req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    res.json({
      success: true,
      data: {
        user: result.rows[0]
      }
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error while fetching profile'
    });
  }
});

// @desc    Get user's items
// @route   GET /api/users/items
// @access  Private
router.get('/items', protect, async (req, res) => {
  try {
    const { type, status, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    let whereConditions = ['user_id = $1'];
    let values = [req.user.id];
    let paramCount = 2;

    if (type) {
      whereConditions.push(`item_type = $${paramCount}`);
      values.push(type);
      paramCount++;
    }

    if (status) {
      whereConditions.push(`status = $${paramCount}`);
      values.push(status);
      paramCount++;
    }

    const whereClause = whereConditions.join(' AND ');

    // Get total count
    const countResult = await query(
      `SELECT COUNT(*) FROM items WHERE ${whereClause}`,
      values
    );

    const totalItems = parseInt(countResult.rows[0].count);
    const totalPages = Math.ceil(totalItems / limit);

    // Get items with pagination
    const itemsResult = await query(
      `SELECT * FROM items WHERE ${whereClause}
       ORDER BY created_at DESC
       LIMIT $${paramCount} OFFSET $${paramCount + 1}`,
      [...values, limit, offset]
    );

    res.json({
      success: true,
      data: {
        items: itemsResult.rows,
        pagination: {
          current_page: parseInt(page),
          total_pages: totalPages,
          total_items: totalItems,
          items_per_page: parseInt(limit)
        }
      }
    });
  } catch (error) {
    console.error('Get user items error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error while fetching user items'
    });
  }
});

// @desc    Get user statistics
// @route   GET /api/users/stats
// @access  Private
router.get('/stats', protect, async (req, res) => {
  try {
    // Get item counts by type
    const itemStatsResult = await query(
      `SELECT 
        item_type,
        status,
        COUNT(*) as count
       FROM items 
       WHERE user_id = $1 
       GROUP BY item_type, status`,
      [req.user.id]
    );

    // Get payment statistics
    const paymentStatsResult = await query(
      `SELECT 
        COUNT(*) as total_payments,
        SUM(amount) as total_spent,
        SUM(platform_fee) as total_fees
       FROM payments 
       WHERE user_id = $1 AND status = 'completed'`,
      [req.user.id]
    );

    // Get payout statistics
    const payoutStatsResult = await query(
      `SELECT 
        COUNT(*) as total_payouts,
        SUM(amount) as total_earned
       FROM payouts 
       WHERE finder_id = $1 AND status = 'completed'`,
      [req.user.id]
    );

    const stats = {
      items: itemStatsResult.rows,
      payments: paymentStatsResult.rows[0] || { total_payments: 0, total_spent: 0, total_fees: 0 },
      payouts: payoutStatsResult.rows[0] || { total_payouts: 0, total_earned: 0 }
    };

    res.json({
      success: true,
      data: { stats }
    });
  } catch (error) {
    console.error('Get user stats error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error while fetching user statistics'
    });
  }
});

// @desc    Update user profile
// @route   PUT /api/users/profile
// @access  Private
router.put('/profile', protect, [
  body('name').optional().trim().isLength({ min: 2 }).withMessage('Name must be at least 2 characters'),
  body('phone').optional().isMobilePhone().withMessage('Please provide a valid phone number')
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

    const { name, phone } = req.body;
    const updateFields = [];
    const values = [];
    let paramCount = 1;

    if (name) {
      updateFields.push(`name = $${paramCount}`);
      values.push(name);
      paramCount++;
    }

    if (phone) {
      updateFields.push(`phone = $${paramCount}`);
      values.push(phone);
      paramCount++;
    }

    if (updateFields.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No fields to update'
      });
    }

    values.push(req.user.id);

    const result = await query(
      `UPDATE users SET ${updateFields.join(', ')}, updated_at = NOW() 
       WHERE id = $${paramCount} 
       RETURNING id, name, email, phone, created_at, updated_at`,
      values
    );

    res.json({
      success: true,
      data: {
        user: result.rows[0]
      }
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error while updating profile'
    });
  }
});

// @desc    Delete user account
// @route   DELETE /api/users/account
// @access  Private
router.delete('/account', protect, async (req, res) => {
  try {
    // Soft delete user account
    await query(
      'UPDATE users SET status = $1, updated_at = NOW() WHERE id = $2',
      ['deleted', req.user.id]
    );

    // Soft delete user's items
    await query(
      'UPDATE items SET status = $1, updated_at = NOW() WHERE user_id = $2',
      ['deleted', req.user.id]
    );

    res.json({
      success: true,
      message: 'Account deleted successfully'
    });
  } catch (error) {
    console.error('Delete account error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error while deleting account'
    });
  }
});

// @desc    Get user's reports
// @route   GET /api/users/reports
// @access  Private
router.get('/reports', protect, async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    // Get user's reports
    const result = await query(
      `SELECT r.*, i.title as item_title, i.item_type, u.name as reporter_name
       FROM reports r
       LEFT JOIN items i ON r.item_id = i.id
       LEFT JOIN users u ON r.reporter_id = u.id
       WHERE r.reporter_id = $1 OR i.user_id = $1
       ORDER BY r.created_at DESC
       LIMIT $2 OFFSET $3`,
      [req.user.id, limit, offset]
    );

    // Get total count
    const countResult = await query(
      `SELECT COUNT(*) FROM reports r
       LEFT JOIN items i ON r.item_id = i.id
       WHERE r.reporter_id = $1 OR i.user_id = $1`,
      [req.user.id]
    );

    const totalReports = parseInt(countResult.rows[0].count);
    const totalPages = Math.ceil(totalReports / limit);

    res.json({
      success: true,
      data: {
        reports: result.rows,
        pagination: {
          current_page: parseInt(page),
          total_pages: totalPages,
          total_reports: totalReports,
          reports_per_page: parseInt(limit)
        }
      }
    });
  } catch (error) {
    console.error('Get user reports error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error while fetching user reports'
    });
  }
});

// @desc    Set up Stripe Connect account
// @route   POST /api/users/stripe-connect
// @access  Private
router.post('/stripe-connect', protect, [
  body('country').isString().withMessage('Country is required'),
  body('email').isEmail().withMessage('Valid email is required')
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

    const { country, email } = req.body;

    // Create Stripe Connect account
    const account = await stripe.accounts.create({
      type: 'express',
      country: country,
      email: email,
      capabilities: {
        card_payments: { requested: true },
        transfers: { requested: true },
      },
    });

    // Update user with Stripe account ID
    await query(
      'UPDATE users SET stripe_account_id = $1, updated_at = NOW() WHERE id = $2',
      [account.id, req.user.id]
    );

    // Create account link for onboarding
    const accountLink = await stripe.accountLinks.create({
      account: account.id,
      refresh_url: `${process.env.FRONTEND_URL}/stripe/refresh`,
      return_url: `${process.env.FRONTEND_URL}/stripe/return`,
      type: 'account_onboarding',
    });

    res.json({
      success: true,
      data: {
        account_id: account.id,
        account_link: accountLink.url
      }
    });
  } catch (error) {
    console.error('Stripe Connect setup error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error while setting up Stripe Connect'
    });
  }
});

// @desc    Get Stripe Connect account status
// @route   GET /api/users/stripe-connect
// @access  Private
router.get('/stripe-connect', protect, async (req, res) => {
  try {
    const result = await query(
      'SELECT stripe_account_id FROM users WHERE id = $1',
      [req.user.id]
    );

    if (!result.rows[0].stripe_account_id) {
      return res.json({
        success: true,
        data: {
          connected: false,
          account: null
        }
      });
    }

    // Get account details from Stripe
    const account = await stripe.accounts.retrieve(result.rows[0].stripe_account_id);

    res.json({
      success: true,
      data: {
        connected: true,
        account: {
          id: account.id,
          charges_enabled: account.charges_enabled,
          payouts_enabled: account.payouts_enabled,
          details_submitted: account.details_submitted
        }
      }
    });
  } catch (error) {
    console.error('Get Stripe Connect status error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error while fetching Stripe Connect status'
    });
  }
});

module.exports = router; 