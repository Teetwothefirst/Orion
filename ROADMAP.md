# Orion Chat: Strategic Roadmap (Telegram-Like Evolution)

This roadmap outlines the journey from a basic real-time chat to a production-ready, feature-rich messaging platform.

## Phase 1: Production Infrastructure & Stability
*Priority: Critical*
- [x] **Cloud Deployment**: Move backend to a VPS (Render, Railway, or VPS) with PostgreSQL/MySQL. <!-- id: 27 -->
- [x] **HTTPS/SSL**: Secure API and Socket connections. <!-- id: 28 -->
- [x] **Environment Security**: Secret management and CORS hardening. <!-- id: 29 -->

## Phase 2: Core Messaging Enhancements
*Priority: High*
- [x] **Media Sharing**: Image, Video, and Document uploads (AWS S3 or Cloudinary). <!-- id: 30 -->
- [x] **Message Status**: Delivered (single tick) and Read (double tick) receipts. <!-- id: 31 -->
- [x] **Reply & Forward**: Contextual threaded replies and message forwarding. <!-- id: 32 -->

## Phase 3: Identity & Engagement
*Priority: Medium-High*
- [x] **Push Notifications**: Real-time alerts when app is in background (FCM/Expo Push). <!-- id: 33 -->
- [x] **User Profiles**: Real avatar uploads, Bio, and "Online/Last Seen" status. <!-- id: 34 -->
- [x] **Global Search**: Search through messages, users, and groups. <!-- id: 35 -->

## Phase 4: Scaling & Discovery
*Priority: Medium*
- [x] **Public Channels**: Broadcast-only channels for unlimited subscribers. <!-- id: 36 -->
- [x] **Invite Links**: QR codes and shareable links for groups/channels. <!-- id: 37 -->
- [x] **Admin Tools**: Group permissions, banning users, and promoting admins. <!-- id: 38 -->

## Phase 5: Security & Optimization
*Priority: Low (Complexity: High)*
- [ ] **End-to-End Encryption (E2EE)**: Signal Protocol or similar for private chats. <!-- id: 39 -->
- [ ] **Voice/Video Calls**: WebRTC integration. <!-- id: 40 -->
- [ ] **Stickers & Gifs**: Integration with Giphy or custom sticker sets. <!-- id: 41 -->
