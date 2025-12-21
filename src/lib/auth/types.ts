export interface SessionUser {
  id: string;
  email: string;
  name?: string;
  tenantId: string;
}

export interface SessionPayload extends SessionUser {
  exp: number;
  iat: number;
}
