import { ConflictException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { Prisma } from '../../generated/prisma/client.js';
import { TaskService } from './task.service.js';

function uniqueViolation(constraint: string) {
  return new Prisma.PrismaClientKnownRequestError(
    `Unique constraint failed on the constraint: \`${constraint}\``,
    { code: 'P2002', clientVersion: '7.10.1', meta: {} },
  );
}

function makeFakeClient() {
  const task = { findUnique: vi.fn(), findFirst: vi.fn().mockResolvedValue(null), findMany: vi.fn(), count: vi.fn(), create: vi.fn(), update: vi.fn(), delete: vi.fn() };
  const teamMember = { findUnique: vi.fn() };
  const taskCompletion = { create: vi.fn(), delete: vi.fn() };
  const hackathon = { findUnique: vi.fn() };
  return { client: { task, teamMember, taskCompletion, hackathon }, task, teamMember, taskCompletion, hackathon };
}

describe('TaskService', () => {
  describe('create', () => {
    it('sets order to the current task count', async () => {
      const { client, hackathon, task } = makeFakeClient();
      hackathon.findUnique.mockResolvedValue({ id: 'h1' });
      task.count.mockResolvedValue(3);
      task.create.mockResolvedValue({ id: 't1', order: 3 });

      const service = new TaskService({ client } as any);
      const result = await service.create('h1', { title: 'Submit idea' });
      expect(task.create).toHaveBeenCalledWith({
        data: { hackathonId: 'h1', title: 'Submit idea', description: undefined, order: 3 },
      });
      expect(result.order).toBe(3);
    });
  });

  describe('create (duplicates)', () => {
    it('rejects a task whose title already exists in the hackathon, ignoring case', async () => {
      const { client, hackathon, task } = makeFakeClient();
      hackathon.findUnique.mockResolvedValue({ id: 'h1' });
      task.findFirst.mockResolvedValue({ id: 'existing' });

      const service = new TaskService({ client } as any);
      await expect(service.create('h1', { title: '  submit IDEA ' })).rejects.toBeInstanceOf(ConflictException);
      expect(task.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({ where: expect.objectContaining({ hackathonId: 'h1', title: { equals: 'submit IDEA', mode: 'insensitive' } }) }),
      );
      expect(task.create).not.toHaveBeenCalled();
    });
  });

  describe('complete', () => {
    it('rejects a caller with no team in the task\'s hackathon', async () => {
      const { client, task, teamMember } = makeFakeClient();
      task.findUnique.mockResolvedValue({ id: 'task1', hackathonId: 'h1' });
      teamMember.findUnique.mockResolvedValue(null);

      const service = new TaskService({ client } as any);
      await expect(service.complete('task1', 'u1')).rejects.toThrow(ForbiddenException);
    });

    it('rejects completing an already-complete task for the same team', async () => {
      const { client, task, teamMember, taskCompletion } = makeFakeClient();
      task.findUnique.mockResolvedValue({ id: 'task1', hackathonId: 'h1' });
      teamMember.findUnique.mockResolvedValue({ teamId: 'team1' });
      taskCompletion.create.mockRejectedValue(uniqueViolation('task_completion_taskId_teamId_key'));

      const service = new TaskService({ client } as any);
      await expect(service.complete('task1', 'u1')).rejects.toThrow(ConflictException);
    });

    it('creates the completion for the caller\'s team', async () => {
      const { client, task, teamMember, taskCompletion } = makeFakeClient();
      task.findUnique.mockResolvedValue({ id: 'task1', hackathonId: 'h1' });
      teamMember.findUnique.mockResolvedValue({ teamId: 'team1' });
      taskCompletion.create.mockResolvedValue({ taskId: 'task1', teamId: 'team1', completedByUserId: 'u1' });

      const service = new TaskService({ client } as any);
      const result = await service.complete('task1', 'u1');
      expect(result.teamId).toBe('team1');
    });
  });

  describe('uncomplete', () => {
    it('throws NotFoundException when no completion exists for the team', async () => {
      const { client, task, teamMember, taskCompletion } = makeFakeClient();
      task.findUnique.mockResolvedValue({ id: 'task1', hackathonId: 'h1' });
      teamMember.findUnique.mockResolvedValue({ teamId: 'team1' });
      taskCompletion.delete.mockRejectedValue(
        new Prisma.PrismaClientKnownRequestError('Record not found', {
          code: 'P2025',
          clientVersion: '7.10.1',
        }),
      );

      const service = new TaskService({ client } as any);
      await expect(service.uncomplete('task1', 'u1')).rejects.toThrow(NotFoundException);
    });
  });

  describe('listByHackathon', () => {
    it('hides tasks for a DRAFT hackathon from a non-admin', async () => {
      const { client, hackathon } = makeFakeClient();
      hackathon.findUnique.mockResolvedValue({ id: 'h1', status: 'DRAFT' });

      const service = new TaskService({ client } as any);
      await expect(service.listByHackathon('h1', 'PARTICIPANT', 'u1')).rejects.toThrow(NotFoundException);
    });
  });
});
