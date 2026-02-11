import { Router } from "express";
import rateLimit from "express-rate-limit"; // Import rateLimit
import {
  // ParseQueryRequest, ParseQueryResponse are for JSDoc only
} from "../types/api.js"; // Added .js
import { parseQuery as llmParseQuery } from "../llm/parseQuery.js";

const router = Router();

// Rate limiting configuration
const parseQueryLimiter = rateLimit({
  windowMs: parseInt(process.env.PARSE_QUERY_RATE_LIMIT_WINDOW_MS || "60000", 10), // 1 minute
  max: parseInt(process.env.PARSE_QUERY_RATE_LIMIT_MAX || "10", 10), // Max 10 requests per minute
  message: "Too many requests from this IP, please try again after a minute.",
  standardHeaders: true, // Return rate limit info in the X-RateLimit-* headers
  legacyHeaders: false, // Disable the X-Powered-By: Express header
});

// Apply rate limiting specifically to the parse-query route
router.post("/", parseQueryLimiter, async (req, res) => {
  /** @type {ParseQueryRequest} */
  const { text } = req.body;

  // Input validation
  if (!text || typeof text !== "string") {
    return res.status(400).json({ error: "Text query is required and must be a string" });
  }

  try {
    const parsedLLMResponse = await llmParseQuery(text); // Await the async function
    /** @type {ParseQueryResponse} */
    const response = {
      constraints: parsedLLMResponse.constraints,
      direction: parsedLLMResponse.direction,
      startTime: parsedLLMResponse.startTime, // Now included
    };
    res.json(response);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;