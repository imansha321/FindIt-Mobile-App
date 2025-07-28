# Authentication Integration - Frontend & Backend

## Overview
The FindIt app now has complete authentication integration between the frontend React Native app and the backend Node.js server. Users can register, login, and maintain authenticated sessions.

## Backend API Endpoints

### Authentication Routes (`/api/auth`)

#### 1. Register User
- **POST** `/api/auth/register`
- **Body:**
  ```json
  {
    "name": "John Doe",
    "email": "john@example.com",
    "password": "password123",
    "phone": "+1234567890" // optional
  }
  ```
- **Response:**
  ```json
  {
    "success": true,
    "data": {
      "user": {
        "id": "uuid",
        "name": "John Doe",
        "email": "john@example.com",
        "phone": "+1234567890",
        "created_at": "2025-01-20T10:00:00Z"
      },
      "token": "jwt_token_here"
    }
  }
  ```

#### 2. Login User
- **POST** `/api/auth/login`
- **Body:**
  ```json
  {
    "email": "john@example.com",
    "password": "password123"
  }
  ```
- **Response:** Same as register response

#### 3. Get Current User
- **GET** `/api/auth/me`
- **Headers:** `Authorization: Bearer <token>`
- **Response:**
  ```json
  {
    "success": true,
    "data": {
      "user": {
        "id": "uuid",
        "name": "John Doe",
        "email": "john@example.com",
        "phone": "+1234567890",
        "created_at": "2025-01-20T10:00:00Z"
      }
    }
  }
  ```

## Frontend Implementation

### 1. API Service (`app/services/api.ts`)
- Handles all HTTP requests to the backend
- Manages token and user data storage using AsyncStorage
- Provides methods for login, register, and token management

### 2. Authentication Context (`app/context/AuthContext.tsx`)
- Manages global authentication state
- Provides authentication methods to all components
- Handles automatic token verification on app startup
- Manages user session persistence

### 3. Updated Auth Pages

#### Login Page (`app/(auth)/login.tsx`)
- **Features:**
  - Email and password validation
  - Real-time error handling
  - Loading states
  - Integration with auth context
  - Automatic navigation on success

#### Register Page (`app/(auth)/register.tsx`)
- **Features:**
  - Full form validation (name, email, password, phone)
  - Real-time error handling
  - Loading states
  - Integration with auth context
  - Automatic navigation on success

### 4. Authentication Flow

#### App Startup
1. App loads with `AuthProvider`
2. `AuthProvider` checks for stored token and user data
3. If found, verifies token with server
4. If valid, sets authenticated state
5. If invalid, clears stored data

#### Login Flow
1. User enters credentials
2. Form validation runs
3. API call to `/api/auth/login`
4. On success:
   - Token and user data stored locally
   - Auth context updated
   - User redirected to home
5. On failure:
   - Error message displayed
   - User can retry

#### Register Flow
1. User fills registration form
2. Form validation runs
3. API call to `/api/auth/register`
4. On success:
   - Token and user data stored locally
   - Auth context updated
   - User redirected to home
5. On failure:
   - Error message displayed
   - User can retry

## Security Features

### Backend Security
- **Password Hashing:** bcrypt with salt rounds
- **JWT Tokens:** Secure token generation and verification
- **Input Validation:** Express-validator for all inputs
- **Rate Limiting:** Prevents brute force attacks
- **CORS:** Configured for secure cross-origin requests
- **Helmet:** Security headers middleware

### Frontend Security
- **Token Storage:** AsyncStorage for persistent sessions
- **Input Validation:** Client-side validation before API calls
- **Error Handling:** Secure error messages without exposing sensitive data
- **Automatic Logout:** Invalid tokens trigger automatic logout

## Configuration

### Backend Environment Variables
```env
JWT_SECRET=your_jwt_secret_here
JWT_EXPIRES_IN=7d
PORT=3001
NODE_ENV=development
```

### Frontend Configuration
- **API Base URL:** `http://localhost:3001/api` (development)
- **Token Storage:** AsyncStorage keys: `authToken`, `user`
- **Error Handling:** User-friendly error messages

## Usage Examples

### Using Auth Context in Components
```typescript
import { useAuth } from '../context/AuthContext';

function MyComponent() {
  const { user, isAuthenticated, logout } = useAuth();
  
  if (!isAuthenticated) {
    return <LoginPrompt />;
  }
  
  return (
    <View>
      <Text>Welcome, {user?.name}!</Text>
      <Button onPress={logout}>Logout</Button>
    </View>
  );
}
```

### Making Authenticated API Calls
```typescript
import apiService from '../services/api';

// The API service automatically includes the token in requests
const response = await apiService.getCurrentUser(token);
```

## Testing

### Manual Testing Steps
1. **Start Backend Server:**
   ```bash
   cd backend
   npm start
   ```

2. **Start Frontend App:**
   ```bash
   npm start
   ```

3. **Test Registration:**
   - Navigate to register page
   - Fill in valid details
   - Submit and verify success

4. **Test Login:**
   - Navigate to login page
   - Use registered credentials
   - Submit and verify success

5. **Test Session Persistence:**
   - Close and reopen app
   - Verify user remains logged in

6. **Test Logout:**
   - Use logout function
   - Verify user is redirected to login

### Error Scenarios
- Invalid email format
- Weak password
- Non-existent user login
- Wrong password
- Network connectivity issues
- Server errors

## Future Enhancements

### Planned Features
- **Password Reset:** Email-based password recovery
- **Email Verification:** Account activation via email
- **Social Login:** Google, Facebook integration
- **Two-Factor Authentication:** SMS or app-based 2FA
- **Biometric Authentication:** Fingerprint/Face ID support
- **Secure Storage:** Expo SecureStore for sensitive data
- **Token Refresh:** Automatic token renewal
- **Offline Support:** Basic functionality without internet

### Security Improvements
- **HTTPS:** SSL/TLS encryption in production
- **API Rate Limiting:** Per-user rate limiting
- **Session Management:** Multiple device support
- **Audit Logging:** Track authentication events
- **Account Lockout:** Prevent brute force attacks

## Troubleshooting

### Common Issues
1. **CORS Errors:** Ensure backend CORS is configured for your frontend URL
2. **Token Expiry:** Implement token refresh mechanism
3. **Network Errors:** Check API base URL configuration
4. **Storage Issues:** Verify AsyncStorage permissions

### Debug Steps
1. Check browser/device console for errors
2. Verify backend server is running
3. Test API endpoints with Postman/curl
4. Check network connectivity
5. Verify environment variables

## API Documentation
For complete API documentation, see the backend routes files:
- `backend/routes/auth.js` - Authentication endpoints
- `backend/routes/users.js` - User management
- `backend/routes/items.js` - Item management
- `backend/routes/payments.js` - Payment processing 