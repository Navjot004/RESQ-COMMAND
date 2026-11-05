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

// ── ROUTING / NAVIGATION ───────────────────────────────
const App = {
  currentPage: 'dashboard',

  navigate(page) {
    // Hide all pages
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));

    // Show target page
    const pageEl = document.getElementById(`page-${page}`);
    if (!pageEl) return;
    pageEl.classList.add('active');

    // Activate nav item
    const navEl = document.getElementById(`nav-${page}`);
    if (navEl) navEl.classList.add('active');

    // Update topbar
    const titles = {
      dashboard: 'Operation Dashboard',
      map:       'Search Map',
      incidents: 'Incident Management',
      teams:     'Team Management',
      resources: 'Resource Management',
      findings:  'Findings & Reports',
    };
    document.getElementById('pageTitle').textContent = titles[page] || page;
    document.getElementById('breadcrumbCurrent').textContent = titles[page] || page;

    // Stop live feed if leaving dashboard
    if (this.currentPage === 'dashboard' && page !== 'dashboard') stopLiveFeed();

    this.currentPage = page;

    // Render page content
    switch(page) {
      case 'dashboard': renderDashboard(); startLiveFeed(); break;
      case 'map':       setTimeout(initMap, 100); break;
      case 'incidents': renderIncidents(); break;
      case 'teams':     renderTeams(); break;
      case 'resources': renderResources(); break;
      case 'findings':  renderFindings(); break;
    }
  },
};

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
    const apiOnline = await fetchAllSARData();

    updateBadges();
    App.navigate('dashboard');

    if (apiOnline) {
        Toast.show(
            'success',
            'Command Center Online',
            'Live data synchronized from MongoDB.'
        );
    } else {
        Toast.show(
            'error',
            'Database Connection Failed',
            'Backend server not responding. Please run npm start in backend.'
        );
    }
})();