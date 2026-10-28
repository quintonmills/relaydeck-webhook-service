import path from "node:path";
import swaggerJSDoc from "swagger-jsdoc";

export const swaggerSpec = swaggerJSDoc({
  definition: {
    openapi: "3.0.3",
    info: {
      title: "RelayDeck API",
      version: "1.0.0",
      description: "Webhook subscription and dispatch API"
    },
    components: {
      securitySchemes: {
        RelayDeckHmac: {
          type: "apiKey",
          in: "header",
          name: "x-relaydeck-signature",
          description:
            "HMAC-SHA256 of the exact request body using API_HMAC_SECRET"
        }
      }
    },
    security: [{ RelayDeckHmac: [] }],
    servers: [{ url: "/" }]
  },
  apis: [path.join(__dirname, "../routes/*")]
});
