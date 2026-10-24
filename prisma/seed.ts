import 'dotenv/config';
import { PrismaClient } from '../generated/prisma/client.js';
import { PrismaPg } from '@prisma/adapter-pg';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
  const admin = await prisma.user.upsert({
    where: { email: 'admin@hackathon.dev' },
    update: {},
    create: {
      email: 'admin@hackathon.dev',
      name: 'Hackathon Admin',
      emailVerified: true,
      role: 'ADMIN',
    },
  });

  const participants = await Promise.all(
    [
      { email: 'alice@hackathon.dev', name: 'Alice Khan' },
      { email: 'bob@hackathon.dev', name: 'Bob Rivera' },
      { email: 'chen@hackathon.dev', name: 'Chen Wu' },
      { email: 'dina@hackathon.dev', name: 'Dina Osei' },
    ].map((u) =>
      prisma.user.upsert({
        where: { email: u.email },
        update: {},
        create: { ...u, emailVerified: true, role: 'PARTICIPANT' },
      }),
    ),
  );

  const hackathon = await prisma.hackathon.upsert({
    where: { id: 'seed-hackathon-2026' },
    update: {},
    create: {
      id: 'seed-hackathon-2026',
      title: 'Build-a-thon 2026',
      description: 'A 48-hour hackathon for building full-stack apps with NestJS and Prisma.',
      startDate: new Date('2026-11-14T09:00:00Z'),
      endDate: new Date('2026-11-16T18:00:00Z'),
      location: 'San Francisco, CA',
      maxTeams: 20,
    },
  });

  const teamAlpha = await prisma.team.upsert({
    where: { hackathonId_name: { hackathonId: hackathon.id, name: 'Team Alpha' } },
    update: {},
    create: {
      name: 'Team Alpha',
      description: 'Building a real-time collaboration tool.',
      hackathonId: hackathon.id,
    },
  });

  const teamBeta = await prisma.team.upsert({
    where: { hackathonId_name: { hackathonId: hackathon.id, name: 'Team Beta' } },
    update: {},
    create: {
      name: 'Team Beta',
      description: 'Building an AI-powered scheduling assistant.',
      hackathonId: hackathon.id,
    },
  });

  const [alice, bob, chen, dina] = participants;

  await prisma.teamMember.upsert({
    where: { teamId_userId: { teamId: teamAlpha.id, userId: alice.id } },
    update: {},
    create: { teamId: teamAlpha.id, userId: alice.id, role: 'LEAD' },
  });
  await prisma.teamMember.upsert({
    where: { teamId_userId: { teamId: teamAlpha.id, userId: bob.id } },
    update: {},
    create: { teamId: teamAlpha.id, userId: bob.id, role: 'MEMBER' },
  });
  await prisma.teamMember.upsert({
    where: { teamId_userId: { teamId: teamBeta.id, userId: chen.id } },
    update: {},
    create: { teamId: teamBeta.id, userId: chen.id, role: 'LEAD' },
  });
  await prisma.teamMember.upsert({
    where: { teamId_userId: { teamId: teamBeta.id, userId: dina.id } },
    update: {},
    create: { teamId: teamBeta.id, userId: dina.id, role: 'MEMBER' },
  });

  console.log('Seed complete:', {
    admin: admin.email,
    participants: participants.map((p) => p.email),
    hackathon: hackathon.title,
    teams: [teamAlpha.name, teamBeta.name],
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
