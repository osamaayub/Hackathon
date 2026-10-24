import { ConflictException, NotFoundException } from '@nestjs/common';
import { HackathonService } from './hackathon.service.js';

function makeFakeClient() {
  const hackathon = {
    findUnique: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    findMany: vi.fn(),
    count: vi.fn(),
  };
  return { client: { hackathon }, hackathon };
}

describe('HackathonService', () => {
  describe('update (status transitions)', () => {
    it('rejects an invalid transition (DRAFT -> CLOSED)', async () => {
      const { client, hackathon } = makeFakeClient();
      hackathon.findUnique.mockResolvedValue({ id: 'h1', status: 'DRAFT', _count: { teams: 0 } });

      const service = new HackathonService({ client } as any);
      await expect(service.update('h1', { status: 'CLOSED' })).rejects.toThrow(ConflictException);
      expect(hackathon.update).not.toHaveBeenCalled();
    });

    it('rejects un-publishing a hackathon that already has teams', async () => {
      const { client, hackathon } = makeFakeClient();
      hackathon.findUnique.mockResolvedValue({ id: 'h1', status: 'PUBLISHED', _count: { teams: 2 } });

      const service = new HackathonService({ client } as any);
      await expect(service.update('h1', { status: 'DRAFT' })).rejects.toThrow(ConflictException);
    });

    it('allows PUBLISHED -> CLOSED', async () => {
      const { client, hackathon } = makeFakeClient();
      hackathon.findUnique.mockResolvedValue({ id: 'h1', status: 'PUBLISHED', _count: { teams: 3 } });
      hackathon.update.mockResolvedValue({ id: 'h1', status: 'CLOSED' });

      const service = new HackathonService({ client } as any);
      const result = await service.update('h1', { status: 'CLOSED' });
      expect(result.status).toBe('CLOSED');
    });

    it('throws NotFoundException for a missing hackathon', async () => {
      const { client, hackathon } = makeFakeClient();
      hackathon.findUnique.mockResolvedValue(null);

      const service = new HackathonService({ client } as any);
      await expect(service.update('missing', { title: 'x' })).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('rejects deleting a hackathon that already has teams', async () => {
      const { client, hackathon } = makeFakeClient();
      hackathon.findUnique.mockResolvedValue({ id: 'h1', _count: { teams: 1 } });

      const service = new HackathonService({ client } as any);
      await expect(service.remove('h1')).rejects.toThrow(ConflictException);
      expect(hackathon.delete).not.toHaveBeenCalled();
    });

    it('deletes a hackathon with no teams', async () => {
      const { client, hackathon } = makeFakeClient();
      hackathon.findUnique.mockResolvedValue({ id: 'h1', _count: { teams: 0 } });

      const service = new HackathonService({ client } as any);
      const result = await service.remove('h1');
      expect(hackathon.delete).toHaveBeenCalledWith({ where: { id: 'h1' } });
      expect(result).toEqual({ success: true });
    });
  });

  describe('findOne (visibility)', () => {
    it('hides a DRAFT hackathon from a non-admin as a 404', async () => {
      const { client, hackathon } = makeFakeClient();
      hackathon.findUnique.mockResolvedValue({ id: 'h1', status: 'DRAFT' });

      const service = new HackathonService({ client } as any);
      await expect(service.findOne('h1', 'PARTICIPANT')).rejects.toThrow(NotFoundException);
    });

    it('shows a DRAFT hackathon to an admin', async () => {
      const { client, hackathon } = makeFakeClient();
      hackathon.findUnique.mockResolvedValue({ id: 'h1', status: 'DRAFT' });

      const service = new HackathonService({ client } as any);
      const result = await service.findOne('h1', 'ADMIN');
      expect(result.id).toBe('h1');
    });
  });
});
