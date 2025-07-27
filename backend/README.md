# FindIt Backend API

A comprehensive Node.js/Express backend for the FindIt lost and found application with payment processing, notifications, and real-time features.

## 🚀 Features

- **User Authentication & Authorization** - JWT-based authentication with role-based access
- **Item Management** - CRUD operations for lost, found, and bounty items
- **Payment Processing** - Stripe integration for bounty payments and payouts
- **Image Upload** - Cloudinary integration for item images
- **Notifications** - Email and in-app notifications
- **Search & Filtering** - Advanced search with pagination
- **Database** - PostgreSQL with Supabase integration
- **Security** - Rate limiting, input validation, CORS protection

## 📋 Prerequisites

- Node.js (v16 or higher)
- PostgreSQL database (Supabase recommended)
- Stripe account for payments
- Cloudinary account for image uploads
- SMTP service for email notifications

## 🛠️ Installation

1. **Clone the repository**
   ```bash
   cd backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   ```bash
   cp env.example .env
   ```
   
   Edit `.env` with your configuration:
   ```env
   # Server Configuration
   PORT=3001
   NODE_ENV=development
   
   # Database Configuration (Supabase)
   DATABASE_URL=postgresql://username:password@host:port/database
   SUPABASE_URL=https://your-project.supabase.co
   SUPABASE_ANON_KEY=your-supabase-anon-key
   SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key
   
   # JWT Configuration
   JWT_SECRET=your-super-secret-jwt-key-here
   JWT_EXPIRES_IN=7d
   
   # Cloudinary Configuration
   CLOUDINARY_CLOUD_NAME=your-cloud-name
   CLOUDINARY_API_KEY=your-api-key
   CLOUDINARY_API_SECRET=your-api-secret
   
   # Stripe Configuration
   STRIPE_SECRET_KEY=sk_test_your-stripe-secret-key
   STRIPE_PUBLISHABLE_KEY=pk_test_your-stripe-publishable-key
   STRIPE_WEBHOOK_SECRET=whsec_your-webhook-secret
   STRIPE_CONNECT_ACCOUNT_ID=acct_your-connect-account-id
   
   # Email Configuration
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USER=your-email@gmail.com
   SMTP_PASS=your-app-password
   
   # Frontend URL
   FRONTEND_URL=http://localhost:3000
   ```

4. **Database Setup**
   ```bash
   npm run migrate
   ```

5. **Start the server**
   ```bash
   # Development
   npm run dev
   
   # Production
   npm start
   ```

## 📚 API Documentation

### Authentication Endpoints

#### Register User
```http
POST /api/auth/register
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123",
  "phone": "+1-555-0123"
}
```

#### Login User
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "password123"
}
```

#### Get Current User
```http
GET /api/auth/me
Authorization: Bearer <token>
```

### Items Endpoints

#### Get All Items
```http
GET /api/items?type=lost&category=Electronics&search=phone&page=1&limit=20
```

#### Get Single Item
```http
GET /api/items/:id
```

#### Create Item
```http
POST /api/items
Authorization: Bearer <token>
Content-Type: multipart/form-data

{
  "title": "Lost iPhone",
  "description": "Blue iPhone 13 lost at the park",
  "category": "Electronics",
  "item_type": "lost",
  "location": "Central Park",
  "latitude": 40.7829,
  "longitude": -73.9654,
  "reward_amount": 50,
  "images": [file1, file2]
}
```

#### Update Item
```http
PUT /api/items/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "Updated title",
  "description": "Updated description"
}
```

#### Delete Item
```http
DELETE /api/items/:id
Authorization: Bearer <token>
```

#### Report Item Found/Claimed
```http
POST /api/items/:id/report
Authorization: Bearer <token>
Content-Type: application/json

{
  "action": "found",
  "message": "I found your item at the library"
}
```

### Payment Endpoints

#### Create Payment Intent
```http
POST /api/payments/create-intent
Authorization: Bearer <token>
Content-Type: application/json

{
  "item_id": "item-uuid",
  "amount": 100
}
```

#### Confirm Payment
```http
POST /api/payments/confirm
Authorization: Bearer <token>
Content-Type: application/json

{
  "payment_intent_id": "pi_xxx",
  "item_id": "item-uuid"
}
```

#### Process Bounty Payout
```http
POST /api/payments/payout
Authorization: Bearer <token>
Content-Type: application/json

{
  "item_id": "item-uuid",
  "finder_id": "user-uuid"
}
```

### User Endpoints

#### Get User Profile
```http
GET /api/users/profile
Authorization: Bearer <token>
```

#### Get User Items
```http
GET /api/users/items?type=lost&status=active&page=1&limit=20
Authorization: Bearer <token>
```

#### Get User Statistics
```http
GET /api/users/stats
Authorization: Bearer <token>
```

#### Update Profile
```http
PUT /api/users/profile
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Updated Name",
  "phone": "+1-555-9999"
}
```

### Notification Endpoints

#### Get Notifications
```http
GET /api/notifications?page=1&limit=20&unread_only=false
Authorization: Bearer <token>
```

#### Mark Notification as Read
```http
PUT /api/notifications/:id/read
Authorization: Bearer <token>
```

#### Send Notification
```http
POST /api/notifications/send
Authorization: Bearer <token>
Content-Type: application/json

{
  "recipient_id": "user-uuid",
  "type": "item_found",
  "title": "Item Found!",
  "message": "Your item has been found",
  "item_id": "item-uuid"
}
```

## 🗄️ Database Schema

### Users Table
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  phone VARCHAR(20),
  stripe_account_id VARCHAR(255),
  status VARCHAR(20) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### Items Table
```sql
CREATE TABLE items (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  category VARCHAR(50) NOT NULL,
  item_type VARCHAR(20) NOT NULL CHECK (item_type IN ('lost', 'found', 'bounty')),
  location VARCHAR(255),
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  reward_amount DECIMAL(10, 2),
  images TEXT[],
  is_priority BOOLEAN DEFAULT false,
  status VARCHAR(20) DEFAULT 'active',
  payment_status VARCHAR(20) DEFAULT 'pending',
  payout_status VARCHAR(20) DEFAULT 'pending',
  payout_amount DECIMAL(10, 2),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### Payments Table
```sql
CREATE TABLE payments (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  item_id UUID REFERENCES items(id) ON DELETE CASCADE,
  amount DECIMAL(10, 2) NOT NULL,
  platform_fee DECIMAL(10, 2) NOT NULL,
  stripe_payment_intent_id VARCHAR(255) UNIQUE,
  status VARCHAR(20) DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

## 🔧 Configuration

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `PORT` | Server port | No (default: 3001) |
| `NODE_ENV` | Environment | No (default: development) |
| `DATABASE_URL` | PostgreSQL connection string | Yes |
| `JWT_SECRET` | JWT signing secret | Yes |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary cloud name | Yes |
| `CLOUDINARY_API_KEY` | Cloudinary API key | Yes |
| `CLOUDINARY_API_SECRET` | Cloudinary API secret | Yes |
| `STRIPE_SECRET_KEY` | Stripe secret key | Yes |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook secret | Yes |
| `SMTP_HOST` | SMTP server host | Yes |
| `SMTP_USER` | SMTP username | Yes |
| `SMTP_PASS` | SMTP password | Yes |

### Rate Limiting

The API includes rate limiting to prevent abuse:
- 100 requests per 15 minutes per IP address
- Configurable via environment variables

### File Upload

- Maximum file size: 5MB
- Supported formats: JPEG, PNG, WebP
- Images are automatically optimized and stored in Cloudinary

## 🚀 Deployment

### Heroku Deployment

1. **Create Heroku app**
   ```bash
   heroku create your-findit-backend
   ```

2. **Set environment variables**
   ```bash
   heroku config:set DATABASE_URL=your-database-url
   heroku config:set JWT_SECRET=your-jwt-secret
   # ... set all other environment variables
   ```

3. **Deploy**
   ```bash
   git push heroku main
   ```

### Docker Deployment

1. **Build image**
   ```bash
   docker build -t findit-backend .
   ```

2. **Run container**
   ```bash
   docker run -p 3001:3001 --env-file .env findit-backend
   ```

## 🧪 Testing

```bash
# Run tests
npm test

# Run tests with coverage
npm run test:coverage
```

## 📝 Scripts

```bash
# Development
npm run dev          # Start development server with nodemon

# Production
npm start            # Start production server

# Database
npm run migrate      # Run database migrations

# Testing
npm test             # Run tests
npm run test:watch   # Run tests in watch mode
```

## 🔒 Security Features

- **JWT Authentication** - Secure token-based authentication
- **Password Hashing** - bcrypt for password security
- **Input Validation** - Express-validator for request validation
- **Rate Limiting** - Prevents API abuse
- **CORS Protection** - Configurable cross-origin requests
- **Helmet** - Security headers
- **SQL Injection Protection** - Parameterized queries

## 📊 Monitoring

The API includes comprehensive logging:
- Request/response logging
- Error tracking
- Database query monitoring
- Payment processing logs

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For support, email support@findit.com or create an issue in the repository. 