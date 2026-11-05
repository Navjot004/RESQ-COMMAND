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
        <input class="form-control font-mono" id="incId" value="${SAR.nextId('INC', SAR.incidents)}" readonly style="opacity:0.6" />
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
      <input class="form-control" id="incTitle" placeholder="e.g. Hiker Missing — Solang Glacial Valley" />
    </div>

    <!-- ── Interactive Tactical Map Location Picker ── -->
    <div class="form-group" style="margin-bottom: 12px;">
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px;">
        <label class="form-label" style="margin:0; font-weight:700; color:var(--text-primary); display:flex; align-items:center; gap:6px;">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--cyan)" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
          Location & Tactical Map Selection *
        </label>
        <span style="font-size:0.7rem; color:var(--text-muted)">Search or click map to auto-fill</span>
      </div>

      <div class="geo-picker-toolbar">
        <div class="geo-search-box">
          <svg class="geo-search-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input type="text" id="incLocationSearch" class="geo-search-input" placeholder="Search place, valley, pass, town (e.g. Solang, Manali, Rohtang)..." autocomplete="off" />
          <button type="button" id="incClearSearchBtn" class="geo-btn-clear hidden" title="Clear">✕</button>
        </div>
        <button type="button" id="incSearchBtn" class="btn btn-sm btn-primary geo-btn-action">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          Search
        </button>
        <button type="button" id="incGpsBtn" class="btn btn-sm btn-secondary geo-btn-action" title="Acquire GPS Location">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="3"/><circle cx="12" cy="12" r="8"/><line x1="12" y1="2" x2="12" y2="4"/><line x1="12" y1="20" x2="12" y2="22"/><line x1="2" y1="12" x2="4" y2="12"/><line x1="20" y1="12" x2="22" y2="12"/>
          </svg>
          GPS
        </button>
      </div>

      <!-- Dropdown for searched places -->
      <div id="incSearchResults" class="geo-search-dropdown hidden"></div>

      <!-- Leaflet Tactical Mini-Map -->
      <div class="geo-map-wrapper">
        <div id="incMiniMap" class="geo-mini-map"></div>
        <div class="geo-map-crosshair-hint">
          <span>👆 Click map or drag pin to auto-fill location & coordinates</span>
          <span class="geo-coords-tag" id="incCoordsTag">LAT: 32.24550 | LNG: 77.18730</span>
        </div>
      </div>
    </div>

    <!-- Auto-populated location name field -->
    <div class="form-group">
      <label class="form-label">Resolved Location Name *</label>
      <input class="form-control" id="incLocation" placeholder="Auto-filled from map (e.g. Solang Valley, Kullu District)" />
      <div id="incReverseGeocodeStatus" class="geo-status-indicator"></div>
    </div>

    <!-- Auto-populated latitude & longitude fields -->
    <div class="form-row">
      <div class="form-group">
        <label class="form-label">Latitude</label>
        <input class="form-control font-mono" id="incLat" type="number" step="0.00001" placeholder="32.xxxx" />
      </div>
      <div class="form-group">
        <label class="form-label">Longitude</label>
        <input class="form-control font-mono" id="incLng" type="number" step="0.00001" placeholder="77.xxxx" />
      </div>
    </div>

    <div class="form-group">
      <label class="form-label">Description *</label>
      <textarea class="form-control" id="incDesc" placeholder="Describe the incident, circumstances, and immediate actions taken…"></textarea>
    </div>
    <div class="form-group">
      <label class="form-label">Reported By</label>
      <input class="form-control" id="incReporter" placeholder="e.g. HP Police HQ / Mountain Patrol" />
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
  `, 'lg');

  // Initialize interactive map & geocoding picker
  if (typeof SARLocationPicker !== 'undefined') {
    SARLocationPicker.init({
      mapElementId: 'incMiniMap',
      locationInputId: 'incLocation',
      latInputId: 'incLat',
      lngInputId: 'incLng',
      searchInputId: 'incLocationSearch',
      searchBtnId: 'incSearchBtn',
      gpsBtnId: 'incGpsBtn',
      clearBtnId: 'incClearSearchBtn',
      resultsContainerId: 'incSearchResults',
      coordsTagId: 'incCoordsTag',
      statusIndicatorId: 'incReverseGeocodeStatus',
      initialLat: 32.2455,
      initialLng: 77.1873,
    });
  }
}


async function submitCreateIncident() {
    const incId = document.getElementById('incId')?.value.trim();
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
        await ensureAuthToken();
        const response = await fetch(`${API_BASE_URL}/incidents/`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({
                incident_id: incId,
                title,
                description: desc,
                location,
                latitude: lat,
                longitude: lng,
                priority: priority.toUpperCase(),
                reported_by: reporter,
                teams: teamsSel
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
        await ensureAuthToken();
        const targetId = inc._dbId || id;
        const response = await fetch(`${API_BASE_URL}/incidents/${targetId}`, {
            method: 'PATCH',
            headers: getAuthHeaders(),
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

