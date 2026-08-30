declare namespace Cloudflare {
  interface Env {
    DB: D1Database;
    AUTH_GATE?: string;
    CF_ACCESS_TEAM_DOMAIN?: string;
    CF_ACCESS_AUD?: string;
    ADMIN_EMAIL?: string;
    PUBLIC_CONTACT_EMAIL?: string;
    PUBLIC_DATA_OWNER?: string;
    PUBLIC_PRIVACY_REPLY_TIME?: string;
    PUBLIC_LAWFUL_BASIS?: string;
    PUBLIC_DATA_RECIPIENTS?: string;
    PUBLIC_INTAKE_ENABLED?: string;
    PUBLIC_INTAKE_PRIVACY_READY?: string;
    PUBLIC_INTAKE_STAFFED?: string;
    PILOT_PRIVACY_READY?: string;
    PILOT_RESPONSE_DELETE_DATE?: string;
    PILOT_INVITES_AUTHORIZED?: string;
    PILOT_INVITE_APPROVAL_REFERENCE?: string;
    PILOT_RECRUITMENT_PLAN?: string;
    PILOT_REPLY_READER?: string;
    RETENTION_CRON_SECRET?: string;
    DEEPSEEK_API_KEY?: string;
  }
}
