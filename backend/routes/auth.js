const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const { v4: uuidv4 } = require('uuid');

const { query } = require('../config/database');
const { protect } = require('../middleware/auth');

const router = express.Router();

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
router.post('/register', [
  body('name').trim().isLength({ min: 2 }).withMessage('Name must be at least 2 characters'),
  body('email').isEmail().normalizeEmail().withMessage('Please provide a valid email'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('phone').optional().isMobilePhone().withMessage('Please provide a valid phone number')
], async (req, res) => {
  const startTime = Date.now();
  const requestId = Math.random().toString(36).substring(7);
  
  console.log(`[REGISTER-${requestId}] 📝 Registration attempt started`);
  console.log(`[REGISTER-${requestId}] 👤 Name: ${req.body.name}`);
  console.log(`[REGISTER-${requestId}] 📧 Email: ${req.body.email}`);
  console.log(`[REGISTER-${requestId}] 📱 Phone: ${req.body.phone || 'Not provided'}`);
  console.log(`[REGISTER-${requestId}] 🌐 IP: ${req.ip || req.connection.remoteAddress}`);
  console.log(`[REGISTER-${requestId}] 📱 User-Agent: ${req.get('User-Agent')}`);
  
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log(`[REGISTER-${requestId}] ❌ Validation failed:`, errors.array());
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { name, email, password, phone } = req.body;
    console.log(`[REGISTER-${requestId}] ✅ Validation passed`);

    // Check if user already exists
    console.log(`[REGISTER-${requestId}] 🔍 Checking if user already exists...`);
    const existingUser = await query(
      'SELECT id FROM users WHERE email = $1',
      [email]
    );

    if (existingUser.rows.length > 0) {
      console.log(`[REGISTER-${requestId}] ❌ User already exists: ${email}`);
      return res.status(400).json({
        success: false,
        error: 'User already exists with this email'
      });
    }
    console.log(`[REGISTER-${requestId}] ✅ Email is available`);

    // Hash password
    console.log(`[REGISTER-${requestId}] 🔐 Hashing password...`);
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    console.log(`[REGISTER-${requestId}] ✅ Password hashed successfully`);

    // Create user
    console.log(`[REGISTER-${requestId}] 👤 Creating new user in database...`);
    const result = await query(
      `INSERT INTO users (id, name, email, password, phone, created_at) 
       VALUES ($1, $2, $3, $4, $5, NOW()) 
       RETURNING id, name, email, phone, created_at`,
      [uuidv4(), name, email, hashedPassword, phone]
    );

    const user = result.rows[0];
    console.log(`[REGISTER-${requestId}] ✅ User created successfully: ${user.name} (ID: ${user.id})`);

    // Generate JWT token
    console.log(`[REGISTER-${requestId}] 🎫 Generating JWT token...`);
    const token = jwt.sign(
      { id: user.id },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );
    console.log(`[REGISTER-${requestId}] ✅ JWT token generated successfully`);

    const responseTime = Date.now() - startTime;
    console.log(`[REGISTER-${requestId}] 🎉 Registration successful for user: ${user.name}`);
    console.log(`[REGISTER-${requestId}] ⏱️ Response time: ${responseTime}ms`);
    console.log(`[REGISTER-${requestId}] 📊 User details:`, {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone ? '***' : null,
      created_at: user.created_at
    });

    res.status(201).json({
      success: true,
      data: {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          created_at: user.created_at
        },
        token
      }
    });
  } catch (error) {
    const responseTime = Date.now() - startTime;
    console.error(`[REGISTER-${requestId}] 💥 Registration error after ${responseTime}ms:`, error);
    console.error(`[REGISTER-${requestId}] 📍 Error stack:`, error.stack);
    console.error(`[REGISTER-${requestId}] 🔍 Error details:`, {
      message: error.message,
      code: error.code,
      detail: error.detail,
      hint: error.hint
    });
    
    res.status(500).json({
      success: false,
      error: 'Server error during registration'
    });
  }
});

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
router.post('/login', [
  body('email').isEmail().normalizeEmail().withMessage('Please provide a valid email'),
  body('password').exists().withMessage('Password is required')
], async (req, res) => {
  const startTime = Date.now();
  const requestId = Math.random().toString(36).substring(7);
  
  console.log(`[LOGIN-${requestId}] 🔐 Login attempt started`);
  console.log(`[LOGIN-${requestId}] 📧 Email: ${req.body.email}`);
  console.log(`[LOGIN-${requestId}] 🌐 IP: ${req.ip || req.connection.remoteAddress}`);
  console.log(`[LOGIN-${requestId}] 📱 User-Agent: ${req.get('User-Agent')}`);
  
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log(`[LOGIN-${requestId}] ❌ Validation failed:`, errors.array());
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { email, password } = req.body;
    console.log(`[LOGIN-${requestId}] ✅ Validation passed`);

    // Check if user exists
    console.log(`[LOGIN-${requestId}] 🔍 Checking if user exists in database...`);
    const result = await query(
      'SELECT id, name, email, password, phone, created_at FROM users WHERE email = $1',
      [email]
    );

    if (result.rows.length === 0) {
      console.log(`[LOGIN-${requestId}] ❌ User not found: ${email}`);
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials'
      });
    }

    const user = result.rows[0];
    console.log(`[LOGIN-${requestId}] ✅ User found: ${user.name} (ID: ${user.id})`);

    // Check password
    console.log(`[LOGIN-${requestId}] 🔐 Verifying password...`);
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      console.log(`[LOGIN-${requestId}] ❌ Password mismatch for user: ${email}`);
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials'
      });
    }
    console.log(`[LOGIN-${requestId}] ✅ Password verified successfully`);

    // Generate JWT token
    console.log(`[LOGIN-${requestId}] 🎫 Generating JWT token...`);
    const token = jwt.sign(
      { id: user.id },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );
    console.log(`[LOGIN-${requestId}] ✅ JWT token generated successfully`);

    const responseTime = Date.now() - startTime;
    console.log(`[LOGIN-${requestId}] 🎉 Login successful for user: ${user.name}`);
    console.log(`[LOGIN-${requestId}] ⏱️ Response time: ${responseTime}ms`);
    console.log(`[LOGIN-${requestId}] 📊 User details:`, {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone ? '***' : null,
      created_at: user.created_at
    });

    res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          created_at: user.created_at
        },
        token
      }
    });
  } catch (error) {
    const responseTime = Date.now() - startTime;
    console.error(`[LOGIN-${requestId}] 💥 Login error after ${responseTime}ms:`, error);
    console.error(`[LOGIN-${requestId}] 📍 Error stack:`, error.stack);
    console.error(`[LOGIN-${requestId}] 🔍 Error details:`, {
      message: error.message,
      code: error.code,
      detail: error.detail,
      hint: error.hint
    });
    
    res.status(500).json({
      success: false,
      error: 'Server error during login'
    });
  }
});

// @desc    Get current user
// @route   GET /api/auth/me
// @access  Private
router.get('/me', protect, async (req, res) => {
  try {
    res.json({
      success: true,
      data: {
        user: req.user
      }
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// @desc    Update user profile
// @route   PUT /api/auth/profile
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
      error: 'Server error during profile update'
    });
  }
});

// @desc    Change password
// @route   PUT /api/auth/password
// @access  Private
router.put('/password', protect, [
  body('currentPassword').exists().withMessage('Current password is required'),
  body('newPassword').isLength({ min: 6 }).withMessage('New password must be at least 6 characters')
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

    const { currentPassword, newPassword } = req.body;

    // Get current password hash
    const result = await query(
      'SELECT password FROM users WHERE id = $1',
      [req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Verify current password
    const isMatch = await bcrypt.compare(currentPassword, result.rows[0].password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        error: 'Current password is incorrect'
      });
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    // Update password
    await query(
      'UPDATE users SET password = $1, updated_at = NOW() WHERE id = $2',
      [hashedPassword, req.user.id]
    );

    res.json({
      success: true,
      message: 'Password updated successfully'
    });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error during password change'
    });
  }
});

module.exports = router; 