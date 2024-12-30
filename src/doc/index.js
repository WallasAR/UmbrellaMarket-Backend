import swaggerUi from "swagger-ui-express";
import swaggerSpec from "../config/swagger.js";
import fs from "fs";
import path from "path";

const setupSwagger = (app) => {
  const customCss = fs.readFileSync(
    path.resolve("src/config/swaggerUI.css"),
    "utf8"
  );

  app.use(
    "/docs",
    swaggerUi.serve,
    swaggerUi.setup(swaggerSpec, {
      customCss,
      customJs: `/static/swaggerJs.js`,
      customSiteTitle: "Umbrella API Docs",
      customfavIcon: "/static/assets/favicon.png",
    })
  );
};

export default setupSwagger;
