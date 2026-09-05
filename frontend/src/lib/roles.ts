import type { BackendRole } from "@/types/auth";

export interface RoleMetadata {
  key: BackendRole;
  label: string;
  tagline: string;
  accent: "orange" | "green" | "ink";
  authTitle: string;
  authNote: string;
  credentialLabel: string;
  credentialPlaceholder: string;
  dashboardPath: string;
}

/**
 * 5 authoritative backend roles and their UI metadata.
 * "team" is NOT a backend role — student teams operate under the University workspace.
 */
export const BACKEND_ROLES: RoleMetadata[] = [
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

export const getRoleMetadata = (key: string): RoleMetadata | undefined => {
  return BACKEND_ROLES.find((r) => r.key === key);
};

export const ROLE_DASHBOARDS: Record<BackendRole, string> = {
  citizen: "/citizen",
  government: "/government",
  university: "/university",
  ngo: "/ngo",
  industry: "/industry",
};

export const getDashboardForRole = (role: string): string => {
  if (role === "team") return "/university/teams";
  return ROLE_DASHBOARDS[role as BackendRole] || "/citizen";
};
