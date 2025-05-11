export interface PlanFeatures {
  eventsPerMonth: number;
  projects?: number;
  webhook?: boolean | number;
  maxTeamMembers?: number;
  retentionDays?: number;
  alert?: string[];
  customDomain?: boolean;
  sso?: boolean;
  prioritySupport?: boolean;
  customIntegration?: boolean;
} 