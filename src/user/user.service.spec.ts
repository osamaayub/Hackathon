import { ConflictException } from '@nestjs/common';
import { UserService } from './user.service.js';

function makeFakeClient() {
  const user = {
    findUnique: vi.fn(),
    update: vi.fn(),
    count: vi.fn(),
    findMany: vi.fn(),
  };
  return { client: { user }, user };
}

describe('UserService', () => {
  describe('updateRole', () => {
    it('rejects demoting the last remaining admin', async () => {
      const { client, user } = makeFakeClient();
      user.findUnique.mockResolvedValue({ id: 'u1', role: 'ADMIN' });
      user.count.mockResolvedValue(1);

      const service = new UserService({ client } as any);
      await expect(service.updateRole('u1', { role: 'PARTICIPANT' })).rejects.toThrow(ConflictException);
      expect(user.update).not.toHaveBeenCalled();
    });

    it('allows demoting an admin when other admins remain', async () => {
      const { client, user } = makeFakeClient();
      user.findUnique.mockResolvedValue({ id: 'u1', role: 'ADMIN' });
      user.count.mockResolvedValue(2);
      user.update.mockResolvedValue({ id: 'u1', role: 'PARTICIPANT' });

      const service = new UserService({ client } as any);
      const result = await service.updateRole('u1', { role: 'PARTICIPANT' });
      expect(result.role).toBe('PARTICIPANT');
    });

    it('allows promoting a participant to admin without checking the admin count', async () => {
      const { client, user } = makeFakeClient();
      user.findUnique.mockResolvedValue({ id: 'u1', role: 'PARTICIPANT' });
      user.update.mockResolvedValue({ id: 'u1', role: 'ADMIN' });

      const service = new UserService({ client } as any);
      const result = await service.updateRole('u1', { role: 'ADMIN' });
      expect(user.count).not.toHaveBeenCalled();
      expect(result.role).toBe('ADMIN');
    });
  });
});
