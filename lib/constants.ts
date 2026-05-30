export const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME || 'ScanServe';
export const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

export const PLANS = ['free', 'starter', 'pro', 'business'] as const;
export type Plan = (typeof PLANS)[number];

export const ORDER_STATUSES = [
  'pending',
  'confirmed',
  'preparing',
  'ready',
  'completed',
  'cancelled',
] as const;

export const TEAM_ROLES = ['owner', 'manager', 'staff'] as const;

export const RATE_LIMITS = {
  guest: 60,
  authed: 300,
  publicMenu: 1000,
} as const;

export const OTP_MAX_ATTEMPTS = 5;
export const OTP_LOCK_MINUTES = 15;
export const OTP_RESEND_SECONDS = 60;

export const MENU_TEMPLATES = [
  'indian',
  'chinese',
  'fast-food',
  'cafe',
  'bakery',
  'custom',
] as const;

export type MenuTemplate = (typeof MENU_TEMPLATES)[number];
