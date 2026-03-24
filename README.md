# KaamConnect

KaamConnect is a modern platform that connects households and businesses with reliable blue-collar workers. Designed for both immediate (time-wise) and task-based (work-wise) hiring, it provides a seamless interface, real-time location matching, and a comprehensive booking management system.

## Key Features

- **Dual Roles (Separated Collections):** Distinct dashboards and capabilities for Workers and Employers, seamlessly unified through a smart login system.
- **Worker Bidding & Negotiation:** Employers set their own price; nearby workers bid and employer chooses the best offer — full price control, no platform-fixed rates.
- **Safety-First Platform:** Aadhar-verified workers, OTP-protected job confirmation, and video proof on arrival.
- **Geospatial Location Matching:** Uses MongoDB `$geoNear` to match employers with nearby workers.
- **Interactive Maps & Tracking:** Integration with Leaflet and OpenStreetMap. Employers can drop pins to set precise job locations, and workers can broadcast their real-time coordinates. Bookings calculate and display real-time live distance between the worker and the job.
- **Comprehensive Job Ecosystem:** Support for hiring "Per Hour/Shift" and "Per Task" across 20+ specialized categories (e.g. Electric Repair, AC Repair, Cleaning).
- **Ratings & Reviews:** Built-in review system to build trust between Workers and Employers.

## Tech Stack

- **Backend:** Node.js, Express.js
- **Database:** MongoDB (Mongoose) with GeoJSON spatial indexing
- **Frontend:** Vanilla HTML, CSS, JavaScript (Dynamic single-page feel without heavy framework overhead)
- **Mapping:** Leaflet.js w/ OpenStreetMap Tiles
- **Authentication:** JWT (JSON Web Tokens) with Secure HTTP-Only Cookies

## Run Locally

1. Clone the repository.
2. Ensure you have MongoDB running locally or a MongoDB Atlas URI.
3. Add a `.env` file to the root directory with the following configuration:
   ```env
   PORT=3000
   MONGO_URI_LOCAL=mongodb://127.0.0.1:27017/kaamconnect
   MONGO_URI_ATLAS=mongodb+srv://...
   JWT_SECRET=your_jwt_secret_key
   ```
4. Install backend dependencies:
   ```bash
   npm install
   ```
5. Start the server (Dev Mode):
   ```bash
   npm run dev
   ```
   Or standard start:
   ```bash
   npm start
   ```
6. Visit `http://localhost:3000`

## Hybrid Database Architecture
KaamConnect features a resilient startup script that searches for a local MongoDB daemon first for rapid development. If the local instance is missing or unreachable, it gracefully falls back to the cloud via MongoDB Atlas, ensuring the app consistently stays live.

## Vercel Deployment
The repository is fully configured for serverless deployment on Vercel (`vercel.json` included).
1. Connect this GitHub repository to Vercel.
2. Under "Environment Variables", set `MONGO_URI_ATLAS` to your connection string.
3. *Important*: If your Atlas password contains special characters (like `@` or `:`), it **must** be percent-encoded (e.g. `%40`). Do not include any brackets (`<` `>`) surrounding the password.

## Directory Structure

- `/models`: Mongoose Schemas (Worker, Employer, Job, Booking)
- `/routes`: Express API endpoints (Auth, Workers, Jobs, Bookings)
- `/middleware`: Authentication and Role checks
- `/public`: Frontend static assets (HTML, CSS variables, JS utilities)

---
*Created as a capstone project iteration for KaamConnect.*
