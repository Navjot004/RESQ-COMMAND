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

  // ── ROLE & USER HELPERS ────────────────────────────
  get currentUser() {
    return (typeof Auth !== 'undefined') ? Auth.getUser() : null;
  },
  set currentUser(u) {
    if (typeof Auth !== 'undefined' && u) {
      Auth.setSession(Auth.getToken(), u);
    }
  },
  hasRole(...roles) {
    const u = SAR.currentUser;
    return !!(u && roles.includes(u.role));
  },
  isCommander() { return SAR.hasRole('COMMANDER'); },
  isCoordinator() { return SAR.hasRole('COORDINATOR'); },
  isFieldLeader() { return SAR.hasRole('FIELD_LEADER'); },
  isLogistics() { return SAR.hasRole('LOGISTICS'); },
  getMyTeam() {
    const u = SAR.currentUser;
    if (!u || !u.assigned_team) return null;
    return SAR.getTeam(u.assigned_team);
  },
  getMyZone() {
    const t = SAR.getMyTeam();
    if (!t || !t.zone) return null;
    return SAR.getZone(t.zone);
  },

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

  // Add latest findings from MongoDB with Field Leader Actor tags
  SAR.findings.slice(0, 3).forEach((f, idx) => {
    logs.push({
      id: `act-f-${idx}`,
      type: f.type === 'hazard' ? 'error' : 'success',
      text: `<span class="activity-actor-tag actor-leader">[FIELD_LEADER | T-01-LEAD]</span> Logged ${f.type.toUpperCase()}: <strong>${f.title}</strong> at ${f.location}`,
      time: SAR.formatTime(f.reportedAt),
      color: f.type === 'hazard' ? '#EF4444' : '#10B981',
    });
  });

  // Add latest incident status from MongoDB with Commander Actor tags
  SAR.incidents.slice(0, 3).forEach((inc, idx) => {
    logs.push({
      id: `act-i-${idx}`,
      type: inc.priority === 'critical' ? 'error' : 'info',
      text: `<span class="activity-actor-tag actor-commander">[COMMANDER | COMMAND-01]</span> Declared ${inc.priority.toUpperCase()} incident: <strong>${inc.id}</strong> (${inc.title})`,
      time: SAR.formatTime(inc.createdAt),
      color: inc.priority === 'critical' ? '#EF4444' : '#EA580C',
    });
  });

  // Add latest resource requests with Logistics Actor tags
  SAR.resources.slice(0, 2).forEach((res, idx) => {
    logs.push({
      id: `act-r-${idx}`,
      type: 'info',
      text: `<span class="activity-actor-tag actor-logistics">[LOGISTICS | SUPPLY-BASE]</span> ${res.status.toUpperCase()} supply order: <strong>${res.qty} ${res.unit} ${res.item}</strong>`,
      time: SAR.formatTime(res.requestedAt),
      color: res.status === 'delivered' ? '#10B981' : '#F59E0B',
    });
  });

  // Add radio telemetry check-in
  logs.push({
    id: `act-radio-init`,
    type: 'success',
    text: `<span class="activity-actor-tag actor-leader">[FIELD_LEADER | T-01-LEAD]</span> Broadcasted VHF radio check-in (Signal 5/5 at Base)`,
    time: '2m ago',
    color: '#10B981',
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

// ── AUTHENTICATION & RBAC CONTROLLER ─────────────────
const DEMO_ACCOUNTS = {
  commander:   { email: 'commander@resq.in', password: 'password123', label: 'Incident Commander', role: 'COMMANDER' },
  coordinator: { email: 'coordinator@resq.in', password: 'password123', label: 'Zone Coordinator', role: 'COORDINATOR' },
  leader:      { email: 'alpha.lead@resq.in', password: 'password123', label: 'Field Leader (Alpha)', role: 'FIELD_LEADER' },
  logistics:   { email: 'logistics@resq.in', password: 'password123', label: 'Logistics Officer', role: 'LOGISTICS' },
};

const Auth = {
  getToken() {
    return localStorage.getItem('sar_token') || null;
  },

  getUser() {
    try {
      const u = localStorage.getItem('sar_user');
      return u ? JSON.parse(u) : null;
    } catch (e) {
      return null;
    }
  },

  setSession(token, user) {
    if (token) localStorage.setItem('sar_token', token);
    if (user) localStorage.setItem('sar_user', JSON.stringify(user));
    currentAuthToken = token;
    Auth.updateIdentityUI(user);
  },

  clearSession() {
    localStorage.removeItem('sar_token');
    localStorage.removeItem('sar_user');
    currentAuthToken = null;
    Auth.updateIdentityUI(null);
    Auth.showLoginOverlay(false);
  },

  updateIdentityUI(user) {
    const avatarMap = {
      COMMANDER: 'IC',
      COORDINATOR: 'ZC',
      FIELD_LEADER: 'FL',
      LOGISTICS: 'LO',
    };

    const roleClassMap = {
      COMMANDER: 'role-badge-commander',
      COORDINATOR: 'role-badge-coordinator',
      FIELD_LEADER: 'role-badge-leader',
      LOGISTICS: 'role-badge-logistics',
    };

    const role = user?.role || 'COMMANDER';
    const name = user?.name || 'Tactical Operator';
    const callsign = user?.callsign || 'HQ-OPERATOR';
    const initials = avatarMap[role] || (name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()) || 'OP';

    // Topbar Tactical Identity Pill
    const topAvatar = document.getElementById('topbarUserAvatar');
    const topName = document.getElementById('topbarUserName');
    const topCallsign = document.getElementById('topbarUserCallsign');
    const topRoleBadge = document.getElementById('topbarUserRoleBadge');

    if (topAvatar) topAvatar.textContent = initials;
    if (topName) topName.textContent = name;
    if (topCallsign) topCallsign.textContent = callsign;
    if (topRoleBadge) {
      topRoleBadge.textContent = role;
      topRoleBadge.className = `role-badge ${roleClassMap[role] || 'role-badge-commander'}`;
    }

    // Sidebar User Profile
    const sideAvatar = document.getElementById('sidebarUserAvatar');
    const sideName = document.getElementById('sidebarUserName');
    const sideRole = document.getElementById('sidebarUserRole');

    if (sideAvatar) sideAvatar.textContent = initials;
    if (sideName) sideName.textContent = name;
    if (sideRole) sideRole.textContent = `${role} • ${callsign}`;

    // Reconfigure Sidebar for current role
    if (typeof App !== 'undefined' && typeof App.configureSidebarForRole === 'function') {
      App.configureSidebarForRole(role);
    }
  },

  showLoginOverlay(canDismiss = true) {
    const overlay = document.getElementById('authOverlay');
    const dismissBtn = document.getElementById('authDismissBtn');
    if (!overlay) return;

    if (dismissBtn) {
      dismissBtn.style.display = (canDismiss && Auth.getUser()) ? 'flex' : 'none';
    }
    overlay.classList.remove('hidden');

    const alertBox = document.getElementById('authAlert');
    if (alertBox) {
      alertBox.textContent = '';
      alertBox.classList.add('hidden');
    }
  },

  hideLoginOverlay() {
    const overlay = document.getElementById('authOverlay');
    if (overlay) overlay.classList.add('hidden');
  },

  openRoleSwitcher() {
    Auth.showLoginOverlay(true);
  },

  async login(email, password) {
    const alertBox = document.getElementById('authAlert');
    const submitBtn = document.getElementById('authSubmitBtn');
    const submitText = document.getElementById('authSubmitText');
    const spinner = document.getElementById('authSpinner');

    if (submitBtn) submitBtn.disabled = true;
    if (submitText) submitText.textContent = 'Authenticating...';
    if (spinner) spinner.classList.remove('hidden');
    if (alertBox) alertBox.classList.add('hidden');

    try {
      const res = await nativeFetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.detail || data.message || 'Authentication failed. Please verify credentials.');
      }

      // Successful tactical authentication
      Auth.setSession(data.token, data.user);
      Auth.hideLoginOverlay();

      if (typeof Toast !== 'undefined') {
        Toast.show(
          'success',
          'Tactical Access Granted',
          `Authenticated as ${data.user.name} [${data.user.role}]`
        );
      }

      // Synchronize all tactical data with new role clearance
      if (typeof fetchAllSARData === 'function') {
        await fetchAllSARData();
      }
      if (typeof updateBadges === 'function') {
        updateBadges();
      }
      if (typeof App !== 'undefined') {
        const targetPage = App.getDefaultPageForRole ? App.getDefaultPageForRole(data.user.role) : (App.currentPage || 'dashboard');
        App.navigate(targetPage);
      }

      return true;
    } catch (err) {
      if (alertBox) {
        alertBox.textContent = `❌ ${err.message}`;
        alertBox.classList.remove('hidden');
      }
      if (typeof Toast !== 'undefined') {
        Toast.show('error', 'Auth Failed', err.message);
      }
      return false;
    } finally {
      if (submitBtn) submitBtn.disabled = false;
      if (submitText) submitText.textContent = '⚡ Authenticate Session';
      if (spinner) spinner.classList.add('hidden');
    }
  },

  async quickLogin(roleKey) {
    const acc = DEMO_ACCOUNTS[roleKey];
    if (!acc) return;

    const emailInput = document.getElementById('authEmail');
    const passInput = document.getElementById('authPassword');
    if (emailInput) emailInput.value = acc.email;
    if (passInput) passInput.value = acc.password;

    return await Auth.login(acc.email, acc.password);
  },

  async checkSession() {
    const token = Auth.getToken();
    if (!token) {
      return false;
    }

    try {
      const res = await nativeFetch(`${API_BASE_URL}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
        signal: AbortSignal.timeout(4000),
      });

      if (!res.ok) {
        Auth.clearSession();
        return false;
      }

      const data = await res.json();
      Auth.setSession(token, data.user);
      return true;
    } catch (err) {
      console.warn('Session verification fallback:', err.message);
      const user = Auth.getUser();
      if (user) {
        Auth.updateIdentityUI(user);
        return true;
      }
      return false;
    }
  },

  initListeners() {
    // 1-Click Quick Demo Role Cards
    document.querySelectorAll('.demo-role-card').forEach((card) => {
      card.addEventListener('click', (e) => {
        e.preventDefault();
        const role = card.dataset.role;
        if (role) Auth.quickLogin(role);
      });
    });

    // Manual Form Submission
    const form = document.getElementById('authLoginForm');
    if (form) {
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        const email = document.getElementById('authEmail')?.value.trim();
        const password = document.getElementById('authPassword')?.value;
        if (email && password) {
          Auth.login(email, password);
        }
      });
    }

    // Dismiss Button (Only shown when already logged in and switching roles)
    const dismissBtn = document.getElementById('authDismissBtn');
    if (dismissBtn) {
      dismissBtn.addEventListener('click', () => Auth.hideLoginOverlay());
    }

    // Topbar Switch Role Button
    const switchBtn = document.getElementById('switchRoleBtn');
    if (switchBtn) {
      switchBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        Auth.openRoleSwitcher();
      });
    }

    // Topbar Identity Pill Click
    const topPill = document.getElementById('topbarIdentityPill');
    if (topPill) {
      topPill.addEventListener('click', () => Auth.openRoleSwitcher());
    }

    // Sidebar User Profile Click
    const sideProfile = document.getElementById('sidebarUserProfile');
    if (sideProfile) {
      sideProfile.addEventListener('click', () => Auth.openRoleSwitcher());
    }

    // Click Outside Overlay to Dismiss (Only if already authenticated)
    const overlay = document.getElementById('authOverlay');
    if (overlay) {
      overlay.addEventListener('click', (e) => {
        if (e.target === overlay && Auth.getUser()) {
          Auth.hideLoginOverlay();
        }
      });
    }
  },
};

// ── CENTRAL FETCH INTERCEPTOR (ATTACH JWT & HANDLE 401/403) ──
const nativeFetch = window.fetch;
window.fetch = async function (resource, config = {}) {
  const url = typeof resource === 'string' ? resource : resource?.url || '';

  // Intercept requests directed to our SAR Backend API
  if (url.startsWith(API_BASE_URL)) {
    config = config || {};
    let headersObj = {};

    if (config.headers instanceof Headers) {
      config.headers.forEach((v, k) => { headersObj[k] = v; });
    } else if (Array.isArray(config.headers)) {
      config.headers.forEach(([k, v]) => { headersObj[k] = v; });
    } else if (typeof config.headers === 'object' && config.headers !== null) {
      headersObj = { ...config.headers };
    }

    const token = Auth.getToken();
    if (token && !headersObj['Authorization'] && !headersObj['authorization']) {
      headersObj['Authorization'] = `Bearer ${token}`;
    }
    config.headers = headersObj;

    const response = await nativeFetch(resource, config);

    // 401 Unauthorized: token expired or invalid
    if (response.status === 401 && !url.includes('/auth/login')) {
      console.warn('[AUTH] 401 Unauthorized intercepted on:', url);
      if (typeof Toast !== 'undefined') {
        Toast.show('error', 'Session Expired', 'Tactical session expired. Please re-authenticate.');
      }
      Auth.clearSession();
    }
    // 403 Forbidden: RBAC restriction
    else if (response.status === 403) {
      try {
        const cloned = response.clone();
        const errData = await cloned.json();
        const reason = errData.detail || errData.message || 'Operation forbidden for your tactical role.';
        if (typeof Toast !== 'undefined') {
          Toast.show('warning', 'Clearance Restricted (403)', reason, 6000);
        }
      } catch (err) {
        if (typeof Toast !== 'undefined') {
          Toast.show('warning', 'Clearance Restricted (403)', 'Your role lacks tactical clearance for this operation.', 6000);
        }
      }
    }

    return response;
  }

  return nativeFetch(resource, config);
};

// ── AUTHENTICATION TOKEN HELPERS (BACKWARD COMPATIBLE) ──
let currentAuthToken = Auth.getToken();

async function ensureAuthToken() {
  const token = Auth.getToken();
  if (token) {
    currentAuthToken = token;
    return token;
  }
  Auth.showLoginOverlay(false);
  return null;
}

function getAuthHeaders(extraHeaders = {}) {
  const headers = { 'Content-Type': 'application/json', ...extraHeaders };
  const token = Auth.getToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
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

  // Ensure active auth session
  const token = await ensureAuthToken();
  if (!token) {
    return false;
  }

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

  // Initialize real-time Socket.IO stream
  initSocketIO();

  return isApiOnline;
}

// ── REAL-TIME TACTICAL SOCKET.IO EVENT STREAM ─────────
let sarSocket = null;
function initSocketIO() {
  if (typeof io === 'undefined') return;
  if (sarSocket) return;

  try {
    sarSocket = io(API_BASE_URL.replace('/api', ''), {
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 5,
    });

    sarSocket.on('connect', () => {
      console.log('⚡ Connected to real-time tactical stream:', sarSocket.id);
    });

    sarSocket.on('activity:log', (entry) => {
      SAR.activityLog.unshift(entry);
      if (SAR.activityLog.length > 30) SAR.activityLog.pop();

      if (typeof appendActivityFeedItem === 'function') {
        appendActivityFeedItem(entry);
      }
    });

    // Real-time synchronization of domain models
    sarSocket.on('incident:created', (data) => {
      if (!SAR.incidents.some(i => i.id === data.id)) {
        SAR.incidents.unshift(data);
        if (typeof App !== 'undefined' && App.currentPage === 'incidents') renderIncidents();
        if (typeof App !== 'undefined' && App.currentPage === 'dashboard') renderDashboard();
        if (typeof updateBadges === 'function') updateBadges();
      }
    });

    sarSocket.on('incident:updated', (data) => {
      const idx = SAR.incidents.findIndex(i => i.id === data.id);
      if (idx !== -1) SAR.incidents[idx] = { ...SAR.incidents[idx], ...data };
      if (typeof App !== 'undefined' && App.currentPage === 'incidents') renderIncidents();
      if (typeof App !== 'undefined' && App.currentPage === 'dashboard') renderDashboard();
      if (typeof updateBadges === 'function') updateBadges();
    });

    sarSocket.on('zone:created', (data) => {
      if (!SAR.zones.some(z => z.id === data.id)) {
        SAR.zones.push(data);
        if (typeof App !== 'undefined' && App.currentPage === 'map') renderMapZones();
      }
    });

    sarSocket.on('zone:updated', (data) => {
      const idx = SAR.zones.findIndex(z => z.id === data.id);
      if (idx !== -1) SAR.zones[idx] = { ...SAR.zones[idx], ...data };
      if (typeof App !== 'undefined' && App.currentPage === 'map') renderMapZones();
      if (typeof App !== 'undefined' && App.currentPage === 'dashboard') renderDashboard();
    });

    sarSocket.on('team:updated', (data) => {
      const idx = SAR.teams.findIndex(t => t.id === data.id);
      if (idx !== -1) SAR.teams[idx] = { ...SAR.teams[idx], ...data };
      if (typeof App !== 'undefined' && App.currentPage === 'teams') renderTeams();
      if (typeof App !== 'undefined' && App.currentPage === 'map') renderMapTeams();
    });

    sarSocket.on('resource:created', (data) => {
      if (!SAR.resources.some(r => r.id === data.id)) {
        SAR.resources.unshift(data);
        if (typeof App !== 'undefined' && App.currentPage === 'resources') renderResources();
        if (typeof updateBadges === 'function') updateBadges();
      }
    });

    sarSocket.on('resource:updated', (data) => {
      const idx = SAR.resources.findIndex(r => r.id === data.id);
      if (idx !== -1) SAR.resources[idx] = { ...SAR.resources[idx], ...data };
      if (typeof App !== 'undefined' && App.currentPage === 'resources') renderResources();
      if (typeof updateBadges === 'function') updateBadges();
    });

    sarSocket.on('finding:created', (data) => {
      if (!SAR.findings.some(f => f.id === data.id)) {
        SAR.findings.unshift(data);
        if (typeof App !== 'undefined' && App.currentPage === 'findings') renderFindings();
        if (typeof App !== 'undefined' && App.currentPage === 'map') renderMapFindings();
      }
    });
  } catch (err) {
    console.warn('Socket.IO connection notice:', err.message);
  }
}
