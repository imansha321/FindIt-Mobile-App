const express = require('express');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { body, validationResult } = require('express-validator');
const { v4: uuidv4 } = require('uuid');

const { query } = require('../config/database');
const { protect } = require('../middleware/auth');

const router = express.Router();

// @desc    Create payment intent for bounty
// @route   POST /api/payments/create-intent
// @access  Private
router.post('/create-intent', protect, [
  body('item_id').isUUID().withMessage('Valid item ID is required'),
  body('amount').isFloat({ min: 1 }).withMessage('Amount must be at least $1')
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

    const { item_id, amount } = req.body;

    // Verify item exists and is a bounty item
    const itemResult = await query(
      'SELECT * FROM items WHERE id = $1 AND item_type = $2 AND status = $3',
      [item_id, 'bounty', 'active']
    );

    if (itemResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Bounty item not found'
      });
    }

    const item = itemResult.rows[0];

    // Verify amount matches item reward
    if (amount !== item.reward_amount) {
      return res.status(400).json({
        success: false,
        error: 'Payment amount does not match bounty amount'
      });
    }

    // Calculate platform fee (10%)
    const platformFee = Math.round(amount * 0.1 * 100); // Convert to cents
    const totalAmount = Math.round(amount * 100); // Convert to cents

    // Create payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: totalAmount,
      currency: 'usd',
      metadata: {
        item_id,
        user_id: req.user.id,
        platform_fee: platformFee
      },
      application_fee_amount: platformFee,
      transfer_data: {
        destination: process.env.STRIPE_CONNECT_ACCOUNT_ID, // Platform account
      },
    });

    // Store payment intent in database
    const paymentId = uuidv4();
    await query(
      `INSERT INTO payments (
        id, user_id, item_id, amount, platform_fee, 
        stripe_payment_intent_id, status, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())`,
      [
        paymentId,
        req.user.id,
        item_id,
        amount,
        platformFee / 100,
        paymentIntent.id,
        'pending'
      ]
    );

    res.json({
      success: true,
      data: {
        client_secret: paymentIntent.client_secret,
        payment_id: paymentId,
        amount: totalAmount,
        platform_fee: platformFee
      }
    });
  } catch (error) {
    console.error('Create payment intent error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error while creating payment intent'
    });
  }
});

// @desc    Confirm payment
// @route   POST /api/payments/confirm
// @access  Private
router.post('/confirm', protect, [
  body('payment_intent_id').isString().withMessage('Payment intent ID is required'),
  body('item_id').isUUID().withMessage('Valid item ID is required')
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

    const { payment_intent_id, item_id } = req.body;

    // Verify payment intent
    const paymentIntent = await stripe.paymentIntents.retrieve(payment_intent_id);

    if (paymentIntent.status !== 'succeeded') {
      return res.status(400).json({
        success: false,
        error: 'Payment not completed'
      });
    }

    // Update payment status in database
    await query(
      `UPDATE payments SET status = $1, updated_at = NOW() 
       WHERE stripe_payment_intent_id = $2`,
      ['completed', payment_intent_id]
    );

    // Update item status to paid
    await query(
      `UPDATE items SET payment_status = $1, updated_at = NOW() 
       WHERE id = $2`,
      ['paid', item_id]
    );

    res.json({
      success: true,
      message: 'Payment confirmed successfully'
    });
  } catch (error) {
    console.error('Confirm payment error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error while confirming payment'
    });
  }
});

// @desc    Process bounty payout
// @route   POST /api/payments/payout
// @access  Private
router.post('/payout', protect, [
  body('item_id').isUUID().withMessage('Valid item ID is required'),
  body('finder_id').isUUID().withMessage('Valid finder ID is required')
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

    const { item_id, finder_id } = req.body;

    // Verify item exists and is a bounty item
    const itemResult = await query(
      'SELECT * FROM items WHERE id = $1 AND item_type = $2 AND status = $3',
      [item_id, 'bounty', 'found']
    );

    if (itemResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Bounty item not found or not in found status'
      });
    }

    const item = itemResult.rows[0];

    // Verify user owns the item
    if (item.user_id !== req.user.id) {
      return res.status(403).json({
        success: false,
        error: 'You can only payout for your own bounty items'
      });
    }

    // Get finder's Stripe account
    const finderResult = await query(
      'SELECT stripe_account_id FROM users WHERE id = $1',
      [finder_id]
    );

    if (finderResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Finder not found'
      });
    }

    const finder = finderResult.rows[0];

    if (!finder.stripe_account_id) {
      return res.status(400).json({
        success: false,
        error: 'Finder has not set up payment account'
      });
    }

    // Calculate payout amount (90% of bounty, 10% platform fee)
    const payoutAmount = Math.round(item.reward_amount * 0.9 * 100); // Convert to cents

    // Create transfer to finder
    const transfer = await stripe.transfers.create({
      amount: payoutAmount,
      currency: 'usd',
      destination: finder.stripe_account_id,
      metadata: {
        item_id,
        finder_id,
        bounty_amount: item.reward_amount
      }
    });

    // Update item status
    await query(
      `UPDATE items SET payout_status = $1, payout_amount = $2, updated_at = NOW() 
       WHERE id = $3`,
      ['paid', payoutAmount / 100, item_id]
    );

    // Create payout record
    const payoutId = uuidv4();
    await query(
      `INSERT INTO payouts (
        id, item_id, finder_id, amount, stripe_transfer_id, status, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, NOW())`,
      [
        payoutId,
        item_id,
        finder_id,
        payoutAmount / 100,
        transfer.id,
        'completed'
      ]
    );

    res.json({
      success: true,
      message: 'Bounty payout completed successfully',
      data: {
        payout_id: payoutId,
        amount: payoutAmount / 100,
        transfer_id: transfer.id
      }
    });
  } catch (error) {
    console.error('Payout error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error while processing payout'
    });
  }
});

// @desc    Get payment history
// @route   GET /api/payments/history
// @access  Private
router.get('/history', protect, async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    // Get user's payment history
    const result = await query(
      `SELECT p.*, i.title as item_title, i.item_type
       FROM payments p
       LEFT JOIN items i ON p.item_id = i.id
       WHERE p.user_id = $1
       ORDER BY p.created_at DESC
       LIMIT $2 OFFSET $3`,
      [req.user.id, limit, offset]
    );

    // Get total count
    const countResult = await query(
      'SELECT COUNT(*) FROM payments WHERE user_id = $1',
      [req.user.id]
    );

    const totalPayments = parseInt(countResult.rows[0].count);
    const totalPages = Math.ceil(totalPayments / limit);

    res.json({
      success: true,
      data: {
        payments: result.rows,
        pagination: {
          current_page: parseInt(page),
          total_pages: totalPages,
          total_payments: totalPayments,
          payments_per_page: parseInt(limit)
        }
      }
    });
  } catch (error) {
    console.error('Get payment history error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error while fetching payment history'
    });
  }
});

// @desc    Stripe webhook handler
// @route   POST /api/payments/webhook
// @access  Public
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle the event
  switch (event.type) {
    case 'payment_intent.succeeded':
      const paymentIntent = event.data.object;
      console.log('Payment succeeded:', paymentIntent.id);
      
      // Update payment status in database
      await query(
        `UPDATE payments SET status = $1, updated_at = NOW() 
         WHERE stripe_payment_intent_id = $2`,
        ['completed', paymentIntent.id]
      );
      break;

    case 'payment_intent.payment_failed':
      const failedPayment = event.data.object;
      console.log('Payment failed:', failedPayment.id);
      
      // Update payment status in database
      await query(
        `UPDATE payments SET status = $1, updated_at = NOW() 
         WHERE stripe_payment_intent_id = $2`,
        ['failed', failedPayment.id]
      );
      break;

    case 'transfer.created':
      const transfer = event.data.object;
      console.log('Transfer created:', transfer.id);
      break;

    case 'transfer.failed':
      const failedTransfer = event.data.object;
      console.log('Transfer failed:', failedTransfer.id);
      
      // Update payout status
      await query(
        `UPDATE payouts SET status = $1, updated_at = NOW() 
         WHERE stripe_transfer_id = $2`,
        ['failed', failedTransfer.id]
      );
      break;

    default:
      console.log(`Unhandled event type: ${event.type}`);
  }

  res.json({ received: true });
});

module.exports = router; 