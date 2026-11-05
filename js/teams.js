/* ══════════════════════════════════════════════════════
   SAR COMMAND — TEAMS
══════════════════════════════════════════════════════ */

let teamFilter = 'all';

function renderTeams() {
  const root = document.getElementById('teams-root');
  if (!root) return;

  if (typeof renderFieldMissionConsole === 'function') {
    renderFieldMissionConsole('fieldMissionConsoleTeams');
  }

  let filtered = [...SAR.teams];
  if (teamFilter !== 'all') {
    filtered = filtered.filter(t => t.status === teamFilter);
  }

  // Highlight Field Leader's assigned squad at the top of the list
  const myTeamId = (typeof SAR !== 'undefined' && SAR.currentUser?.assigned_team) || 'T-01';
  const isLeader = typeof SAR !== 'undefined' && SAR.hasRole('FIELD_LEADER');
  const isLogistics = typeof SAR !== 'undefined' && SAR.hasRole('LOGISTICS');
  const myTeam = typeof SAR !== 'undefined' ? SAR.getMyTeam() : null;

  if (isLeader && myTeamId) {
    filtered.sort((a, b) => {
      if (a.id === myTeamId) return -1;
      if (b.id === myTeamId) return 1;
      return 0;
    });
  }

  let headerTitle = 'Team Management';
  let headerSub = `${SAR.teams.length} teams · ${SAR.teams.filter(t=>t.status==='deployed').length} deployed`;
  if (isLeader) {
    headerTitle = 'My Squad & Radio Check-in';
    headerSub = `Field Command: ${myTeam ? myTeam.name : 'Alpha Mountain Rescue'} (${myTeam ? myTeam.id : 'T-01'}) · All other squads are read-only`;
  } else if (isLogistics) {
    headerTitle = 'Squad Equipment Roster';
    headerSub = `Monitoring 8 rescue squads for equipment readiness, gear payloads, and logistics requests`;
  }

  const canCommission = typeof SAR !== 'undefined' && SAR.hasRole('COMMANDER', 'COORDINATOR');
  const actionButton = canCommission ? `
    <button class="btn btn-primary" onclick="openCreateTeamModal()">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
      New Team
    </button>
  ` : `
    <div class="role-clearance-pill">
      Squad Commission Restricted
    </div>
  `;

  root.innerHTML = `
    <div class="page-header">
      <div class="page-header-left">
        <h2>${headerTitle}</h2>
        <p>${headerSub}</p>
      </div>
      ${actionButton}
    </div>

    <div class="filter-bar">
      ${['all','deployed','standby','returning','off-duty'].map(f => `
        <button class="filter-btn ${teamFilter===f?'active':''}" onclick="setTeamFilter('${f}')">${f.charAt(0).toUpperCase()+f.slice(1)}</button>
      `).join('')}
    </div>

    <div class="teams-grid">
      ${filtered.map(team => renderTeamCard(team)).join('')}
      ${filtered.length === 0 ? '<div class="empty-state"><div class="empty-state-icon"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg></div><div class="empty-state-text">No teams match this filter</div></div>' : ''}
    </div>
  `;
}

function renderTeamCard(team) {
  const zone = team.zone ? SAR.getZone(team.zone) : null;
  const zoneProgress = zone ? zone.progress : 0;
  const statusColors = {
    deployed:  '#10b981',
    standby:   '#0284c7',
    returning: '#8b5cf6',
    'off-duty':'#475569',
  };
  const statusColor = statusColors[team.status] || '#6b7280';
  const radioComms = team.contact || `VHF 155.${(team.id.replace(/\D/g,'') || '16')}0 MHz`;

  const myTeamId = (typeof SAR !== 'undefined' && SAR.currentUser?.assigned_team) || 'T-01';
  const isLeader = typeof SAR !== 'undefined' && SAR.hasRole('FIELD_LEADER');
  const isMySquad = isLeader && team.id === myTeamId;
  const canManageAll = typeof SAR !== 'undefined' && SAR.hasRole('COMMANDER', 'COORDINATOR');

  let footerControls = '';
  if (isMySquad) {
    footerControls = `
      <button class="btn btn-sm btn-primary" onclick="sendRadioCheckIn('${team.id}')" title="Broadcast GPS & Heartbeat to HQ">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:middle;margin-right:4px">
          <path d="M4.9 19.1C1 15.2 1 8.8 4.9 4.9"/><path d="M7.8 16.2c-2.3-2.3-2.3-6.1 0-8.5"/><circle cx="12" cy="12" r="2"/><path d="M16.2 7.8c2.3 2.3 2.3 6.1 0 8.5"/><path d="M19.1 4.9C23 8.8 23 15.2 19.1 19.1"/>
        </svg>
        Radio Check-in
      </button>
      <button class="btn btn-sm btn-secondary" onclick="cycleTeamStatus('${team.id}')" title="Cycle Status (${team.status})">
        Status: ${team.status.toUpperCase()} ⟳
      </button>
      <button class="btn btn-sm btn-secondary" onclick="openTeamDetail('${team.id}')">Roster</button>
    `;
  } else if (isLeader) {
    footerControls = `
      <button class="btn btn-sm btn-secondary" style="flex:1" onclick="openTeamDetail('${team.id}')">Roster & Gear</button>
      <span class="read-only-badge" title="Field Leaders can only command their assigned squad">Squad Locked</span>
    `;
  } else if (canManageAll) {
    footerControls = `
      <button class="btn btn-sm btn-secondary" style="flex:1" onclick="openTeamDetail('${team.id}')">Roster & Gear</button>
      <button class="btn btn-sm btn-secondary" style="flex:1" onclick="openAssignZoneModal('${team.id}')">Assign Sector</button>
      <button class="btn-icon" onclick="cycleTeamStatus('${team.id}')" title="Cycle Status (${team.status})">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>
      </button>
    `;
  } else {
    footerControls = `
      <button class="btn btn-sm btn-secondary" style="flex:1" onclick="openTeamDetail('${team.id}')">Gear Roster</button>
      <span class="read-only-badge">Supply View</span>
    `;
  }

  return `
    <div class="team-card ${isMySquad ? 'team-card-my-squad' : ''}">
      ${isMySquad ? `
        <div class="my-squad-banner">
          <span>ASSIGNED SQUAD (${team.name.toUpperCase()})</span>
          <span>CALL: ${SAR.currentUser?.callsign || 'T-01-LEAD'}</span>
        </div>
      ` : ''}
      <div class="team-card-top">
        <div class="team-avatar" style="border: 1px solid var(--border); background: var(--bg-elevated); color: ${team.color}; font-family: 'JetBrains Mono', monospace; font-size: 0.78rem;">
          ${team.id}
        </div>
        <div class="team-info">
          <div class="team-name">${team.name}</div>
          <div class="team-leader" style="font-size:0.75rem;color:var(--text-secondary)">Lead: <strong>${team.leader}</strong></div>
        </div>
        <div style="display:flex;flex-direction:column;align-items:flex-end;gap:4px">
          <span class="badge badge-${team.status}">${team.status}</span>
          <div style="font-size:0.68rem;color:var(--cyan);font-weight:600">${team.specialization}</div>
        </div>
      </div>

      <!-- Tactical Comms & Crew Role Tags -->
      <div style="display:flex;justify-content:space-between;align-items:center;padding:0 16px 8px;font-size:0.72rem;color:var(--text-muted);border-bottom:1px solid rgba(255,255,255,0.03);margin-bottom:8px">
        <span>Comms: <strong style="color:var(--text-secondary);font-family:'JetBrains Mono',monospace">${radioComms}</strong></span>
        <span style="font-family:'JetBrains Mono',monospace;color:var(--accent-light);font-weight:600">CALL: ${team.id}-LEAD</span>
      </div>

      <div style="padding:0 16px 12px">
        <div style="font-size:0.72rem;color:var(--text-muted);margin-bottom:6px">Assigned Sector: <strong style="color:${team.color}">${zone ? zone.name : 'Standby / Unassigned'}</strong></div>
        ${zone ? `
          <div class="progress-track">
            <div class="progress-fill" style="width:${zoneProgress}%;background:${team.color}"></div>
          </div>
          <div style="display:flex;justify-content:space-between;font-size:0.68rem;color:var(--text-muted);margin-top:3px">
            <span>${zoneProgress}% sector swept</span>
            <span style="color:var(--green)">● Active Ops</span>
          </div>
        ` : `
          <div style="font-size:0.68rem;color:var(--text-muted);font-style:italic">Ready for tactical deployment</div>
        `}
      </div>

      <div class="team-card-meta">
        <div class="meta-item">
          <div class="meta-value" style="color:${team.color}">${team.members}</div>
          <div class="meta-label">Crew</div>
        </div>
        <div class="meta-item">
          <div class="meta-value">${team.equipment.length}</div>
          <div class="meta-label">Gear Kits</div>
        </div>
        <div class="meta-item">
          <div class="meta-value">${SAR.findings.filter(f=>f.team===team.id).length}</div>
          <div class="meta-label">Findings</div>
        </div>
      </div>

      <div class="team-card-footer">
        ${footerControls}
      </div>
    </div>
  `;
}

function setTeamFilter(f) {
  teamFilter = f;
  renderTeams();
}

function openCreateTeamModal() {
  const zones = SAR.zones.filter(z=>!z.team).map(z => `<option value="${z.id}">${z.name} (${z.status})</option>`).join('');
  const colors = SAR.teamColors;
  Modal.open('Create New Team', `
    <div class="form-row">
      <div class="form-group">
        <label class="form-label">Team Name *</label>
        <input class="form-control" id="teamName" placeholder="e.g. India Platoon" />
      </div>
      <div class="form-group">
        <label class="form-label">Team ID</label>
        <input class="form-control" id="teamId" value="${SAR.nextId('T', SAR.teams)}" readonly style="opacity:0.6" />
      </div>
    </div>
    <div class="form-row">
      <div class="form-group">
        <label class="form-label">Team Leader *</label>
        <input class="form-control" id="teamLeader" placeholder="e.g. Capt. Arjun Singh" />
      </div>
      <div class="form-group">
        <label class="form-label">Members</label>
        <input class="form-control" id="teamMembers" type="number" min="1" max="30" value="6" />
      </div>
    </div>
    <div class="form-row">
      <div class="form-group">
        <label class="form-label">Specialization</label>
        <select class="form-control" id="teamSpec">
          <option>Mountain Rescue</option>
          <option>Flood Rescue</option>
          <option>Medical Evac</option>
          <option>Aerial Search</option>
          <option>Heavy Rescue</option>
          <option>Paramedic</option>
          <option>Road Rescue</option>
          <option>Avalanche Search</option>
        </select>
      </div>
      <div class="form-group">
        <label class="form-label">Contact</label>
        <input class="form-control" id="teamContact" placeholder="+91-9805-XXXXXX" />
      </div>
    </div>
    <div class="form-group">
      <label class="form-label">Assign to Zone (Optional)</label>
      <select class="form-control" id="teamZone">
        <option value="">-- Not Assigned --</option>
        ${zones}
      </select>
    </div>
    <div class="form-group">
      <label class="form-label">Color Tag</label>
      <div style="display:flex;gap:8px;flex-wrap:wrap">
        ${colors.map((c,i) => `
          <div onclick="selectTeamColor('${c}',this)" style="width:28px;height:28px;border-radius:6px;background:${c};cursor:pointer;border:2px solid transparent;transition:all 0.2s" data-color="${c}" class="color-swatch ${i===0?'selected':''}"></div>
        `).join('')}
      </div>
      <input type="hidden" id="teamColor" value="${colors[0]}" />
    </div>
    <div class="form-actions">
      <button class="btn btn-secondary" onclick="Modal.close()">Cancel</button>
      <button class="btn btn-primary" onclick="submitCreateTeam()">Create Team</button>
    </div>
  `);
}

function selectTeamColor(color, el) {
  document.querySelectorAll('.color-swatch').forEach(s => s.style.borderColor = 'transparent');
  el.style.borderColor = 'white';
  document.getElementById('teamColor').value = color;
}

async function submitCreateTeam() {
  const name   = document.getElementById('teamName').value.trim();
  const leader = document.getElementById('teamLeader').value.trim();
  const members= parseInt(document.getElementById('teamMembers').value) || 6;
  const spec   = document.getElementById('teamSpec').value;
  const contact= document.getElementById('teamContact').value.trim();
  const zone   = document.getElementById('teamZone').value || null;
  const color  = document.getElementById('teamColor').value;

  if (!name || !leader) {
    Toast.show('error', 'Validation Error', 'Team Name and Leader are required.');
    return;
  }

  const teamPayload = {
    team_id: SAR.nextId('T', SAR.teams),
    name, leader, members,
    status: zone ? 'deployed' : 'standby',
    zone, color,
    specialization: spec,
    contact,
    equipment: ['VHF Radio', 'Trauma Pack', 'Tactical GPS'],
  };

  try {
    if (typeof ensureAuthToken === 'function') await ensureAuthToken();
    const headers = typeof getAuthHeaders === 'function' ? getAuthHeaders() : { 'Content-Type': 'application/json' };
    const res = await fetch(`${API_BASE_URL}/teams/`, {
      method: 'POST',
      headers,
      body: JSON.stringify(teamPayload),
    });
    if (res.ok) {
      const data = await res.json();
      if (data.team) {
        teamPayload.id = data.team.id;
        teamPayload._dbId = data.team._dbId;
      }
    }
  } catch (e) {
    console.warn('Backend offline, team registered in local session:', e.message);
  }

  const team = {
    id: teamPayload.team_id || teamPayload.id,
    ...teamPayload,
  };

  SAR.teams.push(team);
  if (zone) {
    const z = SAR.getZone(zone);
    if (z) z.team = team.id;
  }
  SAR.activityLog.unshift({ type:'info', text:`<strong>${team.name}</strong> commissioned to operational roster`, time:'just now', color:'#0EA5E9' });

  Modal.close();
  renderTeams();
  Toast.show('success', 'Squad Commissioned', `${team.name} (${team.id}) registered.`);
}

function openTeamDetail(id) {
  const team = SAR.getTeam(id);
  if (!team) return;
  const zone = team.zone ? SAR.getZone(team.zone) : null;
  const tFindings = SAR.findings.filter(f => f.team === id);
  const radioComms = team.contact || `VHF 155.${(team.id.replace(/\D/g,'') || '16')}0 MHz`;

  Modal.open(`${team.name}`, `
    <div class="detail-row"><span class="detail-key">Team ID</span><span class="detail-val font-mono" style="color:${team.color}">${team.id}</span></div>
    <div class="detail-row"><span class="detail-key">Squad Commander</span><span class="detail-val">${team.leader}</span></div>
    <div class="detail-row"><span class="detail-key">Total Crew</span><span class="detail-val">${team.members} Personnel</span></div>
    <div class="detail-row"><span class="detail-key">Specialization</span><span class="detail-val"><span class="badge" style="background:${team.color}22;color:${team.color};border:1px solid ${team.color}44">${team.specialization}</span></span></div>
    <div class="detail-row"><span class="detail-key">Tactical Status</span><span class="detail-val"><span class="badge badge-${team.status}">${team.status}</span></span></div>
    <div class="detail-row"><span class="detail-key">Assigned Sector</span><span class="detail-val">${zone ? zone.name : '<span style="color:var(--text-muted)">Standby / Unassigned</span>'}</span></div>
    <div class="detail-row"><span class="detail-key">Radio Comms</span><span class="detail-val font-mono" style="color:var(--cyan)">${radioComms} (CALL: ${team.id}-LEAD)</span></div>

    <!-- Crew Roster Breakdown -->
    <div style="margin-top:16px">
      <div class="modal-section-title">Crew Roster Breakdown</div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">
        <div style="background:var(--bg-base);border:1px solid var(--border);border-radius:6px;padding:8px 10px">
          <div style="font-size:0.65rem;color:var(--text-muted);text-transform:uppercase">Commander</div>
          <div style="font-size:0.8rem;font-weight:700;color:var(--text-primary);margin-top:2px">${team.leader}</div>
        </div>
        <div style="background:var(--bg-base);border:1px solid var(--border);border-radius:6px;padding:8px 10px">
          <div style="font-size:0.65rem;color:var(--text-muted);text-transform:uppercase">Medical Lead</div>
          <div style="font-size:0.8rem;font-weight:700;color:var(--green);margin-top:2px">Paramedic Level-2</div>
        </div>
        <div style="background:var(--bg-base);border:1px solid var(--border);border-radius:6px;padding:8px 10px">
          <div style="font-size:0.65rem;color:var(--text-muted);text-transform:uppercase">Scout / Navigation</div>
          <div style="font-size:0.8rem;font-weight:700;color:var(--cyan);margin-top:2px">GPS Route Specialist</div>
        </div>
        <div style="background:var(--bg-base);border:1px solid var(--border);border-radius:6px;padding:8px 10px">
          <div style="font-size:0.65rem;color:var(--text-muted);text-transform:uppercase">Field Operators</div>
          <div style="font-size:0.8rem;font-weight:700;color:var(--text-secondary);margin-top:2px">${Math.max(1, team.members - 3)} Certified Techs</div>
        </div>
      </div>
    </div>

    <!-- Mission Equipment -->
    <div style="margin-top:16px">
      <div class="modal-section-title">Mission Equipment (${team.equipment.length})</div>
      <div style="display:flex;flex-wrap:wrap;gap:6px">
        ${team.equipment.length ? team.equipment.map(e => `
          <span style="background:var(--bg-elevated);border:1px solid var(--border);border-radius:6px;padding:4px 10px;font-size:0.75rem;color:var(--text-secondary)">${e}</span>
        `).join('') : '<span style="color:var(--text-muted);font-size:0.82rem">Standard mountain search kit</span>'}
      </div>
    </div>

    <!-- Recent Findings -->
    <div style="margin-top:16px">
      <div class="modal-section-title">Recent Sector Findings (${tFindings.length})</div>
      ${tFindings.length === 0 ? '<div style="color:var(--text-muted);font-size:0.82rem">No field findings recorded yet.</div>' : ''}
      ${tFindings.map(f=>`
        <div style="padding:8px 0;border-bottom:1px solid var(--border);display:flex;gap:8px">
          <span style="font-size:1rem">${SAR.findingIcon(f.type)}</span>
          <div>
            <div style="font-size:0.85rem;font-weight:600;color:var(--text-primary)">${f.title}</div>
            <div style="font-size:0.72rem;color:var(--text-muted)">${SAR.formatTime(f.reportedAt)} · ${f.location}</div>
          </div>
        </div>
      `).join('')}
    </div>

    <div class="form-actions" style="margin-top:20px">
      <button class="btn btn-secondary" onclick="Modal.close()">Close</button>
      <button class="btn btn-secondary" onclick="logSafetyCheckIn('${team.id}')" title="Record radio check-in">Radio Check-in</button>
      <button class="btn btn-primary" onclick="Modal.close();openAssignZoneModal('${id}')">Assign Sector</button>
    </div>
  `, 'lg');
}

function logSafetyCheckIn(teamId) {
  const team = SAR.getTeam(teamId);
  if (!team) return;

  const now = new Date();
  const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  SAR.activityLog.unshift({
    type: 'success',
    text: `Radio Check-in confirmed with <strong>${team.name}</strong> (${team.id}). All personnel nominal.`,
    time: timeStr,
    color: '#10B981'
  });

  Toast.show('success', 'Radio Check-in Received', `Squad ${team.id} reported nominal status over VHF.`);
  Modal.close();

  if (typeof renderDashboard === 'function' && App.currentPage === 'dashboard') {
    renderDashboard();
  }
}

function openAssignZoneModal(teamId) {
  const team  = SAR.getTeam(teamId);
  const zones = SAR.zones;
  Modal.open(`Assign Zone — ${team.name}`, `
    <div class="form-group">
      <label class="form-label">Select Search Zone</label>
      <select class="form-control" id="assignZoneSelect">
        <option value="">-- Unassign --</option>
        ${zones.map(z=>`<option value="${z.id}" ${z.id===team.zone?'selected':''}>${z.name} (${z.status}) — ${z.team && z.team!==teamId ? 'Occupied by '+z.team : 'Available'}</option>`).join('')}
      </select>
    </div>
    <div class="form-actions">
      <button class="btn btn-secondary" onclick="Modal.close()">Cancel</button>
      <button class="btn btn-primary" onclick="submitAssignZone('${teamId}')">Confirm Assignment</button>
    </div>
  `);
}

function submitAssignZone(teamId) {
  const team    = SAR.getTeam(teamId);
  const newZone = document.getElementById('assignZoneSelect').value;

  // Unassign old zone
  if (team.zone) {
    const oldZ = SAR.getZone(team.zone);
    if (oldZ) { oldZ.team = null; oldZ.status = 'pending'; }
  }
  // Assign new zone
  if (newZone) {
    const z = SAR.getZone(newZone);
    if (z) { z.team = teamId; z.status = 'assigned'; }
    team.zone   = newZone;
    team.status = 'deployed';
  } else {
    team.zone   = null;
    team.status = 'standby';
  }

  Modal.close();
  renderTeams();
  Toast.show('success', 'Zone Assigned', newZone ? `${team.name} → ${newZone}` : `${team.name} unassigned`);
}

async function cycleTeamStatus(id) {
  const team = SAR.getTeam(id);
  if (!team) return;
  const flow = ['standby', 'deployed', 'returning', 'off-duty'];
  const cur  = flow.indexOf(team.status);
  const newStatus = flow[(cur + 1) % flow.length];

  try {
    const targetId = team._dbId || id;
    const res = await fetch(`${API_BASE_URL}/teams/${targetId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus }),
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || 'Failed to update squad status');
    }

    team.status = newStatus;
    renderTeams();
    if (typeof updateBadges === 'function') updateBadges();
    Toast.show('info', 'Status Changed', `${team.name} → ${newStatus.toUpperCase()}`);
  } catch (err) {
    Toast.show('error', 'Status Update Failed', err.message);
  }
}

async function sendRadioCheckIn(teamId) {
  const team = SAR.getTeam(teamId);
  if (!team) return;

  try {
    const targetId = team._dbId || team.id;
    const res = await fetch(`${API_BASE_URL}/teams/${targetId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: team.status }),
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || 'Radio telemetry transmission failed');
    }

    SAR.activityLog.unshift({
      id: 'act-radio-' + Date.now(),
      type: 'success',
      text: `<strong>Radio Ping</strong>: Squad ${team.id} (${team.name}) VHF 155.16 MHz verified at Base Receiver`,
      time: 'just now',
      color: '#10b981',
    });

    Toast.show('success', 'Radio Check-in Confirmed', `Squad ${team.id} VHF signal 5/5. Tactical command acknowledged.`);
    renderTeams();
  } catch (err) {
    Toast.show('error', 'Radio Ping Failed', err.message);
  }
}
