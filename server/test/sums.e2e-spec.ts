import { INestApplication } from '@nestjs/common';
import { RoleKey } from '@prisma/client';
import request, { Response } from 'supertest';
import { PrismaService } from '../src/common/prisma/prisma.service';
import { configureApp } from '../src/main';

describe('SUMS API (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  const password = process.env.SEED_DEMO_PASSWORD ?? 'SumsDemo!2026';
  const roleChecks: Array<[RoleKey, string, string]> = [
    [RoleKey.student, 'student@up.edu.ps', '/api/v1/grades/transcript'],
    [RoleKey.instructor, 'instructor@up.edu.ps', '/api/v1/attendance/sections'],
    [RoleKey.advisor, 'advisor@up.edu.ps', '/api/v1/students'],
    [RoleKey.registrar, 'registrar@up.edu.ps', '/api/v1/terms'],
    [RoleKey.admin, 'admin@up.edu.ps', '/api/v1/users'],
    [RoleKey.depthead, 'depthead@up.edu.ps', '/api/v1/staff'],
    [RoleKey.coordinator, 'coordinator@up.edu.ps', '/api/v1/curriculum'],
    [RoleKey.dean, 'dean@up.edu.ps', '/api/v1/analytics'],
    [RoleKey.uniregistrar, 'uniregistrar@up.edu.ps', '/api/v1/academic-policies'],
  ];

  beforeAll(async () => {
    const configured = await configureApp();
    app = configured.app;
    prisma = app.get(PrismaService);
    await app.init();
  }, 30_000);

  afterAll(async () => {
    await app.close();
  });

  const login = (identifier: string, requestedRole: RoleKey) =>
    request(app.getHttpServer()).post('/api/v1/auth/login').send({ identifier, password, requestedRole });

  const refreshCookie = (response: Response) => {
    const header = response.headers['set-cookie'] as unknown;
    const value = Array.isArray(header) ? String(header[0]) : String(header);
    return value.split(';')[0];
  };

  it('reports database readiness', async () => {
    await request(app.getHttpServer())
      .get('/api/v1/health/ready')
      .expect(200)
      .expect(({ body }) => expect(body.database).toBe('reachable'));
  });

  it('authenticates a seeded account and exposes the current user without leaking the refresh token', async () => {
    const response = await login('student@up.edu.ps', RoleKey.student).expect(200);
    expect(response.body.data.accessToken).toEqual(expect.any(String));
    expect(response.body.data.refreshToken).toBeUndefined();
    expect(response.headers['set-cookie']?.[0]).toContain('HttpOnly');

    await request(app.getHttpServer())
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${response.body.data.accessToken}`)
      .expect(200)
      .expect(({ body }) => expect(body.data.activeRole).toBe(RoleKey.student));
  });

  it.each(roleChecks)(
    'authenticates %s and authorizes its representative protected endpoint',
    async (role, email, endpoint) => {
      const response = await login(email, role).expect(200);
      expect(response.body.data.user.activeRole).toBe(role);
      expect(response.body.data.user.roles).toContain(role);
      await request(app.getHttpServer())
        .get(endpoint)
        .set('Authorization', `Bearer ${response.body.data.accessToken}`)
        .expect(200);
    },
  );

  it('returns the same generic authentication failure for unknown users and bad passwords', async () => {
    const unknown = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ identifier: 'unknown@up.edu.ps', password: 'WrongPassword!1', requestedRole: RoleKey.student })
      .expect(401);
    const badPassword = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ identifier: 'student@up.edu.ps', password: 'WrongPassword!1', requestedRole: RoleKey.student })
      .expect(401);
    expect(unknown.body.code).toBe('INVALID_CREDENTIALS');
    expect(badPassword.body.code).toBe(unknown.body.code);
    expect(badPassword.body.message).toBe(unknown.body.message);
  });

  it('denies a student access to the administrator user list', async () => {
    const response = await login('student@up.edu.ps', RoleKey.student).expect(200);
    await request(app.getHttpServer())
      .get('/api/v1/users')
      .set('Authorization', `Bearer ${response.body.data.accessToken}`)
      .expect(403);
  });

  it('prevents a student from reading another student transcript', async () => {
    const response = await login('student@up.edu.ps', RoleKey.student).expect(200);
    const otherStudent = await prisma.studentProfile.findFirstOrThrow({
      where: { universityId: { not: '2202100054' } },
      select: { id: true },
    });
    await request(app.getHttpServer())
      .get(`/api/v1/grades/transcript?studentId=${otherStudent.id}`)
      .set('Authorization', `Bearer ${response.body.data.accessToken}`)
      .expect(403);
  });

  it('prevents an instructor from reading an unassigned section gradebook', async () => {
    const response = await login('instructor@up.edu.ps', RoleKey.instructor).expect(200);
    const unassigned = await prisma.courseSection.findFirstOrThrow({
      where: { instructors: { none: {} } },
      select: { id: true },
    });
    await request(app.getHttpServer())
      .get(`/api/v1/grades/sections/${unassigned.id}`)
      .set('Authorization', `Bearer ${response.body.data.accessToken}`)
      .expect(403);
  });

  it('rotates refresh tokens and rejects reuse of the previous token', async () => {
    const original = await login('student@up.edu.ps', RoleKey.student).expect(200);
    const originalCookie = refreshCookie(original);
    const rotated = await request(app.getHttpServer())
      .post('/api/v1/auth/refresh')
      .set('Cookie', originalCookie)
      .expect(200);
    expect(refreshCookie(rotated)).not.toBe(originalCookie);

    await request(app.getHttpServer())
      .post('/api/v1/auth/refresh')
      .set('Cookie', originalCookie)
      .expect(401)
      .expect(({ body }) => expect(body.code).toBe('REFRESH_TOKEN_REUSE'));
  });

  it('revokes the active session on logout', async () => {
    const response = await login('student@up.edu.ps', RoleKey.student).expect(200);
    const cookie = refreshCookie(response);
    await request(app.getHttpServer())
      .post('/api/v1/auth/logout')
      .set('Authorization', `Bearer ${response.body.data.accessToken}`)
      .set('Cookie', cookie)
      .expect(204);
    await request(app.getHttpServer()).post('/api/v1/auth/refresh').set('Cookie', cookie).expect(401);
  });
});
