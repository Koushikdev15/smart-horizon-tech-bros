import swaggerUi from 'swagger-ui-express';
import { Application } from 'express';

const swaggerDocument = {
  openapi: "3.0.0",
  info: {
    title: "HerbChain AI Backend API",
    version: "1.0.0",
    description: "The Single Source of Truth Backend for the HerbChain AI ecosystem."
  },
  servers: [{ url: "http://localhost:3000/api/v1" }],
  paths: {
    "/auth/register": {
      post: {
        summary: "Register a new account",
        requestBody: {
          content: { "application/json": { schema: { type: "object", properties: { name: { type: "string" }, email: { type: "string" }, mobile: { type: "string" }, password: { type: "string" }, role: { type: "string" } } } } }
        },
        responses: { "201": { description: "User registered" } }
      }
    },
    "/auth/login": {
      post: {
        summary: "Login to the platform (email or mobile)",
        requestBody: {
          content: { "application/json": { schema: { type: "object", properties: { email: { type: "string" }, password: { type: "string" } } } } }
        },
        responses: { "200": { description: "Successful login" } }
      }
    },
    "/auth/refresh": {
      post: {
        summary: "Exchange a refresh token for a new access token",
        requestBody: {
          content: { "application/json": { schema: { type: "object", properties: { refreshToken: { type: "string" } } } } }
        },
        responses: { "200": { description: "Token refreshed" } }
      }
    },
    "/auth/profile": {
      get: {
        summary: "Get the signed-in user's profile",
        security: [{ bearerAuth: [] }],
        responses: { "200": { description: "Profile fetched" } }
      }
    },
    "/health-profile": {
      get: {
        summary: "Get the signed-in user's health profile",
        security: [{ bearerAuth: [] }],
        responses: { "200": { description: "Health profile fetched" } }
      },
      put: {
        summary: "Create or update the signed-in user's health profile",
        security: [{ bearerAuth: [] }],
        responses: { "200": { description: "Health profile saved" } }
      },
      delete: {
        summary: "Delete the signed-in user's health profile",
        security: [{ bearerAuth: [] }],
        responses: { "200": { description: "Health profile deleted" } }
      }
    },
    "/doctors": {
      get: {
        summary: "List verified doctors (public, filterable by region/specialization/language)",
        responses: { "200": { description: "Verified doctors fetched" } }
      }
    },
    "/doctors/{id}": {
      get: {
        summary: "Get a single verified doctor's public profile",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: { "200": { description: "Doctor fetched" }, "404": { description: "Doctor not found" } }
      }
    },
    "/doctors/me": {
      get: {
        summary: "Get the signed-in doctor's own profile + submitted documents",
        security: [{ bearerAuth: [] }],
        responses: { "200": { description: "Doctor profile fetched" } }
      },
      post: {
        summary: "Submit (or resubmit after rejection) the signed-in doctor's profile for review",
        security: [{ bearerAuth: [] }],
        responses: { "201": { description: "Doctor profile submitted for review" } }
      }
    },
    "/admin/doctors/pending": {
      get: {
        summary: "List doctors awaiting verification",
        security: [{ bearerAuth: [] }],
        responses: { "200": { description: "Pending doctors fetched" } }
      }
    },
    "/admin/doctors/{id}/approve": {
      put: {
        summary: "Verify a pending doctor",
        security: [{ bearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: { "200": { description: "Doctor verified" } }
      }
    },
    "/admin/doctors/{id}/reject": {
      put: {
        summary: "Reject a pending doctor (reason required)",
        security: [{ bearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        requestBody: { content: { "application/json": { schema: { type: "object", properties: { reason: { type: "string" } } } } } },
        responses: { "200": { description: "Doctor rejected" } }
      }
    },
    "/admin/doctors/{id}/suspend": {
      put: {
        summary: "Suspend a verified doctor (reason required)",
        security: [{ bearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        requestBody: { content: { "application/json": { schema: { type: "object", properties: { reason: { type: "string" } } } } } },
        responses: { "200": { description: "Doctor suspended" } }
      }
    },
    "/admin/doctors/{id}/revoke": {
      put: {
        summary: "Revoke a verified or suspended doctor (reason required)",
        security: [{ bearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        requestBody: { content: { "application/json": { schema: { type: "object", properties: { reason: { type: "string" } } } } } },
        responses: { "200": { description: "Doctor revoked" } }
      }
    },
    "/admin/audit-logs": {
      get: {
        summary: "List audit log entries (filterable by targetType/targetId/action)",
        security: [{ bearerAuth: [] }],
        responses: { "200": { description: "Audit logs fetched" } }
      }
    },
    "/doctor-guidance": {
      get: {
        summary: "Search published doctor guidance (public, filterable by productId/healthTopic/region/country/language)",
        responses: { "200": { description: "Published guidance fetched" } }
      },
      post: {
        summary: "Create a new guidance draft (verified-doctor-authored, not yet submitted)",
        security: [{ bearerAuth: [] }],
        responses: { "201": { description: "Guidance draft created" } }
      }
    },
    "/doctor-guidance/versions/{versionId}/submit": {
      put: {
        summary: "Submit a draft guidance version for admin review (doctor must currently be VERIFIED)",
        security: [{ bearerAuth: [] }],
        parameters: [{ name: "versionId", in: "path", required: true, schema: { type: "string" } }],
        responses: { "200": { description: "Guidance submitted for review" } }
      }
    },
    "/admin/doctor-guidance/submitted": {
      get: {
        summary: "List guidance versions awaiting admin review",
        security: [{ bearerAuth: [] }],
        responses: { "200": { description: "Submitted guidance fetched" } }
      }
    },
    "/admin/doctor-guidance/{versionId}/approve": {
      put: {
        summary: "Approve and publish a submitted guidance version",
        security: [{ bearerAuth: [] }],
        parameters: [{ name: "versionId", in: "path", required: true, schema: { type: "string" } }],
        responses: { "200": { description: "Guidance published" } }
      }
    },
    "/admin/doctor-guidance/{versionId}/reject": {
      put: {
        summary: "Reject a submitted guidance version (reason required)",
        security: [{ bearerAuth: [] }],
        parameters: [{ name: "versionId", in: "path", required: true, schema: { type: "string" } }],
        requestBody: { content: { "application/json": { schema: { type: "object", properties: { reason: { type: "string" } } } } } },
        responses: { "200": { description: "Guidance rejected" } }
      }
    },
    "/products": {
      get: {
        summary: "Search products (public, filterable by q/healthTopic/ingredient)",
        responses: { "200": { description: "Products fetched" } }
      },
      post: {
        summary: "Create a product (Manufacturer only)",
        security: [{ bearerAuth: [] }],
        responses: { "201": { description: "Product created" } }
      }
    },
    "/products/by-qr/{qrCode}": {
      get: {
        summary: "Look up a product by its QR code (public)",
        parameters: [{ name: "qrCode", in: "path", required: true, schema: { type: "string" } }],
        responses: { "200": { description: "Product fetched" }, "404": { description: "No product found for this QR code" } }
      }
    },
    "/products/suitability": {
      post: {
        summary: "Deterministic product-suitability check against the signed-in user's health profile (no LLM involved)",
        security: [{ bearerAuth: [] }],
        requestBody: { content: { "application/json": { schema: { type: "object", properties: { productId: { type: "string" }, productName: { type: "string" } } } } } },
        responses: { "200": { description: "Suitability check complete" } }
      }
    },
    "/stores/nearby": {
      get: {
        summary: "Find nearby active stores (public), optionally filtered to ones with a product in stock",
        parameters: [
          { name: "latitude", in: "query", required: true, schema: { type: "number" } },
          { name: "longitude", in: "query", required: true, schema: { type: "number" } },
          { name: "maxDistanceKm", in: "query", schema: { type: "number" } },
          { name: "productId", in: "query", schema: { type: "string" } }
        ],
        responses: { "200": { description: "Nearby stores fetched" } }
      }
    },
    "/stores": {
      post: {
        summary: "Create the signed-in Pharmacy/Distributor account's store",
        security: [{ bearerAuth: [] }],
        responses: { "201": { description: "Store created" } }
      }
    },
    "/stores/me/inventory": {
      put: {
        summary: "Upsert one product's availability/quantity/price in the signed-in store",
        security: [{ bearerAuth: [] }],
        responses: { "200": { description: "Inventory updated" } }
      }
    },
    "/complaints": {
      post: {
        summary: "Submit a product/QR complaint",
        security: [{ bearerAuth: [] }],
        responses: { "201": { description: "Complaint submitted" } }
      }
    },
    "/admin/complaints": {
      get: {
        summary: "List complaints (filterable by status)",
        security: [{ bearerAuth: [] }],
        responses: { "200": { description: "Complaints fetched" } }
      }
    },
    "/admin/complaints/{id}/status": {
      put: {
        summary: "Update a complaint's review status",
        security: [{ bearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: { "200": { description: "Complaint updated" } }
      }
    },
    "/admin/dashboard/stats": {
      get: {
        summary: "Admin dashboard summary counts (doctors, guidance, AI safety alerts, complaints)",
        security: [{ bearerAuth: [] }],
        responses: { "200": { description: "Dashboard stats fetched" } }
      }
    },
    "/chat/session": {
      post: {
        summary: "Start a new chat session",
        security: [{ bearerAuth: [] }],
        responses: { "201": { description: "Chat session created" } }
      },
      get: {
        summary: "List the signed-in user's chat sessions",
        security: [{ bearerAuth: [] }],
        responses: { "200": { description: "Chat sessions fetched" } }
      }
    },
    "/chat/session/{sessionId}/message": {
      post: {
        summary: "Send a message and get the AI assistant's reply (RAG + safety-classified)",
        security: [{ bearerAuth: [] }],
        parameters: [{ name: "sessionId", in: "path", required: true, schema: { type: "string" } }],
        requestBody: { content: { "application/json": { schema: { type: "object", properties: { content: { type: "string" } } } } } },
        responses: { "200": { description: "Message sent" } }
      }
    },
    "/collection": {
      post: {
        summary: "Submit a new raw herb collection",
        security: [{ bearerAuth: [] }],
        responses: { "201": { description: "Collection created" } }
      }
    }
  },
  components: {
    securitySchemes: {
      bearerAuth: { type: "http", scheme: "bearer", bearerFormat: "JWT" }
    }
  }
};

export const setupSwagger = (app: Application) => {
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
};
