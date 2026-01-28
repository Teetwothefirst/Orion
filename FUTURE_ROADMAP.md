# Orion Future Roadmap

This document outlines the architectural and feature gaps to bridge to reach "WhatsApp-level" infrastructure.

## 1. Massive Scalability (Architectural)
*   **Horizontal Scaling**: 
    *   **Redis Pub/Sub**: To allow users connected to different server instances to communicate seamlessly.
    *   **Load Balancers**: Distribute traffic across multiple backend instances.
*   **Distributed Database**: Transition from single-instance Postgres/SQLite to a distributed system like **Cassandra** or **ScyllaDB** for global scale.
*   **Message Queuing**: Implement **Kafka** or **RabbitMQ** to ensure message delivery reliability and handle server load spikes.

## 2. Advanced Communication Features
*   **Voice & Video Calls (WebRTC)**: 
    *   Deploy **STUN/TURN servers** (e.g., Coturn) for NAT traversal.
    *   Integrate a Media Server (e.g., Mediasoup, Janus, or Jitsi) for high-quality group calls.
*   **End-to-End Encryption for Groups**: 
    *   Implement "Sender Keys" logic within the Signal Protocol to handle group member transitions securely.

## 3. Advanced UX & Media
*   **Global Content Delivery**: Use a CDN (e.g., AWS CloudFront) for fast media sharing worldwide.
*   **Multi-Device Synchronization**: Implement multi-device sessions so a user can be logged in on phone, desktop, and web simultaneously with synchronized message state.
