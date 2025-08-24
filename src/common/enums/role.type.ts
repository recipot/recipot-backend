export const Role = {
  Admin: 'Admin',
  Paid: 'Paid',
  General: 'General',
} as const;
export type Role = (typeof Role)[keyof typeof Role];
