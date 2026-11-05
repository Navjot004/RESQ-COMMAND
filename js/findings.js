/* ══════════════════════════════════════════════════════
   SAR COMMAND — FINDINGS
══════════════════════════════════════════════════════ */

let findingFilter = 'all';

function renderFindings() {
  const root = document.getElementById('findings-root');
  if (!root) return;

  let filtered = SAR.findings;
  if (findingFilter !== 'all') {
    filtered = SAR.findings.filter(f =>
      f.type === findingFilter || f.status === findingFilter
    );
  }

  const personCount = SAR.findings.filter(f=>f.type==='person-found').length;
  const clueCount   = SAR.findings.filter(f=>f.type==='clue').length;
  const hazardCount = SAR.findings.filter(f=>f.type==='hazard').length;
  const evidCount   = SAR.findings.filter(f=>f.type==='evidence').length;

  root.innerHTML = `
    <div class="page-header">
      <div class="page-header-left">
        <h2>Findings & Reports</h2>
        <p>${SAR.findings.length} total findings logged</p>
      </div>
      <div style="display:flex;gap:10px">
        <button class="btn btn-secondary" onclick="exportReport()">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
          Export Report
        </button>
        <button class="btn btn-primary" onclick="openLogFindingModal()">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Log Finding
        </button>
      </div>
    </div>

    <!-- Summary -->
    <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:14px;padding:0 24px 20px">
      ${findingStatCard('🧍','Persons Found', personCount, '#10b981')}
      ${findingStatCard('🔍','Clues',         clueCount,   '#3b82f6')}
      ${findingStatCard('⚠️','Hazards',       hazardCount, '#ef4444')}
      ${findingStatCard('🪝','Evidence',      evidCount,   '#8b5cf6')}
    </div>

    <div class="filter-bar">
      ${['all','person-found','clue','hazard','evidence'].map(f => `
        <button class="filter-btn ${findingFilter===f?'active':''}" onclick="setFindingFilter('${f}')">${f==='person-found'?'Person Found':f.charAt(0).toUpperCase()+f.slice(1)}</button>
      `).join('')}
    </div>

    <div class="page-content">
      <div class="card">
        <div class="card-body" style="padding:0">
          <div class="table-container">
            <table class="data-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Type</th>
                  <th>Title</th>
                  <th>Zone</th>
                  <th>Team</th>
                  <th>Location</th>
                  <th>Status</th>
                  <th>Reported</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                ${filtered.length === 0 ? `<tr><td colspan="9" class="text-center text-muted" style="padding:30px">No findings logged</td></tr>` : ''}
                ${filtered.map(f => {
                  const team = f.team ? SAR.getTeam(f.team) : null;
                  const statusColors = {
                    'recovered':    '#10b981',
                    'evacuated':    '#10b981',
                    'logged':       '#3b82f6',
                    'awaiting-evac':'#f59e0b',
                  };
                  const sc = statusColors[f.status] || '#6b7280';
                  return `
                    <tr>
                      <td class="td-mono" style="color:var(--green)">${f.id}</td>
                      <td><span style="font-size:1.1rem">${SAR.findingIcon(f.type)}</span></td>
                      <td>
                        <div class="td-name">${f.title}</div>
                        <div style="font-size:0.72rem;color:var(--text-muted);margin-top:2px;max-width:200px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${f.description.substring(0,60)}…</div>
                      </td>
                      <td><span class="font-mono" style="color:var(--blue)">${f.zone}</span></td>
                      <td>${team ? `<span style="color:${team.color}">${team.name}</span>` : '<span class="text-muted">—</span>'}</td>
                      <td style="color:var(--text-muted);font-size:0.78rem">${f.location}</td>
                      <td><span style="background:${sc}22;color:${sc};border:1px solid ${sc}44;border-radius:20px;padding:2px 8px;font-size:0.7rem;font-weight:700">${f.status}</span></td>
                      <td class="font-mono" style="font-size:0.72rem;color:var(--text-muted)">${SAR.formatTime(f.reportedAt)}</td>
                      <td>
                        <button class="btn btn-sm btn-secondary" onclick="openFindingDetail('${f.id}')">Detail</button>
                      </td>
                    </tr>
                  `;
                }).join('')}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  `;
}

function findingStatCard(icon, label, value, color) {
  return `
    <div style="background:var(--bg-card);border:1px solid var(--border);border-radius:10px;padding:16px;text-align:center">
      <div style="font-size:1.8rem;margin-bottom:6px">${icon}</div>
      <div style="font-size:1.6rem;font-weight:800;color:${color}">${value}</div>
      <div style="font-size:0.72rem;color:var(--text-muted);margin-top:2px">${label}</div>
    </div>
  `;
}

function setFindingFilter(f) {
  findingFilter = f;
  renderFindings();
}

function openLogFindingModal() {
  const teams = SAR.teams.map(t=>`<option value="${t.id}">${t.name}</option>`).join('');
  const zones = SAR.zones.map(z=>`<option value="${z.id}">${z.name}</option>`).join('');
  const incidents = SAR.incidents.map(i=>`<option value="${i.id}">${i.id} — ${i.title.substring(0,30)}</option>`).join('');

  Modal.open('🔍 Log New Finding', `
    <div class="form-row">
      <div class="form-group">
        <label class="form-label">Finding ID</label>
        <input class="form-control" value="${SAR.nextId('FND',SAR.findings)}" readonly style="opacity:0.6" />
      </div>
      <div class="form-group">
        <label class="form-label">Type *</label>
        <select class="form-control" id="fndType">
          <option value="person-found">🧍 Person Found</option>
          <option value="clue">🔍 Clue</option>
          <option value="evidence">🪝 Evidence</option>
          <option value="hazard">⚠️ Hazard</option>
        </select>
      </div>
    </div>
    <div class="form-group">
      <label class="form-label">Title *</label>
      <input class="form-control" id="fndTitle" placeholder="e.g. Survivor Located at Grid B-4" />
    </div>
    <div class="form-row">
      <div class="form-group">
        <label class="form-label">Zone *</label>
        <select class="form-control" id="fndZone">${zones}</select>
      </div>
      <div class="form-group">
        <label class="form-label">Reporting Team *</label>
        <select class="form-control" id="fndTeam">${teams}</select>
      </div>
    </div>
    <div class="form-group">
      <label class="form-label">Associated Incident</label>
      <select class="form-control" id="fndIncident">${incidents}</select>
    </div>
    <div class="form-group">
      <label class="form-label">Location Description *</label>
      <input class="form-control" id="fndLocation" placeholder="e.g. Near waterfall, Zone Alpha Grid C-3" />
    </div>
    <div class="form-row">
      <div class="form-group">
        <label class="form-label">Latitude</label>
        <input class="form-control" id="fndLat" type="number" step="0.0001" placeholder="32.xxxx" />
      </div>
      <div class="form-group">
        <label class="form-label">Longitude</label>
        <input class="form-control" id="fndLng" type="number" step="0.0001" placeholder="77.xxxx" />
      </div>
    </div>
    <div class="form-group">
      <label class="form-label">Description *</label>
      <textarea class="form-control" id="fndDesc" placeholder="Detailed description of the finding, condition, observations…"></textarea>
    </div>
    <div class="form-actions">
      <button class="btn btn-secondary" onclick="Modal.close()">Cancel</button>
      <button class="btn btn-primary" onclick="submitLogFinding()">Log Finding</button>
    </div>
  `);
}

async function submitLogFinding() {
  const title    = document.getElementById('fndTitle').value.trim();
  const type     = document.getElementById('fndType').value;
  const zone     = document.getElementById('fndZone').value;
  const team     = document.getElementById('fndTeam').value;
  const incident = document.getElementById('fndIncident').value;
  const location = document.getElementById('fndLocation').value.trim();
  const desc     = document.getElementById('fndDesc').value.trim();
  const lat      = parseFloat(document.getElementById('fndLat').value) || 32.15;
  const lng      = parseFloat(document.getElementById('fndLng').value) || 77.40;

  if (!title || !location || !desc) {
    Toast.show('error','Validation Error','Title, Location, and Description are required.');
    return;
  }

  const findingPayload = {
    finding_id: SAR.nextId('FND', SAR.findings),
    type, title, zone, team, incident, location, lat, lng,
    description: desc,
    status: 'logged',
    reportedAt: new Date(),
  };

  try {
    const res = await fetch(`${API_BASE_URL}/findings/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(findingPayload),
    });
    if (res.ok) {
      const data = await res.json();
      if (data.finding) {
        findingPayload.id = data.finding.id;
        findingPayload._dbId = data.finding._dbId;
      }
    }
  } catch (e) {
    console.warn('Backend offline, finding recorded in local session:', e.message);
  }

  const finding = {
    id: findingPayload.finding_id || findingPayload.id,
    ...findingPayload,
  };

  SAR.findings.push(finding);

  // Increment finding count on incident
  const inc = SAR.getIncident(incident);
  if (inc) inc.findings++;

  const icon = SAR.findingIcon(type);
  SAR.activityLog.unshift({ type:'success', text:`${icon} <strong>${finding.id}</strong> "${title}" recorded by ${SAR.getTeam(team)?.name||team}`, time:'just now', color:'#10B981' });

  Modal.close();
  renderFindings();
  Toast.show('success', 'Finding Recorded', `${finding.id} saved to operational intelligence.`);
}

function openFindingDetail(id) {
  const f = SAR.findings.find(x=>x.id===id);
  if (!f) return;
  const team = f.team ? SAR.getTeam(f.team) : null;
  Modal.open(`${SAR.findingIcon(f.type)} ${f.title}`, `
    <div class="detail-row"><span class="detail-key">Finding ID</span><span class="detail-val font-mono">${f.id}</span></div>
    <div class="detail-row"><span class="detail-key">Type</span><span class="detail-val">${SAR.findingIcon(f.type)} ${f.type}</span></div>
    <div class="detail-row"><span class="detail-key">Zone</span><span class="detail-val font-mono">${f.zone}</span></div>
    <div class="detail-row"><span class="detail-key">Team</span><span class="detail-val">${team ? team.name : '—'}</span></div>
    <div class="detail-row"><span class="detail-key">Incident</span><span class="detail-val font-mono">${f.incident}</span></div>
    <div class="detail-row"><span class="detail-key">Location</span><span class="detail-val">${f.location}</span></div>
    <div class="detail-row"><span class="detail-key">Status</span><span class="detail-val">${f.status}</span></div>
    <div class="detail-row"><span class="detail-key">Reported</span><span class="detail-val font-mono">${SAR.formatDateTime(f.reportedAt)}</span></div>
    <div class="detail-row"><span class="detail-key">GPS</span><span class="detail-val font-mono">${f.lat.toFixed(4)}°N, ${f.lng.toFixed(4)}°E</span></div>
    <div style="margin-top:16px">
      <div class="modal-section-title">Description</div>
      <p style="color:var(--text-secondary);font-size:0.85rem;line-height:1.7">${f.description}</p>
    </div>
    <div class="form-actions">
      <button class="btn btn-secondary" onclick="Modal.close()">Close</button>
      <button class="btn btn-primary" onclick="Modal.close();App.navigate('map')">View on Map</button>
    </div>
  `);
}

function exportReport() {
  const now  = new Date();
  const lines = [
    `SAR COMMAND — OPERATION REPORT`,
    `Generated: ${SAR.formatDateTime(now)}`,
    `${'='.repeat(60)}`,
    ``,
    `INCIDENT SUMMARY`,
    `${'─'.repeat(40)}`,
    ...SAR.incidents.map(i =>
      `[${i.id}] ${i.title}\n  Priority: ${i.priority.toUpperCase()} | Status: ${i.status}\n  Location: ${i.location}\n  Teams: ${i.teams.join(', ')||'None'} | Findings: ${i.findings}\n  Reported: ${SAR.formatDateTime(i.createdAt)}`
    ),
    ``,
    `TEAM STATUS`,
    `${'─'.repeat(40)}`,
    ...SAR.teams.map(t =>
      `[${t.id}] ${t.name} — ${t.leader} | ${t.members} members | ${t.status.toUpperCase()} | Zone: ${t.zone||'—'}`
    ),
    ``,
    `FINDINGS LOG (${SAR.findings.length} total)`,
    `${'─'.repeat(40)}`,
    ...SAR.findings.map(f =>
      `[${f.id}] ${SAR.findingIcon(f.type)} ${f.title}\n  Zone: ${f.zone} | Team: ${f.team||'—'} | Status: ${f.status}\n  ${f.description}`
    ),
    ``,
    `RESOURCE REQUESTS`,
    `${'─'.repeat(40)}`,
    ...SAR.resources.map(r =>
      `[${r.id}] ${r.item} × ${r.qty} ${r.unit} | Priority: ${r.priority} | Status: ${r.status}\n  Team: ${r.team} | Notes: ${r.notes||'—'}`
    ),
    ``,
    `${'='.repeat(60)}`,
    `END OF REPORT`,
  ];

  const text = lines.join('\n');
  const blob = new Blob([text], { type: 'text/plain' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = `SAR-Report-${now.toISOString().slice(0,10)}.txt`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  Toast.show('success', 'Report Exported', 'SAR operation report downloaded.');
}
