import 'dotenv/config.js';
import express from "express";
import path from "path"; // Import path module
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
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

// Define the path to the static files (Next.js build output)
const staticFilesPath = path.join(__dirname, "../../web/out");

// Routes
const apiRouter = express.Router(); // Define apiRouter here

apiRouter.use("/find-event", findEventRoute);
apiRouter.use("/sky-at", skyAtRoute);
apiRouter.use("/planet-longitude", planetLongitudeRoute);
apiRouter.use("/parse-query", parseQueryRoute);

// Basic health check for API
apiRouter.get("/health", (req, res) => {
  res.status(200).send("API OK");
});

// Function to initialize and start the server
async function startServer() {
  try {
    await initializeSwissEphemeris();
    console.log("Swiss Ephemeris initialized successfully.");
    console.log(`DEBUG: process.env.PORT is ${process.env.PORT}`);
    console.log(`DEBUG: App listening on PORT ${PORT}`);

    app.use("/api", apiRouter); // Mount the API router
    
    // Serve static files from the Next.js app
    app.use(express.static(staticFilesPath));

    // Serve the Next.js app for any other GET requests to the root
    app.use((req, res, next) => { // Added 'next' here for consistency, though not strictly used in this handler
      res.sendFile(path.join(staticFilesPath, "index.html"), (err) => {
        if (err) {
          console.error("Error sending index.html:", err);
          // If a file cannot be sent (e.g., doesn't exist), pass to next middleware
          // or send a 500 status.
          if (err.code === 'ENOENT') {
            res.status(404).send('Not Found');
          } else {
            next(err); // Pass unexpected errors to the global error handler
          }
        }
      });
    });

    // Global error handling middleware - MUST be last
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
