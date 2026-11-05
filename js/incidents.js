/* ══════════════════════════════════════════════════════
   SAR COMMAND — INCIDENTS
══════════════════════════════════════════════════════ */

let incidentFilter = 'all';

function renderIncidents() {
  const root = document.getElementById('incidents-root');
  if (!root) return;

  let filtered = SAR.incidents;
  if (incidentFilter !== 'all') {
    filtered = SAR.incidents.filter(i =>
      i.priority === incidentFilter || i.status === incidentFilter
    );
  }

  root.innerHTML = `
    <div class="page-header">
      <div class="page-header-left">
        <h2>Incident Management</h2>
        <p>${SAR.incidents.length} total incidents · ${SAR.incidents.filter(i=>i.status==='active').length} active</p>
      </div>
      <button class="btn btn-primary" onclick="openCreateIncidentModal()">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
        New Incident
      </button>
    </div>

    <div class="filter-bar">
      ${['all','critical','high','medium','low','active','contained','resolved'].map(f => `
        <button class="filter-btn ${incidentFilter===f?'active':''}" onclick="setIncidentFilter('${f}')">${f.charAt(0).toUpperCase()+f.slice(1)}</button>
      `).join('')}
    </div>

    <div class="page-content">
      <div class="card">
        <div class="card-body" style="padding:0;">
          <div class="table-container">
            <table class="data-table" id="incidentsTable">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Title</th>
                  <th>Location</th>
                  <th>Priority</th>
                  <th>Status</th>
                  <th>Teams</th>
                  <th>Findings</th>
                  <th>Reported</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                ${filtered.length === 0 ? `<tr><td colspan="9" class="text-center text-muted" style="padding:30px">No incidents found</td></tr>` : ''}
                ${filtered.map(inc => `
                  <tr>
                    <td class="td-mono" style="color:var(--orange)">${inc.id}</td>
                    <td>
                      <div class="td-name">${inc.title}</div>
                      <div style="font-size:0.72rem;color:var(--text-muted);margin-top:2px">${inc.description.substring(0,60)}…</div>
                    </td>
                    <td>
                      <div style="font-size:0.8rem;color:var(--text-secondary)">${inc.location}</div>
                    </td>
                    <td><span class="badge badge-${inc.priority}">${inc.priority}</span></td>
                    <td><span class="badge badge-${inc.status}">${inc.status}</span></td>
                    <td>
                      <div style="display:flex;gap:4px;flex-wrap:wrap">
                        ${inc.teams.map(tid => {
                          const t = SAR.getTeam(tid);
                          return t ? `<span style="background:${t.color}22;border:1px solid ${t.color}44;color:${t.color};padding:2px 6px;border-radius:4px;font-size:0.68rem;font-weight:700">${t.name.split(' ')[0]}</span>` : '';
                        }).join('')}
                      </div>
                    </td>
                    <td><span style="font-family:'JetBrains Mono',monospace;color:var(--green)">${inc.findings}</span></td>
                    <td><span class="font-mono" style="font-size:0.72rem;color:var(--text-muted)">${SAR.formatTime(inc.createdAt)}</span></td>
                    <td>
                      <div style="display:flex;gap:6px">
                        <button class="btn btn-sm btn-secondary" onclick="openIncidentDetail('${inc.id}')">Detail</button>
                        <button class="btn btn-sm btn-secondary" onclick="cycleIncidentStatus('${inc.id}')">Update</button>
                      </div>
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  `;
}

function setIncidentFilter(f) {
  incidentFilter = f;
  renderIncidents();
}

function openCreateIncidentModal() {
  const teams = SAR.teams.map(t => `<option value="${t.id}">${t.name} (${t.status})</option>`).join('');
  Modal.open('🚨 Create New Incident', `
    <div class="form-row">
      <div class="form-group">
        <label class="form-label">Incident ID</label>
        <input class="form-control" id="incId" value="${SAR.nextId('INC', SAR.incidents)}" readonly style="opacity:0.6" />
      </div>
      <div class="form-group">
        <label class="form-label">Priority *</label>
        <select class="form-control" id="incPriority">
          <option value="critical">🔴 Critical</option>
          <option value="high">🟠 High</option>
          <option value="medium" selected>🟡 Medium</option>
          <option value="low">🔵 Low</option>
        </select>
      </div>
    </div>
    <div class="form-group">
      <label class="form-label">Incident Title *</label>
      <input class="form-control" id="incTitle" placeholder="e.g. Hiker Missing — Hampta Pass" />
    </div>
    <div class="form-group">
      <label class="form-label">Location *</label>
      <input class="form-control" id="incLocation" placeholder="e.g. Hampta Pass, Kullu District" />
    </div>
    <div class="form-row">
      <div class="form-group">
        <label class="form-label">Latitude</label>
        <input class="form-control" id="incLat" type="number" step="0.0001" placeholder="32.xxxx" />
      </div>
      <div class="form-group">
        <label class="form-label">Longitude</label>
        <input class="form-control" id="incLng" type="number" step="0.0001" placeholder="77.xxxx" />
      </div>
    </div>
    <div class="form-group">
      <label class="form-label">Description *</label>
      <textarea class="form-control" id="incDesc" placeholder="Describe the incident, circumstances, and immediate actions taken…"></textarea>
    </div>
    <div class="form-group">
      <label class="form-label">Reported By</label>
      <input class="form-control" id="incReporter" placeholder="e.g. HP Police HQ" />
    </div>
    <div class="form-group">
      <label class="form-label">Assign Teams</label>
      <select class="form-control" id="incTeams" multiple style="min-height:80px">
        ${teams}
      </select>
      <div style="font-size:0.72rem;color:var(--text-muted);margin-top:4px">Hold Ctrl / Cmd to select multiple</div>
    </div>
    <div class="form-actions">
      <button class="btn btn-secondary" onclick="Modal.close()">Cancel</button>
      <button class="btn btn-primary" onclick="submitCreateIncident()">Create Incident</button>
    </div>
  `);
}


async function submitCreateIncident() {
    const title = document.getElementById('incTitle').value.trim();
    const location = document.getElementById('incLocation').value.trim();
    const priority = document.getElementById('incPriority').value;
    const desc = document.getElementById('incDesc').value.trim();
    const reporter = document.getElementById('incReporter').value.trim() || 'Unknown';

    const lat = parseFloat(document.getElementById('incLat').value) || 32.15;
    const lng = parseFloat(document.getElementById('incLng').value) || 77.40;

    const teamsSel = Array.from(
        document.getElementById('incTeams').selectedOptions
    ).map(o => o.value);

    if (!title || !location || !desc) {
        Toast.show('error', 'Validation Error', 'Please fill in Title, Location, and Description.');
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/incidents/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                title,
                description: desc,
                location,
                latitude: lat,
                longitude: lng,
                priority: priority.toUpperCase()
            })
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.detail || 'Failed to create incident');
        }

        const savedIncident = await response.json();

        await fetchIncidents();

        Modal.close();
        renderIncidents();
        updateBadges();

        if (typeof renderDashboard === 'function') {
            renderDashboard();
        }

        Toast.show(
            'success',
            'Incident Created',
            `${savedIncident.id} saved successfully in MongoDB.`
        );

    } catch (error) {
        console.error('Create Incident Error:', error);
        Toast.show('error', 'Creation Failed', error.message);
    }
}


function openIncidentDetail(id) {
  const inc = SAR.getIncident(id);
  if (!inc) return;
  const teams = inc.teams.map(tid => {
    const t = SAR.getTeam(tid);
    return t ? `<span style="background:${t.color}22;border:1px solid ${t.color}55;color:${t.color};padding:3px 8px;border-radius:6px;font-size:0.75rem;font-weight:700;margin-right:4px">${t.name}</span>` : '';
  }).join('');
  const findings = SAR.findings.filter(f => f.incident === id);

  Modal.open(`📋 Incident ${inc.id}`, `
    <div class="detail-row">
      <span class="detail-key">Title</span>
      <span class="detail-val">${inc.title}</span>
    </div>
    <div class="detail-row">
      <span class="detail-key">Location</span>
      <span class="detail-val">${inc.location}</span>
    </div>
    <div class="detail-row">
      <span class="detail-key">Priority</span>
      <span class="detail-val"><span class="badge badge-${inc.priority}">${inc.priority}</span></span>
    </div>
    <div class="detail-row">
      <span class="detail-key">Status</span>
      <span class="detail-val"><span class="badge badge-${inc.status}">${inc.status}</span></span>
    </div>
    <div class="detail-row">
      <span class="detail-key">Reported By</span>
      <span class="detail-val">${inc.reportedBy}</span>
    </div>
    <div class="detail-row">
      <span class="detail-key">Created</span>
      <span class="detail-val font-mono">${SAR.formatDateTime(inc.createdAt)}</span>
    </div>
    <div class="detail-row">
      <span class="detail-key">Last Update</span>
      <span class="detail-val font-mono">${SAR.formatDateTime(inc.updatedAt)}</span>
    </div>
    <div class="detail-row">
      <span class="detail-key">Description</span>
      <span class="detail-val" style="text-align:left;max-width:300px;line-height:1.5;font-weight:400;color:var(--text-secondary)">${inc.description}</span>
    </div>
    <div class="detail-row">
      <span class="detail-key">Teams</span>
      <span class="detail-val">${teams || '—'}</span>
    </div>
    <div class="detail-row">
      <span class="detail-key">Zones</span>
      <span class="detail-val">${inc.zones.join(', ') || '—'}</span>
    </div>

    <div style="margin-top:16px">
      <div class="modal-section-title">Findings (${findings.length})</div>
      ${findings.length === 0 ? '<div style="color:var(--text-muted);font-size:0.82rem">No findings recorded yet</div>' : ''}
      ${findings.map(f => `
        <div style="display:flex;gap:10px;padding:10px 0;border-bottom:1px solid var(--border);align-items:flex-start">
          <span style="font-size:1.2rem">${SAR.findingIcon(f.type)}</span>
          <div>
            <div style="font-weight:600;color:var(--text-primary);font-size:0.85rem">${f.title}</div>
            <div style="color:var(--text-muted);font-size:0.75rem;margin-top:2px">${f.description.substring(0,80)}…</div>
          </div>
        </div>
      `).join('')}
    </div>

    <div class="form-actions" style="margin-top:20px">
      <button class="btn btn-secondary" onclick="cycleIncidentStatus('${id}');Modal.close()">Update Status</button>
      <button class="btn btn-primary" onclick="Modal.close();App.navigate('map')">View on Map</button>
    </div>
  `);
}


async function cycleIncidentStatus(id) {
    const inc = SAR.getIncident(id);
    if (!inc) return;

    const flow = ['active', 'contained', 'resolved'];
    const currentIndex = flow.indexOf(inc.status);
    const newStatus = flow[(currentIndex + 1) % flow.length];

    try {
        const response = await fetch(`${API_BASE_URL}/incidents/${id}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              status: newStatus === 'contained'
                ? 'IN_PROGRESS'
                : newStatus.toUpperCase()
       })
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.detail || 'Status update failed');
        }

        await fetchIncidents();

        renderIncidents();
        updateBadges();

        if (typeof renderDashboard === 'function') {
            renderDashboard();
        }

        Toast.show(
            'success',
            'Status Updated',
            `${id} is now ${newStatus.toUpperCase()}.`
        );

    } catch (error) {
        console.error('Status Update Error:', error);
        Toast.show('error', 'Update Failed', error.message);
    }
}

