# 🚨 RESQ-COMMAND (SAR Command Platform)

A real-time **Search and Rescue (SAR) Coordination & Command Platform** built for emergency response coordinators, incident commanders, and rescue squads to manage disaster operations, field teams, search zones, logistics, and field findings.

---

## 🌟 Key Features

- **Operations Dashboard**: Real-time stats on active incidents, deployed rescue squads, zone coverage, and a live activity radar.
- **Interactive GIS Map**: Built with [Leaflet.js](https://leafletjs.com/) and [Leaflet.draw](https://github.com/Leaflet/Leaflet.draw) using OpenStreetMap tiles (no API key required). Supports custom polygon zone drawing, real-time team markers, and geolocated findings.
- **Incident Management**: Incident tracker with priority levels (Critical, High, Medium, Low), status tracking (Active, Contained, Resolved), and full CRUD operations.
- **Team Roster & Deployment**: Monitor rescue squads (e.g. Mountain Rescue, Avalanche Search, Flood Rescue), leaders, radio frequencies, and equipment status.
- **Resource Logistics**: Manage vehicle, aviation, and medical resource requests with workflow approval states (Pending, Dispatched, Delivered).
- **Field Findings & Clues**: Log survivor rescues, physical clues, debris, and secondary hazard reports.
- **Real-Time Ready**: Built-in **Socket.IO** support for streaming live team coordinates and operational alerts.

---

## 🏗️ Architecture

- **Frontend**: HTML5, Vanilla JavaScript (ES6+), CSS3 with a tactical dark command-center theme.
- **Backend**: **Node.js & Express.js**
- **Database**: **MongoDB Atlas** (via Mongoose)
- **Real-time Engine**: **Socket.IO**
- **Authentication**: JWT (`jsonwebtoken`) + password hashing (`bcryptjs`)

---

## 🚀 Getting Started

### 1. Prerequisites
- [Node.js](https://nodejs.org/) (v18+ recommended)
- A modern web browser

### 2. Backend Setup
1. Open a terminal and navigate to the `backend/` folder:
   ```bash
   cd backend
   ```
2. Install dependencies (if not already installed):
   ```bash
   npm install
   ```
3. Ensure `.env` is configured with your MongoDB Atlas connection string and secret key:
   ```env
   MONGODB_URL=mongodb+srv://<user>:<password>@sar-platform.luvgars.mongodb.net/?retryWrites=true&w=majority
   MONGODB_DATABASE=sar_platform
   SECRET_KEY=your-secret-key-here
   PORT=8000
   ```
4. Start the server:
   ```bash
   npm start
   # or with auto-reload:
   npm run dev
   ```
   The backend will be running at: `http://127.0.0.1:8000`

> **Note on MongoDB Atlas Connection**:  
> If the backend logs a connection notice, ensure your current IP address is whitelisted in [MongoDB Atlas](https://cloud.mongodb.com/) under **Network Access** (or add `0.0.0.0/0` to allow access from any IP during development). Even if offline or disconnected, the frontend will smoothly run using built-in simulation data.

### 3. Frontend Setup
Simply open `index.html` in your browser:
- Using VS Code: Right-click `index.html` and select **"Open with Live Server"** (runs on port 5500).
- Or using any static file server:
  ```bash
  npx serve .
  ```

---

## 📡 API Endpoints

### System
- `GET /` — API root and status
- `GET /api/health` — Health check & database connection status

### Authentication
- `POST /api/auth/register` — Register a team member `{ name, email, password }`
- `POST /api/auth/login` — Login and receive JWT `{ email, password }`

### Incidents
- `GET /api/incidents/` — List all incidents (sorted newest first)
- `GET /api/incidents/:id` — Get single incident by ID
- `POST /api/incidents/` — Create incident `{ title, description, location, latitude, longitude, priority }`
- `PATCH /api/incidents/:id` — Update incident status or priority
- `DELETE /api/incidents/:id` — Delete incident

