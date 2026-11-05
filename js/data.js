/* ══════════════════════════════════════════════════════
   SAR COMMAND — DATA STORE
   Mock data for all entities
══════════════════════════════════════════════════════ */
const API_BASE_URL = 'http://127.0.0.1:8000/api';

async function fetchIncidents() {
    try {
        const response = await fetch(`${API_BASE_URL}/incidents/`);

        if (!response.ok) {
            throw new Error(`API Error: ${response.status}`);
        }

        const data = await response.json();

        SAR.incidents = data.map(inc => ({
            id: inc.id,
            title: inc.title,
            location: inc.location,
            lat: inc.latitude,
            lng: inc.longitude,
            priority: (inc.priority || 'medium').toLowerCase(),
            status: inc.status === 'IN_PROGRESS'
            ? 'contained'
            : (inc.status || 'active').toLowerCase(),
            description: inc.description,
            reportedBy: inc.reported_by || 'Unknown',
            createdAt: new Date(inc.created_at),
            updatedAt: new Date(inc.updated_at || inc.created_at),
            teams: inc.teams || [],
            zones: inc.zones || [],
            findings: inc.findings || 0
        }));

        console.log('Incidents loaded from MongoDB:', SAR.incidents);
        return true;

    } catch (error) {
        console.error('Failed to load incidents:', error);
        return false;
    }
}
const SAR = {

  // ── INCIDENTS ──────────────────────────────────────
  incidents: [
    {
      id: 'INC-001',
      title: 'Trekker Missing — Rohtang Pass',
      location: 'Rohtang Pass, Himachal Pradesh',
      lat: 32.3720, lng: 77.2410,
      priority: 'critical',
      status: 'active',
      description: 'A group of 3 trekkers reported missing after avalanche warning. Last seen at base camp coordinates.',
      reportedBy: 'HP Police HQ',
      createdAt: new Date(Date.now() - 3600000 * 5),
      updatedAt: new Date(Date.now() - 1800000),
      teams: ['T-01', 'T-02'],
      zones: ['Z-01', 'Z-02', 'Z-03'],
      findings: 2,
    },
    {
      id: 'INC-002',
      title: 'Flash Flood — Spiti Valley',
      location: 'Spiti River Basin',
      lat: 32.2432, lng: 78.0350,
      priority: 'high',
      status: 'active',
      description: 'Flash flood displaced 4 villages. Multiple persons unaccounted for. Rescue teams deployed.',
      reportedBy: 'District Collector Lahual',
      createdAt: new Date(Date.now() - 3600000 * 12),
      updatedAt: new Date(Date.now() - 900000),
      teams: ['T-03', 'T-04'],
      zones: ['Z-04', 'Z-05'],
      findings: 5,
    },
    {
      id: 'INC-003',
      title: 'Landslide — Manali-Leh Highway',
      location: 'NH-3, Km 112',
      lat: 32.5780, lng: 77.5320,
      priority: 'high',
      status: 'contained',
      description: 'Major landslide blocked highway. 2 vehicles buried. Road clearance operation ongoing.',
      reportedBy: 'BRO Patrol Unit',
      createdAt: new Date(Date.now() - 3600000 * 20),
      updatedAt: new Date(Date.now() - 3600000 * 2),
      teams: ['T-05'],
      zones: ['Z-06'],
      findings: 7,
    },
    {
      id: 'INC-004',
      title: 'Hiker Injured — Beas Kund Trail',
      location: 'Beas Kund, Solang Valley',
      lat: 32.3150, lng: 77.1780,
      priority: 'medium',
      status: 'active',
      description: 'Lone hiker with suspected fractured ankle. Location pinpointed via GPS. Medical team dispatched.',
      reportedBy: 'Tourist Helpline 1364',
      createdAt: new Date(Date.now() - 3600000 * 2),
      updatedAt: new Date(Date.now() - 600000),
      teams: ['T-06'],
      zones: ['Z-07'],
      findings: 1,
    },
    {
      id: 'INC-005',
      title: 'Boat Capsized — Parvati River',
      location: 'Kasol, Kullu District',
      lat: 32.0095, lng: 77.3139,
      priority: 'critical',
      status: 'active',
      description: 'Tourist boat capsized near Kasol rapids. 6 persons missing. River search commenced.',
      reportedBy: 'Kasol Police',
      createdAt: new Date(Date.now() - 3600000 * 1.5),
      updatedAt: new Date(Date.now() - 300000),
      teams: ['T-01', 'T-03'],
      zones: ['Z-08', 'Z-09'],
      findings: 0,
    },
  ],

  // ── TEAMS ──────────────────────────────────────────
  teams: [
    { id: 'T-01', name: 'Alpha Squad',    leader: 'Capt. Rajesh Negi', members: 8,  status: 'deployed',  zone: 'Z-01', color: '#ef4444', specialization: 'Mountain Rescue', contact: '+91-9805-001001', equipment: ['Rope', 'Harness', 'Radio', 'Medical Kit'] },
    { id: 'T-02', name: 'Bravo Unit',     leader: 'Lt. Priya Sharma',  members: 6,  status: 'deployed',  zone: 'Z-02', color: '#3b82f6', specialization: 'Avalanche Search', contact: '+91-9805-001002', equipment: ['Probe Poles', 'Beacon', 'Shovel', 'Radio'] },
    { id: 'T-03', name: 'Charlie Force',  leader: 'Sgt. Mohan Thakur', members: 10, status: 'deployed',  zone: 'Z-04', color: '#10b981', specialization: 'Flood Rescue',    contact: '+91-9805-001003', equipment: ['Zodiac Boat', 'Life Jacket', 'Rope', 'Radio'] },
    { id: 'T-04', name: 'Delta Wing',     leader: 'Maj. Suresh Kumar', members: 5,  status: 'standby',   zone: null,   color: '#f97316', specialization: 'Medical Evac',    contact: '+91-9805-001004', equipment: ['Stretcher', 'AED', 'Trauma Kit', 'Oxygen'] },
    { id: 'T-05', name: 'Echo Platoon',   leader: 'Cpl. Anita Rawat',  members: 7,  status: 'deployed',  zone: 'Z-06', color: '#8b5cf6', specialization: 'Road Rescue',     contact: '+91-9805-001005', equipment: ['Excavator', 'Chainsaw', 'Winch', 'Radio'] },
    { id: 'T-06', name: 'Foxtrot Medics', leader: 'Dr. Kavita Singh',  members: 4,  status: 'deployed',  zone: 'Z-07', color: '#f59e0b', specialization: 'Paramedic',       contact: '+91-9805-001006', equipment: ['Medical Bag', 'Splint', 'Radio', 'Stretcher'] },
    { id: 'T-07', name: 'Golf Recon',     leader: 'Lt. Vikas Thapa',   members: 6,  status: 'returning', zone: null,   color: '#06b6d4', specialization: 'Aerial Search',   contact: '+91-9805-001007', equipment: ['Drone', 'Binoculars', 'Radio', 'GPS'] },
    { id: 'T-08', name: 'Hotel Reserve',  leader: 'Cdr. Deepak Rana',  members: 12, status: 'standby',   zone: null,   color: '#64748b', specialization: 'Heavy Rescue',    contact: '+91-9805-001008', equipment: ['Crane', 'Winch', 'Generator', 'Flood Light'] },
  ],

  // ── ZONES ──────────────────────────────────────────
  zones: [
    { id: 'Z-01', name: 'Zone Alpha',   incident: 'INC-001', team: 'T-01', status: 'in-progress', progress: 65, lat: 32.3820, lng: 77.2510, coords: [[32.372,77.241],[32.392,77.241],[32.392,77.261],[32.372,77.261]] },
    { id: 'Z-02', name: 'Zone Bravo',   incident: 'INC-001', team: 'T-02', status: 'assigned',    progress: 10, lat: 32.3620, lng: 77.2310, coords: [[32.352,77.221],[32.372,77.221],[32.372,77.241],[32.352,77.241]] },
    { id: 'Z-03', name: 'Zone Charlie', incident: 'INC-001', team: null,   status: 'pending',     progress: 0,  lat: 32.3820, lng: 77.2210, coords: [[32.372,77.211],[32.392,77.211],[32.392,77.231],[32.372,77.231]] },
    { id: 'Z-04', name: 'Zone Delta',   incident: 'INC-002', team: 'T-03', status: 'in-progress', progress: 40, lat: 32.2532, lng: 78.0450, coords: [[32.243,78.035],[32.263,78.035],[32.263,78.055],[32.243,78.055]] },
    { id: 'Z-05', name: 'Zone Echo',    incident: 'INC-002', team: 'T-04', status: 'assigned',    progress: 5,  lat: 32.2332, lng: 78.0250, coords: [[32.223,78.015],[32.243,78.015],[32.243,78.035],[32.223,78.035]] },
    { id: 'Z-06', name: 'Zone Foxtrot', incident: 'INC-003', team: 'T-05', status: 'completed',   progress: 100,lat: 32.5780, lng: 77.5320, coords: [[32.568,77.522],[32.588,77.522],[32.588,77.542],[32.568,77.542]] },
    { id: 'Z-07', name: 'Zone Golf',    incident: 'INC-004', team: 'T-06', status: 'in-progress', progress: 80, lat: 32.3150, lng: 77.1780, coords: [[32.305,77.168],[32.325,77.168],[32.325,77.188],[32.305,77.188]] },
    { id: 'Z-08', name: 'Zone Hotel',   incident: 'INC-005', team: 'T-01', status: 'assigned',    progress: 20, lat: 32.0195, lng: 77.3239, coords: [[32.009,77.313],[32.029,77.313],[32.029,77.333],[32.009,77.333]] },
    { id: 'Z-09', name: 'Zone India',   incident: 'INC-005', team: 'T-03', status: 'in-progress', progress: 35, lat: 32.0095, lng: 77.3039, coords: [[31.999,77.293],[32.019,77.293],[32.019,77.313],[31.999,77.313]] },
  ],

  // ── RESOURCES ──────────────────────────────────────
  resources: [
    { id: 'RES-001', item: 'Zodiac Rescue Boat',    category: 'vehicles',   qty: 2,  unit: 'units',   team: 'T-03', incident: 'INC-002', priority: 'critical', status: 'approved',   requestedAt: new Date(Date.now()-3600000*4), notes: 'Required for river search.' },
    { id: 'RES-002', item: 'Medical Oxygen Tanks',  category: 'medical',    qty: 10, unit: 'cylinders',team: 'T-06', incident: 'INC-004', priority: 'high',     status: 'dispatched', requestedAt: new Date(Date.now()-3600000*2), notes: 'For altitude sickness cases.' },
    { id: 'RES-003', item: 'Helicopter Support',    category: 'vehicles',   qty: 1,  unit: 'sortie',  team: 'T-07', incident: 'INC-001', priority: 'critical', status: 'pending',    requestedAt: new Date(Date.now()-1800000),   notes: 'Aerial survey of Rohtang.' },
    { id: 'RES-004', item: 'Emergency Ration Kits', category: 'food',       qty: 50, unit: 'kits',    team: 'T-02', incident: 'INC-001', priority: 'medium',   status: 'pending',    requestedAt: new Date(Date.now()-3600000),   notes: '3-day rations for 50 persons.' },
    { id: 'RES-005', item: 'Thermal Imaging Drone', category: 'equipment',  qty: 1,  unit: 'unit',    team: 'T-07', incident: 'INC-005', priority: 'high',     status: 'pending',    requestedAt: new Date(Date.now()-900000),    notes: 'Night search for river victims.' },
    { id: 'RES-006', item: 'Satellite Phone',        category: 'communication',qty:3, unit:'units',   team: 'T-01', incident: 'INC-001', priority: 'high',     status: 'approved',   requestedAt: new Date(Date.now()-7200000),   notes: 'Remote zone comms.' },
    { id: 'RES-007', item: 'Trauma Stretchers',      category: 'medical',   qty: 4,  unit: 'units',   team: 'T-04', incident: 'INC-002', priority: 'medium',   status: 'delivered',  requestedAt: new Date(Date.now()-86400000),  notes: 'For evacuation.' },
    { id: 'RES-008', item: 'Portable Generator',     category: 'equipment', qty: 2,  unit: 'units',   team: 'T-05', incident: 'INC-003', priority: 'low',      status: 'delivered',  requestedAt: new Date(Date.now()-86400000*2),notes: 'Flood lighting.' },
  ],

  // ── FINDINGS ──────────────────────────────────────
  findings: [
    { id: 'FND-001', type: 'person-found', title: 'Survivor Located', location: 'Zone Alpha, Grid A-3', zone: 'Z-01', team: 'T-01', incident: 'INC-001', lat: 32.3780, lng: 77.2480, description: 'Male trekker, approx 28 yrs, mild hypothermia. Conscious and responsive.', status: 'recovered', reportedAt: new Date(Date.now()-1800000) },
    { id: 'FND-002', type: 'clue',         title: 'Backpack Recovered', location: 'Zone Bravo, near waterfall', zone: 'Z-02', team: 'T-02', incident: 'INC-001', lat: 32.3620, lng: 77.2340, description: 'Red hiking backpack with ID belonging to missing person. Fresh tracks nearby.', status: 'logged', reportedAt: new Date(Date.now()-3600000) },
    { id: 'FND-003', type: 'person-found', title: 'Child Rescued',    location: 'Zone Delta, river bank', zone: 'Z-04', team: 'T-03', incident: 'INC-002', lat: 32.2520, lng: 78.0440, description: 'Female child ~10yrs, rescued from flood debris. Mild injuries. Airlifted.', status: 'evacuated', reportedAt: new Date(Date.now()-7200000) },
    { id: 'FND-004', type: 'hazard',       title: 'Secondary Landslide Risk', location: 'Zone Foxtrot, Km 114', zone: 'Z-06', team: 'T-05', incident: 'INC-003', lat: 32.5790, lng: 77.5340, description: 'Unstable rock face identified. Risk of secondary slide. Area marked as danger zone.', status: 'logged', reportedAt: new Date(Date.now()-10800000) },
    { id: 'FND-005', type: 'evidence',     title: 'Vehicle Debris',   location: 'Zone Hotel, river edge', zone: 'Z-08', team: 'T-01', incident: 'INC-005', lat: 32.0185, lng: 77.3220, description: 'Boat wreckage found 200m downstream. Life jackets recovered. Searching for occupants.', status: 'logged', reportedAt: new Date(Date.now()-900000) },
    { id: 'FND-006', type: 'person-found', title: 'Injured Hiker',   location: 'Zone Golf, trail marker 7', zone: 'Z-07', team: 'T-06', incident: 'INC-004', lat: 32.3155, lng: 77.1790, description: 'Male hiker, fractured right ankle. Stabilized. Awaiting helicopter evacuation.', status: 'awaiting-evac', reportedAt: new Date(Date.now()-1200000) },
    { id: 'FND-007', type: 'clue',         title: 'Tent Found Abandoned', location: 'Zone Charlie', zone: 'Z-03', team: null, incident: 'INC-001', lat: 32.3830, lng: 77.2220, description: 'Abandoned tent with sleeping bags and food supplies. Indicates occupants left suddenly.', status: 'logged', reportedAt: new Date(Date.now()-5400000) },
  ],

  // ── ACTIVITY LOG ──────────────────────────────────
  activityLog: [
    { id: 1, type: 'success', text: '<strong>Alpha Squad</strong> located a survivor in Zone Alpha', time: '2 min ago', color: '#10b981' },
    { id: 2, type: 'warning', text: '<strong>Resource Request RES-003</strong> for helicopter pending approval', time: '8 min ago', color: '#f59e0b' },
    { id: 3, type: 'info',    text: '<strong>INC-005</strong> (Boat Capsized) created by Kasol Police', time: '14 min ago', color: '#3b82f6' },
    { id: 4, type: 'success', text: '<strong>Foxtrot Medics</strong> stabilized injured hiker at Zone Golf', time: '21 min ago', color: '#10b981' },
    { id: 5, type: 'error',   text: '<strong>Critical:</strong> Secondary landslide risk identified at Zone Foxtrot', time: '34 min ago', color: '#ef4444' },
    { id: 6, type: 'info',    text: '<strong>Bravo Unit</strong> assigned to Zone Bravo for avalanche search', time: '42 min ago', color: '#3b82f6' },
    { id: 7, type: 'success', text: '<strong>RES-007</strong> Trauma Stretchers delivered to Charlie Force', time: '1h 10m ago', color: '#10b981' },
  ],

  // ── HELPERS ───────────────────────────────────────
  getPriorityClass(p)  { return `badge-${p}`; },
  getStatusClass(s)    { return `badge-${s.replace(' ','-')}`; },
  formatTime(date) {
    const diff = Math.floor((Date.now() - date) / 1000);
    if (diff < 60)       return `${diff}s ago`;
    if (diff < 3600)     return `${Math.floor(diff/60)}m ago`;
    if (diff < 86400)    return `${Math.floor(diff/3600)}h ago`;
    return date.toLocaleDateString();
  },
  formatDateTime(date) {
    return date.toLocaleString('en-IN', { day:'2-digit', month:'short', year:'numeric', hour:'2-digit', minute:'2-digit' });
  },
  nextId(prefix, list) {
    const nums = list.map(x => parseInt(x.id.split('-')[1])).filter(Boolean);
    const max  = nums.length ? Math.max(...nums) : 0;
    return `${prefix}-${String(max + 1).padStart(3,'0')}`;
  },
  getTeam(id)     { return SAR.teams.find(t => t.id === id) || null; },
  getZone(id)     { return SAR.zones.find(z => z.id === id) || null; },
  getIncident(id) { return SAR.incidents.find(i => i.id === id) || null; },
  teamColors: ['#ef4444','#3b82f6','#10b981','#f97316','#8b5cf6','#f59e0b','#06b6d4','#64748b'],

  categoryIcon(cat) {
    const icons = { vehicles:'🚁', medical:'💊', equipment:'🔧', communication:'📡', food:'🍱' };
    return icons[cat] || '📦';
  },
  findingIcon(type) {
    const icons = { 'person-found':'🧍', clue:'🔍', evidence:'🪝', hazard:'⚠️' };
    return icons[type] || '📌';
  },
};

