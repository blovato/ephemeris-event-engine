import 'dotenv/config.js';
import express from "express";
import pkg from "body-parser";
const { json } = pkg;
import morgan from "morgan";
import { initializeSwissEphemeris } from "./ephemeris/swiss.js";
import findEventRoute from "./routes/findEvent.js";
import skyAtRoute from "./routes/skyAt.js";
import planetLongitudeRoute from "./routes/planetLongitude.js";
import parseQueryRoute from "./routes/parseQuery.js";

const app = express();
const PORT = process.env.PORT || 8080;
const HOST = process.env.HOST || "0.0.0.0";

// Middleware for parsing JSON request bodies
app.use(json());
// Morgan middleware for logging HTTP requests
app.use(morgan("dev")); // Use 'dev' format for concise, colorful output

// Function to initialize and start the server
async function startServer() {
  try {
    await initializeSwissEphemeris();
    console.log("Swiss Ephemeris initialized successfully.");
    console.log(`DEBUG: process.env.PORT is ${process.env.PORT}`);
    console.log(`DEBUG: App listening on PORT ${PORT}`);

    // Routes
    const apiRouter = express.Router();

    apiRouter.use("/find-event", findEventRoute);
    apiRouter.use("/sky-at", skyAtRoute);
    apiRouter.use("/planet-longitude", planetLongitudeRoute);
    apiRouter.use("/parse-query", parseQueryRoute);

    // Basic health check for API
    apiRouter.get("/health", (req, res) => {
      res.status(200).send("API OK");
    });

    app.use("/api", apiRouter); // Mount the API router

    app.get("/", (req, res) => {
      res.status(200).send("OK"); // Root endpoint remains
    });

    // Global error handling middleware
    app.use((err, req, res, next) => {
      console.error(err.stack);
      res.status(500).send({ error: "Something went wrong!" });
    });

    app.listen(PORT, HOST, () => {
      console.log(`Server running on http://${HOST}:${PORT}`);
    });
  } catch (error) {
    console.error(
      "Failed to initialize Swiss Ephemeris or start server:",
      error,
    );
    process.exit(1);
  }
}

// Start the server
startServer();
