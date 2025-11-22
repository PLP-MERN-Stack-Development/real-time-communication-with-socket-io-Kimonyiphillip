<<<<<<< HEAD
⚡ PulseChat - Real-Time Chat Application
A modern, full-stack real-time chat application built with the MERN stack and Socket.IO. Experience seamless communication with advanced features like typing indicators, file sharing, and live user status.

https://img.shields.io/badge/PulseChat-Real--Time%2520Chat-purple?style=for-the-badge
https://img.shields.io/badge/MERN-Stack-green?style=for-the-badge
https://img.shields.io/badge/Socket.IO-Real--Time-orange?style=for-the-badge

🎯 Features
💬 Real-Time Communication
Instant Messaging - Real-time message delivery with Socket.IO

Typing Indicators - See when others are typing

Online Status - Live user presence indicators

Read Receipts - Know when messages are delivered and seen

Message Reactions - Express with emoji reactions

👥 Chat Management
1-on-1 Conversations - Private messaging

Group Chats - Create and manage group conversations

Global Chat Room - Public room for all users

User Directory - Find and connect with other users

📁 Media & Files
File Sharing - Upload and share documents

Image Support - Send and view images in chat

Drag & Drop - Easy file upload interface

🔐 Security & UX
Clerk Authentication - Secure user authentication

Responsive Design - Works on all devices

Modern UI - Beautiful dark theme with glass morphism effects

Real-time Notifications - Browser and sound notifications

🛠️ Tech Stack
Frontend
React 19 - Modern React with latest features

Vite - Fast build tool and dev server

Tailwind CSS - Utility-first CSS framework

Socket.IO Client - Real-time communication

Clerk - Authentication and user management

Axios - HTTP client for API calls

Backend
Node.js - Runtime environment

Express.js - Web framework

Socket.IO - Real-time bidirectional communication

MongoDB - NoSQL database

Mongoose - MongoDB object modeling

Multer - File upload handling

🚀 Quick Start
Prerequisites
Node.js (v18 or higher)

MongoDB (local or Atlas)

Clerk account
Installation
Clone the repositories

bash
# Backend
git clone <backend-repo-url>
cd backend

# Frontend
git clone <frontend-repo-url>
cd frontend
Backend Setup

bash
cd backend
npm install

# Create .env file
echo "NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/chatdb
PORT=5000
ALLOWED_ORIGINS=http://localhost:5173,http://127.0.0.1:5173" > .env

npm run dev
Frontend Setup

bash
cd frontend
npm install

# Create .env file
echo "VITE_API_URL=http://localhost:5000
VITE_SOCKET_URL=http://localhost:5000
VITE_CLERK_PUBLISHABLE_KEY=pk_test_..." > .env

npm run dev
Access the application

Frontend: http://localhost:5173

Backend API: http://localhost:5000

📁 Project Structure
text
pulsechat/
├── backend/
│   ├── src/
│   │   ├── controllers/     # Route controllers
│   │   ├── models/          # MongoDB models
│   │   ├── routes/          # API routes
│   │   ├── middleware/      # Custom middleware
│   │   ├── config/          # Database configuration
│   │   └── utils/           # Utility functions
│   ├── package.json
│   └── server.js
└── frontend/
    ├── src/
    │   ├── components/      # React components
    │   ├── hooks/           # Custom React hooks
    │   ├── lib/             # Utility libraries
    │   ├── pages/           # Page components
    │   └── App.jsx
    ├── package.json
    └── vite.config.js
🔌 API Endpoints
Authentication
All requests require X-User-Id header with Clerk user ID.

Conversations
GET /api/conversations - Get user's conversations

POST /api/conversations - Start 1-on-1 chat

POST /api/conversations/group - Create group chat

GET /api/conversations/:id - Get conversation details

Messages
GET /api/messages/:conversationId - Get messages with pagination

POST /api/messages - Send new message

POST /api/messages/:messageId/reaction - Add reaction to message

Users
GET /api/users - Get all users

POST /api/users/sync - Sync user profile

Upload
POST /api/upload - Upload files

🌐 Socket.IO Events
Client to Server
conversation:join - Join conversation room

conversation:leave - Leave conversation room

message:new - Send new message

typing:start - Start typing indicator

typing:stop - Stop typing indicator

message:react - React to message

Server to Client
message:new - Receive new message

conversation:update - Conversation updated

user:status - User online/offline status

typing:start - User started typing

typing:stop - User stopped typing

message:react - Message reaction added

notification:new - New notification

🚀 Deployment
Backend (Render.com)
Push backend to GitHub

Connect repo to Render

Set environment variables:

env
NODE_ENV=production
MONGODB_URI=mongodb+srv://...
ALLOWED_ORIGINS=https://your-frontend.vercel.app
Frontend (Vercel)
Push frontend to GitHub

Connect repo to Vercel

Set environment variables:

env
VITE_API_URL=https://your-backend.onrender.com
VITE_SOCKET_URL=https://your-backend.onrender.com
VITE_CLERK_PUBLISHABLE_KEY=pk_live_...
🎨 UI/UX Features
Dark Theme - Easy on the eyes

Glass Morphism - Modern design effects

Responsive Layout - Mobile-first approach

Smooth Animations - Enhanced user experience

Real-time Updates - Live user interactions

🔧 Development
Backend Scripts
bash
npm run dev      # Development with nodemon
npm start        # Production start
Frontend Scripts
bash
npm run dev      # Development server
npm run build    # Production build
npm run preview  # Preview production build
npm run lint     # Code linting
🤝 Contributing
We welcome contributions! Please feel free to submit issues, feature requests, and pull requests.

Fork the project

Create your feature branch (git checkout -b feature/AmazingFeature)

Commit your changes (git commit -m 'Add some AmazingFeature')

Push to the branch (git push origin feature/AmazingFeature)

Open a Pull Request

📄 License
This project is licensed under the MIT License - see the LICENSE file for details.

🙏 Acknowledgments
Clerk for authentication

Socket.IO for real-time communication

Tailwind CSS for styling

MongoDB Atlas for database hosting

Built with ⚡ by phillip kimonyi, plp student

=======
# Real-Time Chat Application with Socket.io

This assignment focuses on building a real-time chat application using Socket.io, implementing bidirectional communication between clients and server.

## Assignment Overview

You will build a chat application with the following features:
1. Real-time messaging using Socket.io
2. User authentication and presence
3. Multiple chat rooms or private messaging
4. Real-time notifications
5. Advanced features like typing indicators and read receipts

## Project Structure

```
socketio-chat/
├── client/                 # React front-end
│   ├── public/             # Static files
│   ├── src/                # React source code
│   │   ├── components/     # UI components
│   │   ├── context/        # React context providers
│   │   ├── hooks/          # Custom React hooks
│   │   ├── pages/          # Page components
│   │   ├── socket/         # Socket.io client setup
│   │   └── App.jsx         # Main application component
│   └── package.json        # Client dependencies
├── server/                 # Node.js back-end
│   ├── config/             # Configuration files
│   ├── controllers/        # Socket event handlers
│   ├── models/             # Data models
│   ├── socket/             # Socket.io server setup
│   ├── utils/              # Utility functions
│   ├── server.js           # Main server file
│   └── package.json        # Server dependencies
└── README.md               # Project documentation
```

## Getting Started

1. Accept the GitHub Classroom assignment invitation
2. Clone your personal repository that was created by GitHub Classroom
3. Follow the setup instructions in the `Week5-Assignment.md` file
4. Complete the tasks outlined in the assignment

## Files Included

- `Week5-Assignment.md`: Detailed assignment instructions
- Starter code for both client and server:
  - Basic project structure
  - Socket.io configuration templates
  - Sample components for the chat interface

## Requirements

- Node.js (v18 or higher)
- npm or yarn
- Modern web browser
- Basic understanding of React and Express

## Submission

Your work will be automatically submitted when you push to your GitHub Classroom repository. Make sure to:

1. Complete both the client and server portions of the application
2. Implement the core chat functionality
3. Add at least 3 advanced features
4. Document your setup process and features in the README.md
5. Include screenshots or GIFs of your working application
6. Optional: Deploy your application and add the URLs to your README.md

## Resources

- [Socket.io Documentation](https://socket.io/docs/v4/)
- [React Documentation](https://react.dev/)
- [Express.js Documentation](https://expressjs.com/)
- [Building a Chat Application with Socket.io](https://socket.io/get-started/chat) 
>>>>>>> 474be929c7061edab2f8942c6b13d3fb6251e992
