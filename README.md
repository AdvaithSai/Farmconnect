# Farmer-Retailer Marketplace with Real-Time Chat

A marketplace platform that connects farmers and retailers with real-time chat functionality for negotiation and communication.

## Features

### Core Marketplace Features
- **User Authentication**: Separate registration for farmers and retailers
- **Crop Management**: Farmers can add, edit, and manage their crop listings
- **Offer System**: Retailers can make offers on crops with price negotiation
- **Transaction Management**: Complete purchase flow from offer to payment

### Real-Time Chat Features
- **Direct Messaging**: Farmers and retailers can chat directly about specific crops
- **Chat History**: All conversations are saved and can be viewed again
- **Price Negotiation**: Special message types for price discussions
- **Real-time Updates**: Messages appear instantly for both parties
- **Chat List**: Easy navigation between different conversations

## Chat Implementation

### Database Schema
The chat system uses two main tables:

#### `chats` table
- `id`: Unique chat identifier
- `crop_id`: Reference to the crop being discussed
- `farmer_id`: Farmer's user ID
- `retailer_id`: Retailer's user ID
- `last_message_at`: Timestamp of last message
- `status`: 'active' or 'archived'

#### `messages` table
- `id`: Unique message identifier
- `chat_id`: Reference to the chat
- `sender_id`: User ID of message sender
- `content`: Message text content
- `message_type`: 'text', 'offer', or 'price_negotiation'
- `offer_id`: Optional reference to an offer
- `price`: Optional price amount for negotiations

### Components

#### Chat.tsx
Main chat interface component that displays:
- Message history with timestamps
- Real-time message sending
- Price negotiation highlights
- Auto-scroll to latest messages

#### ChatList.tsx
Sidebar component showing:
- List of all conversations
- Other user names and crop names
- Last message timestamps
- Visual indicators for selected chat

### Pages

#### /farmer/chats
Farmer's chat interface with:
- List of conversations with retailers
- Full chat functionality
- Easy navigation back to dashboard

#### /retailer/chats
Retailer's chat interface with:
- List of conversations with farmers
- Full chat functionality
- Easy navigation back to dashboard

### Integration Points

#### Crop Details Page
- "Chat with Farmer" button for retailers
- Direct navigation to chat with pre-filled crop context

#### Dashboards
- "Messages" links in both farmer and retailer dashboards
- Quick access to all conversations

## Usage

### For Farmers
1. Log into your farmer dashboard
2. Click "Messages" to view all conversations with retailers
3. Select a conversation to start chatting
4. Negotiate prices and discuss crop details

### For Retailers
1. Browse available crops on the retailer dashboard
2. Click "Chat with Farmer" on any crop to start a conversation
3. Or access all conversations via the "Messages" link
4. Negotiate prices and ask questions about crops

## Technical Implementation

### Real-time Features
- Messages are stored in Firebase Firestore
- Real-time updates using Firestore listeners
- Automatic chat creation when first message is sent
- Persistent chat history across sessions

### Security
- User authentication required for all chat features
- Users can only access their own conversations
- Role-based access control (farmers vs retailers)

### Performance
- Efficient message loading with pagination
- Optimized chat list with lazy loading
- Minimal re-renders with proper state management

## Future Enhancements

- **File Attachments**: Allow image sharing in chats
- **Push Notifications**: Real-time notifications for new messages
- **Chat Search**: Search through message history
- **Voice Messages**: Audio message support
- **Chat Export**: Download conversation history
- **Read Receipts**: See when messages are read 