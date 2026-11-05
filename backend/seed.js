const path = require('path');
const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config({ path: path.resolve(__dirname, '.env') });
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const connectDB = require('./config/db');
const Incident = require('./models/Incident');
const Team = require('./models/Team');
const Zone = require('./models/Zone');
const Resource = require('./models/Resource');
const Finding = require('./models/Finding');
const User = require('./models/User');

const usersData = [
  {
    name: 'Col. Vikram Rathore',
    email: 'commander@resq.in',
    password: 'password123',
    role: 'COMMANDER',
    callsign: 'COMMAND-01',
    assigned_team: null,
  },
  {
    name: 'Dr. Ananya Sharma',
    email: 'coordinator@resq.in',
    password: 'password123',
    role: 'COORDINATOR',
    callsign: 'OPS-COORD-01',
    assigned_team: null,
  },
  {
    name: 'Capt. Vikram Batra',
    email: 'alpha.lead@resq.in',
    password: 'password123',
    role: 'FIELD_LEADER',
    callsign: 'T-01-LEAD',
    assigned_team: 'T-01', // Linked to Alpha Squad T-01
  },
  {
    name: 'Sgt. Rajesh Kumar',
    email: 'logistics@resq.in',
    password: 'password123',
    role: 'LOGISTICS',
    callsign: 'SUPPLY-BASE',
    assigned_team: null,
  },
];

const incidentsData = [
  {
    incident_id: 'INC-001',
    title: 'Trekker Party Stranded — Rohtang Pass Ridge',
    location: 'Rohtang Pass, Altitude 3,978m',
    latitude: 32.3720,
    longitude: 77.2410,
    priority: 'CRITICAL',
    status: 'ACTIVE',
    description: 'Group of 3 mountaineers trapped under rapid blizzard accumulation and avalanche warning. Last transponder beacon logged near Gulaba Ridge.',
    reported_by: 'HP State Disaster Management Authority',
    teams: ['T-01', 'T-02'],
    zones: ['Z-01', 'Z-02', 'Z-03'],
    findings: 2,
    created_at: new Date(Date.now() - 3600000 * 5),
  },
  {
    incident_id: 'INC-002',
    title: 'Flash Flood Inundation — Spiti River Sector 4',
    location: 'Spiti River Basin, Kaza',
    latitude: 32.2432,
    longitude: 78.0350,
    priority: 'HIGH',
    status: 'ACTIVE',
    description: 'High-altitude cloudburst triggered sudden river surges affecting 4 settlement perimeters. Search and swiftwater evacuation in progress.',
    reported_by: 'District Emergency Operations Center',
    teams: ['T-03', 'T-04'],
    zones: ['Z-04', 'Z-05'],
    findings: 5,
    created_at: new Date(Date.now() - 3600000 * 12),
  },
  {
    incident_id: 'INC-003',
    title: 'Debris Flow & Landslide — NH-3 Mountain Corridor Km 112',
    location: 'National Highway 3, Manali-Leh Route',
    latitude: 32.5780,
    longitude: 77.5320,
    priority: 'HIGH',
    status: 'CONTAINED',
    description: 'Massive rockfall severed transportation arterial. 2 civil utility vehicles partially buried. Heavy machinery working with road rescue squads.',
    reported_by: 'Border Roads Organization (BRO)',
    teams: ['T-05'],
    zones: ['Z-06'],
    findings: 7,
    created_at: new Date(Date.now() - 3600000 * 20),
  },
  {
    incident_id: 'INC-004',
    title: 'Medical Evacuation — Beas Kund Alpine Trail',
    location: 'Beas Kund Glacial Basin, Solang',
    latitude: 32.3150,
    longitude: 77.1780,
    priority: 'MEDIUM',
    status: 'ACTIVE',
    description: 'Solo trekker sustained compound lower limb fracture with hypothermia onset at 3,600m. Ground medics deployed awaiting rotor clearance.',
    reported_by: 'Atal Bihari Institute of Mountaineering',
    teams: ['T-06'],
    zones: ['Z-07'],
    findings: 1,
    created_at: new Date(Date.now() - 3600000 * 2),
  },
  {
    incident_id: 'INC-005',
    title: 'Capsized Raft Investigation — Parvati Gorge Rapids',
    location: 'Kasol Rapid Bend, Parvati Valley',
    latitude: 32.0095,
    longitude: 77.3139,
    priority: 'CRITICAL',
    status: 'ACTIVE',
    description: 'Commercial expedition raft overturned in Class IV rapids. 4 persons unaccounted for downstream. Drone thermography scanning shoreline.',
    reported_by: 'Kullu District Police Control',
    teams: ['T-01', 'T-03'],
    zones: ['Z-08', 'Z-09'],
    findings: 1,
    created_at: new Date(Date.now() - 3600000 * 1.5),
  },
];

const teamsData = [
  {
    team_id: 'T-01',
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
    team_id: 'T-02',
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
    team_id: 'T-03',
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
    team_id: 'T-04',
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
    team_id: 'T-05',
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
    team_id: 'T-06',
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
    team_id: 'T-07',
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
    team_id: 'T-08',
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
];

const zonesData = [
  {
    zone_id: 'Z-01',
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
    zone_id: 'Z-02',
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
    zone_id: 'Z-03',
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
    zone_id: 'Z-04',
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
    zone_id: 'Z-05',
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
    zone_id: 'Z-06',
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
    zone_id: 'Z-07',
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
    zone_id: 'Z-08',
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
    zone_id: 'Z-09',
    name: 'Sector India-9 (Manikaran Confluence)',
    incident: 'INC-005',
    team: 'T-03',
    status: 'in-progress',
    progress: 40,
    lat: 32.0095,
    lng: 77.3039,
    coords: [[31.999,77.293],[32.019,77.293],[32.019,77.313],[31.999,77.313]],
  },
];

const resourcesData = [
  {
    resource_id: 'RES-001',
    item: 'Zodiac Heavy Inflatable Rescue Craft',
    category: 'vehicles',
    qty: 2,
    unit: 'craft',
    team: 'T-03',
    incident: 'INC-002',
    priority: 'critical',
    status: 'approved',
    notes: 'Immediate deployment for high-current Spiti river extraction.',
  },
  {
    resource_id: 'RES-002',
    item: 'Portable Medical Oxygen Banks (40L)',
    category: 'medical',
    qty: 8,
    unit: 'cylinders',
    team: 'T-06',
    incident: 'INC-004',
    priority: 'high',
    status: 'dispatched',
    notes: 'Urgent for pulmonary stabilization at altitude >3,500m.',
  },
  {
    resource_id: 'RES-003',
    item: 'IAF ALH Dhruv Rotor Evac Sortie',
    category: 'aviation',
    qty: 1,
    unit: 'flight sortie',
    team: 'T-04',
    incident: 'INC-001',
    priority: 'critical',
    status: 'pending',
    notes: 'Winch extraction requested at Rohtang North ridge coordinates.',
  },
  {
    resource_id: 'RES-004',
    item: 'Tactical High-Calorie Rations (72hr)',
    category: 'food',
    qty: 60,
    unit: 'packs',
    team: 'T-02',
    incident: 'INC-001',
    priority: 'medium',
    status: 'pending',
    notes: 'Resupply for stranded mountain search party.',
  },
  {
    resource_id: 'RES-005',
    item: 'FLIR Thermal Long-Range UAV System',
    category: 'equipment',
    qty: 1,
    unit: 'unit',
    team: 'T-07',
    incident: 'INC-005',
    priority: 'high',
    status: 'pending',
    notes: 'Night surveillance of Parvati river banks and gorges.',
  },
  {
    resource_id: 'RES-006',
    item: 'Iridium Extreme Satellite Handsets',
    category: 'communication',
    qty: 4,
    unit: 'terminals',
    team: 'T-01',
    incident: 'INC-001',
    priority: 'high',
    status: 'delivered',
    notes: 'Dead-zone communications in zero-cellular alpine sector.',
  },
  {
    resource_id: 'RES-007',
    item: 'Trauma Immobilization Stretchers',
    category: 'medical',
    qty: 4,
    unit: 'stretchers',
    team: 'T-04',
    incident: 'INC-002',
    priority: 'medium',
    status: 'delivered',
    notes: 'Standardized rigid spinal boards for water rescue victims.',
  },
  {
    resource_id: 'RES-008',
    item: 'Diesel Silent Generator (10 kVA)',
    category: 'equipment',
    qty: 2,
    unit: 'generators',
    team: 'T-05',
    incident: 'INC-003',
    priority: 'low',
    status: 'delivered',
    notes: 'Night ops flood lighting on NH-3 highway clearance.',
  },
];

const findingsData = [
  {
    finding_id: 'FND-001',
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
  },
  {
    finding_id: 'FND-002',
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
  },
  {
    finding_id: 'FND-003',
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
  },
  {
    finding_id: 'FND-004',
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
  },
  {
    finding_id: 'FND-005',
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
  },
  {
    finding_id: 'FND-006',
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
  },
  {
    finding_id: 'FND-007',
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
  },
];

async function seedDatabase() {
  try {
    await connectDB();

    console.log('🌱 Seeding real SAR operational data into MongoDB...');

    // 1. Incidents
    await Incident.deleteMany({});
    await Incident.insertMany(incidentsData);
    console.log(`✅ Seeded ${incidentsData.length} incidents`);

    // 2. Teams
    await Team.deleteMany({});
    await Team.insertMany(teamsData);
    console.log(`✅ Seeded ${teamsData.length} tactical teams`);

    // 3. Zones
    await Zone.deleteMany({});
    await Zone.insertMany(zonesData);
    console.log(`✅ Seeded ${zonesData.length} search sectors`);

    // 4. Resources
    await Resource.deleteMany({});
    await Resource.insertMany(resourcesData);
    console.log(`✅ Seeded ${resourcesData.length} resource logistics items`);

    // 5. Findings
    await Finding.deleteMany({});
    await Finding.insertMany(findingsData);
    console.log(`✅ Seeded ${findingsData.length} field findings & reports`);

    // 6. Users (RBAC Demo Accounts)
    await User.deleteMany({});
    for (const u of usersData) {
      await User.create(u); // Triggers bcrypt pre-save hash
    }
    console.log(`✅ Seeded ${usersData.length} RBAC demo accounts (password: 'password123')`);
    console.table(usersData.map(u => ({ Email: u.email, Role: u.role, Callsign: u.callsign, Team: u.assigned_team || '—' })));

    console.log('🎯 Database successfully populated with real SAR data and RBAC accounts!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding Error:', error.message);
    process.exit(1);
  }
}

seedDatabase();

