export function ensureAuthorizedTenant(entityTenantId: string, sessionTenantId: string) {
  if (entityTenantId !== sessionTenantId) {
    throw new Error('No autorizado para operar sobre este recurso');
  }
}

export function isSameTenant(entityTenantId: string, sessionTenantId: string): boolean {
  try {
    ensureAuthorizedTenant(entityTenantId, sessionTenantId);
    return true;
  } catch {
    return false;
  }
}
