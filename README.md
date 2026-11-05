# 🚨 RESQ-COMMAND — Search and Rescue (SAR) Coordination Platform

> **A real-time, defense-grade tactical command center built for multi-agency Search and Rescue (SAR) operations, disaster management squads, incident commanders, and field teams.**

---

## 📋 Table of Contents
1. [Project Overview & Problem Statement](#-project-overview--problem-statement)
2. [Real Data vs. Simulated Data (The Data Reality)](#-real-data-vs-simulated-data-the-data-reality)
3. [Architecture & Technology Stack](#-architecture--technology-stack)
4. [Role-Based Access Control (RBAC) Architecture](#-role-based-access-control-rbac-architecture)
5. [Tactical Roles & Permissions Matrix](#-tactical-roles--permissions-matrix)
6. [Demo Credentials & 1-Click Role Switcher](#-demo-credentials--1-click-role-switcher)
7. [Real-Time Socket.IO Tactical Audit Feed](#-real-time-socketio-tactical-audit-feed)
8. [Deep-Dive: How Every Page Works](#-deep-dive-how-every-page-works)
   - [1. Operations Dashboard](#1-operations-dashboard-pagedashboard)
   - [2. Tactical Search Map (GIS)](#2-tactical-search-map-pagemap)
   - [3. Incident Management & Map Picker](#3-incident-management-pageincidents)
   - [4. Teams & Squad Management (How Teams Work)](#4-teams--squad-management-pageteams)
   - [5. Resource Logistics & Supply Chain](#5-resource-logistics-pageresources)
   - [6. Field Findings & Clues](#6-field-findings--clues-pagefindings)
9. [Tactical Map Location Picker Module](#-tactical-map-location-picker-module)
10. [Mobile & Tablet Responsive Design System](#-mobile--tablet-responsive-design-system)
11. [API Specification & Backend Routes](#-api-specification--backend-routes)
12. [Database Schema & Models](#-database-schema--models)
13. [Project Directory Structure](#-project-directory-structure)
14. [Setup & Running Instructions](#-setup--running-instructions)
15. [Summary for Evaluators & Examiners](#-summary-for-evaluators--examiners)

---

## 🎯 Project Overview & Problem Statement

### Problem Statement
During natural disasters, flash floods, avalanches, and missing-person crises in challenging terrain (e.g., the Himalayas), search and rescue operations involve multiple specialized teams deployed across fragmented sectors. Operational coordination often suffers from:
- **Lack of common operational picture**: Commanders cannot see real-time sector coverage.
- **Geographic ambiguity**: Responders and reporting callers cannot recite exact numeric coordinates (latitude/longitude like `32.24546, 77.18729`).
- **Resource bottlenecks**: Medical kits, oxygen cylinders, thermal drones, and transport vehicles are requested without centralized tracking.
- **Fatigue & Comms Gaps**: Teams lose safety check-in accountability, risking rescuer safety.

### Project Objective
**RESQ-COMMAND** solves this by providing a unified, centralized web-based coordination platform that manages:
1. **Dynamic Incident Creation** with automated map-based geocoding and reverse-geocoding.
2. **Search Sector Designation** via interactive polygon drawing tools.
3. **Tactical Squad Deployment** with structured crew roles, VHF frequencies, callsigns, and radio safety check-ins.
4. **Logistics & Resource Requests** with workflow approval states.
5. **Field Findings & Clues** tagged directly to incidents, sectors, and teams.
6. **Real-time Operations Dashboard** for high-level situational awareness.

---

## 🌐 Real Data vs. Simulated Data (The Data Reality)

A critical requirement of this project is **zero hardcoding**:

| Component | Status | How It Works in RESQ-COMMAND |
| :--- | :--- | :--- |
| **Frontend State** | **100% Dynamic** | The frontend (`js/data.js`) contains **zero hardcoded fallback mock arrays**. State variables (`SAR.incidents`, `SAR.teams`, `SAR.zones`, `SAR.resources`, `SAR.findings`) are initialized completely empty (`[]`) and populated via live REST calls to the backend. |
| **Database** | **Real Cloud DB** | Connected to a live **MongoDB Atlas** cluster (`sar_platform` database). All creates, updates, status changes, and sector assignments persist directly to cloud collections. |
| **Geocoding & Search** | **Live OpenStreetMap API** | When an operator types any place name (e.g., *"Solang Valley"*, *"Rohtang Pass"*, *"Manali"*, *"Shimla"*, or any global location), the request queries real-time OpenStreetMap **Nominatim** geographic servers via the `/api/geocode/search` proxy. |
| **Reverse Geocoding** | **Live Spatial Resolution** | Clicking anywhere on the map or dragging a pin executes `/api/geocode/reverse?lat=...&lng=...`, resolving numeric GPS coordinates into actual human-readable road, village, and district names. |
| **Map Basemap Tiles** | **Real Defense Tiles** | Uses official **Esri ArcGIS** map tile services (`World_Dark_Gray_Base`, `World_Dark_Gray_Reference`, `World_Imagery` Satellite Recon, and `World_Topo_Map`). These are 100% unblocked, have **zero CARTO watermarks**, and require no proprietary API key. |
| **Baseline Operational Scenario** | **Realistic Disaster Dataset** | Seeded via [`backend/seed.js`](backend/seed.js), providing a realistic mountain search-and-rescue disaster scenario based in the Kullu/Manali mountain corridor (Himachal Pradesh, India) with 5 real incidents, 8 multi-agency teams, 9 tactical sectors, 8 logistical resources, and 7 geolocated findings. |

---

## 🏗️ Architecture & Technology Stack

```
   ┌──────────────────────────────────────────────────────────────┐
   │                   CLIENT (BROWSER UI)                        │
   │   - HTML5, Modular Vanilla ES6+ JavaScript, CSS3 variables   │
   │   - Leaflet.js 1.9.4 (GIS Engine) & Leaflet.draw (Polygons)  │
   │   - Responsive Design (Mobile / Tablet / Desktop)            │
   │   - Tactical Role-Based UI Adaptations & Identity Pill       │
   └──────────────────────────────┬───────────────────────────────┘
                                  │  REST API (JSON + Bearer JWT)
                                  │  + WebSockets (Socket.IO)
                                  ▼
   ┌──────────────────────────────────────────────────────────────┐
   │                 BACKEND SERVER (Node.js & Express)           │
   │   - Express.js REST API with CORS enabled                    │
   │   - JWT Authentication & RBAC Middleware (verifyToken/Roles) │
   │   - Real-time Socket.IO Live Tactical Audit Broadcaster      │
   │   - Reverse Geocoding & Search Proxy (/api/geocode)          │
   │   - Mongoose ODM Layer                                       │
   └──────────────────────────────┬───────────────────────────────┘
                                  │
                                  ▼
   ┌──────────────────────────────────────────────────────────────┐
   │                 DATABASE (MongoDB Atlas Cloud)               │
   │   - Collections: Users, Incidents, Teams, Zones,             │
   │                  Resources, Findings                         │
   └──────────────────────────────────────────────────────────────┘
```

- **Frontend Core**: Vanilla JavaScript (ES6+), HTML5, CSS3 variables.
- **Mapping & GIS**: Leaflet.js v1.9.4, Leaflet.draw v1.0.4, Esri ArcGIS Tile Servers.
- **Backend Runtime**: Node.js (v24.x) & Express.js.
- **Database**: MongoDB Atlas via Mongoose ODM.
- **Authentication & Security**: JSON Web Tokens (JWT) signed with HMAC-SHA256, bcryptjs password hashing, role-based route guards.
- **Real-Time Engine**: Socket.IO for live tactical activity audits and domain event distribution.
- **Geocoding Services**: OpenStreetMap Nominatim with server-side in-memory caching.

---

## 🔐 Role-Based Access Control (RBAC) Architecture

During high-intensity multi-agency disaster operations, strict chain-of-command integrity is critical:
- An unauthorized operator must **never** be able to delete active incident records or arbitrarily reassign rescue squads.
- Field leaders must have immediate, friction-free authority to report survivor clues and update sector progress without waiting for HQ bottlenecks.
- Supply officers require exclusive custody over equipment approvals and dispatch lifecycles.

To solve this, **RESQ-COMMAND** enforces a defense-grade **Role-Based Access Control (RBAC)** architecture across both the backend REST endpoints and the interactive frontend client.

### Backend Security Enforcement
1. **JWT Authentication (`backend/middleware/auth.js`)**:
   - `verifyToken`: Extracts and cryptographically verifies the `Authorization: Bearer <token>` header. Decodes user identity, checks token expiration (8-hour operational shift window), and attaches the full `req.user` profile.
   - `authorizeRoles(...allowedRoles)`: A higher-order route guard. If the authenticated role is not in the allowed list, the request is immediately rejected with HTTP `403 Forbidden` and a structured diagnostic response:
     ```json
     {
       "error": "Forbidden",
       "message": "Access denied: Required role [COMMANDER], your role is [FIELD_LEADER]"
     }
     ```
2. **Password Security**:
   - All passwords are encrypted using `bcryptjs` with salted hashing before persistence in MongoDB.
3. **Role Scoping at Route Level**:
   - **Incidents:** Only `COMMANDER` can create or delete incidents. `COMMANDER` and `COORDINATOR` can update status/priority.
   - **Zones / Sectors:** Only `COMMANDER` and `COORDINATOR` can draw new sectors or assign teams. `FIELD_LEADER` can update search progress (0–100%) and mark sectors completed.
   - **Teams:** Only `COMMANDER` and `COORDINATOR` can commission squads or modify assignments. `FIELD_LEADER` can broadcast radio check-ins and update operational status for their assigned squad.
   - **Resources:** Any authenticated user can submit a supply request. Only `COMMANDER` and `LOGISTICS` can approve, dispatch, or deliver items.
   - **Findings:** `FIELD_LEADER`, `COORDINATOR`, and `COMMANDER` can log real-time clues and survivor locations.

### Dynamic Frontend Adaptations
1. **Automatic Bearer Token Injection**:
   - The central data client (`js/data.js`) stores the signed JWT in `localStorage` upon login and automatically injects `Authorization: Bearer <token>` into all `fetch()` calls via `SAR.authFetch()`.
   - If an unauthorized action is attempted, a tactical toast alert displays the exact clearance limitation.
2. **Role-Aware UI Rendering (`js/app.js`, `js/dashboard.js`, `js/map.js`, `js/teams.js`, `js/resources.js`)**:
   - Navigation links, buttons, drawing toolbars, and action forms dynamically hide, show, or lock depending on `SAR.currentUser.role`.

---

## 🛡️ Tactical Roles & Permissions Matrix

| Tactical Role | Badge & Callsign | Page Clearance Scope | Creation Permissions | Operational / Update Permissions | Approval & Admin Authority | Restricted / Locked Actions |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **COMMANDER** | 🎖️ `COMMAND-01`<br>`#e74c3c` | Full Access (All 6 Pages)<br>*Dashboard, Map, Incidents, Teams, Resources, Findings* | • New Incidents<br>• Search Sectors<br>• Commission Squads<br>• Log Findings<br>• Supply Requests | • Update incident status/priority<br>• Assign squads to sectors<br>• Radio safety check-ins<br>• Delete any incident | • Full logistics approval pipeline (`PENDING` ➔ `APPROVED` ➔ `DISPATCHED` ➔ `DELIVERED`)<br>• Incident deletion authority | **None** (Supreme Operational Authority) |
| **COORDINATOR** | 📡 `OPS-COORD-01`<br>`#3498db` | Operations Clearance (5 Pages)<br>*Dashboard, Map, Incidents, Teams, Findings* | • Search Sectors (Polygons)<br>• Assign Squads<br>• Log Field Findings<br>• Supply Requests | • Update incident status/priority<br>• Reassign squads & sectors<br>• Update team status | • Sector tactical management<br>• Field coordination | ✕ Cannot delete incidents<br>✕ Cannot approve or dispatch logistical resources |
| **FIELD_LEADER** | 🥾 `T-01-LEAD`<br>`#2ecc71` | Tactical Field Clearance (3 Pages)<br>*Map, Assigned Team, Field Findings* | • Log Field Findings & Clues<br>• Emergency Supply Requests | • Update assigned sector progress (0–100%)<br>• Broadcast squad radio check-in<br>• Update squad operational status | • In-situ sector progress validation<br>• Squad safety verification | ✕ Cannot create/delete incidents<br>✕ Cannot draw new search sectors<br>✕ Non-assigned squads are read-only<br>✕ Cannot approve logistical supplies |
| **LOGISTICS** | 📦 `SUPPLY-BASE`<br>`#f39c12` | Supply Chain Clearance (2 Pages)<br>*Resources & Tactical Map* | • Log Supply Requests<br>• Equipment Procurement | • Route resources to incidents & sectors<br>• Monitor map delivery waypoints | • **Exclusive Logistics Custody**: Approve (`APPROVED`), dispatch (`DISPATCHED`), and mark delivered (`DELIVERED`) | ✕ Cannot create/delete incidents<br>✕ Cannot draw search sectors<br>✕ Cannot alter team deployments |

---

## 🎯 Demo Credentials & 1-Click Role Switcher

To allow academic evaluators and examiners to test the complete multi-role system immediately without manual sign-ups or database re-seeding, 4 pre-configured accounts are seeded directly into MongoDB Atlas:

| Persona | Email | Password | Callsign | Assigned Unit | Primary Operational Role |
| :--- | :--- | :--- | :--- | :--- | :--- |
| 🎖️ **Incident Commander** | `commander@resq.in` | `password123` | `COMMAND-01` | HQ Command Post | Strategic command, incident authoring, full approvals |
| 📡 **Zone Coordinator** | `coordinator@resq.in` | `password123` | `OPS-COORD-01` | Operations Centre | Sector designation, squad routing, spatial coordination |
| 🥾 **Field Team Leader** | `alpha.lead@resq.in` | `password123` | `T-01-LEAD` | Alpha Mountain Rescue (T-01) | Sector search execution, radio check-ins, finding clues |
| 📦 **Logistics Officer** | `logistics@resq.in` | `password123` | `SUPPLY-BASE` | Base Logistics Depot | Supply chain verification, equipment dispatch, delivery tracking |

### Evaluator Features for Rapid Testing
1. **Defense-Grade Tactical Login Screen (`#authOverlay`)**:
   - When opened without an active session, a sleek dark tactical portal blocks access.
   - Evaluators can enter custom credentials **OR** click any of the **4 Quick Demo Role Login Buttons** to log in instantaneously with one click.
2. **Topbar Tactical Identity Pill (`.user-identity-pill`)**:
   - The persistent top navigation bar displays the active user's Name, Callsign, and a color-coded Role Badge.
   - Includes a **`[ 🔄 Switch Role ]`** button that opens a tactical overlay. Evaluators can transition between **Commander**, **Field Leader**, **Coordinator**, and **Logistics** instantly without page reload, observing real-time UI adaptations.
3. **Tactical Role Mandate Banner (`.role-mandate-banner`)**:
   - Displayed prominently at the top of the Operations Dashboard.
   - Highlights the operator's active clearance scope, color theme, and explicit permission badges (`✓ Allowed` vs. `✕ Locked`).

---

## ⚡ Real-Time Socket.IO Tactical Audit Feed

RESQ-COMMAND integrates an event-driven **Socket.IO** telemetry feed that streams real-time field updates across all connected command stations and mobile units:

### Event Architecture
Whenever an authorized operator performs an operational change, the backend route broadcasts an `activity:log` event containing structured actor metadata:
```javascript
// Backend Broadcast Structure
io.emit('activity:log', {
  text: `<strong>[${req.user.role} | ${req.user.callsign}]</strong> Created critical incident: Rohtang Pass Avalanche`,
  badge: 'CRITICAL',
  badgeClass: 'tag-critical',
  time: new Date().toISOString()
});
```

### Live Tactical Feed Updates
- **Incident Created / Status Updated:** Broadcasts priority elevation or containment.
- **Search Sector Progress Slider:** Emits live percentage updates (e.g., `[FIELD_LEADER | T-01-LEAD] Updated Sector Alpha progress to 75%`).
- **Radio Safety Check-in:** Logs live VHF frequency check-ins to confirm rescuer health and comms integrity.
- **Field Finding / Clue Discovered:** Broadcasts GPS-tagged evidence or survivor sightings.
- **Logistics Status Transition:** Streams real-time equipment approval and dispatch confirmations.

All broadcasts immediately prepend to the **Live Activity Feed** on `#page-dashboard` with glowing radar pulse indicators.

---

## 🔍 Deep-Dive: How Every Page Works

### 1. Operations Dashboard (`#page-dashboard`)
**File:** [`js/dashboard.js`](js/dashboard.js)

The central command dashboard provides an at-a-glance situational summary for Incident Commanders:
- **Top Metric Cards:**
  - *Active Incidents:* Number of critical and open emergencies requiring action.
  - *Deployed Squads:* Active teams currently deployed in the field vs. total available roster.
  - *Sectors Completed:* Overall geographic search clearance percentage (`completedZones / totalZones`).
  - *Pending Requests:* Critical logistical resource requests awaiting HQ dispatch.
- **Live Activity Feed:**
  - Reverse-chronological radar feed of latest mission milestones, incident reports, team check-ins, and survivor rescues.
  - Dynamically colored priority markers (Critical = Red, High = Orange, Medium = Amber, Low = Blue).
- **Incident Priority Distribution:**
  - Visual progress meters illustrating proportion of Critical vs. High vs. Medium vs. Low threats.
- **Squad Status Gauge:**
  - Real-time distribution of personnel across `Deployed`, `Standby`, `Returning`, and `Off-Duty` states.
- **Quick Deployment Actions:** Direct shortcut triggers to open New Incident, Draw Zone, or Commission Squad modals.

---

### 2. Tactical Search Map (`#page-map`)
**File:** [`js/map.js`](js/map.js)

The interactive GIS engine built on Leaflet.js represents the spatial Common Operational Picture (COP):
- **Tactical Basemap Switcher:**
  - **Tactical Dark Canvas (Default):** Esri World Dark Gray Base + Reference layer for low eye-strain in dimly lit command tents.
  - **Satellite Recon:** High-resolution Esri World Imagery photography displaying real terrain, snow lines, rivers, and cliffs.
  - **Topographic Relief:** Contoured elevation maps for assessing mountain steepness and avalanche gradients.
- **Layer Toggles:**
  - `Sectors (Zones)`: Toggle polygon boundary visualization.
  - `Squads (Teams)`: Toggle live GPS markers of field units.
  - `Findings`: Toggle survivor, hazard, clue, and evidence map pins.
- **Interactive Sector Creation (Leaflet.draw):**
  - Click **"✏️ Designate Sector"** to activate polygon drawing.
  - Click points on the map to enclose a valley or search grid.
  - On polygon completion, a modal prompts for Sector ID, Sector Name, Priority, Assigned Squad, and Terrain Type.
  - Persists directly to MongoDB Atlas.
- **Real-Time Team Tracking Markers:**
  - Custom HTML DivIcons with directional arrows and team color borders.
  - Live Unit badge indicating active telemetry.
  - Clicking any squad opens the slide-out Map Detail Inspector.
- **Slide-Out Detail Inspector / Mobile Bottom-Sheet:**
  - Displays squad leader, VHF frequency, assigned zone progress bar, and list of findings reported in that sector.

---

### 3. Incident Management (`#page-incidents`)
**File:** [`js/incidents.js`](js/incidents.js)

Tracks all emergency distress calls, missing person alerts, and disaster events:
- **Filter Bar:** Filter incidents instantly by `All`, `Critical`, `High`, `Medium`, `Low`, `Active`, `Contained`, `Resolved`.
- **Incident Data Table:** Displays Incident ID, Title, Location, Priority badge, Status badge, Assigned Teams, Findings counter, Reported Time, and Action buttons.
- **New Incident Modal with Location Picker:**
  - Click **"+ New Incident"** to open the creation dialog.
  - Instead of guessing coordinates, the operator searches any location name or clicks anywhere on the embedded tactical mini-map.
  - Automatically fills Location, Latitude, and Longitude.
  - Select priority, description, reporting agency, and multi-select squads.
  - On submit, saves to MongoDB Atlas (`POST /api/incidents/`), broadcasts via Socket.IO, and auto-refreshes the dashboard and map.
- **Status Lifecycle:** Click **"Update"** on any row to cycle the incident through `ACTIVE` &rarr; `CONTAINED` &rarr; `RESOLVED`.

---

### 4. Teams & Squad Management (How Teams Work)
**File:** [`js/teams.js`](js/teams.js) & [`backend/models/Team.js`](backend/models/Team.js)

The Teams system is modeled after professional Search and Rescue standards (FEMA ICS & Mountain Rescue Association) while remaining straightforward and intuitive for a college project:

#### 1. Tactical Callsign & Radio Communications
Every team has:
- A standardized **Tactical Callsign** (e.g., `CALL: T-01-LEAD`, `T-02-LEAD`).
- A dedicated **VHF Radio Channel** (e.g., `VHF 155.160 MHz`).
- This ensures realistic radio communication accountability between HQ and the field.

#### 2. Structured Crew Roles (Beyond Just a Number)
Rather than displaying an abstract number like "6 people", clicking **"Roster & Gear"** on any team reveals a functional crew breakdown:
- **Squad Commander:** Mission decision-maker and radio lead (e.g., *Capt. Vikram Batra*).
- **Medical Lead:** Certified EMT / Paramedic Level-2 responsible for field trauma stabilization.
- **Scout / Navigator:** Route planning, GPS coordinates, and pathfinder specialist.
- **Field Operators:** Certified technical searchers, rope riggers, or K9 handlers.

#### 3. Operational States & Sector Progress
Teams cycle through four clear operational states:
- `Deployed` (Green): Actively sweeping an assigned search sector. Shows live % of sector swept.
- `Standby` (Blue): Stationed at Command Base Camp, fully rested, ready for immediate deployment.
- `Returning` (Purple): Search completed; en route back to base camp for debrief.
- `Off-Duty` (Gray): Mandatory rest cycle / shift relief.

#### 4. Interactive "Radio Check-in" Action
Inside the **Roster & Gear** modal, clicking **"📡 Radio Check-in"**:
1. Confirms the squad has checked in over VHF radio.
2. Posts a verified safety confirmation into the system-wide live activity stream.
3. Triggers a tactical notification toast to confirm all personnel are nominal.

#### 5. Assign Sector Modal
Click **"Assign Sector"** to assign or reassign any available search zone to the team. This updates both the team record and the zone record in MongoDB.

---

### 5. Resource Logistics & Supply Chain (`#page-resources`)
**File:** [`js/resources.js`](js/resources.js)

Manages mission equipment, emergency assets, and supply logistics:
- **Summary Counters:** Total items, items deployed in field, items available at base warehouse, and pending resource requests.
- **Logistics Categories:**
  - `Medical`: Trauma kits, hypothermia warmers, automated external defibrillators (AED).
  - `Vehicles`: 4x4 troop carriers, snowmobiles, ambulances.
  - `Aviation`: Air-ambulance helicopters, thermal search UAV drones.
  - `Personnel`: Heavy rescue squads, dog teams.
  - `Comms`: Satellite transceivers, repeater stations.
- **Request Lifecycle Workflow:**
  - Requests move from `PENDING` &rarr; `APPROVED` &rarr; `DISPATCHED` &rarr; `DELIVERED`.
  - Authorized commanders can approve or cycle request states with a single click.

---

### 6. Field Findings & Clues (`#page-findings`)
**File:** [`js/findings.js`](js/findings.js)

Captures on-the-ground intelligence reported by search teams:
- **Four Standard Finding Types:**
  - 🧍 `Person Found`: Survivor located (injured, ambulatory, or awaiting evacuation).
  - 🔍 `Clue`: Physical evidence discovered (e.g., dropped backpack, footprints, trekking pole).
  - ⚠️ `Hazard`: Environmental threat identified (e.g., rockfall, washed-out bridge, crevasse).
  - 🪝 `Evidence`: Structural or aircraft debris, vehicle wreckage.
- **Interactive Map Pinning:** When logging a finding, the finder uses the same embedded tactical map picker to pinpoint the exact location where the clue was discovered.
- **Export Report:** Generates a structured operational summary report ready for export to higher headquarters or local authorities.

---

## 🗺️ Tactical Map Location Picker Module
**File:** [`js/location-picker.js`](js/location-picker.js) & [`css/modals.css`](css/modals.css)

Built to solve the problem that ordinary users and field callers do not know decimal coordinates:
1. **Search Bar:** Type any town, valley, mountain pass, or landmark. Uses real-time geocoding to fly the map pin directly to the target.
2. **Click & Drag Selection:** Clicking anywhere on the mini-map or dragging the pulsing target crosshair moves the marker and triggers reverse-geocoding to resolve the human-readable address.
3. **One-Click GPS Button:** Click **[ GPS ]** to acquire the browser/device GPS coordinates in the field.
4. **Auto-Fill:** Automatically populates `Location Name`, `Latitude`, and `Longitude` without manual numeric typing.

---

## 📱 Mobile & Tablet Responsive Design System
**File:** [`css/responsive.css`](css/responsive.css) & [`js/app.js`](js/app.js)

The application is completely responsive across phones, tablets, and desktops:

```
  Desktop (>= 1024px)            Tablet / Mobile (<= 768px)
┌───────────────────────┐      ┌─────────────────────────┐
│ [Sidebar] [Main Area] │ ===> │ [ ☰ ] SAR Command       │  (Hamburger Menu)
│  260px     Fluid      │      │ ┌─────────────────────┐ │
│                       │      │ │ Drawer slides from  │ │  (Backdrop overlay)
│  4-column cards       │      │ │ left on tap         │ │
│  Side-by-side tables  │      │ └─────────────────────┘ │
└───────────────────────┘      │ 1-2 column cards        │
                               │ Scrollable data tables  │
                               │ Slide-up map inspector  │
                               └─────────────────────────┘
```

- **Off-Canvas Navigation Drawer:** On mobile screens ($\le 768\text{px}$), the sidebar converts to a slide-out drawer controlled by a topbar hamburger button (`[ ☰ ]`).
- **Touch-Friendly Tables:** Tables feature smooth horizontal scrolling with preserved readability.
- **Map Bottom-Sheet Inspector:** On mobile, clicking a team or sector opens the detail panel as a native slide-up bottom sheet instead of an awkward side panel.
- **Single-Column Modal Layouts:** All modal dialogs and form rows (`.form-row`) adapt to full-width mobile viewports with full touch targets.

---

## 📡 API Specification & Backend Routes

The backend server is an Express.js application listening on port `8000`. Protected endpoints require an `Authorization: Bearer <token>` header containing a valid signed JWT:

### Authentication & Identity
| Method | Endpoint | Clearance | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/login` | **Public** | Authenticate with `{ email, password }`. Returns `{ token, user }` with 8-hour shift validity. |
| `GET` | `/api/auth/me` | **Authenticated** | Returns current active user profile, callsign, role, and assigned team. |

### System & Health
| Method | Endpoint | Clearance | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/` | **Public** | API status and tactical platform version info |
| `GET` | `/api/health` | **Public** | Health check (reports MongoDB Atlas connection state & Node.js version) |

### Geocoding & GIS Resolution
| Method | Endpoint | Clearance | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/geocode/search?q={query}` | **Public** | Searches place names via OpenStreetMap Nominatim with memory cache |
| `GET` | `/api/geocode/reverse?lat={lat}&lng={lng}` | **Public** | Reverse-geocodes coordinates into road, village, and state names |

### Incidents
| Method | Endpoint | Clearance | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/incidents/` | **Authenticated** | List all incidents (sorted newest first) |
| `GET` | `/api/incidents/:id` | **Authenticated** | Get single incident details with linked teams, zones, and findings |
| `POST` | `/api/incidents/` | `COMMANDER` | Create new incident `{ title, description, location, latitude, longitude, priority, reported_by, teams }` |
| `PATCH`| `/api/incidents/:id` | `COMMANDER`, `COORDINATOR` | Update incident status or priority |
| `DELETE`| `/api/incidents/:id` | `COMMANDER` | Delete incident from active database |

### Teams / Squads
| Method | Endpoint | Clearance | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/teams/` | **Authenticated** | List all rescue squads with personnel, comms, and GPS positions |
| `POST` | `/api/teams/` | `COMMANDER`, `COORDINATOR` | Commission new squad `{ name, leader, members, specialization, contact, zone, color }` |
| `PATCH`| `/api/teams/:id` | `COMMANDER`, `COORDINATOR` *(or `FIELD_LEADER` for assigned squad)* | Update squad status or assigned zone |
| `POST` | `/api/teams/:id/checkin` | `COMMANDER`, `COORDINATOR`, `FIELD_LEADER` | Trigger tactical radio safety check-in on squad's VHF frequency |

### Search Zones / Sectors
| Method | Endpoint | Clearance | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/zones/` | **Authenticated** | List all designated search zones and polygon perimeters |
| `POST` | `/api/zones/` | `COMMANDER`, `COORDINATOR` | Designate new zone polygon `{ zone_id, name, coordinates, priority, team, status }` |
| `PATCH`| `/api/zones/:id` | `COMMANDER`, `COORDINATOR` *(or `FIELD_LEADER` for search progress)* | Update search progress percentage (`progress: 0-100%`) or assigned team |

### Resources & Logistics
| Method | Endpoint | Clearance | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/resources/` | **Authenticated** | List all logistical equipment and supply requests |
| `POST` | `/api/resources/` | **Any Authenticated** | Log new resource request `{ name, type, quantity, priority, incident, zone }` |
| `PATCH`| `/api/resources/:id`| `COMMANDER`, `LOGISTICS` | Transition request lifecycle status (`pending`, `approved`, `dispatched`, `delivered`) |

### Field Findings
| Method | Endpoint | Clearance | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/findings/` | **Authenticated** | List all field findings, clues, and survivor reports |
| `POST` | `/api/findings/` | `COMMANDER`, `COORDINATOR`, `FIELD_LEADER` | Record new field clue/finding `{ type, title, location, lat, lng, zone, team, incident }` |

---

## 🗄️ Database Schema & Models

All models are defined via Mongoose in [`backend/models/`](backend/models/):

1. **User (`User.js`):**
   - Fields: `name`, `email` (unique, lowercase), `password` (hashed with `bcryptjs`), `role` (enum: `COMMANDER`, `COORDINATOR`, `FIELD_LEADER`, `LOGISTICS`), `callsign`, `assigned_team` (references `team_id`), `created_at`.
   - Security: Pre-save hook automatically salts and hashes updated passwords. Instance method `comparePassword(candidatePassword)` securely verifies credentials.
2. **Incident (`Incident.js`):**
   - Fields: `incident_id`, `title`, `description`, `location`, `latitude`, `longitude`, `priority` (LOW, MEDIUM, HIGH, CRITICAL), `status` (ACTIVE, CONTAINED, RESOLVED), `reported_by`, `teams`, `zones`, `findings`, `created_at`.
3. **Team (`Team.js`):**
   - Fields: `team_id`, `name`, `leader`, `members` (crew breakdown with sub-roles), `status` (deployed, standby, returning, off-duty), `zone`, `color`, `specialization`, `contact` (VHF callsign & channel), `last_checkin`, `equipment`, `lat`, `lng`.
4. **Zone (`Zone.js`):**
   - Fields: `zone_id`, `name`, `coordinates` (array of lat/lng pairs forming GIS polygon), `priority`, `status` (assigned, in-progress, completed, pending), `progress` (integer 0–100%), `team`, `center` (centroid lat/lng), `terrain`.
5. **Resource (`Resource.js`):**
   - Fields: `resource_id`, `name`, `type` (medical, vehicles, aviation, personnel, comms), `quantity`, `status` (pending, approved, dispatched, delivered), `priority`, `incident`, `zone`, `location`, `requested_at`.
6. **Finding (`Finding.js`):**
   - Fields: `finding_id`, `type` (person-found, clue, hazard, evidence), `title`, `location`, `lat`, `lng`, `zone`, `team`, `incident`, `description`, `status`, `reportedAt`.

---

## 📁 Project Directory Structure

```
RESQ-COMMAND/
├── index.html                  # Main Application Single-Page Interface with Auth Overlay
├── README.md                   # Complete Architectural Documentation & Matrix
│
├── css/
│   ├── main.css                # Base Layout, Dark Command Theme & Tactical Role Styling
│   ├── modals.css              # Glassmorphism Modals & Location Picker Pin Styles
│   ├── animations.css          # Tactical Radar Pulses, Glowing Pins & Fade-ins
│   └── responsive.css          # Mobile / Tablet Breakpoints & Drawer Styles
│
├── js/
│   ├── app.js                  # Application Router, RBAC Navigation Guard & Modals Manager
│   ├── data.js                 # Dynamic State Orchestrator, JWT Auth & Socket.IO Listener
│   ├── dashboard.js            # Operations Dashboard, Role Mandate Banner & Live Radar Feed
│   ├── map.js                  # Leaflet GIS Engine, Polygon Drawer & Role Map Toolbar
│   ├── location-picker.js      # Tactical Map Geocoding & Reverse-Geocoding Module
│   ├── incidents.js            # Incident Table, Filtering & Incident Creation Modal
│   ├── teams.js                # Squad Cards, Crew Roles, Comms & Radio Check-in
│   ├── resources.js            # Logistics Supply Chain & Request Lifecycle Manager
│   └── findings.js             # Field Clues, Survivor Findings & Geo-logging
│
└── backend/
    ├── server.js               # Express Server, Static Serving & Socket.IO Engine
    ├── package.json            # Node.js Dependencies & NPM Scripts
    ├── seed.js                 # Realistic Himalayan Disaster & Demo RBAC Accounts Seeder
    ├── .env                    # MongoDB Atlas URI, JWT Secret & Port Configuration
    ├── .env.example            # Environment Variable Template for Production / Review
    ├── config/
    │   └── db.js               # Mongoose MongoDB Atlas Connection Pool
    ├── middleware/
    │   └── auth.js             # JWT Security Middleware (verifyToken & authorizeRoles)
    ├── models/
    │   ├── User.js             # User & RBAC Mongoose Model (bcryptjs)
    │   ├── Incident.js         # Incident Mongoose Model
    │   ├── Team.js             # Team / Squad Mongoose Model
    │   ├── Zone.js             # Search Sector Polygon Mongoose Model
    │   ├── Resource.js         # Logistics Mongoose Model
    │   └── Finding.js          # Field Finding Mongoose Model
    └── routes/
        ├── auth.js             # Authentication Endpoints (Login & Current User)
        ├── incidents.js        # Incident REST Endpoints with RBAC Guards
        ├── teams.js            # Team REST Endpoints with RBAC Guards
        ├── zones.js            # Zone REST Endpoints with RBAC Guards
        ├── resources.js        # Resource REST Endpoints with RBAC Guards
        ├── findings.js         # Finding REST Endpoints with RBAC Guards
        └── geocode.js          # Live Geocoding & Reverse-Geocoding Proxy
```

---

## 🚀 Setup & Running Instructions

### 1. Prerequisites
- **Node.js** (v18 or higher recommended; v24 fully supported)
- An active internet connection (for MongoDB Atlas cloud and Esri map tiles)

### 2. Backend Setup
1. Open a terminal and navigate to the `backend/` directory:
   ```bash
   cd backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Ensure `.env` is present with your MongoDB Atlas connection string and JWT secret:
   ```env
   PORT=8000
   MONGODB_URL=mongodb+srv://<username>:<password>@sar-platform.luvgars.mongodb.net/?retryWrites=true&w=majority
   MONGODB_DATABASE=sar_platform
   JWT_SECRET=super_secret_sar_defense_grade_jwt_key_2026
   JWT_EXPIRES_IN=8h
   ```
4. Seed the database with the realistic disaster scenario and 4 demo accounts (optional / first time):
   ```bash
   node seed.js
   ```
5. Start the backend server:
   ```bash
   npm start
   ```
   The backend will log:
   ```
   🚀 RESQ COMMAND Node.js Server listening on http://127.0.0.1:8000
   ✅ MongoDB Connected: ac-nadgbrm-shard-00-01.luvgars.mongodb.net (DB: sar_platform)
   ```

### 3. Frontend Launch & Role Testing
You can access the frontend in either of two ways:
- **Directly via the Node backend:** Open `http://127.0.0.1:8000/index.html` in your browser.
- **Via VS Code Live Server:** Right-click `index.html` and choose **"Open with Live Server"** (`http://127.0.0.1:5500`).

#### 1-Click Demo Evaluation:
1. When the Tactical Login Screen appears, click any of the 4 demo role buttons:
   - 🎖️ **Incident Commander** (`commander@resq.in`)
   - 📡 **Zone Coordinator** (`coordinator@resq.in`)
   - 🥾 **Field Team Leader** (`alpha.lead@resq.in`)
   - 📦 **Logistics Officer** (`logistics@resq.in`)
2. To test different roles during evaluation, click the **`[ 🔄 Switch Role ]`** button in the topbar header to seamlessly swap personas and inspect permission enforcement.

---

## 🏆 Summary for Evaluators & Examiners

1. **Not a mock UI**: Every user, incident, squad, finding, and zone is saved and retrieved from live **MongoDB Atlas**.
2. **Defense-Grade RBAC**: Enforces strict operational clearance with signed JWTs, protecting critical incident and dispatch workflows.
3. **Real-world geospatial intelligence**: Users do not have to memorize latitude and longitude; typing a place or clicking the map resolves exact GPS coordinates and location names dynamically via OpenStreetMap.
4. **Live Telemetry & Audit Broadcaster**: Socket.IO streams instantaneous, role-tagged operational audits (`[ROLE | CALLSIGN]`) across all active command stations.
5. **Professional disaster response standard**: Teams possess tactical callsigns, VHF radio frequencies, crew role breakdowns, and radio safety check-in accountability.
6. **Device agnostic**: Works on desktop monitors in command centers and mobile smartphones in the field with a dedicated off-canvas drawer and responsive touch layout.
