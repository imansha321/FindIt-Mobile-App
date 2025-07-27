# Frontend-Backend Integration Guide

## Overview

This guide explains how the React Native frontend has been integrated with the Node.js/Express backend API.

## Architecture

### Frontend (React Native/Expo)
- **Location**: `/app/` directory
- **Framework**: Expo Router for navigation
- **UI**: React Native Paper components
- **State Management**: React Context for authentication
- **API Communication**: Custom API service class

### Backend (Node.js/Express)
- **Location**: `/backend/` directory
- **Framework**: Express.js with TypeScript
- **Database**: PostgreSQL with Supabase
- **Authentication**: JWT tokens
- **File Upload**: Cloudinary for images
- **Payments**: Stripe integration

## Key Integration Points

### 1. API Service (`app/services/api.ts`)

The main API service handles all HTTP requests to the backend:

```typescript
class ApiService {
  private token: string | null = null;
  
  // Authentication methods
  async login(credentials): Promise<AuthResponse>
  async register(userData): Promise<AuthResponse>
  async logout(): Promise<void>
  
  // Item management
  async getItems(params): Promise<ItemsResponse>
  async createItem(itemData): Promise<Item>
  async getItem(id): Promise<Item>
  
  // Payment processing
  async createPaymentIntent(itemId, amount): Promise<PaymentIntent>
  async confirmPayment(paymentIntentId, itemId): Promise<void>
}
```

### 2. Authentication Context (`app/context/AuthContext.tsx`)

Manages user authentication state throughout the app:

```typescript
interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (userData) => Promise<void>;
  logout: () => Promise<void>;
}
```

### 3. Updated Components

#### Item Listing Screens
- **Lost Items** (`app/(tabs)/lost/index.tsx`)
- **Found Items** (`app/(tabs)/found/index.tsx`)
- **Bounty Items** (`app/(tabs)/bounty/index.tsx`)

All now use real API calls instead of mock data:
```typescript
const fetchLostItems = async () => {
  const response = await apiService.getItems({ type: 'lost' });
  setItems(response.items);
};
```

#### Item Detail Screen (`app/item/[id].tsx`)
- Fetches real item data from API
- Handles item reporting (found/claimed)
- Supports contact and messaging features

#### Add Item Form (`app/add-item.tsx`)
- Creates items using FormData for file uploads
- Integrates with payment system for bounty items
- Handles location services and image uploads

### 4. Payment Integration

The payment system is fully integrated:

```typescript
// PaymentModal component handles Stripe-like payment flow
<PaymentModal
  visible={showPaymentModal}
  amount={formData.reward_amount || 0}
  onSuccess={handlePaymentSuccess}
  onCancel={handlePaymentCancel}
  itemTitle={formData.title}
/>
```

## Environment Configuration

### Frontend Environment

Create `.env` file in the root directory:
```env
EXPO_PUBLIC_API_URL=http://localhost:3001/api
```

### Backend Environment

Copy `backend/.env.example` to `backend/.env` and configure:
```env
DATABASE_URL=your_postgresql_connection_string
JWT_SECRET=your_jwt_secret
CLOUDINARY_CLOUD_NAME=your_cloudinary_name
CLOUDINARY_API_KEY=your_cloudinary_key
CLOUDINARY_API_SECRET=your_cloudinary_secret
STRIPE_SECRET_KEY=your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret
```

## Setup Instructions

### 1. Backend Setup

```bash
cd backend
npm install
cp .env.example .env
# Configure .env with your credentials
npm run migrate  # Sets up database and sample data
npm start  # Starts server on port 3001
```

### 2. Frontend Setup

```bash
# In the root directory
npm install
npx expo start
```

### 3. Database Setup

The migration script creates all necessary tables:
- `users` - User accounts and profiles
- `items` - Lost, found, and bounty items
- `payments` - Payment records
- `payouts` - Bounty payouts
- `reports` - Item found/claimed reports
- `notifications` - In-app notifications

## API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user
- `PUT /api/auth/profile` - Update profile

### Items
- `GET /api/items` - List items with filtering
- `POST /api/items` - Create new item
- `GET /api/items/:id` - Get item details
- `PUT /api/items/:id` - Update item
- `DELETE /api/items/:id` - Delete item
- `POST /api/items/:id/report` - Report item found/claimed

### Payments
- `POST /api/payments/create-intent` - Create payment intent
- `POST /api/payments/confirm` - Confirm payment
- `POST /api/payments/payout` - Process bounty payout

### Users
- `GET /api/users/profile` - Get user profile
- `GET /api/users/items` - Get user's items
- `GET /api/users/stats` - Get user statistics

### Notifications
- `GET /api/notifications` - Get notifications
- `PUT /api/notifications/:id/read` - Mark as read
- `POST /api/notifications/item-found` - Send notification

## Key Features

### 1. Real-time Data
- All item listings now fetch from the database
- Search and filtering work with backend queries
- Pagination support for large datasets

### 2. Authentication Flow
- JWT token-based authentication
- Automatic token storage in AsyncStorage
- Protected routes and API calls

### 3. File Upload
- Image uploads to Cloudinary
- FormData handling for multipart requests
- Progress tracking and error handling

### 4. Payment Processing
- Stripe integration for bounty payments
- Secure payment flow with client-side validation
- Payment confirmation and item creation

### 5. Location Services
- GPS location detection
- Reverse geocoding for addresses
- Map integration for item locations

## Error Handling

The integration includes comprehensive error handling:

```typescript
try {
  const response = await apiService.getItems(params);
  setItems(response.items);
} catch (error: any) {
  console.error('Error fetching items:', error);
  setError('Failed to load items. Please try again.');
}
```

## Testing the Integration

### 1. Start Backend
```bash
cd backend
npm start
```

### 2. Start Frontend
```bash
npx expo start
```

### 3. Test Features
- Register/login with the app
- Create lost/found/bounty items
- Test payment flow for bounty items
- Search and filter items
- View item details and contact owners

## Troubleshooting

### Common Issues

1. **API Connection Failed**
   - Check if backend is running on port 3001
   - Verify API_BASE_URL in api.ts
   - Check network connectivity

2. **Authentication Errors**
   - Clear AsyncStorage and re-login
   - Check JWT_SECRET in backend .env
   - Verify token expiration

3. **Image Upload Issues**
   - Check Cloudinary credentials
   - Verify file size limits
   - Check network permissions

4. **Payment Errors**
   - Verify Stripe keys in backend .env
   - Check payment amount validation
   - Test with Stripe test cards

### Debug Mode

Enable debug logging in `app/services/api.ts`:
```typescript
console.log('API request:', url, options);
console.log('API response:', data);
```

## Next Steps

1. **Production Deployment**
   - Deploy backend to Heroku/Railway
   - Deploy frontend to Expo Application Services
   - Configure production environment variables

2. **Additional Features**
   - Push notifications
   - Real-time chat
   - Advanced search filters
   - User ratings and reviews

3. **Performance Optimization**
   - Image caching
   - API response caching
   - Lazy loading for large lists

## Security Considerations

- All API calls use HTTPS in production
- JWT tokens are securely stored
- Input validation on both frontend and backend
- Rate limiting on API endpoints
- File upload validation and sanitization

This integration provides a complete, production-ready solution for the FindIt app with real backend functionality, authentication, payments, and data persistence. 