import { NotFoundException } from '@nestjs/common';
import { ScheduleService } from './schedule.service.js';

function makeFakeClient() {
  const hackathon = { findUnique: vi.fn() };
  const scheduleItem = { findMany: vi.fn(), count: vi.fn(), create: vi.fn() };
  return { client: { hackathon, scheduleItem }, hackathon, scheduleItem };
}

describe('ScheduleService', () => {
  describe('listByHackathon', () => {
    it('hides schedule items for a DRAFT hackathon from a non-admin', async () => {
      const { client, hackathon } = makeFakeClient();
      hackathon.findUnique.mockResolvedValue({ id: 'h1', status: 'DRAFT' });

      const service = new ScheduleService({ client } as any);
      await expect(service.listByHackathon('h1', 'PARTICIPANT')).rejects.toThrow(NotFoundException);
    });

    it('allows an admin to see DRAFT schedule items', async () => {
      const { client, hackathon, scheduleItem } = makeFakeClient();
      hackathon.findUnique.mockResolvedValue({ id: 'h1', status: 'DRAFT' });
      scheduleItem.findMany.mockResolvedValue([{ id: 's1', title: 'Opening', time: new Date() }]);
      scheduleItem.count.mockResolvedValue(1);

      const service = new ScheduleService({ client } as any);
      const result = await service.listByHackathon('h1', 'ADMIN');
      expect(result.total).toBe(1);
    });
  });

  describe('create', () => {
    it('throws NotFoundException for a missing hackathon', async () => {
      const { client, hackathon } = makeFakeClient();
      hackathon.findUnique.mockResolvedValue(null);

      const service = new ScheduleService({ client } as any);
      await expect(service.create('missing', { title: 'x', time: '2026-01-01T00:00:00Z' })).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
