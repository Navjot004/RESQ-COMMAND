/* ══════════════════════════════════════════════════════
   SAR COMMAND — RESOURCES
══════════════════════════════════════════════════════ */

let resourceFilter = 'all';

function renderResources() {
  const root = document.getElementById('resources-root');
  if (!root) return;

  let filtered = SAR.resources;
  if (resourceFilter !== 'all') {
    filtered = SAR.resources.filter(r =>
      r.status === resourceFilter || r.category === resourceFilter || r.priority === resourceFilter
    );
  }

  const pending    = SAR.resources.filter(r=>r.status==='pending').length;
  const approved   = SAR.resources.filter(r=>r.status==='approved').length;
  const dispatched = SAR.resources.filter(r=>r.status==='dispatched').length;
  const delivered  = SAR.resources.filter(r=>r.status==='delivered').length;

  root.innerHTML = `
    <div class="page-header">
      <div class="page-header-left">
        <h2>Resource Management</h2>
        <p>${SAR.resources.length} requests · ${pending} pending approval</p>
      </div>
      <button class="btn btn-primary" onclick="openCreateResourceModal()">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
        New Request
      </button>
    </div>

    <!-- Summary Row -->
    <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:14px;padding:0 24px 20px">
      ${miniStatCard('⏳', 'Pending',    pending,    '#f59e0b')}
      ${miniStatCard('✅', 'Approved',   approved,   '#3b82f6')}
      ${miniStatCard('🚚', 'Dispatched', dispatched, '#8b5cf6')}
      ${miniStatCard('📦', 'Delivered',  delivered,  '#10b981')}
    </div>

    <div class="filter-bar">
      ${['all','pending','approved','dispatched','delivered','vehicles','medical','equipment','communication','food'].map(f => `
        <button class="filter-btn ${resourceFilter===f?'active':''}" onclick="setResourceFilter('${f}')">${f.charAt(0).toUpperCase()+f.slice(1)}</button>
      `).join('')}
    </div>

    <div class="page-content">
      <div class="resources-list">
        ${filtered.length === 0 ? '<div class="empty-state"><div class="empty-state-icon">📦</div><div class="empty-state-text">No resource requests match this filter</div></div>' : ''}
        ${filtered.map(r => renderResourceItem(r)).join('')}
      </div>
    </div>
  `;
}

function miniStatCard(icon, label, value, color) {
  return `
    <div style="background:var(--bg-card);border:1px solid var(--border);border-radius:10px;padding:14px;display:flex;align-items:center;gap:12px">
      <div style="font-size:1.4rem">${icon}</div>
      <div>
        <div style="font-size:1.4rem;font-weight:800;color:${color}">${value}</div>
        <div style="font-size:0.72rem;color:var(--text-muted)">${label}</div>
      </div>
    </div>
  `;
}

function renderResourceItem(r) {
  const team = SAR.getTeam(r.team);
  const inc  = SAR.getIncident(r.incident);
  const statusActions = {
    'pending':    `<button class="btn btn-sm btn-success" onclick="updateResourceStatus('${r.id}','approved')">Approve</button><button class="btn btn-sm btn-danger" onclick="updateResourceStatus('${r.id}','rejected')">Reject</button>`,
    'approved':   `<button class="btn btn-sm btn-secondary" onclick="updateResourceStatus('${r.id}','dispatched')">Dispatch</button>`,
    'dispatched': `<button class="btn btn-sm btn-success" onclick="updateResourceStatus('${r.id}','delivered')">Mark Delivered</button>`,
    'delivered':  `<span style="color:var(--green);font-size:0.78rem">✓ Completed</span>`,
    'rejected':   `<span style="color:var(--red);font-size:0.78rem">✗ Rejected</span>`,
  };

  return `
    <div class="resource-item" id="res-${r.id}">
      <div class="resource-icon" style="background:${r.status==='delivered'?'var(--green-glow)':r.status==='pending'?'var(--amber-glow)':r.status==='approved'?'var(--blue-glow)':'var(--purple-glow)'}">
        <span>${SAR.categoryIcon(r.category)}</span>
      </div>
      <div class="resource-info">
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:2px">
          <span class="resource-name">${r.item}</span>
          <span class="badge badge-${r.priority}">${r.priority}</span>
        </div>
        <div class="resource-meta">
          <span class="font-mono" style="color:var(--orange)">${r.id}</span>
          · Qty: <strong>${r.qty} ${r.unit}</strong>
          · Team: <strong>${team ? team.name : '—'}</strong>
          · Incident: <strong>${inc ? inc.id : '—'}</strong>
          · ${SAR.formatTime(r.requestedAt)}
        </div>
        ${r.notes ? `<div style="font-size:0.72rem;color:var(--text-muted);margin-top:4px">📝 ${r.notes}</div>` : ''}
      </div>
      <div style="display:flex;flex-direction:column;align-items:flex-end;gap:8px;flex-shrink:0">
        <span class="badge badge-${r.status}">${r.status}</span>
        <div class="resource-actions">
          ${statusActions[r.status] || ''}
        </div>
      </div>
    </div>
  `;
}

function setResourceFilter(f) {
  resourceFilter = f;
  renderResources();
}

function updateResourceStatus(id, newStatus) {
  const r = SAR.resources.find(x=>x.id===id);
  if (!r) return;
  r.status = newStatus;
  SAR.activityLog.unshift({ type:'info', text:`<strong>${r.id}</strong> "${r.item}" status → <strong>${newStatus}</strong>`, time:'just now', color:'#8b5cf6' });
  renderResources();
  updateBadges();
  const msgs = { approved:'approved ✓', rejected:'rejected ✗', dispatched:'dispatched 🚚', delivered:'delivered 📦' };
  Toast.show('success', 'Request Updated', `${r.item} ${msgs[newStatus]||newStatus}`);
}

function openCreateResourceModal() {
  const incidents = SAR.incidents.map(i=>`<option value="${i.id}">${i.id} — ${i.title.substring(0,30)}</option>`).join('');
  const teams     = SAR.teams.map(t=>`<option value="${t.id}">${t.name}</option>`).join('');

  Modal.open('📦 New Resource Request', `
    <div class="form-row">
      <div class="form-group">
        <label class="form-label">Request ID</label>
        <input class="form-control" value="${SAR.nextId('RES',SAR.resources)}" readonly style="opacity:0.6" />
      </div>
      <div class="form-group">
        <label class="form-label">Priority *</label>
        <select class="form-control" id="resPriority">
          <option value="critical">🔴 Critical</option>
          <option value="high">🟠 High</option>
          <option value="medium" selected>🟡 Medium</option>
          <option value="low">🔵 Low</option>
        </select>
      </div>
    </div>
    <div class="form-group">
      <label class="form-label">Item / Resource *</label>
      <input class="form-control" id="resItem" placeholder="e.g. Rescue Helicopter, Medical Oxygen" />
    </div>
    <div class="form-row">
      <div class="form-group">
        <label class="form-label">Quantity *</label>
        <input class="form-control" id="resQty" type="number" min="1" value="1" />
      </div>
      <div class="form-group">
        <label class="form-label">Unit</label>
        <input class="form-control" id="resUnit" placeholder="e.g. units, kits, sortie" />
      </div>
    </div>
    <div class="form-row">
      <div class="form-group">
        <label class="form-label">Category</label>
        <select class="form-control" id="resCat">
          <option value="vehicles">🚁 Vehicles</option>
          <option value="medical">💊 Medical</option>
          <option value="equipment">🔧 Equipment</option>
          <option value="communication">📡 Communication</option>
          <option value="food">🍱 Food & Water</option>
        </select>
      </div>
      <div class="form-group">
        <label class="form-label">Requesting Team *</label>
        <select class="form-control" id="resTeam">${teams}</select>
      </div>
    </div>
    <div class="form-group">
      <label class="form-label">For Incident</label>
      <select class="form-control" id="resIncident">${incidents}</select>
    </div>
    <div class="form-group">
      <label class="form-label">Notes / Justification</label>
      <textarea class="form-control" id="resNotes" placeholder="Why is this resource needed?"></textarea>
    </div>
    <div class="form-actions">
      <button class="btn btn-secondary" onclick="Modal.close()">Cancel</button>
      <button class="btn btn-primary" onclick="submitCreateResource()">Submit Request</button>
    </div>
  `);
}

function submitCreateResource() {
  const item     = document.getElementById('resItem').value.trim();
  const qty      = parseInt(document.getElementById('resQty').value) || 1;
  const unit     = document.getElementById('resUnit').value.trim() || 'units';
  const category = document.getElementById('resCat').value;
  const priority = document.getElementById('resPriority').value;
  const team     = document.getElementById('resTeam').value;
  const incident = document.getElementById('resIncident').value;
  const notes    = document.getElementById('resNotes').value.trim();

  if (!item) { Toast.show('error','Validation Error','Item name is required.'); return; }

  const res = {
    id: SAR.nextId('RES', SAR.resources),
    item, category, qty, unit, team, incident, priority, notes,
    status: 'pending',
    requestedAt: new Date(),
  };
  SAR.resources.push(res);
  SAR.activityLog.unshift({ type:'warning', text:`<strong>${res.id}</strong> Resource request for "${item}" submitted`, time:'just now', color:'#f59e0b' });

  Modal.close();
  renderResources();
  updateBadges();
  Toast.show('success', 'Request Submitted', `${res.id} is pending approval.`);
}
