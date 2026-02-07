# Ephemeris Event Engine

This is a Node.js (TypeScript) REST server designed to compute deterministic ephemeris events. It utilizes the Swiss Ephemeris library to calculate planetary positions and find specific astrological configurations based on defined constraints.

## What it Does

-   **Deterministic Ephemeris Calculations**: Computes precise geocentric ecliptic longitudes for celestial bodies.
-   **Event Finding**: Identifies UTC timestamps where specific astrological constraints (aspects, sign ingress, degree positions) are met, using a coarse-to-fine search algorithm.
-   **Sky State at a Given Time**: Provides the positions (longitude, sign, degree within sign) of all supported planets at a specified UTC timestamp.
-   **Individual Planet Longitude**: Returns the longitude of a single planet at a given UTC timestamp.
-   **Query Parsing (Mock)**: Translates natural language queries into structured astrological constraints (currently a mock implementation, demonstrating the API contract for an LLM integration).
-   **UTC Only**: All operations and timestamps are strictly in UTC.

## What it Explicitly Does NOT Do

-   **Astrology Interpretation**: This server provides raw ephemeris data and event-finding capabilities only. It does not offer any astrological interpretations, forecasts, or personal readings.
-   **UI/Frontend**: This is a backend REST API only. It does not include any user interface.
-   **Database Persistence**: All data is processed in-memory. There is no database integration or persistence of event data.
-   **Non-deterministic Calculations**: All calculations are based on the deterministic algorithms provided by the Swiss Ephemeris.
-   **Unsupported Planets/Aspects**: Only the planets and aspects defined in the types are supported. Invalid inputs will be rejected.
-   **Silent Defaults**: Input validation is enforced, and no silent defaults are used for critical parameters.

## Tech Stack

-   **Node.js**: v20+
-   **TypeScript**: For type safety and better developer experience.
-   **Express**: A minimal and flexible Node.js web application framework.
-   **Swiss Ephemeris (via `swisseph` library)**: The core library for astronomical calculations.

## Project Structure

```
src/
  server.ts                   // Main Express application setup
  routes/
    findEvent.ts              // Endpoint for POST /find-event
    skyAt.ts                  // Endpoint for POST /sky-at
    planetLongitude.ts        // Endpoint for POST /planet-longitude
    parseQuery.ts             // Endpoint for POST /parse-query
  ephemeris/
    swiss.ts                  // Wrapper for swisseph library and data path setup
    planetLongitudeAt.ts      // Calculates planet longitude and converts to sign/degree
  solver/
    findEvent.ts              // Core event finding logic (coarse scan, binary search)
    constraints.ts            // Functions to check if constraints are met
    aspects.ts                // Aspect definitions and degree utilities
  llm/
    parseQuery.ts             // Mock LLM for query parsing
  types/
    planets.ts                // TypeScript types for planets and zodiac signs
    constraints.ts            // TypeScript types for event constraints
    api.ts                    // TypeScript types for API request/response contracts
```

## Setup and Running

1.  **Clone the repository**:
    ```bash
    git clone <repository-url>
    cd ephemeris-event-engine
    ```

2.  **Install dependencies**:
    ```bash
    npm install
    ```

3.  **Download Swiss Ephemeris Data Files**:
    The `swisseph` library requires ephemeris data files (`sweph.core`). These files are crucial for the astronomical calculations and are *not* included in this repository due to their size and licensing.

    -   Download the necessary `sweph` data files from the official AstroDienst website: [https://www.astro.com/swisseph/swepha_src.htm](https://www.astro.com/swisseph/swepha_src.htm)
    -   Look for the section "Complete ephemeris files (large files)". You will typically need at least `sefedata.zip` or the relevant `sefXXX.zip` files for your desired time range.
    -   **Extract** the contents of the downloaded `zip` file(s) into a new directory named `sweph` at the **root** of this project (i.e., alongside `src`, `package.json`, etc.).
    -   Ensure that the `sweph` directory contains files like `sefplan.se1`, `seflunar.se1`, etc.

4.  **Build the TypeScript project**:
    ```bash
    npm run build
    ```
    (You might need to add a `build` script to `package.json`: `"build": "tsc"`)

5.  **Start the server**:
    ```bash
    npm start
    ```
    (You might need to add a `start` script to `package.json`: `"start": "node dist/server.js"`)

    Alternatively, for development with `ts-node`:
    ```bash
    npm install -D ts-node # if not already installed
    npx ts-node src/server.ts
    ```

    The server will start on `http://localhost:3000` (or the port specified by the `PORT` environment variable).

## API Endpoints and Example Requests

### POST /find-event

Finds a UTC timestamp that satisfies a set of astrological constraints.

**Input**:

```json
{
  "constraints": [
    {
      "kind": "aspect",
      "planetA": "Sun",
      "planetB": "Moon",
      "aspect": "conjunction",
      "orb": 0.1
    },
    {
      "kind": "in_sign",
      "planet": "Sun",
      "sign": "Pisces"
    }
  ],
  "direction": "future",
  "startTime": "2026-01-01T00:00:00Z"
}
```

**Output**:

```json
{
  "timestamp": "2026-03-19T08:41:00Z"
}
```

**Example cURL**:

```bash
curl -X POST -H "Content-Type: application/json" -d '{
  "constraints": [
    { "kind": "aspect", "planetA": "Sun", "planetB": "Moon", "aspect": "conjunction", "orb": 0.1 },
    { "kind": "in_sign", "planet": "Sun", "sign": "Pisces" }
  ],
  "direction": "future",
  "startTime": "2026-01-01T00:00:00Z"
}' http://localhost:3000/find-event
```

### POST /sky-at

Provides the positions of all supported planets at a given UTC timestamp.

**Input**:

```json
{
  "timestamp": "2026-03-19T08:41:00Z"
}
```

**Output**:

```json
{
  "planets": [
    { "planet": "Sun", "longitude": 358.2, "sign": "Pisces", "degree": 28.2 },
    { "planet": "Moon", "longitude": 358.1, "sign": "Pisces", "degree": 28.1 }
    // ... other planets
  ]
}
```

**Example cURL**:

```bash
curl -X POST -H "Content-Type: application/json" -d '{
  "timestamp": "2026-03-19T08:41:00Z"
}' http://localhost:3000/sky-at
```

### POST /planet-longitude

Returns the geocentric ecliptic longitude of a specific planet at a given UTC timestamp.

**Input**:

```json
{
  "planet": "Mars",
  "timestamp": "2026-03-19T08:41:00Z"
}
```

**Output**:

```json
{
  "longitude": 307.4
}
```

**Example cURL**:

```bash
curl -X POST -H "Content-Type: application/json" -d '{
  "planet": "Mars",
  "timestamp": "2026-03-19T08:41:00Z"
}' http://localhost:3000/planet-longitude
```

### POST /parse-query

Translates a natural language query into a structured set of astrological constraints.

**Input**:

```json
{
  "text": "When was the last time Pluto was opposite Uranus?"
}
```

**Output**:

```json
{
  "constraints": [
    {
      "kind": "aspect",
      "planetA": "Pluto",
      "planetB": "Uranus",
      "aspect": "opposition",
      "orb": 0
    }
  ],
  "direction": "past"
}
```

**Example cURL**:

```bash
curl -X POST -H "Content-Type: application/json" -d '{
  "text": "When was the last time Pluto was opposite Uranus?"
}' http://localhost:3000/parse-query
```
