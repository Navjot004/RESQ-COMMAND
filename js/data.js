/* ══════════════════════════════════════════════════════
   SAR COMMAND — DATA STORE (100% DYNAMIC / NO HARDCODING)
   All data is fetched from and saved to the MongoDB Database via REST API
══════════════════════════════════════════════════════ */
const API_BASE_URL = 'http://127.0.0.1:8000/api';

let isApiOnline = false;

// ── CENTRAL OPERATIONAL STATE (INITIALIZED EMPTY — NO HARDCODED DATA) ──
const SAR = {
  incidents: [],
  teams: [],
  zones: [],
  resources: [],
  findings: [],
  activityLog: [],

  // Tactical Squad Colors
  teamColors: [
    '#E11D48', // Tactical Red (Alpha)
    '#2563EB', // Naval Blue (Bravo)
    '#0D9488', // Tactical Teal (Charlie)
    '#D97706', // Aviation Amber (Delta)
    '#0284C7', // Steel Blue (Echo)
    '#059669', // Medic Emerald (Foxtrot)
    '#0891B2', // Recon Cyan (Golf)
    '#64748B', // Tactical Slate (Hotel)
  ],

  // ── HELPERS & FORMATTERS ───────────────────────────
  getPriorityClass(p) {
    return `badge-${(p || 'medium').toLowerCase()}`;
  },

  getStatusClass(s) {
    return `badge-${(s || 'pending').toLowerCase().replace(/\s+/g, '-')}`;
  },

  formatTime(date) {
    if (!date) return '—';
    const d = date instanceof Date ? date : new Date(date);
    const diff = Math.floor((Date.now() - d.getTime()) / 1000);
    if (diff < 60) return `${diff}s ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return d.toLocaleDateString();
  },

  formatDateTime(date) {
    if (!date) return '—';
    const d = date instanceof Date ? date : new Date(date);
    return d.toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  },

  nextId(prefix, list) {
    const nums = list
      .map((x) => parseInt((x.id || '').split('-')[1]))
      .filter((n) => !isNaN(n));
    const max = nums.length ? Math.max(...nums) : 0;
    return `${prefix}-${String(max + 1).padStart(prefix === 'T' || prefix === 'Z' ? 2 : 3, '0')}`;
  },

  getTeam(id) {
    return SAR.teams.find((t) => t.id === id) || null;
  },

  getZone(id) {
    return SAR.zones.find((z) => z.id === id) || null;
  },

  getIncident(id) {
    return SAR.incidents.find((i) => i.id === id) || null;
  },

  categoryIcon(cat) {
    const icons = {
      vehicles: '🚢',
      aviation: '🚁',
      medical: '🩺',
      equipment: '⚙️',
      communication: '📡',
      food: '🥫',
    };
    return icons[cat] || '📦';
  },

  findingIcon(type) {
    const icons = {
      'person-found': '👤',
      clue: '🔎',
      evidence: '🧭',
      hazard: '⚠️',
    };
    return icons[type] || '📍';
  },
};

// ── DYNAMIC ACTIVITY LOG GENERATOR (BASED ON REAL DB RECORDS) ──
function refreshDynamicActivityLog() {
  const logs = [];

  // Add latest findings from MongoDB
  SAR.findings.slice(0, 4).forEach((f, idx) => {
    logs.push({
      id: `act-f-${idx}`,
      type: f.type === 'hazard' ? 'error' : 'success',
      text: `<strong>${f.title}</strong> reported at ${f.location}`,
      time: SAR.formatTime(f.reportedAt),
      color: f.type === 'hazard' ? '#EF4444' : '#10B981',
    });
  });

  // Add latest incident status from MongoDB
  SAR.incidents.slice(0, 4).forEach((inc, idx) => {
    logs.push({
      id: `act-i-${idx}`,
      type: inc.priority === 'critical' ? 'error' : 'info',
      text: `<strong>${inc.id}</strong>: ${inc.title} [${inc.status.toUpperCase()}]`,
      time: SAR.formatTime(inc.createdAt),
      color: inc.priority === 'critical' ? '#EF4444' : '#0EA5E9',
    });
  });

  SAR.activityLog = logs;
}

// ── CONNECTION STATUS UI ─────────────────────────────
function updateConnectionStatusUI(online) {
  const el = document.getElementById('connectionStatus');
  if (!el) return;
  if (online) {
    el.innerHTML = `
      <span class="status-dot pulse-green"></span>
      <span class="status-text">Live • MongoDB Connected</span>
    `;
  } else {
    el.innerHTML = `
      <span class="status-dot" style="background:#EF4444"></span>
      <span class="status-text" style="color:#F87171">API Disconnected</span>
    `;
  }
}

// ── BACKEND HEALTH CHECK ─────────────────────────────
async function checkBackendHealth() {
  try {
    const res = await fetch(`${API_BASE_URL}/health`, { signal: AbortSignal.timeout(2000) });
    return res.ok;
  } catch (err) {
    return false;
  }
}

// ── AUTHENTICATION TOKEN MANAGEMENT ───────────────────
let currentAuthToken = localStorage.getItem('sar_token') || null;

async function ensureAuthToken() {
  if (currentAuthToken) return currentAuthToken;
  try {
    const res = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'commander@resq.in', password: 'password123' }),
    });
    if (res.ok) {
      const data = await res.json();
      currentAuthToken = data.token;
      localStorage.setItem('sar_token', data.token);
      localStorage.setItem('sar_user', JSON.stringify(data.user));
    }
  } catch (e) {
    console.warn('Auto-auth notice:', e.message);
  }
  return currentAuthToken;
}

function getAuthHeaders(extraHeaders = {}) {
  const headers = { 'Content-Type': 'application/json', ...extraHeaders };
  if (currentAuthToken) {
    headers['Authorization'] = `Bearer ${currentAuthToken}`;
  }
  return headers;
}

// ── FETCH FUNCTIONS (DIRECT FROM MONGODB) ─────────────

async function fetchIncidents() {
  try {
    const res = await fetch(`${API_BASE_URL}/incidents/`, { signal: AbortSignal.timeout(5000) });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    if (Array.isArray(data)) {
      SAR.incidents = data.map((inc) => ({
        id: inc.id,
        _dbId: inc._dbId || inc.id,
        title: inc.title,
        location: inc.location,
        lat: inc.latitude,
        lng: inc.longitude,
        priority: (inc.priority || 'medium').toLowerCase(),
        status: inc.status === 'IN_PROGRESS' ? 'contained' : (inc.status || 'active').toLowerCase(),
        description: inc.description || '',
        reportedBy: inc.reported_by || 'Operations HQ',
        createdAt: new Date(inc.created_at || Date.now()),
        updatedAt: new Date(inc.updated_at || inc.created_at || Date.now()),
        teams: inc.teams || [],
        zones: inc.zones || [],
        findings: inc.findings || 0,
      }));
      return true;
    }
    return false;
  } catch (err) {
    console.error('Failed to load incidents from MongoDB:', err.message);
    return false;
  }
}

async function fetchTeams() {
  try {
    const res = await fetch(`${API_BASE_URL}/teams/`, { signal: AbortSignal.timeout(5000) });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    if (Array.isArray(data)) {
      SAR.teams = data.map((t) => ({
        id: t.id,
        _dbId: t._dbId || t.id,
        name: t.name,
        leader: t.leader,
        members: t.members,
        status: t.status,
        zone: t.zone,
        color: t.color || '#0284C7',
        specialization: t.specialization,
        contact: t.contact,
        equipment: t.equipment || [],
        lat: t.lat,
        lng: t.lng,
      }));
      return true;
    }
    return false;
  } catch (err) {
    console.error('Failed to load teams from MongoDB:', err.message);
    return false;
  }
}

async function fetchZones() {
  try {
    const res = await fetch(`${API_BASE_URL}/zones/`, { signal: AbortSignal.timeout(5000) });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    if (Array.isArray(data)) {
      SAR.zones = data.map((z) => ({
        id: z.id,
        _dbId: z._dbId || z.id,
        name: z.name,
        incident: z.incident,
        team: z.team,
        status: z.status,
        progress: z.progress || 0,
        lat: z.lat,
        lng: z.lng,
        coords: z.coords || [],
      }));
      return true;
    }
    return false;
  } catch (err) {
    console.error('Failed to load zones from MongoDB:', err.message);
    return false;
  }
}

async function fetchResources() {
  try {
    const res = await fetch(`${API_BASE_URL}/resources/`, { signal: AbortSignal.timeout(5000) });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    if (Array.isArray(data)) {
      SAR.resources = data.map((r) => ({
        id: r.id,
        _dbId: r._dbId || r.id,
        item: r.item,
        category: r.category,
        qty: r.qty,
        unit: r.unit,
        team: r.team,
        incident: r.incident,
        priority: (r.priority || 'medium').toLowerCase(),
        status: r.status,
        requestedAt: new Date(r.requestedAt || Date.now()),
        notes: r.notes || '',
      }));
      return true;
    }
    return false;
  } catch (err) {
    console.error('Failed to load resources from MongoDB:', err.message);
    return false;
  }
}

async function fetchFindings() {
  try {
    const res = await fetch(`${API_BASE_URL}/findings/`, { signal: AbortSignal.timeout(5000) });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    if (Array.isArray(data)) {
      SAR.findings = data.map((f) => ({
        id: f.id,
        _dbId: f._dbId || f.id,
        type: f.type,
        title: f.title,
        location: f.location,
        zone: f.zone,
        team: f.team,
        incident: f.incident,
        lat: f.lat,
        lng: f.lng,
        description: f.description || '',
        status: f.status,
        reportedAt: new Date(f.reportedAt || Date.now()),
      }));
      return true;
    }
    return false;
  } catch (err) {
    console.error('Failed to load findings from MongoDB:', err.message);
    return false;
  }
}

// ── MASTER SYNC FUNCTION ─────────────────────────────
async function fetchAllSARData() {
  const isHealthy = await checkBackendHealth();
  if (!isHealthy) {
    updateConnectionStatusUI(false);
    return false;
  }

  // Ensure active auth session for write operations
  await ensureAuthToken();

  const [incOk, teamsOk, zonesOk, resOk, fndOk] = await Promise.all([
    fetchIncidents(),
    fetchTeams(),
    fetchZones(),
    fetchResources(),
    fetchFindings(),
  ]);

  isApiOnline = incOk && teamsOk && zonesOk && resOk && fndOk;
  updateConnectionStatusUI(isApiOnline);

  // Generate dynamic live logs from real DB data
  refreshDynamicActivityLog();

  return isApiOnline;
}
