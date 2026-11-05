/* ══════════════════════════════════════════════════════
   SAR COMMAND — RESOURCES
   Minimalist Linear-style Supply Chain & Equipment Tracker
══════════════════════════════════════════════════════ */

let resourceStatusFilter = 'all';
let resourceCategoryFilter = 'all';

function renderResources() {
  const root = document.getElementById('resources-root');
  if (!root) return;

  const filtered = SAR.resources.filter(r => {
    const matchStatus = resourceStatusFilter === 'all' || r.status === resourceStatusFilter;
    const matchCat = resourceCategoryFilter === 'all' || r.category === resourceCategoryFilter;
    return matchStatus && matchCat;
  });

  const pending    = SAR.resources.filter(r => r.status === 'pending').length;
  const approved   = SAR.resources.filter(r => r.status === 'approved').length;
  const dispatched = SAR.resources.filter(r => r.status === 'dispatched').length;
  const delivered  = SAR.resources.filter(r => r.status === 'delivered').length;

  const isLogisticsOrCmd = typeof SAR !== 'undefined' && SAR.hasRole('COMMANDER', 'LOGISTICS');
  const isFieldLeader = typeof SAR !== 'undefined' && SAR.hasRole('FIELD_LEADER');
  const isCoordinator = typeof SAR !== 'undefined' && SAR.hasRole('COORDINATOR');

  let headerTitle = 'Resource Management';
  let headerSub = `${SAR.resources.length} requests · ${pending} pending approval`;
  let newReqBtnText = 'New Request';

  if (typeof SAR !== 'undefined' && SAR.hasRole('LOGISTICS')) {
    headerTitle = 'Supply Chain & Dispatch Hub';
    headerSub = `${SAR.resources.length} requisitions · ${pending} awaiting depot clearance · ${dispatched} in transit`;
    newReqBtnText = 'New Supply Manifest';
  } else if (isFieldLeader) {
    headerTitle = 'Field Gear & Emergency Supplies';
    headerSub = 'Request tactical equipment, cold-weather suits, medical kits, and thermal drones for your squad';
    newReqBtnText = 'Request Field Gear';
  } else if (isCoordinator) {
    headerTitle = 'Operational Sector Supplies';
    headerSub = 'Review and request equipment required across active search sectors';
    newReqBtnText = 'Request Sector Gear';
  } else if (typeof SAR !== 'undefined' && SAR.hasRole('COMMANDER')) {
    headerTitle = 'Logistics & Supply Approvals';
    headerSub = `${SAR.resources.length} requisitions · Full executive approval & dispatch authority`;
    newReqBtnText = 'New Resource Request';
  }

  root.innerHTML = `
    <div class="page-header">
      <div class="page-header-left">
        <h2>${headerTitle}</h2>
        <p>${headerSub}</p>
      </div>
      <div class="page-header-actions">
        ${isLogisticsOrCmd ? `
          <div class="batch-action-group">
            <button class="btn btn-sm btn-outline-success" onclick="quickBatchAdvance('pending', 'approved')" ${pending === 0 ? 'disabled' : ''} title="Approve all currently pending requests">
              Approve All (${pending})
            </button>
            <button class="btn btn-sm btn-outline-primary" onclick="quickBatchAdvance('approved', 'dispatched')" ${approved === 0 ? 'disabled' : ''} title="Dispatch all staged supplies to field">
              Dispatch (${approved})
            </button>
            <button class="btn btn-sm btn-outline-purple" onclick="quickBatchAdvance('dispatched', 'delivered')" ${dispatched === 0 ? 'disabled' : ''} title="Confirm all in-transit supplies delivered">
              Deliver (${dispatched})
            </button>
          </div>
        ` : ''}
        <button class="btn btn-primary" onclick="openCreateResourceModal()">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          <span>${newReqBtnText}</span>
        </button>
      </div>
    </div>

    <!-- 4 KPI Stat Cards (Minimalist with Status Dot) -->
    <div class="resource-stats-grid">
      ${miniStatCard('#f59e0b', 'Pending Clearance', pending)}
      ${miniStatCard('#3b82f6', 'Approved / Staged', approved)}
      ${miniStatCard('#8b5cf6', 'In Transit', dispatched)}
      ${miniStatCard('#10b981', 'Delivered to Field', delivered)}
    </div>

    <!-- 2-Part Clean Filter Bar -->
    <div class="resource-filter-bar">
      <div class="segmented-control">
        ${['all', 'pending', 'approved', 'dispatched', 'delivered'].map(st => `
          <button class="segmented-btn ${resourceStatusFilter === st ? 'active' : ''}" onclick="setResourceStatusFilter('${st}')">
            ${st.charAt(0).toUpperCase() + st.slice(1)}
          </button>
        `).join('')}
      </div>
      <div class="category-filter-wrap">
        <select class="category-select" id="resourceCategorySelect" onchange="setResourceCategoryFilter(this.value)">
          <option value="all" ${resourceCategoryFilter === 'all' ? 'selected' : ''}>All Categories</option>
          <option value="vehicles" ${resourceCategoryFilter === 'vehicles' ? 'selected' : ''}>Vehicles</option>
          <option value="medical" ${resourceCategoryFilter === 'medical' ? 'selected' : ''}>Medical</option>
          <option value="equipment" ${resourceCategoryFilter === 'equipment' ? 'selected' : ''}>Equipment</option>
          <option value="communication" ${resourceCategoryFilter === 'communication' ? 'selected' : ''}>Communication</option>
          <option value="food" ${resourceCategoryFilter === 'food' ? 'selected' : ''}>Food & Water</option>
        </select>
      </div>
    </div>

    <div class="page-content">
      <div class="resources-list">
        ${filtered.length === 0 ? '<div class="empty-state"><div class="empty-state-icon"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg></div><div class="empty-state-text">No resource requests match this filter</div></div>' : ''}
        ${filtered.map(r => renderResourceItem(r)).join('')}
      </div>
    </div>
  `;
}

function miniStatCard(color, label, value) {
  return `
    <div class="mini-stat-card">
      <div class="mini-stat-dot" style="background:${color}"></div>
      <div class="mini-stat-info">
        <div class="mini-stat-val" style="color:${color}">${value}</div>
        <div class="mini-stat-label">${label}</div>
      </div>
    </div>
  `;
}

function renderResourceItem(r) {
  const team = SAR.getTeam(r.team);
  const inc  = SAR.getIncident(r.incident);

  const canApprove = typeof SAR !== 'undefined' && SAR.hasRole('COMMANDER', 'LOGISTICS');

  let actionButtons = '';
  if (canApprove) {
    const statusActions = {
      'pending':    `<button class="btn btn-sm btn-success" onclick="updateResourceStatus('${r.id}','approved')">Approve</button><button class="btn btn-sm btn-danger" onclick="updateResourceStatus('${r.id}','rejected')">Reject</button>`,
      'approved':   `<button class="btn btn-sm btn-primary" onclick="updateResourceStatus('${r.id}','dispatched')">Dispatch</button>`,
      'dispatched': `<button class="btn btn-sm btn-success" onclick="updateResourceStatus('${r.id}','delivered')">Mark Delivered</button>`,
      'delivered':  `<span class="status-confirmed-text">Delivered</span>`,
      'rejected':   `<span class="status-rejected-text">Rejected</span>`,
    };
    actionButtons = statusActions[r.status] || '';
  } else {
    const lockedIndicators = {
      'pending':    `<span class="resource-lock-badge">Awaiting Logistics</span>`,
      'approved':   `<span class="badge badge-approved">Approved</span>`,
      'dispatched': `<span class="badge badge-dispatched">In Transit</span>`,
      'delivered':  `<span class="badge badge-delivered">Delivered</span>`,
      'rejected':   `<span class="badge badge-rejected">Rejected</span>`,
    };
    actionButtons = lockedIndicators[r.status] || '';
  }

  return `
    <div class="resource-item" id="res-${r.id}">
      <div class="resource-icon">
        ${SAR.categoryIcon(r.category)}
      </div>
      <div class="resource-info">
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:2px">
          <span class="resource-name">${r.item}</span>
          <span class="badge badge-${r.priority}">${r.priority}</span>
        </div>
        <div class="resource-meta">
          <span class="font-mono" style="color:var(--text-secondary)">${r.id}</span>
          · Qty: <strong>${r.qty} ${r.unit}</strong>
          · Team: <strong>${team ? team.name : '—'}</strong>
          · Incident: <strong>${inc ? inc.id : '—'}</strong>
          · ${SAR.formatTime(r.requestedAt)}
        </div>
        ${r.notes ? `<div class="resource-notes">${r.notes}</div>` : ''}
      </div>
      <div style="display:flex;flex-direction:column;align-items:flex-end;gap:8px;flex-shrink:0">
        <span class="badge badge-${r.status}">${r.status}</span>
        <div class="resource-actions">
          ${actionButtons}
        </div>
      </div>
    </div>
  `;
}

function setResourceStatusFilter(st) {
  resourceStatusFilter = st;
  renderResources();
}

function setResourceCategoryFilter(cat) {
  resourceCategoryFilter = cat;
  renderResources();
}

function setResourceFilter(f) {
  if (['all', 'pending', 'approved', 'dispatched', 'delivered'].includes(f)) {
    resourceStatusFilter = f;
  } else {
    resourceCategoryFilter = f;
  }
  renderResources();
}

async function updateResourceStatus(id, newStatus) {
  const r = SAR.resources.find(x => x.id === id);
  if (!r) return;

  try {
    const targetId = r._dbId || id;
    const res = await fetch(`${API_BASE_URL}/resources/${targetId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus }),
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || 'Failed to update resource request');
    }

    r.status = newStatus;
    SAR.activityLog.unshift({
      id: 'act-res-' + Date.now(),
      type: 'info',
      text: `<span class="activity-actor-tag">SUPPLY-BASE</span> <strong>${r.id}</strong> "${r.item}" → <strong>${newStatus.toUpperCase()}</strong>`,
      time: 'just now',
      color: '#8b5cf6',
    });

    renderResources();
    updateBadges();

    Toast.show('success', 'Request Updated', `${r.item} marked as ${newStatus.toUpperCase()}`);
  } catch (err) {
    Toast.show('error', 'Update Failed', err.message);
  }
}

function openCreateResourceModal() {
  const myTeam = (typeof SAR !== 'undefined' && SAR.currentUser?.assigned_team) || '';
  const incidents = SAR.incidents.map(i => `<option value="${i.id}">${i.id} — ${i.title.substring(0, 30)}</option>`).join('');
  const teams     = SAR.teams.map(t => `<option value="${t.id}" ${t.id === myTeam ? 'selected' : ''}>${t.name}</option>`).join('');

  Modal.open('New Resource Request', `
    <div class="form-row">
      <div class="form-group">
        <label class="form-label">Request ID</label>
        <input class="form-control" value="${SAR.nextId('RES',SAR.resources)}" readonly style="opacity:0.6" />
      </div>
      <div class="form-group">
        <label class="form-label">Priority *</label>
        <select class="form-control" id="resPriority">
          <option value="critical">Critical</option>
          <option value="high">High</option>
          <option value="medium" selected>Medium</option>
          <option value="low">Low</option>
        </select>
      </div>
    </div>
    <div class="form-group">
      <label class="form-label">Item / Resource *</label>
      <input class="form-control" id="resItem" placeholder="e.g. Rescue Helicopter, Medical Oxygen, Cold Weather Suits" />
    </div>
    <div class="form-row">
      <div class="form-group">
        <label class="form-label">Quantity *</label>
        <input class="form-control" id="resQty" type="number" min="1" value="1" />
      </div>
      <div class="form-group">
        <label class="form-label">Unit</label>
        <input class="form-control" id="resUnit" placeholder="e.g. units, kits, sorties" />
      </div>
    </div>
    <div class="form-row">
      <div class="form-group">
        <label class="form-label">Category</label>
        <select class="form-control" id="resCat">
          <option value="vehicles">Vehicles</option>
          <option value="medical">Medical</option>
          <option value="equipment">Equipment</option>
          <option value="communication">Communication</option>
          <option value="food">Food & Water</option>
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
      <textarea class="form-control" id="resNotes" placeholder="Reason for this equipment requisition..."></textarea>
    </div>
    <div class="form-actions">
      <button class="btn btn-secondary" onclick="Modal.close()">Cancel</button>
      <button class="btn btn-primary" onclick="submitCreateResource()">Submit Request</button>
    </div>
  `);
}

async function submitCreateResource() {
  const item     = document.getElementById('resItem').value.trim();
  const qty      = parseInt(document.getElementById('resQty').value) || 1;
  const unit     = document.getElementById('resUnit').value.trim() || 'units';
  const category = document.getElementById('resCat').value;
  const priority = document.getElementById('resPriority').value;
  const team     = document.getElementById('resTeam').value;
  const incident = document.getElementById('resIncident').value;
  const notes    = document.getElementById('resNotes').value.trim();

  if (!item) { Toast.show('error','Validation Error','Item name is required.'); return; }

  const resPayload = {
    resource_id: SAR.nextId('RES', SAR.resources),
    item, category, qty, unit, team, incident, priority, notes,
    status: 'pending',
    requestedAt: new Date(),
  };

  try {
    if (typeof ensureAuthToken === 'function') await ensureAuthToken();
    const headers = typeof getAuthHeaders === 'function' ? getAuthHeaders() : { 'Content-Type': 'application/json' };
    const res = await fetch(`${API_BASE_URL}/resources/`, {
      method: 'POST',
      headers,
      body: JSON.stringify(resPayload),
    });
    if (res.ok) {
      const data = await res.json();
      if (data.resource) {
        resPayload.id = data.resource.id;
        resPayload._dbId = data.resource._dbId;
      }
    }
  } catch (e) {
    console.warn('Backend offline, resource queued locally:', e.message);
  }

  const res = {
    id: resPayload.resource_id || resPayload.id,
    ...resPayload,
  };

  SAR.resources.push(res);
  SAR.activityLog.unshift({
    type: 'warning',
    text: `<span class="activity-actor-tag">SUPPLY-BASE</span> Request for "${item}" logged (${res.id})`,
    time: 'just now',
    color: '#D97706'
  });

  Modal.close();
  renderResources();
  updateBadges();
  Toast.show('success', 'Request Submitted', `${res.id} queued for authorization.`);
}

/* ── 1-CLICK LOGISTICS PIPELINE BATCH ADVANCE ────── */
async function quickBatchAdvance(fromStatus, toStatus) {
  const targets = SAR.resources.filter(r => r.status === fromStatus);
  if (!targets.length) {
    if (typeof Toast !== 'undefined') {
      Toast.show('info', 'No Items', `No requests currently in "${fromStatus.toUpperCase()}" status.`);
    }
    return;
  }

  let count = 0;
  for (const r of targets) {
    const targetId = r._dbId || r.id;
    try {
      const res = await fetch(`${API_BASE_URL}/resources/${targetId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: toStatus }),
      });
      if (res.ok) {
        r.status = toStatus;
        count++;
      }
    } catch (err) {
      console.warn('Batch update failed for item:', r.id, err);
    }
  }

  const role = typeof SAR !== 'undefined' ? (SAR.currentUser?.role || 'LOGISTICS') : 'LOGISTICS';
  const callsign = typeof SAR !== 'undefined' ? (SAR.currentUser?.callsign || 'SUPPLY-BASE') : 'SUPPLY-BASE';

  SAR.activityLog.unshift({
    id: 'act-res-batch-' + Date.now(),
    type: 'info',
    text: `<span class="activity-actor-tag">${callsign}</span> Batch advanced ${count} items to <strong>${toStatus.toUpperCase()}</strong>`,
    time: 'just now',
    color: '#f59e0b',
  });

  renderResources();
  updateBadges();

  if (typeof Toast !== 'undefined') {
    Toast.show('success', 'Pipeline Advanced', `Successfully advanced ${count} requests to "${toStatus.toUpperCase()}".`);
  }
}
