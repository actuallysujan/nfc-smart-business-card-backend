// src/config/permissions.config.js

const PERMISSIONS = {
  SUPER_ADMIN: {
    canRegisterUsers: true,
    canDeleteUsers: true,
    canEditAllUsers: true,
    canViewAllUsers: true,
    canManageAdmins: true, // Can promote/demote admins
    canAccessAllCards: true,
  },
  ADMIN: {
    canRegisterUsers: false, // ❌ Only SUPER_ADMIN can register
    canDeleteUsers: false,
    canEditAllUsers: true,
    canViewAllUsers: true,
    canManageAdmins: false,
    canAccessAllCards: true,
  },
  USER: {
    canRegisterUsers: false,
    canDeleteUsers: false,
    canEditAllUsers: false,
    canViewAllUsers: false,
    canManageAdmins: false,
    canAccessAllCards: false, // Only their own cards
  },
};

// Helper function to check permissions
const hasPermission = (role, permission) => {
  return PERMISSIONS[role]?.[permission] || false;
};

// Check if role has higher privileges than another
const canManageRole = (managerRole, targetRole) => {
  const hierarchy = { SUPER_ADMIN: 3, ADMIN: 2, USER: 1 };
  return hierarchy[managerRole] > hierarchy[targetRole];
};

module.exports = { PERMISSIONS, hasPermission, canManageRole };