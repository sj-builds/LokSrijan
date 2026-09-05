export type RoleKey = "citizen" | "university" | "team" | "industry" | "ngo" | "government";

export type Role = {
  key: RoleKey;
  label: string;
  tagline: string;
  accent: "orange" | "green" | "ink";
  authTitle: string;
  authNote: string;
  credentialLabel: string;
  credentialPlaceholder: string;
  dashboardPath: string;
};

export const ROLES: Role[] = [
  {
    key: "citizen",
    label: "Citizen",
    tagline: "Report the problems you live with every day.",
    accent: "orange",
    authTitle: "Sign in as a Citizen",
    authNote: "Verified with your mobile number and Aadhaar-linked OTP.",
    credentialLabel: "Mobile number",
    credentialPlaceholder: "98XXXXXX21",
    dashboardPath: "/citizen",
  },
  {
    key: "university",
    label: "University",
    tagline: "Route live civic problems to student teams.",
    accent: "green",
    authTitle: "Sign in as a University",
    authNote: "Institutional AISHE code required for nodal officers.",
    credentialLabel: "AISHE institution code",
    credentialPlaceholder: "U-0421-MP",
    dashboardPath: "/university",
  },
  {
    key: "team",
    label: "Student Team",
    tagline: "Build, test and submit your solution.",
    accent: "orange",
    authTitle: "Sign in as a Student Team",
    authNote: "Use the team code issued by your university nodal officer.",
    credentialLabel: "Team code",
    credentialPlaceholder: "LS-TEAM-1187",
    dashboardPath: "/team",
  },
  {
    key: "industry",
    label: "Industry",
    tagline: "Mentor, fund and adopt working prototypes.",
    accent: "ink",
    authTitle: "Sign in as Industry",
    authNote: "CIN/GSTIN verified partner accounts only.",
    credentialLabel: "Company CIN",
    credentialPlaceholder: "U72900MP2019PTC0",
    dashboardPath: "/industry",
  },
  {
    key: "ngo",
    label: "NGO",
    tagline: "Validate ground truth and run field pilots.",
    accent: "green",
    authTitle: "Sign in as an NGO",
    authNote: "Darpan ID verification keeps field reports accountable.",
    credentialLabel: "NITI Darpan ID",
    credentialPlaceholder: "MP/2016/0102341",
    dashboardPath: "/ngo",
  },
  {
    key: "government",
    label: "Government",
    tagline: "Prioritise, sanction and scale what works.",
    accent: "ink",
    authTitle: "Sign in as Government",
    authNote: "Restricted to department officers on NIC email domains.",
    credentialLabel: "Officer NIC email",
    credentialPlaceholder: "name@nic.in",
    dashboardPath: "/government",
  },
];

export const roleByKey = (key: string) => ROLES.find((r) => r.key === key);

export type ProblemStage = "Reported" | "Verified" | "In build" | "Piloting" | "Adopted";

export type Problem = {
  id: string;
  title: string;
  summary: string;
  detail: string;
  sector: string;
  district: string;
  state: string;
  stage: ProblemStage;
  severity: "Low" | "Moderate" | "High" | "Critical";
  reportedBy: string;
  reportedOn: string;
  affected: number;
  endorsements: number;
  teams: number;
  ngoValidated: boolean;
  evidence: string[];
  timeline: { label: string; date: string; note: string }[];
};

export const PROBLEMS: Problem[] = [
  {
    id: "LS-2411",
    title: "Overflowing drains flood the Kamla Nagar market every monsoon",
    summary:
      "Four hours of rain shuts 180 shops. Silt clearing happens once a year, always after the first flood.",
    detail:
      "The stormwater drain along Kamla Nagar market was built for a 1998 catchment and now carries runoff from three new colonies. Shopkeepers lose stock every July. The municipal ward has no live water-level data, so desilting crews are dispatched only after complaints reach the ward office.",
    sector: "Urban water",
    district: "Bhopal",
    state: "Madhya Pradesh",
    stage: "In build",
    severity: "High",
    reportedBy: "Ward 42 shopkeepers' association",
    reportedOn: "2026-06-11",
    affected: 12400,
    endorsements: 318,
    teams: 3,
    ngoValidated: true,
    evidence: [
      "Ward drainage map, 2019",
      "Photos of 11 July waterlogging",
      "Loss estimate from 62 shops",
    ],
    timeline: [
      {
        label: "Reported",
        date: "11 Jun 2026",
        note: "Filed by shopkeepers' association with 34 photos.",
      },
      {
        label: "NGO validated",
        date: "19 Jun 2026",
        note: "Jal Sathi Foundation confirmed drain gradient failure.",
      },
      {
        label: "Assigned",
        date: "02 Jul 2026",
        note: "3 student teams from MANIT and RGPV picked it up.",
      },
      {
        label: "Prototype",
        date: "24 Aug 2026",
        note: "Low-cost ultrasonic level sensors installed at 4 nodes.",
      },
    ],
  },
  {
    id: "LS-2388",
    title: "Anganwadi centres lack a reliable cold chain for supplementary nutrition",
    summary:
      "Fortified milk spoils before distribution in 9 of 21 centres surveyed across two blocks.",
    detail:
      "Power cuts of 5–7 hours make conventional refrigerators unreliable. Centres improvise with earthen pots. There is no temperature logging, so spoilage is discovered only when children fall ill.",
    sector: "Health & nutrition",
    district: "Barmer",
    state: "Rajasthan",
    stage: "Piloting",
    severity: "Critical",
    reportedBy: "Anganwadi worker collective",
    reportedOn: "2026-05-02",
    affected: 5600,
    endorsements: 502,
    teams: 2,
    ngoValidated: true,
    evidence: ["Spoilage log, 21 centres", "Discom outage records", "Block CDPO note"],
    timeline: [
      {
        label: "Reported",
        date: "02 May 2026",
        note: "Collective filed with block-level spoilage log.",
      },
      {
        label: "NGO validated",
        date: "16 May 2026",
        note: "Marusthal Seva verified 9 affected centres.",
      },
      {
        label: "Assigned",
        date: "30 May 2026",
        note: "MNIT Jaipur team building solar-buffered cold box.",
      },
      { label: "Pilot", date: "12 Aug 2026", note: "6 centres running, 41 days without spoilage." },
    ],
  },
  {
    id: "LS-2450",
    title: "Farmers burn paddy stubble because baler machines arrive three weeks late",
    summary: "Booking is offline and first-come, first-served, so small holdings never get a slot.",
    detail:
      "Custom hiring centres allot balers over phone calls. Large farms book early; the 1–2 acre holdings that create most burn events get machines after the sowing window closes, so they burn instead.",
    sector: "Agriculture",
    district: "Sangrur",
    state: "Punjab",
    stage: "Verified",
    severity: "High",
    reportedBy: "Kisan Sabha, Longowal",
    reportedOn: "2026-07-28",
    affected: 34000,
    endorsements: 741,
    teams: 0,
    ngoValidated: true,
    evidence: ["CHC allotment registers", "Satellite burn map Nov 2025"],
    timeline: [
      {
        label: "Reported",
        date: "28 Jul 2026",
        note: "Filed with two seasons of allotment registers.",
      },
      { label: "NGO validated", date: "09 Aug 2026", note: "Kheti Virasat cross-checked 3 CHCs." },
    ],
  },
  {
    id: "LS-2299",
    title: "Night-shift women workers have no safe last-mile transport from the SEZ gate",
    summary:
      "The gate-to-colony stretch is 2.4 km with no lighting and no shared transport after 10 pm.",
    detail:
      "Around 900 women finish shifts between 10 pm and 1 am. Autos refuse the route. Factory shuttles stop at the highway. Absenteeism on night shifts is 3x the day shift.",
    sector: "Safety & mobility",
    district: "Sriperumbudur",
    state: "Tamil Nadu",
    stage: "Adopted",
    severity: "High",
    reportedBy: "Women workers' welfare committee",
    reportedOn: "2026-02-14",
    affected: 900,
    endorsements: 1123,
    teams: 4,
    ngoValidated: true,
    evidence: ["Shift-end headcount", "Route lighting audit", "Absenteeism data from 3 units"],
    timeline: [
      {
        label: "Reported",
        date: "14 Feb 2026",
        note: "Committee filed with shift-end headcounts.",
      },
      { label: "NGO validated", date: "27 Feb 2026", note: "Sakhi Trust ran a night route audit." },
      {
        label: "Prototype",
        date: "18 Apr 2026",
        note: "Shift-synced shuttle scheduler built by SSN team.",
      },
      { label: "Adopted", date: "05 Aug 2026", note: "District administration funded 6 shuttles." },
    ],
  },
  {
    id: "LS-2466",
    title: "Tribal students lose scholarship money to wrong bank-seeding of Aadhaar",
    summary: "Payments bounce silently; students discover it only at fee deadline.",
    detail:
      "Direct benefit transfer fails when the Aadhaar-linked account differs from the account in the scholarship portal. There is no failure notification to the student, and the school clerk has no dashboard of bounced transfers.",
    sector: "Education",
    district: "Dantewada",
    state: "Chhattisgarh",
    stage: "Reported",
    severity: "Moderate",
    reportedBy: "Hostel warden, Govt. Boys HSS",
    reportedOn: "2026-08-21",
    affected: 2100,
    endorsements: 96,
    teams: 0,
    ngoValidated: false,
    evidence: ["Bounced transfer list, 2 terms"],
    timeline: [
      {
        label: "Reported",
        date: "21 Aug 2026",
        note: "Warden filed with two terms of bounce lists.",
      },
    ],
  },
  {
    id: "LS-2401",
    title: "Coastal fishers have no local forecast for sudden squall lines",
    summary: "District bulletins cover 120 km of coast; squalls hit a 15 km stretch.",
    detail:
      "Boats leave at 3 am on a district-level advisory. Squall lines that form 20 km offshore are not captured. Twenty-two capsize incidents were recorded last season on this stretch alone.",
    sector: "Climate resilience",
    district: "Ganjam",
    state: "Odisha",
    stage: "In build",
    severity: "Critical",
    reportedBy: "Matsyajibi cooperative",
    reportedOn: "2026-04-09",
    affected: 7800,
    endorsements: 664,
    teams: 2,
    ngoValidated: true,
    evidence: ["Capsize incident log", "Harbour departure register"],
    timeline: [
      {
        label: "Reported",
        date: "09 Apr 2026",
        note: "Cooperative filed with a season of incident logs.",
      },
      {
        label: "NGO validated",
        date: "21 Apr 2026",
        note: "Samudra Trust confirmed with harbour registers.",
      },
      {
        label: "Assigned",
        date: "14 May 2026",
        note: "NIT Rourkela team building a buoy-fed alert app.",
      },
    ],
  },
];

export const SECTORS = Array.from(new Set(PROBLEMS.map((p) => p.sector))).sort();
export const STAGES: ProblemStage[] = ["Reported", "Verified", "In build", "Piloting", "Adopted"];
export const STATES = Array.from(new Set(PROBLEMS.map((p) => p.state))).sort();

export const problemById = (id: string) => PROBLEMS.find((p) => p.id === id);

export type StudentTeam = {
  id: string;
  name: string;
  department: string;
  mentor: string;
  members: number;
  problemId: string;
  status: "Forming" | "Building" | "Pilot review" | "Submitted";
  progress: number;
  lastUpdate: string;
};

export const TEAMS: StudentTeam[] = [
  {
    id: "LS-TEAM-1187",
    name: "Drain Sentinels",
    department: "Civil Engineering, MANIT",
    mentor: "Prof. A. Deshmukh",
    members: 5,
    problemId: "LS-2411",
    status: "Building",
    progress: 62,
    lastUpdate: "Sensor node 3 calibrated at Kamla Nagar",
  },
  {
    id: "LS-TEAM-1202",
    name: "ColdBox Collective",
    department: "Mechanical Engineering, MNIT",
    mentor: "Dr. R. Sharma",
    members: 4,
    problemId: "LS-2388",
    status: "Pilot review",
    progress: 84,
    lastUpdate: "41-day spoilage-free run submitted for NGO sign-off",
  },
  {
    id: "LS-TEAM-1214",
    name: "Squall Watch",
    department: "Ocean Engineering, NIT Rourkela",
    mentor: "Dr. P. Mohanty",
    members: 6,
    problemId: "LS-2401",
    status: "Building",
    progress: 38,
    lastUpdate: "Buoy telemetry parser passing 92% of test frames",
  },
  {
    id: "LS-TEAM-1231",
    name: "Setu Mobility",
    department: "Information Technology, SSN",
    mentor: "Prof. K. Iyer",
    members: 4,
    problemId: "LS-2299",
    status: "Submitted",
    progress: 100,
    lastUpdate: "Handover pack accepted by district administration",
  },
  {
    id: "LS-TEAM-1240",
    name: "Baler Bandhu",
    department: "Computer Science, Thapar",
    mentor: "Unassigned",
    members: 3,
    problemId: "LS-2450",
    status: "Forming",
    progress: 8,
    lastUpdate: "Awaiting mentor allocation",
  },
];

export const teamById = (id: string) => TEAMS.find((t) => t.id === id);
