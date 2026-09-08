/**
 * Canonical role routes.
 *
 * Defined once so the header, the landing page, and future dashboards
 * cannot drift out of sync.
 */

export interface RoleRoute {
  href: string;
  label: string;
  description: string;
}

export const ROLE_ROUTES: readonly RoleRoute[] = [
  {
    href: "/citizen",
    label: "Citizen",
    description: "Report a local problem with a photo and location.",
  },
  {
    href: "/government",
    label: "Government",
    description: "Validate, prioritise, and track clustered challenges.",
  },
  {
    href: "/university",
    label: "University",
    description: "Adopt challenges as student and faculty projects.",
  },
  {
    href: "/ngo",
    label: "NGO",
    description: "Contribute field knowledge and ground validation.",
  },
  {
    href: "/industry",
    label: "Industry",
    description: "Sponsor pilots and help scale proven solutions.",
  },
] as const;
