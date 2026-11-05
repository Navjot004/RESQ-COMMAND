/* ══════════════════════════════════════════════════════
   SAR COMMAND — MAP (FIXED & ENHANCED)
   - OpenStreetMap tiles (no API key)
   - Leaflet.draw polygon zone creation / edit / delete
   - Custom team markers with live/stale/offline states
   - Incident + team-status filters
   - No duplicate event listeners (map init guard)
   - Stable team positions (no random drift accumulation)
══════════════════════════════════════════════════════ */

/* ── State ────────────────────────────────────────── */
let sarMap          = null;
let mapInitialized  = false;   // true after first init
let drawControl     = null;
let drawnItems      = null;    // FeatureGroup for drawn polygons

let zoneLayerGroup    = null;
let teamLayerGroup    = null;
let findingLayerGroup = null;
let teamAnimInterval  = null;

// Active filter state
let mapFilters = {
  zones:      true,
  teams:      true,
  findings:   true,
  incident:   'all',   // 'all' | 'INC-001' | …
  teamStatus: 'all',   // 'all' | 'deployed' | …
};

/* ═══════════════════════ INIT ═══════════════════════ */
function initMap() {
  if (mapInitialized && sarMap) {
    // Already initialised — just resize and refresh markers
    sarMap.invalidateSize();
    refreshMapLayers();
    return;
  }

  /* ── 1. Create map ── */
  sarMap = L.map('leaflet-map', {
    center: [32.15, 77.40],
    zoom: 9,
    zoomControl: true,
    attributionControl: true,
  });

  /* ── 2. OpenStreetMap tile layer (no API key required) ── */
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© <a href="https://www.openstreetmap.org/copyright" style="color:#94a3b8">OpenStreetMap</a> contributors',
    maxZoom: 19,
    crossOrigin: true,
  }).addTo(sarMap);

  /* ── 3. Layer groups ── */
  drawnItems        = new L.FeatureGroup().addTo(sarMap);
  zoneLayerGroup    = L.layerGroup().addTo(sarMap);
  teamLayerGroup    = L.layerGroup().addTo(sarMap);
  findingLayerGroup = L.layerGroup().addTo(sarMap);

  /* ── 4. Leaflet.draw control ── */
  if (typeof L.Control.Draw !== 'undefined') {
    drawControl = new L.Control.Draw({
      position: 'topright',
      draw: {
        polygon: {
          allowIntersection: false,
          showArea: true,
          shapeOptions: { color: '#f97316', fillOpacity: 0.15, weight: 2 },
        },
        rectangle: {
          shapeOptions: { color: '#3b82f6', fillOpacity: 0.15, weight: 2 },
        },
        polyline:  false,
        circle:    false,
        circlemarker: false,
        marker:    false,
      },
      edit: {
        featureGroup: drawnItems,
        remove: true,
      },
    });
    // Draw control is added to map only when "Draw Zone" is active (see button handler below)

    /* Draw created → prompt for zone name */
    sarMap.on(L.Draw.Event.CREATED, function(e) {
      const layer = e.layer;
      drawnItems.addLayer(layer);
      disableDrawMode();
      promptNewZone(layer);
    });

    /* Draw edited → persist coords update */
    sarMap.on(L.Draw.Event.EDITED, function(e) {
      e.layers.eachLayer(layer => {
        const zoneId = layer._sarZoneId;
        if (!zoneId) return;
        const zone = SAR.getZone(zoneId);
        if (!zone) return;
        zone.coords = layer.getLatLngs()[0].map(ll => [ll.lat, ll.lng]);
        SAR.activityLog.unshift({ type:'info', text:`<strong>${zone.name}</strong> boundary updated`, time:'just now', color:'#3b82f6' });
      });
      refreshMapLayers();
    });

    /* Draw deleted → remove from SAR data */
    sarMap.on(L.Draw.Event.DELETED, function(e) {
      e.layers.eachLayer(layer => {
        const zoneId = layer._sarZoneId;
        if (!zoneId) return;
        const idx = SAR.zones.findIndex(z => z.id === zoneId);
        if (idx !== -1) {
          const [removed] = SAR.zones.splice(idx, 1);
          Toast.show('warning', 'Zone Deleted', `${removed.name} removed from operational map.`);
        }
      });
      refreshMapLayers();
    });
  }

  /* ── 5. Render initial layers ── */
  renderMapZones();
  renderMapTeams();
  renderMapFindings();
  startTeamAnimation();

  /* ── 6. Wire up layer toggles (once) ── */
  document.getElementById('toggleZones').addEventListener('click', function() {
    mapFilters.zones = !mapFilters.zones;
    this.classList.toggle('active', mapFilters.zones);
    mapFilters.zones ? sarMap.addLayer(zoneLayerGroup) : sarMap.removeLayer(zoneLayerGroup);
  });
  document.getElementById('toggleTeams').addEventListener('click', function() {
    mapFilters.teams = !mapFilters.teams;
    this.classList.toggle('active', mapFilters.teams);
    mapFilters.teams ? sarMap.addLayer(teamLayerGroup) : sarMap.removeLayer(teamLayerGroup);
  });
  document.getElementById('toggleFindings').addEventListener('click', function() {
    mapFilters.findings = !mapFilters.findings;
    this.classList.toggle('active', mapFilters.findings);
    mapFilters.findings ? sarMap.addLayer(findingLayerGroup) : sarMap.removeLayer(findingLayerGroup);
  });

  /* ── 7. Wire up filters ── */
  const incidentSelect = document.getElementById('filterByIncident');
  if (incidentSelect) {
    // Populate options
    incidentSelect.innerHTML = '<option value="all">All Incidents</option>' +
      SAR.incidents.map(i => `<option value="${i.id}">${i.id} — ${i.title.substring(0,28)}</option>`).join('');

    incidentSelect.addEventListener('change', function() {
      mapFilters.incident = this.value;
      refreshMapLayers();
    });
  }
  const teamStatusSelect = document.getElementById('filterByTeamStatus');
  if (teamStatusSelect) {
    teamStatusSelect.addEventListener('change', function() {
      mapFilters.teamStatus = this.value;
      renderMapTeams();
    });
  }

  /* ── 8. Draw Zone button ── */
  const drawBtn   = document.getElementById('drawZoneBtn');
  const cancelBtn = document.getElementById('cancelDrawBtn');
  if (drawBtn) {
    drawBtn.addEventListener('click', () => enableDrawMode());
  }
  if (cancelBtn) {
    cancelBtn.addEventListener('click', () => disableDrawMode());
  }

  /* ── 9. Close panel ── */
  document.getElementById('closeMapPanel').addEventListener('click', () => {
    document.getElementById('mapDetailPanel').classList.remove('open');
  });

  mapInitialized = true;
}

/* ═══════════════════ DRAW MODE ═══════════════════════ */
function enableDrawMode() {
  if (!sarMap || typeof L.Control.Draw === 'undefined') return;
  sarMap.addControl(drawControl);
  // Activate polygon draw immediately
  new L.Draw.Polygon(sarMap, drawControl.options.draw.polygon).enable();
  document.getElementById('drawZoneBtn').style.display    = 'none';
  document.getElementById('cancelDrawBtn').style.display  = '';
  Toast.show('info', 'Draw Mode', 'Click on the map to draw a search zone polygon. Double-click to finish.');
}

function disableDrawMode() {
  if (!sarMap || !drawControl) return;
  try { sarMap.removeControl(drawControl); } catch(e) { /* already removed */ }
  document.getElementById('drawZoneBtn').style.display    = '';
  document.getElementById('cancelDrawBtn').style.display  = 'none';
}

/* ── Prompt for zone metadata after drawing ── */
function promptNewZone(layer) {
  const coords = layer.getLatLngs()[0].map(ll => [ll.lat, ll.lng]);
  const newId  = SAR.nextId('Z', SAR.zones);
  const incidents = SAR.incidents.map(i =>
    `<option value="${i.id}">${i.id} — ${i.title.substring(0,28)}</option>`
  ).join('');
  const teams = SAR.teams.map(t =>
    `<option value="${t.id}">${t.name} (${t.status})</option>`
  ).join('');

  Modal.open('🗺️ New Search Zone', `
    <div class="form-row">
      <div class="form-group">
        <label class="form-label">Zone ID</label>
        <input class="form-control" value="${newId}" readonly style="opacity:0.6" />
      </div>
      <div class="form-group">
        <label class="form-label">Zone Name *</label>
        <input class="form-control" id="newZoneName" placeholder="e.g. Zone Juliet" />
      </div>
    </div>
    <div class="form-row">
      <div class="form-group">
        <label class="form-label">Assign to Incident *</label>
        <select class="form-control" id="newZoneIncident">${incidents}</select>
      </div>
      <div class="form-group">
        <label class="form-label">Assign Team (optional)</label>
        <select class="form-control" id="newZoneTeam">
          <option value="">-- None --</option>
          ${teams}
        </select>
      </div>
    </div>
    <div class="form-group">
      <label class="form-label">Initial Status</label>
      <select class="form-control" id="newZoneStatus">
        <option value="pending">Pending</option>
        <option value="assigned" selected>Assigned</option>
        <option value="in-progress">In Progress</option>
      </select>
    </div>
    <div style="background:var(--bg-elevated);border:1px solid var(--border);border-radius:8px;padding:10px 14px;margin-bottom:16px">
      <div style="font-size:0.72rem;color:var(--text-muted);margin-bottom:4px">Polygon Vertices</div>
      <div style="font-family:'JetBrains Mono',monospace;font-size:0.72rem;color:var(--text-secondary)">${coords.length} points drawn</div>
    </div>
    <div class="form-actions">
      <button class="btn btn-secondary" onclick="Modal.close();drawnItems.clearLayers()">Discard</button>
      <button class="btn btn-primary" onclick="saveNewZone('${newId}',${JSON.stringify(coords)})">Save Zone</button>
    </div>
  `);
}

async function saveNewZone(id, coords) {
  const name     = document.getElementById('newZoneName').value.trim();
  const incident = document.getElementById('newZoneIncident').value;
  const teamId   = document.getElementById('newZoneTeam').value || null;
  const status   = document.getElementById('newZoneStatus').value;

  if (!name) { Toast.show('error', 'Validation', 'Zone name is required.'); return; }

  // Compute centroid
  const lats = coords.map(c => c[0]);
  const lngs = coords.map(c => c[1]);
  const lat  = lats.reduce((a,b) => a+b, 0) / lats.length;
  const lng  = lngs.reduce((a,b) => a+b, 0) / lngs.length;

  const zonePayload = {
    zone_id: id,
    name,
    incident,
    team: teamId || null,
    status,
    progress: 0,
    lat,
    lng,
    coords,
  };

  try {
    const res = await fetch(`${API_BASE_URL}/zones/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(zonePayload),
    });
    if (res.ok) {
      const data = await res.json();
      if (data.zone) {
        zonePayload.id = data.zone.id;
        zonePayload._dbId = data.zone._dbId;
      }
    }
  } catch (e) {
    console.warn('Backend offline, sector saved in local session:', e.message);
  }

  const zone = {
    id: zonePayload.zone_id || zonePayload.id,
    ...zonePayload,
  };
  SAR.zones.push(zone);

  // Assign team pointer
  if (teamId) {
    const t = SAR.getTeam(teamId);
    if (t) { t.zone = zone.id; t.status = 'deployed'; }
  }

  // Attach zone id to the drawn layer for future edit/delete
  if (drawnItems.getLayers().length) {
    drawnItems.getLayers()[drawnItems.getLayers().length - 1]._sarZoneId = zone.id;
  }

  // Add zone to incident zones list
  const inc = SAR.getIncident(incident);
  if (inc && !inc.zones.includes(zone.id)) inc.zones.push(zone.id);

  Modal.close();
  refreshMapLayers();
  Toast.show('success', 'Sector Established', `${name} (${zone.id}) mapped.`);
  SAR.activityLog.unshift({ type:'success', text:`<strong>${name}</strong> search sector designated`, time:'just now', color:'#10B981' });
}

/* ════════════════ LAYER RENDERING ════════════════════ */

function refreshMapLayers() {
  renderMapZones();
  renderMapTeams();
  renderMapFindings();
}

/* ── Zones ── */
function renderMapZones() {
  if (!zoneLayerGroup) return;
  zoneLayerGroup.clearLayers();

  const statusColors = {
    'assigned':    '#0284c7',
    'in-progress': '#ea580c',
    'completed':   '#10b981',
    'pending':     '#64748b',
  };

  const filtered = mapFilters.incident === 'all'
    ? SAR.zones
    : SAR.zones.filter(z => z.incident === mapFilters.incident);

  filtered.forEach(zone => {
    const color   = statusColors[zone.status] || '#6b7280';
    const polygon = L.polygon(zone.coords.map(c => [c[0], c[1]]), {
      color:       color,
      fillColor:   color,
      fillOpacity: 0.18,
      weight:      2,
      dashArray:   zone.status === 'pending' ? '6 4' : null,
    });

    polygon._sarZoneId = zone.id;
    polygon.bindPopup(createZonePopup(zone), { maxWidth: 240 });
    polygon.on('click', () => showMapPanel(zone));
    polygon.on('mouseover', function() { this.setStyle({ fillOpacity: 0.38, weight: 3 }); });
    polygon.on('mouseout',  function() { this.setStyle({ fillOpacity: 0.18, weight: 2 }); });

    // Sync to drawnItems for edit/delete support
    // (existing zones won't have drawn layers, we just add polygon to both groups)
    polygon.addTo(zoneLayerGroup);

    // Zone label at centroid
    const center = polygon.getBounds().getCenter();
    const label  = L.divIcon({
      html: `<div style="
        background:rgba(8,12,23,0.88);
        border:1px solid ${color};
        border-radius:5px;
        padding:2px 7px;
        font-size:10.5px;
        font-weight:700;
        color:${color};
        white-space:nowrap;
        font-family:Inter,sans-serif;
        pointer-events:none;
      ">${zone.name}</div>`,
      iconAnchor: [30, 10],
      className:  '',
    });
    L.marker(center, { icon: label, interactive: false }).addTo(zoneLayerGroup);
  });
}

/* ── Teams ── */
function renderMapTeams() {
  if (!teamLayerGroup) return;
  teamLayerGroup.clearLayers();

  // Stable seed positions: base zone centroid + small deterministic offset per team id
  const filtered = SAR.teams.filter(t => {
    if (!t.zone) return false;
    if (mapFilters.teamStatus !== 'all' && t.status !== mapFilters.teamStatus) return false;
    if (mapFilters.incident !== 'all') {
      const inc = SAR.getIncident(mapFilters.incident);
      if (inc && !inc.teams.includes(t.id)) return false;
    }
    return true;
  });

  filtered.forEach(team => {
    const zone = SAR.getZone(team.zone);
    if (!zone) return;

    // Stable, unique positional offset derived from team numeric id (no random drift)
    const teamNum = parseInt(team.id.split('-')[1]) || 1;
    const offsetLat = (((teamNum * 7) % 11) - 5) * 0.0012;
    const offsetLng = (((teamNum * 13) % 11) - 5) * 0.0012;

    if (!team._mapLat || team._needReposition) {
      team._mapLat = zone.lat + offsetLat;
      team._mapLng = zone.lng + offsetLng;
      team._needReposition = false;
    }

    // Determine freshness (simulate last GPS update within 0–8 min)
    const lastUpdateMins = ((teamNum * 3) % 9);
    const isStale  = lastUpdateMins > 5;
    const isOnline = team.status === 'deployed' || team.status === 'returning';

    const dotColor   = isOnline ? (isStale ? '#6b7280' : team.color) : '#374151';
    const ringColor  = isOnline ? (isStale ? '#6b728044' : `${team.color}44`) : '#37415144';
    const statusIcon = isOnline ? (isStale ? '⚠' : '●') : '○';

    const icon = L.divIcon({
      html: `<div style="position:relative;width:36px;height:36px">
        <!-- Pulse ring (live only) -->
        ${isOnline && !isStale ? `<div style="
          position:absolute;inset:-5px;
          border-radius:50%;
          border:2px solid ${team.color};
          opacity:0.5;
          animation:radarExpand 2s ease-out infinite;
        "></div>` : ''}
        <!-- Dot -->
        <div style="
          position:absolute;inset:4px;
          background:${dotColor};
          border:2.5px solid ${isStale ? '#6b7280' : 'white'};
          border-radius:50%;
          display:flex;align-items:center;justify-content:center;
          font-size:9.5px;font-weight:800;color:white;
          font-family:Inter,sans-serif;
          box-shadow:0 2px 8px rgba(0,0,0,0.6);
          cursor:pointer;
        ">${team.id.split('-')[1]}</div>
      </div>`,
      iconSize:   [36, 36],
      iconAnchor: [18, 18],
      className:  '',
    });

    const marker = L.marker([team._mapLat, team._mapLng], { icon, zIndexOffset: 200 });

    marker.bindPopup(buildTeamPopup(team, zone, lastUpdateMins, isStale), {
      maxWidth: 220,
      className: 'sar-popup',
    });

    marker.addTo(teamLayerGroup);
    team._marker = marker;
  });
}

function buildTeamPopup(team, zone, lastUpdateMins, isStale) {
  const freshnessColor = isStale ? '#f59e0b' : '#10b981';
  const freshnessText  = isStale
    ? `⚠ Stale — ${lastUpdateMins} min ago`
    : `● Live — ${lastUpdateMins}m ago`;
  return `
    <div style="font-family:Inter,sans-serif;min-width:190px">
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px;border-bottom:1px solid #1e2d4a;padding-bottom:8px">
        <div style="width:10px;height:10px;border-radius:50%;background:${team.color}"></div>
        <strong style="color:#f1f5f9;font-size:0.9rem">${team.name}</strong>
      </div>
      <div style="font-size:0.78rem;color:#94a3b8;margin-bottom:3px">Leader: <span style="color:#f1f5f9">${team.leader}</span></div>
      <div style="font-size:0.78rem;color:#94a3b8;margin-bottom:3px">Members: <span style="color:#f1f5f9">${team.members}</span></div>
      <div style="font-size:0.78rem;color:#94a3b8;margin-bottom:3px">Zone: <span style="color:#3b82f6;font-weight:600">${zone.name}</span></div>
      <div style="font-size:0.78rem;color:#94a3b8;margin-bottom:3px">Status: <span style="color:#f1f5f9;font-weight:600">${team.status}</span></div>
      <div style="font-size:0.78rem;color:#94a3b8;margin-bottom:3px">Spec: <span style="color:#f1f5f9">${team.specialization}</span></div>
      <div style="margin-top:8px;padding:5px 8px;background:#0f1629;border-radius:6px;font-size:0.72rem;font-weight:600;color:${freshnessColor}">
        ${freshnessText}
      </div>
      <div style="margin-top:8px;font-size:0.7rem;color:#475569;font-family:'JetBrains Mono',monospace">
        ${team._mapLat ? team._mapLat.toFixed(4) : '—'}°N, ${team._mapLng ? team._mapLng.toFixed(4) : '—'}°E
      </div>
    </div>
  `;
}

/* ── Findings ── */
function renderMapFindings() {
  if (!findingLayerGroup) return;
  findingLayerGroup.clearLayers();

  const filtered = mapFilters.incident === 'all'
    ? SAR.findings
    : SAR.findings.filter(f => f.incident === mapFilters.incident);

  filtered.forEach(f => {
    const emoji = SAR.findingIcon(f.type);
    const borderColors = {
      'person-found': '#10b981',
      'clue':         '#0ea5e9',
      'hazard':       '#ef4444',
      'evidence':     '#d97706',
    };
    const bc  = borderColors[f.type] || '#10b981';
    const icon = L.divIcon({
      html: `<div style="
        background:rgba(8,12,23,0.88);
        border:1.5px solid ${bc};
        border-radius:8px;
        width:30px;height:30px;
        display:flex;align-items:center;justify-content:center;
        font-size:14px;
        cursor:pointer;
        box-shadow:0 2px 8px rgba(0,0,0,0.4);
      ">${emoji}</div>`,
      iconSize:   [30, 30],
      iconAnchor: [15, 15],
      className:  '',
    });
    const marker = L.marker([f.lat, f.lng], { icon, zIndexOffset: 100 });
    marker.bindPopup(`
      <div style="font-family:Inter,sans-serif;min-width:185px">
        <div style="font-weight:700;color:${bc};margin-bottom:6px;font-size:0.88rem">${emoji} ${f.title}</div>
        <div style="font-size:0.78rem;color:#94a3b8;margin-bottom:3px">Zone: <span style="color:#f1f5f9">${f.zone}</span></div>
        <div style="font-size:0.78rem;color:#94a3b8;margin-bottom:3px">Team: <span style="color:#f1f5f9">${f.team || '—'}</span></div>
        <div style="font-size:0.78rem;color:#94a3b8;margin-bottom:6px">Status: <span style="color:#f1f5f9">${f.status}</span></div>
        <div style="font-size:0.75rem;color:#94a3b8;line-height:1.5;border-top:1px solid #1e2d4a;padding-top:6px">${f.description.substring(0,90)}…</div>
      </div>
    `, { maxWidth: 230 });
    marker.addTo(findingLayerGroup);
  });
}

/* ════════════════ SIDE PANEL ════════════════════════ */
function showMapPanel(zone) {
  const panel   = document.getElementById('mapDetailPanel');
  const content = document.getElementById('mapPanelContent');
  const team    = zone.team ? SAR.getTeam(zone.team) : null;
  const inc     = SAR.getIncident(zone.incident);
  const statusColors = {
    'assigned':    '#0284c7',
    'in-progress': '#ea580c',
    'completed':   '#10b981',
    'pending':     '#64748b',
  };
  const color = statusColors[zone.status] || '#6b7280';

  content.innerHTML = `
    <div style="margin-top:8px">
      <div style="font-size:0.68rem;color:var(--text-muted);text-transform:uppercase;letter-spacing:1px;margin-bottom:4px">Selected Zone</div>
      <div class="map-panel-zone-name">${zone.name}
        <span style="font-size:0.68rem;font-family:'JetBrains Mono',monospace;color:var(--text-muted);margin-left:6px">${zone.id}</span>
      </div>

      <div style="margin-bottom:14px">
        <div class="progress-track">
          <div class="progress-fill" style="width:${zone.progress}%;background:${color}"></div>
        </div>
        <div style="font-size:0.7rem;color:var(--text-muted);margin-top:4px">Search Coverage: <strong style="color:${color}">${zone.progress}%</strong></div>
      </div>

      <div class="map-panel-row"><span class="map-panel-key">Status</span><span class="map-panel-val" style="color:${color}">${zone.status}</span></div>
      <div class="map-panel-row"><span class="map-panel-key">Incident</span><span class="map-panel-val">${inc ? inc.id : '—'}</span></div>
      <div class="map-panel-row"><span class="map-panel-key">Priority</span><span class="map-panel-val">${inc ? `<span class="badge badge-${inc.priority}">${inc.priority}</span>` : '—'}</span></div>
      <div class="map-panel-row"><span class="map-panel-key">Assigned Team</span><span class="map-panel-val">${team ? team.name : '<span style="color:var(--amber)">Unassigned</span>'}</span></div>
      ${team ? `
        <div class="map-panel-row"><span class="map-panel-key">Leader</span><span class="map-panel-val">${team.leader}</span></div>
        <div class="map-panel-row"><span class="map-panel-key">Members</span><span class="map-panel-val">${team.members}</span></div>
        <div class="map-panel-row"><span class="map-panel-key">Contact</span><span class="map-panel-val" style="font-family:'JetBrains Mono',monospace;font-size:0.72rem">${team.contact || '—'}</span></div>
      ` : ''}

      <div style="margin-top:14px">
        <div style="font-size:0.68rem;font-weight:700;text-transform:uppercase;color:var(--text-muted);letter-spacing:1px;margin-bottom:8px">Findings (${SAR.findings.filter(f=>f.zone===zone.id).length})</div>
        ${SAR.findings.filter(f=>f.zone===zone.id).map(f=>`
          <div style="display:flex;gap:8px;align-items:flex-start;padding:8px 0;border-bottom:1px solid var(--border)">
            <span style="font-size:1rem;flex-shrink:0">${SAR.findingIcon(f.type)}</span>
            <div>
              <div style="font-size:0.8rem;font-weight:600;color:var(--text-primary)">${f.title}</div>
              <div style="font-size:0.68rem;color:var(--text-muted)">${SAR.formatTime(f.reportedAt)}</div>
            </div>
          </div>
        `).join('') || '<div style="color:var(--text-muted);font-size:0.8rem;padding:8px 0">No findings yet</div>'}
      </div>

      <div style="margin-top:16px;display:flex;flex-direction:column;gap:8px">
        ${!team ? `<button class="btn btn-primary w-full" onclick="App.navigate('teams')">Assign Team</button>` : ''}
        <button class="btn btn-secondary w-full" onclick="updateZoneProgress('${zone.id}')">Update Progress</button>
      </div>
    </div>
  `;
  panel.classList.add('open');
}

/* Zone popup HTML */
function createZonePopup(zone) {
  const team = zone.team ? SAR.getTeam(zone.team) : null;
  const inc  = SAR.getIncident(zone.incident);
  return `
    <div style="font-family:Inter,sans-serif;min-width:185px">
      <div style="font-weight:700;font-size:0.9rem;margin-bottom:8px;color:#f1f5f9">${zone.name}</div>
      <div style="font-size:0.78rem;color:#94a3b8;margin-bottom:3px">Incident: <span style="color:#f1f5f9">${inc ? inc.id : '—'}</span></div>
      <div style="font-size:0.78rem;color:#94a3b8;margin-bottom:3px">Team: <span style="color:#f1f5f9">${team ? team.name : 'Unassigned'}</span></div>
      <div style="font-size:0.78rem;color:#94a3b8;margin-bottom:8px">Progress: <span style="color:#f1f5f9;font-weight:600">${zone.progress}%</span></div>
      <div style="height:4px;background:#1e2d4a;border-radius:2px">
        <div style="height:100%;width:${zone.progress}%;background:#f97316;border-radius:2px"></div>
      </div>
    </div>
  `;
}

/* Quick progress update from panel */
function updateZoneProgress(zoneId) {
  const zone = SAR.getZone(zoneId);
  if (!zone) return;
  Modal.open(`📊 Update Progress — ${zone.name}`, `
    <div class="form-group">
      <label class="form-label">Search Coverage (%)</label>
      <input class="form-control" id="zoneProgressVal" type="range" min="0" max="100" value="${zone.progress}"
        oninput="document.getElementById('zoneProgressDisplay').textContent=this.value+'%'" />
      <div style="text-align:center;font-size:1.4rem;font-weight:800;color:var(--orange);margin-top:8px" id="zoneProgressDisplay">${zone.progress}%</div>
    </div>
    <div class="form-group">
      <label class="form-label">Zone Status</label>
      <select class="form-control" id="zoneStatusVal">
        <option value="pending"     ${zone.status==='pending'?'selected':''}>Pending</option>
        <option value="assigned"    ${zone.status==='assigned'?'selected':''}>Assigned</option>
        <option value="in-progress" ${zone.status==='in-progress'?'selected':''}>In Progress</option>
        <option value="completed"   ${zone.status==='completed'?'selected':''}>Completed</option>
      </select>
    </div>
    <div class="form-actions">
      <button class="btn btn-secondary" onclick="Modal.close()">Cancel</button>
      <button class="btn btn-primary" onclick="submitZoneProgress('${zoneId}')">Save</button>
    </div>
  `);
}

function submitZoneProgress(zoneId) {
  const zone = SAR.getZone(zoneId);
  if (!zone) return;
  zone.progress = parseInt(document.getElementById('zoneProgressVal').value);
  zone.status   = document.getElementById('zoneStatusVal').value;
  Modal.close();
  refreshMapLayers();
  showMapPanel(zone);
  Toast.show('success', 'Zone Updated', `${zone.name} → ${zone.progress}% / ${zone.status}`);
}

/* ═══════════════ TEAM ANIMATION ═══════════════════ */
function startTeamAnimation() {
  stopTeamAnimation();
  teamAnimInterval = setInterval(() => {
    SAR.teams.filter(t => t._marker && t.status === 'deployed').forEach(team => {
      if (!team._mapLat) return;
      // Small random walk — max 0.001° per tick, bounded to prevent drift
      const zone = team.zone ? SAR.getZone(team.zone) : null;
      if (!zone) return;
      const teamNum   = parseInt(team.id.split('-')[1]) || 1;
      const maxOffset = 0.008;
      const offsetLat = (((teamNum * 7) % 11) - 5) * 0.0012;
      const offsetLng = (((teamNum * 13) % 11) - 5) * 0.0012;
      const baseLat   = zone.lat + offsetLat;
      const baseLng   = zone.lng + offsetLng;

      team._mapLat += (Math.random() - 0.5) * 0.0015;
      team._mapLng += (Math.random() - 0.5) * 0.0015;

      // Clamp to zone vicinity
      if (Math.abs(team._mapLat - baseLat) > maxOffset) team._mapLat = baseLat;
      if (Math.abs(team._mapLng - baseLng) > maxOffset) team._mapLng = baseLng;

      team._marker.setLatLng([team._mapLat, team._mapLng]);
    });
  }, 3500);
}

function stopTeamAnimation() {
  if (teamAnimInterval) { clearInterval(teamAnimInterval); teamAnimInterval = null; }
}
