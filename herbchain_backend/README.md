# HerbChain AI - Enterprise Backend

This repository contains the Node.js backend acting as the Single Source of Truth for the entire HerbChain AI ecosystem. It securely orchestrates the Flutter Mobile App, React Stakeholder Dashboard, and Consumer QR Verification Portal.

## Architecture & Tech Stack
- **Framework**: Express.js + TypeScript
- **Database**: MongoDB + Mongoose
- **Auth**: JWT + Role Based Access Control
- **Logging**: Winston + Morgan
- **Documentation**: Swagger OpenAPI
- **Integrations**: Mock classes for Hyperledger Fabric, IPFS, and AI Vision Services.

## Installation & Setup

1. Install dependencies
```bash
npm install
```

2. Configure Environment
Ensure the `.env` file exists with `MONGO_URI` and `JWT_SECRET`.

3. Run MongoDB
**Option A: Using Docker (If Docker is installed)**
```bash
docker-compose up -d mongodb
```

**Option B: Using Local MongoDB (If Docker is not installed)**
If you do not have Docker installed, you can:
1. Download and install [MongoDB Community Server](https://www.mongodb.com/try/download/community).
2. Ensure MongoDB is running as a Windows Service (it usually starts automatically on port 27017).
3. The server will automatically connect to `mongodb://localhost:27017/herbchain` as defined in your `.env`.

4. Start Server
```bash
npx ts-node src/server.ts
# OR build and run
npx tsc
node dist/server.js
```

## API Documentation
Once running, visit the Swagger UI to interact with all documented endpoints:
`http://localhost:3000/api-docs`
