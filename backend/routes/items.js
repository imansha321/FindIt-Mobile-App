const express = require('express');
const { body, validationResult, query } = require('express-validator');
const { v4: uuidv4 } = require('uuid');
const multer = require('multer');
const cloudinary = require('cloudinary').v2;

const { query: dbQuery } = require('../config/database');
const { protect, optionalAuth } = require('../middleware/auth');

const router = express.Router();

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 5 * 1024 * 1024 // 5MB
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = (process.env.ALLOWED_FILE_TYPES || 'image/jpeg,image/png,image/webp').split(',');
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type'), false);
    }
  }
});

// @desc    Get all items with filtering
// @route   GET /api/items
// @access  Public
router.get('/', [
  query('type').optional().isIn(['lost', 'found', 'bounty']).withMessage('Invalid item type'),
  query('category').optional().isString().withMessage('Invalid category'),
  query('search').optional().isString().withMessage('Invalid search term'),
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('Limit must be between 1 and 50')
], optionalAuth, async (req, res) => {
  try {
    console.log('GET /api/items called with query:', req.query);
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        errors: errors.array()
      });
    }

    const { type, category, search, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    let queryStr = `
      SELECT 
        i.*,
        u.name as user_name,
        u.email as user_email,
        u.phone as user_phone
      FROM items i
      LEFT JOIN users u ON i.user_id = u.id
      WHERE i.status = 'active'
    `;

    const queryParams = [];
    let paramCount = 1;

    if (type) {
      queryStr += ` AND i.item_type = $${paramCount}`;
      queryParams.push(type);
      paramCount++;
    }

    if (category && category !== 'All') {
      queryStr += ` AND i.category = $${paramCount}`;
      queryParams.push(category);
      paramCount++;
    }

    if (search) {
      queryStr += ` AND (
        i.title ILIKE $${paramCount} OR 
        i.description ILIKE $${paramCount} OR 
        i.category ILIKE $${paramCount}
      )`;
      queryParams.push(`%${search}%`);
      paramCount++;
    }

    // Count total results for pagination
    const countQuery = `SELECT COUNT(*) FROM (${queryStr}) AS count`;
    const countResult = await dbQuery(countQuery, queryParams);
    const totalItems = parseInt(countResult.rows[0].count);

    // Add pagination and ordering
    queryStr += ` ORDER BY i.is_priority DESC, i.created_at DESC LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
    queryParams.push(limit, offset);

    const result = await dbQuery(queryStr, queryParams);
    console.log('Items fetched:', result.rows.length);
    res.json({
      success: true,
      data: {
        items: result.rows.map(item => ({
          ...item,
          contact_info: {
            name: item.user_name,
            phone: item.user_phone,
            email: item.user_email
          }
        })),
        pagination: {
          current_page: parseInt(page),
          total_pages: Math.ceil(totalItems / limit),
          total_items: totalItems,
          items_per_page: parseInt(limit)
        }
      }
    });
  } catch (error) {
    console.error('Error fetching items:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});


// @desc    Get single item
// @route   GET /api/items/:id
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    console.log('GET /api/items/:id called with id:', req.params.id);
    const { id } = req.params;

    const result = await dbQuery(
      `SELECT i.*, u.name as owner_name, u.phone as owner_phone, u.email as owner_email
       FROM items i
       LEFT JOIN users u ON i.user_id = u.id
       WHERE i.id = $1 AND i.status = 'active'`,
      [id]
    );

    if (result.rows.length === 0) {
      console.warn('Item not found for id:', id);
      return res.status(404).json({
        success: false,
        error: 'Item not found'
      });
    }

    const item = result.rows[0];
    item.contact_info = {
      name: item.owner_name,
      phone: item.owner_phone,
      email: item.owner_email
    };

    res.json({
      success: true,
      data: { item }
    });
  } catch (error) {
    console.error('Get item error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error while fetching item'
    });
  }
});

// @desc    Create new item
// @route   POST /api/items
// @access  Private
router.post('/', protect, upload.array('images', 5), [
  body('title').trim().isLength({ min: 3, max: 100 }).withMessage('Title must be between 3 and 100 characters'),
  body('description').trim().isLength({ min: 10, max: 1000 }).withMessage('Description must be between 10 and 1000 characters'),
  body('category').isIn(['Accessories', 'Electronics', 'Bags', 'Clothing', 'Documents', 'Jewelry', 'Keys', 'Toys', 'Sports', 'Books', 'Cards', 'Tools', 'Pets', 'Other']).withMessage('Invalid category'),
  body('item_type').isIn(['lost', 'found', 'bounty']).withMessage('Invalid item type'),
  body('location').optional().isString().withMessage('Invalid location'),
  body('latitude').optional().isFloat().withMessage('Invalid latitude'),
  body('longitude').optional().isFloat().withMessage('Invalid longitude'),
  body('reward_amount').optional().isFloat({ min: 0 }).withMessage('Reward amount must be a positive number')
], async (req, res) => {
  try {
    console.log('POST /api/items called with body:', req.body);
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const {
      title,
      description,
      category,
      item_type,
      location,
      latitude,
      longitude,
      reward_amount
    } = req.body;

    // Validate bounty items have reward amount
    if (item_type === 'bounty' && (!reward_amount || reward_amount < 1)) {
      console.warn('Bounty item missing/invalid reward_amount:', reward_amount);
      return res.status(400).json({
        success: false,
        error: 'Bounty items must have a reward amount of at least $1'
      });
    }

    // Upload images to Cloudinary
    const imageUrls = [];
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        console.log('Uploading image to Cloudinary:', file.originalname);
        const result = await cloudinary.uploader.upload_stream(
          {
            resource_type: 'image',
            folder: 'findit-items',
            transformation: [
              { width: 800, height: 600, crop: 'limit' },
              { quality: 'auto' }
            ]
          },
          (error, result) => {
            if (error) {
              console.error('Cloudinary upload error:', error);
              throw new Error('Failed to upload image');
            }
            imageUrls.push(result.secure_url);
          }
        ).end(file.buffer);
      }
    }

    // Create item
    const itemId = uuidv4();
    const result = await dbQuery(
      `INSERT INTO items (
        id, user_id, title, description, category, item_type, 
        location, latitude, longitude, reward_amount, images, 
        is_priority, status, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, NOW())
      RETURNING *`,
      [
        itemId,
        req.user.id,
        title,
        description,
        category,
        item_type,
        location,
        latitude,
        longitude,
        reward_amount || null,
        imageUrls,
        false, // is_priority
        'active' // status
      ]
    );

    const item = result.rows[0];
    console.log('Item created with id:', item.id);
    res.status(201).json({
      success: true,
      data: { item }
    });
  } catch (error) {
    console.error('Create item error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error while creating item'
    });
  }
});

// @desc    Update item
// @route   PUT /api/items/:id
// @access  Private
router.put('/:id', protect, [
  body('title').optional().trim().isLength({ min: 3, max: 100 }).withMessage('Title must be between 3 and 100 characters'),
  body('description').optional().trim().isLength({ min: 10, max: 1000 }).withMessage('Description must be between 10 and 1000 characters'),
  body('category').optional().isIn(['Accessories', 'Electronics', 'Bags', 'Clothing', 'Documents', 'Jewelry', 'Keys', 'Toys', 'Sports', 'Books', 'Cards', 'Tools', 'Pets', 'Other']).withMessage('Invalid category'),
  body('location').optional().isString().withMessage('Invalid location'),
  body('reward_amount').optional().isFloat({ min: 0 }).withMessage('Reward amount must be a positive number')
], async (req, res) => {
  try {
    console.log('PUT /api/items/:id called with id:', req.params.id, 'body:', req.body);
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { id } = req.params;
    const updateFields = [];
    const values = [];
    let paramCount = 1;

    // Check if item exists and user owns it
    const existingItem = await dbQuery(
      'SELECT * FROM items WHERE id = $1 AND user_id = $2',
      [id, req.user.id]
    );

    if (existingItem.rows.length === 0) {
      console.warn('Update failed: Item not found or no permission for id:', id);
      return res.status(404).json({
        success: false,
        error: 'Item not found or you do not have permission to edit it'
      });
    }

    const item = existingItem.rows[0];

    // Build update query
    Object.keys(req.body).forEach(key => {
      if (req.body[key] !== undefined && key !== 'id') {
        updateFields.push(`${key} = $${paramCount}`);
        values.push(req.body[key]);
        paramCount++;
      }
    });

    if (updateFields.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No fields to update'
      });
    }

    updateFields.push(`updated_at = NOW()`);
    values.push(id);

    const result = await dbQuery(
      `UPDATE items SET ${updateFields.join(', ')} WHERE id = $${paramCount} RETURNING *`,
      values
    );

    res.json({
      success: true,
      data: { item: result.rows[0] }
    });
  } catch (error) {
    console.error('Update item error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error while updating item'
    });
  }
});

// @desc    Delete item
// @route   DELETE /api/items/:id
// @access  Private
router.delete('/:id', protect, async (req, res) => {
  try {
    console.log('DELETE /api/items/:id called with id:', req.params.id);
    const { id } = req.params;

    // Check if item exists and user owns it
    const existingItem = await dbQuery(
      'SELECT * FROM items WHERE id = $1 AND user_id = $2',
      [id, req.user.id]
    );

    if (existingItem.rows.length === 0) {
      console.warn('Delete failed: Item not found or no permission for id:', id);
      return res.status(404).json({
        success: false,
        error: 'Item not found or you do not have permission to delete it'
      });
    }

    // Soft delete by updating status
    await dbQuery(
      'UPDATE items SET status = $1, updated_at = NOW() WHERE id = $2',
      ['deleted', id]
    );

    res.json({
      success: true,
      message: 'Item deleted successfully'
    });
  } catch (error) {
    console.error('Delete item error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error while deleting item'
    });
  }
});

// @desc    Report item as found/claimed
// @route   POST /api/items/:id/report
// @access  Private
router.post('/:id/report', protect, [
  body('action').isIn(['found', 'claimed']).withMessage('Action must be either "found" or "claimed"'),
  body('message').optional().isString().withMessage('Message must be a string')
], async (req, res) => {
  try {
    console.log('POST /api/items/:id/report called with id:', req.params.id, 'body:', req.body);
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { id } = req.params;
    const { action, message } = req.body;

    // Get item details
    const itemResult = await dbQuery(
      'SELECT * FROM items WHERE id = $1 AND status = $2',
      [id, 'active']
    );

    if (itemResult.rows.length === 0) {
      console.warn('Report failed: Item not found for id:', id);
      return res.status(404).json({
        success: false,
        error: 'Item not found'
      });
    }

    const item = itemResult.rows[0];

    // Create report
    const reportId = uuidv4();
    await dbQuery(
      `INSERT INTO reports (id, item_id, reporter_id, action, message, created_at)
       VALUES ($1, $2, $3, $4, $5, NOW())`,
      [reportId, id, req.user.id, action, message]
    );

    // Update item status
    const newStatus = action === 'found' ? 'found' : 'claimed';
    await dbQuery(
      'UPDATE items SET status = $1, updated_at = NOW() WHERE id = $2',
      [newStatus, id]
    );

    res.json({
      success: true,
      message: `Item ${action} successfully`,
      data: { report_id: reportId }
    });
  } catch (error) {
    console.error('Report item error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error while reporting item'
    });
  }
});

module.exports = router; 