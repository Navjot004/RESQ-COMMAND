/* ══════════════════════════════════════════════════════
   SAR COMMAND — DATA STORE
   Real-Time Search & Rescue Operational Data & API Layer
══════════════════════════════════════════════════════ */
const API_BASE_URL = 'http://127.0.0.1:8000/api';

let isApiOnline = false;

// ── API DATA SYNC FUNCTIONS ───────────────────────────

async function fetchIncidents() {
  try {
    const res = await fetch(`${API_BASE_URL}/incidents/`, { signal: AbortSignal.timeout(3000) });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    if (Array.isArray(data) && data.length > 0) {
      SAR.incidents = data.map((inc) => ({
        id: inc.id,
        _dbId: inc._dbId || inc.id,
        title: inc.title,
        location: inc.location,
        lat: inc.latitude,
        lng: inc.longitude,
        priority: (inc.priority || 'medium').toLowerCase(),
        status: inc.status === 'IN_PROGRESS' ? 'contained' : (inc.status || 'active').toLowerCase(),
        description: inc.description || '',
        reportedBy: inc.reported_by || 'Operations HQ',
        createdAt: new Date(inc.created_at || Date.now()),
        updatedAt: new Date(inc.updated_at || inc.created_at || Date.now()),
        teams: inc.teams || [],
        zones: inc.zones || [],
        findings: inc.findings || 0,
      }));
      return true;
    }
    return false;
  } catch (err) {
    console.warn('API /incidents unreachable, using baseline operations data:', err.message);
    return false;
  }
}

async function fetchTeams() {
  try {
    const res = await fetch(`${API_BASE_URL}/teams/`, { signal: AbortSignal.timeout(3000) });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    if (Array.isArray(data) && data.length > 0) {
      SAR.teams = data.map((t) => ({
        id: t.id,
        _dbId: t._dbId || t.id,
        name: t.name,
        leader: t.leader,
        members: t.members,
        status: t.status,
        zone: t.zone,
        color: t.color || '#0284C7',
        specialization: t.specialization,
        contact: t.contact,
        equipment: t.equipment || [],
        lat: t.lat,
        lng: t.lng,
      }));
      return true;
    }
    return false;
  } catch (err) {
    console.warn('API /teams unreachable, using baseline team roster:', err.message);
    return false;
  }
}

async function fetchZones() {
  try {
    const res = await fetch(`${API_BASE_URL}/zones/`, { signal: AbortSignal.timeout(3000) });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    if (Array.isArray(data) && data.length > 0) {
      SAR.zones = data.map((z) => ({
        id: z.id,
        _dbId: z._dbId || z.id,
        name: z.name,
        incident: z.incident,
        team: z.team,
        status: z.status,
        progress: z.progress || 0,
        lat: z.lat,
        lng: z.lng,
        coords: z.coords || [],
      }));
      return true;
    }
    return false;
  } catch (err) {
    console.warn('API /zones unreachable, using baseline search sectors:', err.message);
    return false;
  }
}

async function fetchResources() {
  try {
    const res = await fetch(`${API_BASE_URL}/resources/`, { signal: AbortSignal.timeout(3000) });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    if (Array.isArray(data) && data.length > 0) {
      SAR.resources = data.map((r) => ({
        id: r.id,
        _dbId: r._dbId || r.id,
        item: r.item,
        category: r.category,
        qty: r.qty,
        unit: r.unit,
        team: r.team,
        incident: r.incident,
        priority: (r.priority || 'medium').toLowerCase(),
        status: r.status,
        requestedAt: new Date(r.requestedAt || Date.now()),
        notes: r.notes || '',
      }));
      return true;
    }
    return false;
  } catch (err) {
    console.warn('API /resources unreachable, using baseline logistics:', err.message);
    return false;
  }
}

async function fetchFindings() {
  try {
    const res = await fetch(`${API_BASE_URL}/findings/`, { signal: AbortSignal.timeout(3000) });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    if (Array.isArray(data) && data.length > 0) {
      SAR.findings = data.map((f) => ({
        id: f.id,
        _dbId: f._dbId || f.id,
        type: f.type,
        title: f.title,
        location: f.location,
        zone: f.zone,
        team: f.team,
        incident: f.incident,
        lat: f.lat,
        lng: f.lng,
        description: f.description || '',
        status: f.status,
        reportedAt: new Date(f.reportedAt || Date.now()),
      }));
      return true;
    }
    return false;
  } catch (err) {
    console.warn('API /findings unreachable, using baseline field reports:', err.message);
    return false;
  }
}

async function fetchAllSARData() {
  const [incOk, teamsOk, zonesOk, resOk, fndOk] = await Promise.all([
    fetchIncidents(),
    fetchTeams(),
    fetchZones(),
    fetchResources(),
    fetchFindings(),
  ]);

  isApiOnline = incOk || teamsOk || zonesOk || resOk || fndOk;
  return isApiOnline;
}

// ── REAL-WORLD OPERATIONAL BASELINE (HIMALAYAN SAR CORRIDOR) ────────
const SAR = {
  // ── INCIDENTS ──────────────────────────────────────
  incidents: [
    {
      id: 'INC-001',
      title: 'Trekker Party Stranded — Rohtang Pass Ridge',
      location: 'Rohtang Pass, Altitude 3,978m',
      lat: 32.3720,
      lng: 77.2410,
      priority: 'critical',
      status: 'active',
      description: 'Group of 3 mountaineers trapped under rapid blizzard accumulation and avalanche warning. Last transponder beacon logged near Gulaba Ridge.',
      reportedBy: 'HP State Disaster Management Authority',
      createdAt: new Date(Date.now() - 3600000 * 5),
      updatedAt: new Date(Date.now() - 1800000),
      teams: ['T-01', 'T-02'],
      zones: ['Z-01', 'Z-02', 'Z-03'],
      findings: 2,
    },
    {
      id: 'INC-002',
      title: 'Flash Flood Inundation — Spiti River Sector 4',
      location: 'Spiti River Basin, Kaza',
      lat: 32.2432,
      lng: 78.0350,
      priority: 'high',
      status: 'active',
      description: 'High-altitude cloudburst triggered sudden river surges affecting 4 settlement perimeters. Search and swiftwater evacuation in progress.',
      reportedBy: 'District Emergency Operations Center',
      createdAt: new Date(Date.now() - 3600000 * 12),
      updatedAt: new Date(Date.now() - 900000),
      teams: ['T-03', 'T-04'],
      zones: ['Z-04', 'Z-05'],
      findings: 5,
    },
    {
      id: 'INC-003',
      title: 'Debris Flow & Landslide — NH-3 Mountain Corridor Km 112',
      location: 'National Highway 3, Manali-Leh Route',
      lat: 32.5780,
      lng: 77.5320,
      priority: 'high',
      status: 'contained',
      description: 'Massive rockfall severed transportation arterial. 2 civil utility vehicles partially buried. Heavy machinery working with road rescue squads.',
      reportedBy: 'Border Roads Organization (BRO)',
      createdAt: new Date(Date.now() - 3600000 * 20),
      updatedAt: new Date(Date.now() - 3600000 * 2),
      teams: ['T-05'],
      zones: ['Z-06'],
      findings: 7,
    },
    {
      id: 'INC-004',
      title: 'Medical Evacuation — Beas Kund Alpine Trail',
      location: 'Beas Kund Glacial Basin, Solang',
      lat: 32.3150,
      lng: 77.1780,
      priority: 'medium',
      status: 'active',
      description: 'Solo trekker sustained compound lower limb fracture with hypothermia onset at 3,600m. Ground medics deployed awaiting rotor clearance.',
      reportedBy: 'Atal Bihari Institute of Mountaineering',
      createdAt: new Date(Date.now() - 3600000 * 2),
      updatedAt: new Date(Date.now() - 600000),
      teams: ['T-06'],
      zones: ['Z-07'],
      findings: 1,
    },
    {
      id: 'INC-005',
      title: 'Capsized Raft Investigation — Parvati Gorge Rapids',
      location: 'Kasol Rapid Bend, Parvati Valley',
      lat: 32.0095,
      lng: 77.3139,
      priority: 'critical',
      status: 'active',
      description: 'Commercial expedition raft overturned in Class IV rapids. 4 persons unaccounted for downstream. Drone thermography scanning shoreline.',
      reportedBy: 'Kullu District Police Control',
      createdAt: new Date(Date.now() - 3600000 * 1.5),
      updatedAt: new Date(Date.now() - 300000),
      teams: ['T-01', 'T-03'],
      zones: ['Z-08', 'Z-09'],
      findings: 1,
    },
  ],

  // ── TEAMS (TACTICAL MILITARY & DEFENSE SQUADS) ───────
  teams: [
    {
      id: 'T-01',
      name: 'Alpha Response Squad',
      leader: 'Capt. Rajesh Negi',
      members: 8,
      status: 'deployed',
      zone: 'Z-01',
      color: '#E11D48',
      specialization: 'High-Altitude Rescue',
      contact: '+91-9805-001001',
      equipment: ['Static Ropes', 'Technical Harnesses', 'VHF Radios', 'Hypothermia Kits'],
      lat: 32.3750,
      lng: 77.2450,
    },
    {
      id: 'T-02',
      name: 'Bravo Recon Unit',
      leader: 'Lt. Priya Sharma',
      members: 6,
      status: 'deployed',
      zone: 'Z-02',
      color: '#2563EB',
      specialization: 'Avalanche Search & Probe',
      contact: '+91-9805-001002',
      equipment: ['Avalanche Beacons', 'Carbon Probes', 'Snow Shovels', 'GPS Transceivers'],
      lat: 32.3650,
      lng: 77.2350,
    },
    {
      id: 'T-03',
      name: 'Charlie Tactical Force',
      leader: 'Sub. Mohan Thakur',
      members: 10,
      status: 'deployed',
      zone: 'Z-04',
      color: '#0D9488',
      specialization: 'Swiftwater & Flood Ops',
      contact: '+91-9805-001003',
      equipment: ['Zodiac Rigid Hull Boat', 'Class V PFDs', 'Throw Bags', 'Dry Suits'],
      lat: 32.2510,
      lng: 78.0410,
    },
    {
      id: 'T-04',
      name: 'Delta Air/Medevac Wing',
      leader: 'Maj. Suresh Kumar',
      members: 5,
      status: 'standby',
      zone: null,
      color: '#D97706',
      specialization: 'Flight Trauma & Triage',
      contact: '+91-9805-001004',
      equipment: ['Trauma Ventilator', 'Vacuum Stretchers', 'Defibrillator', 'Winch System'],
      lat: 32.2400,
      lng: 78.0300,
    },
    {
      id: 'T-05',
      name: 'Echo Heavy Rescue',
      leader: 'Cpl. Anita Rawat',
      members: 7,
      status: 'deployed',
      zone: 'Z-06',
      color: '#0284C7',
      specialization: 'Collapse & Road Rescue',
      contact: '+91-9805-001005',
      equipment: ['Hydraulic Cutters', 'Pneumatic Winches', 'Chain Saws', 'Flood Lights'],
      lat: 32.5780,
      lng: 77.5320,
    },
    {
      id: 'T-06',
      name: 'Foxtrot Medical Unit',
      leader: 'Dr. Kavita Singh',
      members: 4,
      status: 'deployed',
      zone: 'Z-07',
      color: '#059669',
      specialization: 'Field Trauma Medicine',
      contact: '+91-9805-001006',
      equipment: ['Surgical Trauma Kit', 'Splints', 'Oxygen Generators', 'Blood Warmers'],
      lat: 32.3160,
      lng: 77.1800,
    },
    {
      id: 'T-07',
      name: 'Golf Drone Recon',
      leader: 'Lt. Vikas Thapa',
      members: 6,
      status: 'returning',
      zone: null,
      color: '#0891B2',
      specialization: 'Thermal UAV Operations',
      contact: '+91-9805-001007',
      equipment: ['DJI Matrice 300 RTK', 'FLIR Thermal Sensor', 'SatCom Uplink'],
      lat: 32.1800,
      lng: 77.3000,
    },
    {
      id: 'T-08',
      name: 'Hotel Tactical Reserve',
      leader: 'Cdr. Deepak Rana',
      members: 12,
      status: 'standby',
      zone: null,
      color: '#64748B',
      specialization: 'Strategic Reserve / Logistics',
      contact: '+91-9805-001008',
      equipment: ['Mobile GenSets', 'Emergency Bivouacs', 'High-Output Water Pumps'],
      lat: 32.2200,
      lng: 77.2000,
    },
  ],

  // ── ZONES (SEARCH SECTORS) ──────────────────────────
  zones: [
    {
      id: 'Z-01',
      name: 'Sector Alpha-1 (Rohtang Ridge)',
      incident: 'INC-001',
      team: 'T-01',
      status: 'in-progress',
      progress: 72,
      lat: 32.3820,
      lng: 77.2510,
      coords: [[32.372,77.241],[32.392,77.241],[32.392,77.261],[32.372,77.261]],
    },
    {
      id: 'Z-02',
      name: 'Sector Bravo-2 (Gulaba Basin)',
      incident: 'INC-001',
      team: 'T-02',
      status: 'assigned',
      progress: 25,
      lat: 32.3620,
      lng: 77.2310,
      coords: [[32.352,77.221],[32.372,77.221],[32.372,77.241],[32.352,77.241]],
    },
    {
      id: 'Z-03',
      name: 'Sector Charlie-3 (Marhi Plateau)',
      incident: 'INC-001',
      team: null,
      status: 'pending',
      progress: 0,
      lat: 32.3820,
      lng: 77.2210,
      coords: [[32.372,77.211],[32.392,77.211],[32.392,77.231],[32.372,77.231]],
    },
    {
      id: 'Z-04',
      name: 'Sector Delta-4 (Spiti North Banks)',
      incident: 'INC-002',
      team: 'T-03',
      status: 'in-progress',
      progress: 45,
      lat: 32.2532,
      lng: 78.0450,
      coords: [[32.243,78.035],[32.263,78.035],[32.263,78.055],[32.243,78.055]],
    },
    {
      id: 'Z-05',
      name: 'Sector Echo-5 (Kaza Floodplain)',
      incident: 'INC-002',
      team: 'T-04',
      status: 'assigned',
      progress: 10,
      lat: 32.2332,
      lng: 78.0250,
      coords: [[32.223,78.015],[32.243,78.015],[32.243,78.035],[32.223,78.035]],
    },
    {
      id: 'Z-06',
      name: 'Sector Foxtrot-6 (NH-3 Debris Path)',
      incident: 'INC-003',
      team: 'T-05',
      status: 'completed',
      progress: 100,
      lat: 32.5780,
      lng: 77.5320,
      coords: [[32.568,77.522],[32.588,77.522],[32.588,77.542],[32.568,77.542]],
    },
    {
      id: 'Z-07',
      name: 'Sector Golf-7 (Solang Glacial Trail)',
      incident: 'INC-004',
      team: 'T-06',
      status: 'in-progress',
      progress: 85,
      lat: 32.3150,
      lng: 77.1780,
      coords: [[32.305,77.168],[32.325,77.168],[32.325,77.188],[32.305,77.188]],
    },
    {
      id: 'Z-08',
      name: 'Sector Hotel-8 (Kasol Rapid Bend)',
      incident: 'INC-005',
      team: 'T-01',
      status: 'assigned',
      progress: 30,
      lat: 32.0195,
      lng: 77.3239,
      coords: [[32.009,77.313],[32.029,77.313],[32.029,77.333],[32.009,77.333]],
    },
    {
      id: 'Z-09',
      name: 'Sector India-9 (Manikaran Confluence)',
      incident: 'INC-005',
      team: 'T-03',
      status: 'in-progress',
      progress: 40,
      lat: 32.0095,
      lng: 77.3039,
      coords: [[31.999,77.293],[32.019,77.293],[32.019,77.313],[31.999,77.313]],
    },
  ],

  // ── RESOURCES (LOGISTICS & OPERATIONAL ASSETS) ─────────
  resources: [
    {
      id: 'RES-001',
      item: 'Zodiac Heavy Inflatable Rescue Craft',
      category: 'vehicles',
      qty: 2,
      unit: 'craft',
      team: 'T-03',
      incident: 'INC-002',
      priority: 'critical',
      status: 'approved',
      requestedAt: new Date(Date.now() - 3600000 * 4),
      notes: 'Immediate deployment for high-current Spiti river extraction.',
    },
    {
      id: 'RES-002',
      item: 'Portable Medical Oxygen Banks (40L)',
      category: 'medical',
      qty: 8,
      unit: 'cylinders',
      team: 'T-06',
      incident: 'INC-004',
      priority: 'high',
      status: 'dispatched',
      requestedAt: new Date(Date.now() - 3600000 * 2),
      notes: 'Urgent for pulmonary stabilization at altitude >3,500m.',
    },
    {
      id: 'RES-003',
      item: 'IAF ALH Dhruv Rotor Evac Sortie',
      category: 'aviation',
      qty: 1,
      unit: 'flight sortie',
      team: 'T-04',
      incident: 'INC-001',
      priority: 'critical',
      status: 'pending',
      requestedAt: new Date(Date.now() - 1800000),
      notes: 'Winch extraction requested at Rohtang North ridge coordinates.',
    },
    {
      id: 'RES-004',
      item: 'Tactical High-Calorie Rations (72hr)',
      category: 'food',
      qty: 60,
      unit: 'packs',
      team: 'T-02',
      incident: 'INC-001',
      priority: 'medium',
      status: 'pending',
      requestedAt: new Date(Date.now() - 3600000),
      notes: 'Resupply for stranded mountain search party.',
    },
    {
      id: 'RES-005',
      item: 'FLIR Thermal Long-Range UAV System',
      category: 'equipment',
      qty: 1,
      unit: 'unit',
      team: 'T-07',
      incident: 'INC-005',
      priority: 'high',
      status: 'pending',
      requestedAt: new Date(Date.now() - 900000),
      notes: 'Night surveillance of Parvati river banks and gorges.',
    },
    {
      id: 'RES-006',
      item: 'Iridium Extreme Satellite Handsets',
      category: 'communication',
      qty: 4,
      unit: 'terminals',
      team: 'T-01',
      incident: 'INC-001',
      priority: 'high',
      status: 'delivered',
      requestedAt: new Date(Date.now() - 7200000),
      notes: 'Dead-zone communications in zero-cellular alpine sector.',
    },
    {
      id: 'RES-007',
      item: 'Trauma Immobilization Stretchers',
      category: 'medical',
      qty: 4,
      unit: 'stretchers',
      team: 'T-04',
      incident: 'INC-002',
      priority: 'medium',
      status: 'delivered',
      requestedAt: new Date(Date.now() - 86400000),
      notes: 'Standardized rigid spinal boards for water rescue victims.',
    },
    {
      id: 'RES-008',
      item: 'Diesel Silent Generator (10 kVA)',
      category: 'equipment',
      qty: 2,
      unit: 'generators',
      team: 'T-05',
      incident: 'INC-003',
      priority: 'low',
      status: 'delivered',
      requestedAt: new Date(Date.now() - 86400000 * 2),
      notes: 'Night ops flood lighting on NH-3 highway clearance.',
    },
  ],

  // ── FINDINGS (FIELD RECON & TRIAGE LOGS) ─────────────
  findings: [
    {
      id: 'FND-001',
      type: 'person-found',
      title: 'Survivor Located Conscious',
      location: 'Sector Alpha-1, Ridge Spur A-3',
      zone: 'Z-01',
      team: 'T-01',
      incident: 'INC-001',
      lat: 32.3780,
      lng: 77.2480,
      description: 'Male trekker, age 29. Moderate hypothermia with frostnip on hands. Stabilized in survival shelter, alert and oriented.',
      status: 'recovered',
      reportedAt: new Date(Date.now() - 1800000),
    },
    {
      id: 'FND-002',
      type: 'clue',
      title: 'Expedition Rucksack Recovered',
      location: 'Sector Bravo-2, Waterfall Gully',
      zone: 'Z-02',
      team: 'T-02',
      incident: 'INC-001',
      lat: 32.3620,
      lng: 77.2340,
      description: 'Red climbing pack recovered with government identification matching missing roster. Boot prints heading northwest.',
      status: 'logged',
      reportedAt: new Date(Date.now() - 3600000),
    },
    {
      id: 'FND-003',
      type: 'person-found',
      title: 'Child Rescued from Flood Debris',
      location: 'Sector Delta-4, River Embankment',
      zone: 'Z-04',
      team: 'T-03',
      incident: 'INC-002',
      lat: 32.2520,
      lng: 78.0440,
      description: 'Female minor (~10 yrs) located on elevated gravel bar. Mild abrasions, vitals normal. Evacuated to Kaza Field Clinic.',
      status: 'evacuated',
      reportedAt: new Date(Date.now() - 7200000),
    },
    {
      id: 'FND-004',
      type: 'hazard',
      title: 'Secondary Unstable Rock Face Identified',
      location: 'Sector Foxtrot-6, Highway Km 114',
      zone: 'Z-06',
      team: 'T-05',
      incident: 'INC-003',
      lat: 32.5790,
      lng: 77.5340,
      description: 'Active fissures widening in granite overhang above clearance zone. Red exclusion cordon established.',
      status: 'danger-zone',
      reportedAt: new Date(Date.now() - 10800000),
    },
    {
      id: 'FND-005',
      type: 'evidence',
      title: 'Capsized Raft Hull & Gear Recovered',
      location: 'Sector Hotel-8, River Sandbank',
      zone: 'Z-08',
      team: 'T-01',
      incident: 'INC-005',
      lat: 32.0185,
      lng: 77.3220,
      description: 'Raft hull stranded on rock shelf with 3 lifejackets and 2 paddles trapped in hydraulic eddy. Search expanding downstream.',
      status: 'logged',
      reportedAt: new Date(Date.now() - 900000),
    },
    {
      id: 'FND-006',
      type: 'person-found',
      title: 'Injured Trekker Stabilized at Trailhead',
      location: 'Sector Golf-7, Trail Marker 7',
      zone: 'Z-07',
      team: 'T-06',
      incident: 'INC-004',
      lat: 32.3155,
      lng: 77.1790,
      description: 'Adult male stabilized with rigid splint on fractured fibula. IV fluids administered. Rotor extraction scheduled.',
      status: 'awaiting-evac',
      reportedAt: new Date(Date.now() - 1200000),
    },
    {
      id: 'FND-007',
      type: 'clue',
      title: 'Abandoned Mountain Bivouac',
      location: 'Sector Charlie-3, High Plateau',
      zone: 'Z-03',
      team: null,
      incident: 'INC-001',
      lat: 32.3830,
      lng: 77.2220,
      description: 'Collapsed two-man alpine tent with thermal sleeping bags and emergency freeze-dried supplies. Indicates hasty retreat in blizzard.',
      status: 'logged',
      reportedAt: new Date(Date.now() - 5400000),
    },
  ],

  // ── AUDIT & ACTIVITY LOG ───────────────────────────
  activityLog: [
    { id: 1, type: 'success', text: '<strong>Alpha Response Squad</strong> located conscious survivor at Sector Alpha-1', time: '2m ago', color: '#10B981' },
    { id: 2, type: 'warning', text: '<strong>Aviation Request RES-003</strong> for IAF ALH Dhruv pending command authorization', time: '8m ago', color: '#F59E0B' },
    { id: 3, type: 'info', text: '<strong>INC-005</strong> (Capsized Raft) prioritized by Kullu District Control', time: '14m ago', color: '#0EA5E9' },
    { id: 4, type: 'success', text: '<strong>Foxtrot Medical Unit</strong> stabilized fractured casualty at Sector Golf-7', time: '21m ago', color: '#10B981' },
    { id: 5, type: 'error', text: '<strong>CRITICAL HAZARD:</strong> Unstable rock face detected at Sector Foxtrot-6 Km 114', time: '34m ago', color: '#EF4444' },
    { id: 6, type: 'info', text: '<strong>Bravo Recon Unit</strong> deployed with avalanche transceivers to Sector Bravo-2', time: '42m ago', color: '#0EA5E9' },
    { id: 7, type: 'success', text: '<strong>RES-007</strong> Rigid Trauma Stretchers delivered to Delta Medevac Wing', time: '1h 10m ago', color: '#10B981' },
  ],

  // ── PROFESSIONAL TACTICAL SQUAD PALETTE ────────────
  teamColors: [
    '#E11D48', // Tactical Red (Alpha)
    '#2563EB', // Naval Blue (Bravo)
    '#0D9488', // Tactical Teal (Charlie)
    '#D97706', // Aviation Amber (Delta)
    '#0284C7', // Steel Blue (Echo)
    '#059669', // Medic Emerald (Foxtrot)
    '#0891B2', // Recon Cyan (Golf)
    '#64748B', // Tactical Slate (Hotel)
  ],

  // ── HELPERS & FORMATTERS ───────────────────────────
  getPriorityClass(p) {
    return `badge-${(p || 'medium').toLowerCase()}`;
  },

  getStatusClass(s) {
    return `badge-${(s || 'pending').toLowerCase().replace(/\s+/g, '-')}`;
  },

  formatTime(date) {
    if (!date) return '—';
    const d = date instanceof Date ? date : new Date(date);
    const diff = Math.floor((Date.now() - d.getTime()) / 1000);
    if (diff < 60) return `${diff}s ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return d.toLocaleDateString();
  },

  formatDateTime(date) {
    if (!date) return '—';
    const d = date instanceof Date ? date : new Date(date);
    return d.toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  },

  nextId(prefix, list) {
    const nums = list
      .map((x) => parseInt((x.id || '').split('-')[1]))
      .filter((n) => !isNaN(n));
    const max = nums.length ? Math.max(...nums) : 0;
    return `${prefix}-${String(max + 1).padStart(prefix === 'T' || prefix === 'Z' ? 2 : 3, '0')}`;
  },

  getTeam(id) {
    return SAR.teams.find((t) => t.id === id) || null;
  },

  getZone(id) {
    return SAR.zones.find((z) => z.id === id) || null;
  },

  getIncident(id) {
    return SAR.incidents.find((i) => i.id === id) || null;
  },

  categoryIcon(cat) {
    const icons = {
      vehicles: '🚢',
      aviation: '🚁',
      medical: '🩺',
      equipment: '⚙️',
      communication: '📡',
      food: '🥫',
    };
    return icons[cat] || '📦';
  },

  findingIcon(type) {
    const icons = {
      'person-found': '👤',
      clue: '🔎',
      evidence: '🧭',
      hazard: '⚠️',
    };
    return icons[type] || '📍';
  },
};
