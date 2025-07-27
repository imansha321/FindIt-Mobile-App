# Bounty Payment Feature

## Overview
The bounty payment feature allows users to attach monetary rewards to lost item posts. When a user creates a bounty item, they must complete a payment before the item is posted.

## Features

### Payment Modal
- **Card Information Input**: Users can enter their credit/debit card details
- **Real-time Validation**: Card number formatting, expiry date validation, CVV verification
- **Security Indicators**: Visual feedback showing payment is secure
- **Fee Calculation**: Automatic calculation of platform fee (10%) and total amount
- **Payment Processing**: Simulated payment processing with success/failure handling

### Form Integration
- **Bounty Amount Field**: Required field for bounty items with minimum $1.00 validation
- **Visual Indicators**: Error states and helper text for bounty requirements
- **Button States**: Submit button changes to "Submit with Payment" for bounty items
- **Validation**: Comprehensive validation for bounty amount and payment details

## User Flow

1. **Select Item Type**: User chooses "Bounty" from item type options
2. **Enter Bounty Amount**: User enters the reward amount (minimum $1.00)
3. **Fill Other Details**: User completes title, description, category, and location
4. **Submit with Payment**: Button changes to indicate payment requirement
5. **Payment Modal**: Secure payment form appears with card details
6. **Payment Processing**: Simulated payment processing with loading state
7. **Success/Failure**: Item is posted on success, error shown on failure

## Technical Implementation

### Components
- `PaymentModal.tsx`: Handles payment form and processing
- `add-item.tsx`: Integrated payment flow for bounty items

### Validation Rules
- Bounty amount must be at least $1.00
- Card number must be 16 digits
- CVV must be 3 digits
- Expiry date must be in MM/YY format
- All payment fields are required

### Security Features
- Card number formatting with spaces
- CVV field is secure text entry
- Payment information is encrypted (simulated)
- Platform fee transparency (10%)

## Future Enhancements

### Payment Providers
- Integrate with Stripe for real payment processing
- Add support for multiple payment methods
- Implement webhook handling for payment confirmations

### Additional Features
- Payment history tracking
- Refund processing for failed returns
- Escrow system for secure fund holding
- Multiple currency support

## Testing

### Manual Testing Steps
1. Create a new item with type "Bounty"
2. Enter a valid bounty amount ($1.00 or more)
3. Fill in all required fields
4. Click "Submit with Payment"
5. Enter test card details:
   - Card Number: 4242 4242 4242 4242
   - Expiry: 12/25
   - CVV: 123
   - Name: Test User
6. Verify payment processing and success/failure handling

### Error Scenarios
- Invalid bounty amount (less than $1.00)
- Incomplete payment details
- Payment processing failures
- Network connectivity issues

## Configuration

### Platform Fee
Currently set to 10% of bounty amount. Can be modified in `PaymentModal.tsx`:

```typescript
const platformFee = 0.1; // 10%
```

### Payment Success Rate
Simulated payment success rate can be adjusted in `PaymentModal.tsx`:

```typescript
// Simulate 90% success rate
if (Math.random() > 0.1) {
  onPaymentSuccess();
} else {
  onPaymentFailure('Payment failed. Please try again.');
}
``` 