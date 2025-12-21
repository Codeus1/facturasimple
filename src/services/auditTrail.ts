import type { SessionUser } from '@/lib/auth/types';

type AuditAction = 'create' | 'update' | 'delete' | 'login' | 'logout';

export interface AuditEvent {
  action: AuditAction;
  entity?: string;
  entityId?: string;
  tenantId: string;
  userId: string;
  timestamp: number;
  details?: Record<string, unknown>;
}

const auditBuffer: AuditEvent[] = [];
const MAX_BUFFER_SIZE = 200;

export function recordAudit(event: Omit<AuditEvent, 'timestamp'>): AuditEvent {
  const fullEvent: AuditEvent = { ...event, timestamp: Date.now() };
  auditBuffer.unshift(fullEvent);
  if (auditBuffer.length > MAX_BUFFER_SIZE) {
    auditBuffer.pop();
  }

  if (process.env.NODE_ENV !== 'production') {
    console.info('[AUDIT]', fullEvent);
  }

  return fullEvent;
}

export function listAuditTrail(tenantId?: string, user?: SessionUser): AuditEvent[] {
  return auditBuffer.filter(event => {
    if (tenantId && event.tenantId !== tenantId) return false;
    if (user && event.userId !== user.id) return false;
    return true;
  });
}
