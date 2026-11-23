// Shown in the logo and on the login page (the browser tab title is in index.html)
export const APP_NAME = 'My App';

// The server's roles (server/src/models/user.model.js)
export const ROLES = { admin: 'admin', user: 'user' };
export const ALL_ROLES = Object.values(ROLES);

// How each server role is shown to people
export const ROLE_LABELS = { [ROLES.admin]: 'Admin', [ROLES.user]: 'User' };
