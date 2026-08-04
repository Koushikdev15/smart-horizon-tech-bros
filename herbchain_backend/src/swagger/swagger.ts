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
    "/auth/login": {
      post: {
        summary: "Login to the platform",
        requestBody: {
          content: { "application/json": { schema: { type: "object", properties: { email: { type: "string" }, password: { type: "string" } } } } }
        },
        responses: { "200": { description: "Successful login" } }
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
