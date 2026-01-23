# Backend API Routes

Base URL: `http://localhost:3001` (Development)

## Authentication (`/auth`)

| Method | Endpoint | Description | Query/Body Params |
| :--- | :--- | :--- | :--- |
| `POST` | `/register` | Register a new user | `username`, `email`, `password` |
| `POST` | `/login` | Authenticate user | `email`, `password` |
| `GET` | `/users` | Get all users (except current) | `currentUserId` (query) |
| `POST` | `/forgot-password` | Request password reset | `email` |
| `POST` | `/reset-password` | Reset password with token | `token`, `newPassword` |

## Chats (`/chats`)

| Method | Endpoint | Description | Query/Body Params |
| :--- | :--- | :--- | :--- |
| `POST` | `/upload` | Upload media file | `file` (multipart/form-data) |
| `GET` | `/stickers` | Get list of stickers | - |
| `GET` | `/` | Get user's chats | `userId` (query) |
| `POST` | `/` | Create new chat | `userId`, `otherUserId`, `type`, `name`, `participantIds` |
| `GET` | `/:id/messages` | Get messages for chat | - |
| `POST` | `/messages/:messageId/react`| React to message | `userId`, `emoji` |
| `DELETE` | `/messages/:messageId` | Delete message | `userId` (body) |
| `GET` | `/search` | Global search | `q`, `userId` (query) |
| `GET` | `/invite/:code` | Get chat info by invite code | - |
| `POST` | `/join/:code` | Join chat by invite code | `userId` |
| `POST` | `/:id/participants` | Add participants (Admin/Owner) | `adminId`, `userIds` (array) |
| `POST` | `/:id/role` | Update participant role | `adminId`, `targetUserId`, `role` |
| `DELETE` | `/:id/participants/:userId`| Kick participant | `adminId` (query) |
| `GET` | `/:id/participants` | Get all participants | - |

## Users (`/users`)

| Method | Endpoint | Description | Query/Body Params |
| :--- | :--- | :--- | :--- |
| `GET` | `/` | Get all users | `currentUserId` (query) |
| `GET` | `/search` | Search users | `q`, `currentUserId` (query) |
| `PUT` | `/profile` | Update profile | `userId`, `username`, `bio` (body), `avatar` (multipart) |
| `POST` | `/push-token` | Register push token | `userId`, `token`, `platform` |

## Support (`/support`)

| Method | Endpoint | Description | Query/Body Params |
| :--- | :--- | :--- | :--- |
| `POST` | `/report-bug` | Submit bug report | `user`, `description`, `deviceInfo`, `isCrash`, `stackTrace` |

## Encryption Keys (`/keys`)

| Method | Endpoint | Description | Query/Body Params |
| :--- | :--- | :--- | :--- |
| `POST` | `/identity` | Register/Update Identity Key | `userId`, `publicKey`, `registrationId` |
| `POST` | `/prekeys` | Upload PreKeys | `userId`, `signedPreKey`, `oneTimePreKeys` |
| `GET` | `/bundle/:userId` | Get encryption bundle | - |
