import { ForbiddenException, NotFoundException, ServiceUnavailableException } from '@nestjs/common';
import { CronController } from './cron.controller.js';
import { CronSecretGuard } from './cron-secret.guard.js';
import { CronService } from './cron.service.js';

function contextWith(authorization?: string) {
  return { switchToHttp: () => ({ getRequest: () => ({ headers: { authorization } }) }) } as any;
}

describe('CronSecretGuard', () => {
  const guard = new CronSecretGuard();
  const original = process.env.CRON_SECRET;
  afterEach(() => {
    if (original === undefined) delete process.env.CRON_SECRET;
    else process.env.CRON_SECRET = original;
  });

  it('refuses everything while CRON_SECRET is not set', () => {
    delete process.env.CRON_SECRET;
    expect(() => guard.canActivate(contextWith('Bearer anything'))).toThrow(ServiceUnavailableException);
  });

  it('rejects a missing or wrong secret', () => {
    process.env.CRON_SECRET = 'correct-secret-value';
    expect(() => guard.canActivate(contextWith(undefined))).toThrow(ForbiddenException);
    expect(() => guard.canActivate(contextWith('Bearer wrong'))).toThrow(ForbiddenException);
    expect(() => guard.canActivate(contextWith('correct-secret-value'))).toThrow(ForbiddenException); // needs "Bearer "
  });

  it('accepts the right secret', () => {
    process.env.CRON_SECRET = 'correct-secret-value';
    expect(guard.canActivate(contextWith('Bearer correct-secret-value'))).toBe(true);
  });
});

describe('CronService', () => {
  function makeService() {
    const session = { deleteMany: vi.fn().mockResolvedValue({ count: 4 }) };
    const verification = { deleteMany: vi.fn().mockResolvedValue({ count: 2 }) };
    const community = { refresh: vi.fn().mockResolvedValue({ leaderboardRows: 3, projects: 8 }) };
    const service = new CronService({ client: { session, verification } } as any, community as any);
    return { service, session, verification, community };
  }

  it('cleanup removes only expired sessions and tokens', async () => {
    const { service, session, verification } = makeService();
    const result = await service.run('cleanup');
    expect(session.deleteMany).toHaveBeenCalledWith({ where: { expiresAt: { lt: expect.any(Date) } } });
    expect(verification.deleteMany).toHaveBeenCalledWith({ where: { expiresAt: { lt: expect.any(Date) } } });
    expect(result).toMatchObject({ job: 'cleanup', expiredSessionsRemoved: 4, expiredTokensRemoved: 2 });
  });

  it('warm-cache refreshes the cached leaderboard and projects', async () => {
    const { service, community } = makeService();
    const result = await service.run('warm-cache');
    expect(community.refresh).toHaveBeenCalledTimes(1);
    expect(result).toMatchObject({ job: 'warm-cache', leaderboardRows: 3, projects: 8 });
  });

  it('in process schedules do nothing on Vercel', async () => {
    const { service, community } = makeService();
    process.env.VERCEL = '1';
    try {
      await service.scheduledWarmCache();
      expect(community.refresh).not.toHaveBeenCalled();
    } finally {
      delete process.env.VERCEL;
    }
  });
});

describe('CronController', () => {
  it('rejects an unknown job name', async () => {
    const controller = new CronController({ run: vi.fn() } as any);
    await expect(controller.run('drop-database')).rejects.toBeInstanceOf(NotFoundException);
  });

  it('runs a known job', async () => {
    const run = vi.fn().mockResolvedValue({ job: 'cleanup' });
    const controller = new CronController({ run } as any);
    await expect(controller.run('cleanup')).resolves.toEqual({ job: 'cleanup' });
    expect(run).toHaveBeenCalledWith('cleanup');
  });
});
