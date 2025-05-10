export interface PlanFeatures {
  eventsPerMonth: number;
  maxProjects?: number;
  maxTeamMembers?: number;
  maxWebhooks?: number;
  retentionDays?: number;
  customDomain?: boolean;
  sso?: boolean;
  prioritySupport?: boolean;
  customIntegration?: boolean;
} 