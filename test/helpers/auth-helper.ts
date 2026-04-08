import * as request from 'supertest';
import { INestApplication } from '@nestjs/common';

/**
 * Test icin auth helper'lari.
 * Login yapip JWT token alir, authenticated request yapar.
 */
export class AuthHelper {
  private token: string;

  constructor(private app: INestApplication) {}

  /** Admin kullanici ile login */
  async loginAsAdmin(email = 'admin@test.com', password = 'Admin123!'): Promise<string> {
    const res = await request(this.app.getHttpServer())
      .post('/api/auth/login')
      .send({ email, password })
      .expect(201);

    this.token = res.body?.data?.access_token || res.body?.access_token;
    return this.token;
  }

  /** Authenticated GET request */
  get(url: string, tenantId?: string) {
    const req = request(this.app.getHttpServer())
      .get(`/api${url}`)
      .set('Authorization', `Bearer ${this.token}`);
    if (tenantId) req.set('x-tenant-id', tenantId);
    return req;
  }

  /** Authenticated POST request */
  post(url: string, body: any, tenantId?: string) {
    const req = request(this.app.getHttpServer())
      .post(`/api${url}`)
      .set('Authorization', `Bearer ${this.token}`)
      .send(body);
    if (tenantId) req.set('x-tenant-id', tenantId);
    return req;
  }

  /** Authenticated PATCH request */
  patch(url: string, body: any, tenantId?: string) {
    const req = request(this.app.getHttpServer())
      .patch(`/api${url}`)
      .set('Authorization', `Bearer ${this.token}`)
      .send(body);
    if (tenantId) req.set('x-tenant-id', tenantId);
    return req;
  }

  /** Authenticated DELETE request */
  delete(url: string, tenantId?: string) {
    const req = request(this.app.getHttpServer())
      .delete(`/api${url}`)
      .set('Authorization', `Bearer ${this.token}`);
    if (tenantId) req.set('x-tenant-id', tenantId);
    return req;
  }

  getToken(): string {
    return this.token;
  }
}
