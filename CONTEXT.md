# FindIt App - Feature Overview & Documentation

## 🏁 Overview

The Findit App is an AI-powered platform connecting people who have lost items with those who find them. Our platform prioritizes verified, incentivized, and user-friendly methods to enhance successful recovery of lost goods through a mobile-first approach.


## Tech Stack:
Frontend: React Native with TypeScript, Expo, and Expo Router
Backend/Database: Supabase
UI Framework: React Native Paper
AI Processing: DeepSeek

## 📁 Project Structure
```
FindIt/
├── app/                      # Main application code
│   ├── (auth)/              # Authentication routes
│   │   ├── login.tsx
│   │   ├── register.tsx
│   │   └── forgot-password.tsx
│   ├── (tabs)/              # Main tab navigation
│   │   ├── lost/
│   │   ├── found/
│   │   └── bounty/
│   ├── modals/              # Modal screens
│   └── _layout.tsx          # Root layout
├── components/              # Reusable components
│   ├── auth/
│   ├── forms/
│   ├── items/
│   ├── chat/
│   └── shared/
├── constants/              # App constants and config
│   ├── colors.ts
│   ├── layout.ts
│   └── config.ts
├── hooks/                 # Custom React hooks
├── services/             # API and external services
│   ├── supabase/
│   ├── ai/
│   └── payments/
├── stores/               # State management
├── types/                # TypeScript definitions
├── utils/                # Helper functions
└── assets/              # Static assets
```

## 🗄️ Database Schema

### Tables

#### users
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  phone TEXT,
  avatar_url TEXT,
  trust_score FLOAT DEFAULT 0,
  is_verified BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_login TIMESTAMP WITH TIME ZONE
);
```

#### items
```sql
CREATE TABLE items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  type TEXT NOT NULL CHECK (type IN ('lost', 'found')),
  user_id UUID REFERENCES users(id),
  location GEOGRAPHY(POINT),
  reward_amount DECIMAL(10,2),
  is_priority BOOLEAN DEFAULT false,
  images TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### chats
```sql
CREATE TABLE chats (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  item_id UUID REFERENCES items(id),
  initiator_id UUID REFERENCES users(id),
  receiver_id UUID REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_message_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### messages
```sql
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  chat_id UUID REFERENCES chats(id),
  sender_id UUID REFERENCES users(id),
  content TEXT NOT NULL,
  type TEXT DEFAULT 'text',
  read_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### reports
```sql
CREATE TABLE reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  reporter_id UUID REFERENCES users(id),
  item_id UUID REFERENCES items(id),
  reason TEXT NOT NULL,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  resolved_at TIMESTAMP WITH TIME ZONE
);
```

#### transactions
```sql
CREATE TABLE transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  item_id UUID REFERENCES items(id),
  payer_id UUID REFERENCES users(id),
  receiver_id UUID REFERENCES users(id),
  amount DECIMAL(10,2) NOT NULL,
  status TEXT DEFAULT 'pending',
  type TEXT NOT NULL,
  platform_fee DECIMAL(10,2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE
);
```

### Indexes
```sql
-- Spatial index for location-based queries
CREATE INDEX items_location_idx ON items USING GIST (location);

-- Indexes for frequent queries
CREATE INDEX items_user_id_idx ON items(user_id);
CREATE INDEX items_status_idx ON items(status);
CREATE INDEX items_type_idx ON items(type);
CREATE INDEX messages_chat_id_idx ON messages(chat_id);
CREATE INDEX transactions_item_id_idx ON transactions(item_id);
```

### Policies
```sql
-- Example RLS policies
ALTER TABLE items ENABLE ROW LEVEL SECURITY;

-- Users can read all active items
CREATE POLICY "Items are viewable by everyone" 
ON items FOR SELECT 
USING (status = 'active');

-- Users can only update their own items
CREATE POLICY "Users can update own items" 
ON items FOR UPDATE 
USING (user_id = auth.uid());
```

## 🔁 Core User Flows

### 1. Welcome Screen
- Clean, branded UI with concise app description
- Authentication options:
  - Sign Up (Email-based)
  - Log In (returning users)

### 2. Sign-Up Process
Required information:
- Full name
- Email address
- Password
- Optional phone verification for enhanced trust score
- Auto-redirect to Main Screen upon successful registration

### 3. Main Screen Interface

#### Tab Navigation
1. 🧭 **Lost Items**
   - AI-sorted feed of reported lost items
2. 🪢 **Found Items**
   - AI-sorted feed of found reports
3. 🏆 **Bounty Zone**
   - Items with active reward offers

#### Search & Filtering
- Category-based (Electronics, ID cards, Pets, etc.)
- Location-based
- Date-based
- Reward/bounty amount

#### Special Features
- 🔝 Priority posts (paid) displayed prominently
- 🔔 Proximity-based notifications for paid posts

### 4. Quick Add Feature

Two reporting methods:
1. 📸 **Manual Form**
   - Title
   - Description
   - Image upload
   - Location
   - Category
   - Reward (optional)

2. 🤖 **AI Assistant**
   - Conversational interface
   - Guided item reporting
   - Smart form completion

## 💡 Key Features

### Priority Posts
- Premium visibility through paid promotion
- Benefits:
  - Enhanced sorting priority
  - Geo-targeted push notifications
- Payment processing via Stripe/Flutterwave

### AI-Powered Sorting
Ranking factors:
- Time relevance
- Geographic proximity
- User trust metrics
- Reward value

### 💰 Bounty System
- Attach monetary rewards to lost item posts
- Process:
  1. Finder marks item as "Returned"
  2. Owner confirms receipt
  3. Reward transfer initiated
  4. Platform fee (10%) deducted
- Multiple payment options:
  - Direct bank transfer
  - Mobile wallet
  - In-app credits

### 📢 Anti-Theft Measures
- Serial/tag verification system for shops
- Suspicious item reporting
- Internal review process
- Law enforcement notification option

### 💬 Secure Communication
- End-to-end encrypted chat
- Features:
  - Image sharing
  - Voice notes
  - Optional location sharing
- Automatic chat initiation on item interest

### 🚨 Trust & Moderation

#### User Features
- Suspicious listing reports
- Identity verification badges
- Trust score system

#### Admin Controls
- Flagged content review
- Theft report management
- Payment processing oversight

### 🔐 Security Implementation
- End-to-end chat encryption
- GDPR-compliant data protection
- Optional 2FA security

## 🌐 Future Enhancements

Planned features:
- 🔎 AI-powered visual item matching
- 🌍 Geofenced alert system
- 📍 Smart tracker integration

## 📌 Feature Summary

| Feature | Description |
|---------|-------------|
| AI Feed Sorting | Smart ranking of relevant posts |
| Quick Add | Streamlined item reporting |
| Priority Posts | Premium promotion with notifications |
| Bounty System | Reward-based recovery service |
| Anti-Theft | Shop-focused stolen goods reporting |
| Secure Chat | Private user communications |

---

*This documentation is subject to updates as new features are implemented.*
