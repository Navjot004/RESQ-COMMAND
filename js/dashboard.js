/* ══════════════════════════════════════════════════════
   SAR COMMAND — DASHBOARD
══════════════════════════════════════════════════════ */

function renderDashboard() {
  const root = document.getElementById('dashboard-root');
  if (!root) return;

  const activeIncidents  = SAR.incidents.filter(i => i.status === 'active').length;
  const deployedTeams    = SAR.teams.filter(t => t.status === 'deployed').length;
  const totalZones       = SAR.zones.length;
  const completedZones   = SAR.zones.filter(z => z.status === 'completed').length;
  const pendingResources = SAR.resources.filter(r => r.status === 'pending').length;

  const priorityCounts = {
    critical: SAR.incidents.filter(i => i.priority === 'critical').length,
    high:     SAR.incidents.filter(i => i.priority === 'high').length,
    medium:   SAR.incidents.filter(i => i.priority === 'medium').length,
    low:      SAR.incidents.filter(i => i.priority === 'low').length,
  };
  const totalInc = SAR.incidents.length;

  root.innerHTML = `
    <!-- Stats Row -->
    <div class="dashboard-grid">
      <div class="stats-row">
        ${statCard('orange', incidentSVG(), 'Active Incidents', activeIncidents, '↑ 2 in last hour', 'up')}
        ${statCard('blue',   teamSVG(),     'Deployed Teams',   deployedTeams,   `${SAR.teams.length} total teams`, 'neutral')}
        ${statCard('green',  zoneSVG(),     'Zones Completed',  `${completedZones}/${totalZones}`, `${Math.round(completedZones/totalZones*100)}% coverage`, 'up')}
        ${statCard('amber',  boxSVG(),      'Pending Requests', pendingResources, '↑ 3 awaiting approval', 'down')}
      </div>
    </div>

    <!-- Row 2: Activity Feed + Priority -->
    <div class="dash-row cols-3-2">
      <div class="card">
        <div class="card-header">
          <div class="card-title">
            <div class="live-radar"></div>
            Live Activity Feed
          </div>
          <button class="card-action" onclick="App.navigate('incidents')">View All</button>
        </div>
        <div class="card-body">
          <div class="activity-feed" id="activityFeed">
            ${SAR.incidents
             .slice()
             .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
             .slice(0, 8)
             .map(i => {
              const colors = {
                critical: '#ef4444',
                high: '#ea580c',
                medium: '#d97706',
                low: '#0284c7'
              };

        return `
            <div class="activity-item">
                <div class="activity-dot" style="background:${colors[i.priority] || 'var(--accent)'}"></div>
                <div class="activity-content">
                    <div class="activity-text">
                        <strong>${i.id}</strong> ${i.title} — ${i.location}
                    </div>
                    <div class="activity-time">
                        ${SAR.formatTime(i.createdAt)}
                    </div>
                </div>
            </div>
        `;
    }).join('')}
          </div>
        </div>
      </div>

      <div style="display:flex;flex-direction:column;gap:20px;">
        <!-- Priority Breakdown -->
        <div class="card">
          <div class="card-header">
            <div class="card-title">
              <div class="card-title-dot" style="background:var(--accent-light)"></div>
              Incident Priority
            </div>
          </div>
          <div class="card-body">
            <div class="priority-bars">
              ${priorityBar('CRITICAL', priorityCounts.critical, totalInc, '#ef4444')}
              ${priorityBar('HIGH',     priorityCounts.high,     totalInc, '#ea580c')}
              ${priorityBar('MEDIUM',   priorityCounts.medium,   totalInc, '#d97706')}
              ${priorityBar('LOW',      priorityCounts.low,      totalInc, '#0284c7')}
            </div>
          </div>
        </div>

        <!-- Team Status Summary -->
        <div class="card">
          <div class="card-header">
            <div class="card-title">
              <div class="card-title-dot" style="background:var(--accent-light)"></div>
              Team Status
            </div>
          </div>
          <div class="card-body">
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">
              ${teamStatusCard('Deployed',  SAR.teams.filter(t=>t.status==='deployed').length,  '#10b981')}
              ${teamStatusCard('Standby',   SAR.teams.filter(t=>t.status==='standby').length,   '#64748b')}
              ${teamStatusCard('Returning', SAR.teams.filter(t=>t.status==='returning').length, '#0ea5e9')}
              ${teamStatusCard('Off-duty',  SAR.teams.filter(t=>t.status==='off-duty').length,  '#334155')}
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Row 3: Zone Overview + Active Incidents -->
    <div class="dash-row cols-2-2">
      <div class="card">
        <div class="card-header">
          <div class="card-title">
            <div class="card-title-dot" style="background:var(--green)"></div>
            Zone Search Progress
          </div>
          <button class="card-action" onclick="App.navigate('map')">Open Map</button>
        </div>
        <div class="card-body">
          <div class="zone-overview">
            ${SAR.zones.map(z => {
              const team = z.team ? SAR.getTeam(z.team) : null;
              const colors = { 'completed':'#10b981', 'in-progress':'#f97316', 'assigned':'#3b82f6', 'pending':'#6b7280' };
              const c = colors[z.status] || '#6b7280';
              return `
                <div class="zone-row">
                  <div>
                    <div class="zone-name">${z.name}</div>
                    <div class="zone-meta">${team ? team.name : 'Unassigned'}</div>
                  </div>
                  <div style="flex:1;max-width:120px;margin:0 16px;">
                    <div class="progress-track">
                      <div class="progress-fill" style="width:${z.progress}%;background:${c}"></div>
                    </div>
                    <div style="font-size:0.7rem;color:var(--text-muted);margin-top:3px;text-align:right">${z.progress}%</div>
                  </div>
                  <span class="badge badge-${z.status === 'in-progress' ? 'high' : z.status === 'completed' ? 'active' : z.status === 'assigned' ? 'contained' : 'resolved'}" style="white-space:nowrap">${z.status}</span>
                </div>
              `;
            }).join('')}
          </div>
        </div>
      </div>

      <div class="card">
        <div class="card-header">
          <div class="card-title">
            <div class="card-title-dot" style="background:var(--red)"></div>
            Active Incidents
          </div>
          <button class="card-action" onclick="App.navigate('incidents')">Manage</button>
        </div>
        <div class="card-body" style="padding:0;">
          <div class="table-container">
            <table class="data-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Title</th>
                  <th>Priority</th>
                  <th>Teams</th>
                </tr>
              </thead>
              <tbody>
                ${SAR.incidents.filter(i=>i.status==='active').map(i => `
                  <tr style="cursor:pointer" onclick="App.navigate('incidents')">
                    <td class="td-mono">${i.id}</td>
                    <td class="td-name" style="max-width:160px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${i.title}</td>
                    <td><span class="badge badge-${i.priority}">${i.priority}</span></td>
                    <td>${i.teams.length}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  `;

  // Animate progress bars
  setTimeout(() => {
    document.querySelectorAll('.priority-bar-fill, .progress-fill').forEach(bar => {
      const target = bar.style.width;
      bar.style.width = '0';
      setTimeout(() => { bar.style.width = target; }, 50);
    });
  }, 100);
}

function statCard(color, iconSVG, label, value, delta, deltaDir) {
  return `
    <div class="stat-card ${color}">
      <div class="stat-icon ${color}">${iconSVG}</div>
      <div class="stat-info">
        <div class="stat-value">${value}</div>
        <div class="stat-label">${label}</div>
        <div class="stat-delta ${deltaDir}">${delta}</div>
      </div>
    </div>
  `;
}

function priorityBar(label, count, total, color) {
  const pct = total ? Math.round(count / total * 100) : 0;
  return `
    <div class="priority-item">
      <div class="priority-label-row">
        <span class="priority-label" style="color:${color}">${label}</span>
        <span class="priority-count">${count}/${total}</span>
      </div>
      <div class="priority-bar-track">
        <div class="priority-bar-fill" style="width:${pct}%;background:${color}"></div>
      </div>
    </div>
  `;
}

function teamStatusCard(label, count, color) {
  return `
    <div style="background:var(--bg-elevated);border:1px solid var(--border);border-radius:8px;padding:12px;text-align:center">
      <div style="font-size:1.5rem;font-weight:800;color:${color}">${count}</div>
      <div style="font-size:0.72rem;color:var(--text-muted);margin-top:2px">${label}</div>
    </div>
  `;
}

// Live feed simulation
let dashFeedTimer = null;
const liveMessages = [
  { text: '<strong>Golf Recon</strong> drone deployed over Parvati River', color: '#06b6d4' },
  { text: '<strong>INC-001</strong> Zone Alpha progress updated to 70%', color: '#3b82f6' },
  { text: '<strong>Hotel Reserve</strong> placed on standby alert', color: '#f59e0b' },
  { text: '<strong>RES-005</strong> Thermal drone request forwarded to command', color: '#f59e0b' },
  { text: '<strong>FND-006</strong> Hiker helicopter evacuation confirmed', color: '#10b981' },
  { text: '<strong>Bravo Unit</strong> reporting movement in Zone Bravo grid B-2', color: '#10b981' },
  { text: '<strong>Weather Alert:</strong> High wind warning for Rohtang Pass sector', color: '#ef4444' },
];
let liveIdx = 0;

function startLiveFeed() {
  stopLiveFeed();
  dashFeedTimer = setInterval(() => {
    const feed = document.getElementById('activityFeed');
    if (!feed) { stopLiveFeed(); return; }
    const msg = liveMessages[liveIdx % liveMessages.length];
    liveIdx++;
    const now = new Date();
    const timeStr = now.toLocaleTimeString('en-IN', { hour:'2-digit', minute:'2-digit', second:'2-digit' });
    const item = document.createElement('div');
    item.className = 'activity-item';
    item.innerHTML = `
      <div class="activity-dot" style="background:${msg.color}"></div>
      <div class="activity-content">
        <div class="activity-text">${msg.text}</div>
        <div class="activity-time">🕐 just now (${timeStr})</div>
      </div>
    `;
    feed.insertBefore(item, feed.firstChild);
    if (feed.children.length > 10) feed.removeChild(feed.lastChild);
    SAR.activityLog.unshift({ type:'info', text: msg.text, time:'just now', color: msg.color });
    if (SAR.activityLog.length > 20) SAR.activityLog.pop();
  }, 6000);
}

function stopLiveFeed() {
  if (dashFeedTimer) { clearInterval(dashFeedTimer); dashFeedTimer = null; }
}

// SVG helpers
function incidentSVG() {
  return `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>`;
}
function teamSVG() {
  return `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>`;
}
function zoneSVG() {
  return `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21"/><line x1="9" y1="3" x2="9" y2="18"/><line x1="15" y1="6" x2="15" y2="21"/></svg>`;
}
function boxSVG() {
  return `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg>`;
}
