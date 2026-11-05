/* ══════════════════════════════════════════════════════
   SAR COMMAND — APP BOOTSTRAP
   Routing, Sidebar, Toast, Modal, Timer
══════════════════════════════════════════════════════ */

// ── OPERATION TIMER ───────────────────────────────────
const opStart = new Date();
setInterval(() => {
  const diff = Math.floor((Date.now() - opStart) / 1000);
  const h    = String(Math.floor(diff / 3600)).padStart(2,'0');
  const m    = String(Math.floor((diff % 3600) / 60)).padStart(2,'0');
  const s    = String(diff % 60).padStart(2,'0');
  const el   = document.getElementById('opTime');
  if (el) el.textContent = `${h}:${m}:${s}`;
}, 1000);

// ── MODAL ─────────────────────────────────────────────
const Modal = {
  open(title, bodyHTML, size = 'default') {
    const box = document.getElementById('modalBox');
    if (box) {
      if (size === 'lg') {
        box.classList.add('modal-box-lg');
      } else {
        box.classList.remove('modal-box-lg');
      }
    }
    document.getElementById('modalTitle').textContent = title;
    document.getElementById('modalBody').innerHTML = bodyHTML;
    document.getElementById('modalOverlay').classList.remove('hidden');
  },
  close() {
    if (typeof SARLocationPicker !== 'undefined') {
      SARLocationPicker.destroy();
    }
    const box = document.getElementById('modalBox');
    if (box) box.classList.remove('modal-box-lg');
    document.getElementById('modalOverlay').classList.add('hidden');
    document.getElementById('modalBody').innerHTML = '';
  },
};
document.getElementById('modalClose').addEventListener('click', Modal.close);
document.getElementById('modalOverlay').addEventListener('click', function(e) {
  if (e.target === this) Modal.close();
});

// ── TOAST ─────────────────────────────────────────────
const Toast = {
  show(type, title, msg, duration = 4000) {
    const container = document.getElementById('toastContainer');
    const icons = {
      success: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>',
      error:   '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>',
      warning: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>',
      info:    '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>',
    };
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
      <div class="toast-icon">${icons[type]}</div>
      <div class="toast-body">
        <div class="toast-title">${title}</div>
        <div class="toast-msg">${msg}</div>
      </div>
    `;
    container.appendChild(toast);
    setTimeout(() => {
      toast.classList.add('removing');
      setTimeout(() => toast.remove(), 300);
    }, duration);
  },
};

// ── ROLE-BASED NAVIGATION CONFIGURATION ────────────────
const ROLE_NAV_CONFIG = {
  COMMANDER: {
    roleName: 'Incident Commander',
    callsign: 'COMMAND-01',
    clearance: 'Level 4 • Supreme Command',
    icon: '🎖️',
    cardClass: 'role-commander',
    defaultPage: 'dashboard',
    sectionOpsLabel: 'Command Operations',
    sectionResLabel: 'Logistics & Intel',
    hideResSection: false,
    sectionOpsOrder: 0,
    sectionResOrder: 5,
    tabs: {
      dashboard: { visible: true, label: 'Command Overview', order: 1 },
      map:       { visible: true, label: 'Master GIS & Sectors', order: 2 },
      incidents: { visible: true, label: 'Incident Command', order: 3 },
      teams:     { visible: true, label: 'Squad Deployment', order: 4 },
      resources: { visible: true, label: 'Supply Approvals', order: 6 },
      findings:  { visible: true, label: 'Intel & Findings', order: 7 },
    }
  },
  COORDINATOR: {
    roleName: 'Zone Coordinator',
    callsign: 'OPS-COORD-01',
    clearance: 'Level 3 • Sector Dispatch',
    icon: '📡',
    cardClass: 'role-coordinator',
    defaultPage: 'map',
    sectionOpsLabel: 'Sector Operations',
    sectionResLabel: 'Field Intel',
    hideResSection: false,
    sectionOpsOrder: 0,
    sectionResOrder: 5,
    tabs: {
      dashboard: { visible: true, label: 'Sector Dispatch', order: 1 },
      map:       { visible: true, label: 'Draw & Assign Zones', order: 2 },
      incidents: { visible: true, label: 'Active Triage', order: 3 },
      teams:     { visible: true, label: 'Squad Comms & Roster', order: 4 },
      findings:  { visible: true, label: 'Verify Field Clues', order: 6 },
      resources: { visible: false, label: '', order: 99 }, // HIDE resources completely from sidebar!
    }
  },
  FIELD_LEADER: {
    roleName: 'Field Team Leader',
    callsign: 'T-01-LEAD',
    clearance: 'Level 2 • Tactical Field Unit',
    icon: '🥾',
    cardClass: 'role-leader',
    defaultPage: 'map', // Default landing page for FIELD_LEADER
    sectionOpsLabel: 'Field Operations',
    sectionResLabel: 'Reporting & Gear',
    hideResSection: false,
    sectionOpsOrder: 0,
    sectionResOrder: 5,
    tabs: {
      dashboard: { visible: false, label: '', order: 99 }, // HIDE dashboard completely!
      incidents: { visible: false, label: '', order: 99 }, // HIDE incidents completely!
      map:       { visible: true, label: 'My Sector & GPS', order: 1 },
      teams:     { visible: true, label: 'My Squad & Radio Check-in', order: 2 },
      findings:  { visible: true, label: 'Report Field Finding', order: 6 },
      resources: { visible: true, label: 'Request Field Gear', order: 7 },
    }
  },
  LOGISTICS: {
    roleName: 'Logistics Officer',
    callsign: 'SUPPLY-BASE',
    clearance: 'Level 2 • Warehouse & Depot',
    icon: '📦',
    cardClass: 'role-logistics',
    defaultPage: 'resources', // Default landing page for LOGISTICS
    sectionOpsLabel: 'Supply & Drop-Zones',
    sectionResLabel: 'Supply Depot',
    hideResSection: true,
    sectionOpsOrder: 0,
    sectionResOrder: 99,
    tabs: {
      dashboard: { visible: false, label: '', order: 99 }, // HIDE dashboard completely!
      incidents: { visible: false, label: '', order: 99 }, // HIDE incidents completely!
      findings:  { visible: false, label: '', order: 99 }, // HIDE findings completely!
      resources: { visible: true, label: 'Supply Chain & Dispatch', order: 1 },
      map:       { visible: true, label: 'Drop-Zone Map', order: 2 },
      teams:     { visible: true, label: 'Squad Equipment Roster', order: 3 },
    }
  }
};

// ── ROUTING / NAVIGATION ───────────────────────────────
const App = {
  currentPage: 'dashboard',

  getDefaultPageForRole(role) {
    const r = role || (typeof SAR !== 'undefined' ? SAR.currentUser?.role : null) || 'COMMANDER';
    return ROLE_NAV_CONFIG[r]?.defaultPage || 'dashboard';
  },

  configureSidebarForRole(role) {
    const user = typeof SAR !== 'undefined' ? SAR.currentUser : null;
    const currentRole = role || user?.role || 'COMMANDER';
    const config = ROLE_NAV_CONFIG[currentRole] || ROLE_NAV_CONFIG.COMMANDER;
    const callsign = user?.callsign || config.callsign;

    // 1. Update prominent Sidebar Role Header Card
    const card = document.getElementById('sidebarRoleCard');
    const icon = document.getElementById('srcRoleIcon');
    const title = document.getElementById('srcRoleTitle');
    const callsignEl = document.getElementById('srcCallsign');
    const clearance = document.getElementById('srcClearance');

    if (card) {
      card.className = `sidebar-role-card ${config.cardClass}`;
    }
    if (icon) icon.textContent = config.icon;
    if (title) title.textContent = config.roleName;
    if (callsignEl) callsignEl.textContent = callsign;
    if (clearance) clearance.textContent = config.clearance;

    // 2. Filter & Rename each navigation tab
    const allTabs = ['dashboard', 'map', 'incidents', 'teams', 'resources', 'findings'];
    allTabs.forEach(tabKey => {
      const navEl = document.getElementById(`nav-${tabKey}`);
      if (!navEl) return;
      const tabCfg = config.tabs[tabKey];
      if (tabCfg && tabCfg.visible) {
        navEl.style.display = 'flex';
        navEl.classList.remove('nav-hidden');
        navEl.style.order = tabCfg.order;
        const label = navEl.querySelector('.nav-label');
        if (label) label.textContent = tabCfg.label;
      } else {
        navEl.style.display = 'none';
        navEl.classList.add('nav-hidden');
        navEl.style.order = 99;
      }
    });

    // 3. Update section headers
    const opsLabel = document.getElementById('nav-section-ops');
    const resLabel = document.getElementById('nav-section-res');
    if (opsLabel) {
      opsLabel.textContent = config.sectionOpsLabel;
      opsLabel.style.order = config.sectionOpsOrder;
    }
    if (resLabel) {
      if (config.hideResSection) {
        resLabel.style.display = 'none';
      } else {
        resLabel.style.display = 'block';
        resLabel.textContent = config.sectionResLabel;
        resLabel.style.order = config.sectionResOrder;
      }
    }
  },

  navigate(page) {
    const user = typeof SAR !== 'undefined' ? SAR.currentUser : null;
    const role = user?.role || 'COMMANDER';
    const config = ROLE_NAV_CONFIG[role] || ROLE_NAV_CONFIG.COMMANDER;

    // Strict Route Guard: if user is not authorized to access this page, redirect to default
    if (config.tabs[page] && !config.tabs[page].visible) {
      console.warn(`[RBAC] Access denied to page "${page}" for role ${role}. Redirecting to ${config.defaultPage}`);
      if (typeof Toast !== 'undefined') {
        Toast.show(
          'warning',
          'Access Restricted',
          `${config.roleName} does not have clearance for ${page.toUpperCase()}. Redirected to ${config.tabs[config.defaultPage].label}.`
        );
      }
      page = config.defaultPage;
    }

    // Hide all pages & deactivate nav items
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));

    // Show target page
    const pageEl = document.getElementById(`page-${page}`);
    if (!pageEl) return;
    pageEl.classList.add('active');

    // Activate nav item
    const navEl = document.getElementById(`nav-${page}`);
    if (navEl) navEl.classList.add('active');

    // Configure sidebar labels and visibility
    this.configureSidebarForRole(role);

    // Dynamic Topbar Titles according to role's custom label
    const customTitle = config.tabs[page]?.label;
    const pageTitleEl = document.getElementById('pageTitle');
    const bcCurrentEl = document.getElementById('breadcrumbCurrent');
    if (pageTitleEl) pageTitleEl.textContent = customTitle || page;
    if (bcCurrentEl) bcCurrentEl.textContent = customTitle || page;

    // Stop live feed if leaving dashboard
    if (this.currentPage === 'dashboard' && page !== 'dashboard') {
      if (typeof stopLiveFeed === 'function') stopLiveFeed();
    }

    this.currentPage = page;

    // Render target page
    switch(page) {
      case 'dashboard':
        if (typeof renderDashboard === 'function') renderDashboard();
        if (typeof startLiveFeed === 'function') startLiveFeed();
        break;
      case 'map':
        renderFieldMissionConsole('fieldMissionConsoleMap');
        if (typeof updateMapRoleControls === 'function') updateMapRoleControls();
        setTimeout(() => {
          if (typeof initMap === 'function') initMap();
        }, 100);
        break;
      case 'incidents':
        if (typeof renderIncidents === 'function') renderIncidents();
        break;
      case 'teams':
        renderFieldMissionConsole('fieldMissionConsoleTeams');
        if (typeof renderTeams === 'function') renderTeams();
        break;
      case 'resources':
        if (typeof renderResources === 'function') renderResources();
        break;
      case 'findings':
        if (typeof renderFindings === 'function') renderFindings();
        break;
    }
  },
};

// ── SHARED FIELD SQUAD MISSION CONSOLE (FIELD_LEADER) ──
function renderFieldMissionConsole(containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;

  const isLeader = typeof SAR !== 'undefined' && SAR.hasRole('FIELD_LEADER');
  if (!isLeader) {
    container.style.display = 'none';
    container.innerHTML = '';
    return;
  }

  container.style.display = 'block';
  const myTeam = (typeof SAR !== 'undefined' && SAR.getMyTeam()) || {
    id: 'T-01',
    name: 'Alpha Mountain Rescue',
    status: 'deployed',
    contact: 'VHF 155.160 MHz (Ch 1)',
    leader: 'Capt. Arjun Mehra'
  };
  const myZone = (typeof SAR !== 'undefined' && SAR.getMyZone()) || {
    name: 'Sector Alpha (Rohtang Pass Corridor)',
    progress: 65,
    id: 'Z-01'
  };

  const currentProgress = myZone.progress !== undefined ? myZone.progress : 65;
  const zoneName = myZone.name || 'Sector Alpha';
  const sliderId = `fsmc_slider_${containerId}`;
  const valId = `fsmc_val_${containerId}`;

  container.innerHTML = `
    <div class="field-mission-console">
      <div class="fmc-col-lead">
        <div class="fmc-badge">🥾 FIELD SQUAD MISSION CONSOLE</div>
        <div class="fmc-team-info">
          <span class="fmc-team-name">${myTeam.name}</span>
          <span class="fmc-team-id">(${myTeam.id})</span>
          <span class="fmc-status-pill fmc-status-${myTeam.status}">${myTeam.status.toUpperCase()}</span>
          <span class="fmc-comms">📡 ${myTeam.contact || 'VHF 155.160 MHz'}</span>
        </div>
      </div>

      <div class="fmc-col-sector">
        <div class="fmc-sector-meta">
          <span class="fmc-sector-label">Assigned Sector:</span>
          <strong class="fmc-sector-name">${zoneName}</strong>
        </div>
        <div class="fmc-progress-ctrl">
          <span class="fmc-ctrl-label">Clearance:</span>
          <input type="range" class="fmc-slider" id="${sliderId}" min="0" max="100" value="${currentProgress}"
            oninput="document.getElementById('${valId}').textContent = this.value + '%'" />
          <span class="fmc-val" id="${valId}">${currentProgress}%</span>
          <button class="btn btn-sm btn-primary fmc-save-btn" onclick="saveConsoleSectorProgress('${sliderId}', '${myZone.id || ''}')">
            Save %
          </button>
        </div>
      </div>

      <div class="fmc-col-actions">
        <button class="btn btn-sm btn-success fmc-action-btn" onclick="sendRadioCheckIn('${myTeam.id}')" title="Transmit VHF GPS & Heartbeat">
          📡 Send Radio Check-in
        </button>
        <button class="btn btn-sm btn-accent fmc-action-btn" onclick="openLogFindingModal()" title="Log Clue, Survivor, or Hazard">
          + 📍 Log Clue / Survivor
        </button>
      </div>
    </div>
  `;
}

async function saveConsoleSectorProgress(sliderId, fallbackZoneId) {
  const slider = document.getElementById(sliderId);
  const newProgress = parseInt(slider?.value || '0', 10);
  const myZone = (typeof SAR !== 'undefined' && SAR.getMyZone()) || SAR.zones.find(z => z.id === fallbackZoneId) || SAR.zones[0];

  if (!myZone) {
    if (typeof Toast !== 'undefined') {
      Toast.show('warning', 'Sector Unassigned', 'No sector currently linked to your squad.');
    }
    return;
  }

  const newStatus = newProgress >= 100 ? 'completed' : newProgress > 0 ? 'in-progress' : 'pending';
  const targetId = myZone._dbId || myZone.id;

  try {
    const res = await fetch(`${API_BASE_URL}/zones/${targetId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ progress: newProgress, status: newStatus }),
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.message || 'Failed to update sector progress');
    }

    myZone.progress = newProgress;
    myZone.status = newStatus;

    if (typeof Toast !== 'undefined') {
      Toast.show('success', 'Sector Progress Saved', `${myZone.name} updated to ${newProgress}% (${newStatus})`);
    }

    // Refresh views if open
    if (App.currentPage === 'map' && typeof refreshMapLayers === 'function') refreshMapLayers();
    if (App.currentPage === 'teams' && typeof renderTeams === 'function') renderTeams();
  } catch (err) {
    if (typeof Toast !== 'undefined') {
      Toast.show('error', 'Update Failed', err.message);
    }
  }
}

// ── SIDEBAR & MOBILE DRAWER TOGGLE ──────────────────────
const sidebarEl = document.getElementById('sidebar');
const sidebarBackdrop = document.getElementById('sidebarBackdrop');
const mobileMenuBtn = document.getElementById('mobileMenuBtn');

document.getElementById('sidebarToggle')?.addEventListener('click', () => {
  sidebarEl?.classList.toggle('collapsed');
  if (App.currentPage === 'map' && sarMap) {
    setTimeout(() => sarMap.invalidateSize(), 350);
  }
});

function closeMobileDrawer() {
  sidebarEl?.classList.remove('mobile-open');
  sidebarBackdrop?.classList.remove('active');
}

mobileMenuBtn?.addEventListener('click', () => {
  sidebarEl?.classList.toggle('mobile-open');
  sidebarBackdrop?.classList.toggle('active');
});

sidebarBackdrop?.addEventListener('click', closeMobileDrawer);

// ── NAV CLICK HANDLERS ────────────────────────────────
document.querySelectorAll('.nav-item').forEach(item => {
  item.addEventListener('click', (e) => {
    e.preventDefault();
    const page = item.dataset.page;
    if (page) {
      App.navigate(page);
      // Auto-close mobile drawer when user taps a navigation link
      if (window.innerWidth <= 768) {
        closeMobileDrawer();
      }
    }
  });
});

// ── GLOBAL SEARCH ─────────────────────────────────────
document.getElementById('globalSearch').addEventListener('input', function() {
  const q = this.value.toLowerCase().trim();
  if (!q) return;
  // Navigate to incidents and filter
  if (['inc','inci','incident'].some(k => q.startsWith(k))) {
    App.navigate('incidents');
    return;
  }
  if (['team','alpha','bravo','charlie'].some(k => q.startsWith(k))) {
    App.navigate('teams');
    return;
  }
});

// ── UPDATE BADGES ─────────────────────────────────────
function updateBadges() {
  const activeInc = SAR.incidents.filter(i=>i.status==='active').length;
  const pendingRes = SAR.resources.filter(r=>r.status==='pending').length;
  const incBadge = document.getElementById('incident-badge');
  const resBadge = document.getElementById('resource-badge');
  if (incBadge) incBadge.textContent = activeInc;
  if (resBadge) resBadge.textContent = pendingRes;
}

// ── NOTIFICATIONS BTN ─────────────────────────────────
document.getElementById('notifBtn').addEventListener('click', () => {
  const recentActivity = SAR.activityLog.slice(0,5);
  Modal.open('🔔 Notifications', `
    <div style="display:flex;flex-direction:column;gap:0">
      ${recentActivity.map(a => `
        <div style="display:flex;gap:12px;padding:14px 0;border-bottom:1px solid var(--border)">
          <div style="width:8px;height:8px;border-radius:50%;background:${a.color};margin-top:6px;flex-shrink:0"></div>
          <div>
            <div style="font-size:0.85rem;color:var(--text-secondary)">${a.text}</div>
            <div style="font-size:0.72rem;color:var(--text-muted);margin-top:3px">${a.time}</div>
          </div>
        </div>
      `).join('')}
    </div>
    <div class="form-actions">
      <button class="btn btn-secondary" onclick="Modal.close()">Close</button>
      <button class="btn btn-primary" onclick="Modal.close();App.navigate('dashboard')">View Dashboard</button>
    </div>
  `);
});

// ── INIT ──────────────────────────────────────────────
(async function init() {
  if (typeof Auth !== 'undefined' && typeof Auth.initListeners === 'function') {
    Auth.initListeners();
  }

  // Verify active tactical session
  const isAuthenticated = typeof Auth !== 'undefined' ? await Auth.checkSession() : false;

  if (!isAuthenticated) {
    if (typeof Auth !== 'undefined') {
      Auth.showLoginOverlay(false);
    }
    return;
  }

  const apiOnline = await fetchAllSARData();

  updateBadges();
  const user = typeof Auth !== 'undefined' ? Auth.getUser() : null;
  const targetPage = App.getDefaultPageForRole(user?.role);
  App.navigate(targetPage);

  if (apiOnline) {
    const user = typeof Auth !== 'undefined' ? Auth.getUser() : null;
    Toast.show(
      'success',
      'Tactical Net Online',
      `Live session active: ${user ? user.name : 'Operator'} [${user ? user.role : 'ACTIVE'}]`
    );
  } else {
    Toast.show(
      'error',
      'Database Connection Failed',
      'Backend server not responding. Please run npm start in backend.'
    );
  }
})();