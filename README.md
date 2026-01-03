# Orion Chat 🌌

A production-ready, feature-rich messaging platform designed for real-time collaboration across Desktop and Mobile. Inspired by the speed and engagement of Telegram.

## 🚀 Recent Milestones (Phases 1-3)

We have successfully completed the core infrastructure and identity layers:

### 🛠 Phase 1: Infrastructure & Stability
- **Cloud Deployment**: Backend successfully deployed to Render with PostgreSQL support.
- **Security**: Hardened CORS policies, environment variable management, and SSL/HTTPS integration.
- **Unified Backend**: A single Node.js/Express server serving both Electron (Desktop) and Expo (Mobile) clients.

### 💬 Phase 2: Core Messaging Enhancements
- **Rich Media**: Support for Image, Video, and Document sharing integrated with Cloudinary/Multer.
- **Message Lifecycle**: Implemented "Delivered" and "Read" receipts with real-time status updates via Socket.io.
- **Threading**: Contextual threaded replies and message forwarding across all platforms.

### 👤 Phase 3: Identity & Engagement
- **User Profiles**: Real-time avatar uploads, bios, and personalized user settings.
- **Online Presence**: "Online" and "Last Seen" status tracking using Socket.io heartbeat logic.
- **Push Notifications**: Expo Push API integration for mobile background alerts and Native Desktop notifications for Electron.
- **Global Search**: High-performance unified search across users, active chats, and message history.

## 🛠 Tech Stack
- **Backend**: Node.js, Express, Socket.io, SQLite (Local) / PostgreSQL (Prod).
- **Desktop**: React, Electron, Lucide Icons, Vanilla CSS.
- **Mobile**: React Native (Expo SDK 54), Expo Router, Ionicons.
- **Storage**: Cloudinary (Media/Avatars).

## 🔭 Current Focus: Phase 4 (Scaling & Discovery)
We are currently implementing:
- **Admin Tools**: Role-based permissions (Member, Admin, Owner).
- **Invite Links**: Shareable group links for easy growth.
- **Public Channels**: Broadcast-only communities.

---
*Orion: Messaging beyond boundaries.*
