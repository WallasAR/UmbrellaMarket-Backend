// src/swaggerConfig.js
import swaggerJSDoc from "swagger-jsdoc";

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Umbrella Marketplace API",
      version: "1.5.0",
      description: `
### Welcome to the Umbrella Corporation API documentation!  
The purpose of this documentation is to provide detailed information about the system's endpoints, functionalities, and operational logic. This API supports various e-commerce operations such as product management, inventory control, payment processing, and more.

Get Started:
  - Use the endpoints described below to interact with the system.
  - Each endpoint is fully documented with request and response examples.
      `,
      // contact: {
      //   name: "Umbrella Corporation Support",
      //   email: "support@umbrella.com",
      //   url: "https://www.umbrella.com/contact"
      // },
      license: {
        name: "License",
        url: "https://opensource.org/licenses/MIT"
      }
    },
    servers: [
      {
        url: `http://localhost:999/api`, // URL for local dev tests
        description: "Development Environment"
      }
    ],
    components: {
      securitySchemes: {
        Token: {  // Mudando para uma autenticação personalizada
          type: 'apiKey',  // Altere para "apiKey" se não for usar o "bearer"
          in: 'header',    // A chave estará no cabeçalho
          name: 'Authorization',  // Nome do cabeçalho
        },
      },
    },
    security: [
      {
        Token: [],  // Usando a autenticação personalizada
      },
    ],
  },
  apis: [
    "src/doc/routes/*.js", // Path to your Swagger doc annotations
  ],
};

const swaggerSpec = swaggerJSDoc(options);

export default swaggerSpec;
