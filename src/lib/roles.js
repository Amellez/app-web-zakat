// src/lib/roles.js
export const ROLES = {
  SUPER_ADMIN: 'super_admin',
  ADMIN_MOSQUEE: 'admin_mosquee',
  BENEVOLE: 'benevole'
};

export const PERMISSIONS = {
  super_admin: {
    canCreateMosquee: true,
    canDeleteMosquee: true,
    canManageUsers: true,
    canAccessAllMosquees: true,
    canModifyInventaire: true,
    canModifyBeneficiaires: true,
    canGeneratePacks: true,
    canCreateItineraires: true
  },
  admin_mosquee: {
    canCreateMosquee: false,
    canDeleteMosquee: false,
    canManageUsers: false,
    canAccessAllMosquees: false,
    canModifyInventaire: true,
    canModifyBeneficiaires: true,
    canGeneratePacks: true,
    canCreateItineraires: true
  },
  benevole: {
    canCreateMosquee: false,
    canDeleteMosquee: false,
    canManageUsers: false,
    canAccessAllMosquees: false,
    canModifyInventaire: false,
    canModifyBeneficiaires: false,
    canGeneratePacks: false,
    canCreateItineraires: false
  }
};

export function hasPermission(userRole, permission) {
  return PERMISSIONS[userRole]?.[permission] || false;
}