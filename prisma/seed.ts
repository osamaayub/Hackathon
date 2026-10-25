import 'dotenv/config';
import { PrismaClient } from '../generated/prisma/client.js';
import { PrismaPg } from '@prisma/adapter-pg';
import { createBetterAuth } from '../src/lib/auth/auth.config.js';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

const SEED_PASSWORD = 'password123';

const auth = createBetterAuth({ client: prisma } as any, {
  sendVerificationEmail: async () => {},
} as any);

/** Creates the user through better-auth (so it gets a real, correctly hashed password credential), idempotently. */
async function ensureUser(email: string, name: string) {
  const existing = await prisma.user.findUnique({ where: { email } });
  if (!existing) {
    await auth.api.signUpEmail({ body: { email, password: SEED_PASSWORD, name } });
  }
  return prisma.user.update({
    where: { email },
    data: { emailVerified: true },
  });
}


// ---------------------------------------------------------------------------
// Extra demo data: more users and hackathons at every stage, with teams, tasks,
// schedules, task completions and submissions. Everything uses fixed ids or
// natural unique keys, so re-running the seed never duplicates rows.
// ---------------------------------------------------------------------------

const EXTRA_USERS: [handle: string, name: string][] = [
  ['eva', 'Eva Lindqvist'],
  ['farid', 'Farid Haddad'],
  ['grace', 'Grace Okafor'],
  ['hiro', 'Hiro Tanaka'],
  ['ines', 'Ines Carvalho'],
  ['jamal', 'Jamal Reid'],
  ['kira', 'Kira Novak'],
  ['liam', 'Liam Brooks'],
];

interface SeedTeam {
  name: string;
  description: string;
  /** Handles of the members. The first one is the team leader. */
  members: string[];
  /** How many of the hackathon's tasks this team has completed. */
  tasksDone: number;
  submission?: { link: string; description: string; at: string };
}

interface SeedHackathon {
  id: string;
  title: string;
  description: string;
  start: string;
  end: string;
  location: string | null;
  status: 'DRAFT' | 'PUBLISHED' | 'CLOSED';
  maxTeams: number;
  maxTeamSize: number;
  tasks: [title: string, description: string][];
  schedule: [title: string, at: string][];
  teams: SeedTeam[];
}

const HACKATHONS: SeedHackathon[] = [
  {
    id: 'seed-hackathon-2026',
    title: 'Build-a-thon 2026',
    description: 'A 48-hour hackathon for building full-stack apps with NestJS and Prisma.',
    start: '2026-11-14T09:00:00Z',
    end: '2026-11-16T18:00:00Z',
    location: 'San Francisco, CA',
    status: 'PUBLISHED',
    maxTeams: 20,
    maxTeamSize: 4,
    tasks: [
      ['Form your team', 'Get at least two members on your team.'],
      ['Pick a problem', 'Agree on the problem you want to solve.'],
      ['Design the data model', 'Sketch the tables and relations you need.'],
      ['Ship a working demo', 'Have the main flow working end to end.'],
      ['Record a demo video', 'A 2 minute walkthrough for the judges.'],
    ],
    schedule: [
      ['Doors open and check in', '2026-11-14T09:00:00Z'],
      ['Opening keynote', '2026-11-14T10:00:00Z'],
      ['Hacking begins', '2026-11-14T11:00:00Z'],
      ['Mentor office hours', '2026-11-15T14:00:00Z'],
      ['Final demos and judging', '2026-11-16T15:00:00Z'],
    ],
    teams: [
      {
        name: 'Team Alpha',
        description: 'Building a real-time collaboration tool.',
        members: ['alice', 'bob'],
        tasksDone: 2,
        submission: {
          link: 'https://github.com/example/team-alpha-collab',
          description: 'A real-time collaborative whiteboard with presence, cursors and comments, built on WebSockets.',
          at: '2026-10-24T12:00:00Z',
        },
      },
    ],
  },
  {
    id: 'seed-ai-sprint-2026',
    title: 'AI Agents Sprint',
    description:
      'Four days to build an AI agent that does something genuinely useful. Tools, memory and evaluation welcome. Online and open to everyone.',
    start: '2026-10-22T09:00:00Z',
    end: '2026-10-27T18:00:00Z',
    location: null,
    status: 'PUBLISHED',
    maxTeams: 30,
    maxTeamSize: 4,
    tasks: [
      ['Register your team', 'Every member needs a verified account.'],
      ['Define the agent goal', 'One clear sentence on what your agent does.'],
      ['Connect your first tool', 'Give the agent at least one working tool.'],
      ['Add evaluation', 'Show how you measure that the agent works.'],
      ['Submit your project', 'Link to the repository and a short demo.'],
    ],
    schedule: [
      ['Kickoff call', '2026-10-22T09:00:00Z'],
      ['Workshop: tool use and function calling', '2026-10-23T15:00:00Z'],
      ['Mid sprint check in', '2026-10-25T12:00:00Z'],
      ['Final submission deadline', '2026-10-27T18:00:00Z'],
      ['Winners announced', '2026-10-28T16:00:00Z'],
    ],
    teams: [
      {
        name: 'Neural Nomads',
        description: 'A research agent that reads papers and writes cited summaries.',
        members: ['alice', 'eva', 'farid'],
        tasksDone: 4,
        submission: {
          link: 'https://github.com/example/neural-nomads',
          description: 'Paper Pilot reads a topic, finds sources, and writes a summary with citations you can click.',
          at: '2026-10-24T09:30:00Z',
        },
      },
      {
        name: 'Prompt Pioneers',
        description: 'A support agent that triages tickets and drafts replies.',
        members: ['bob', 'grace'],
        tasksDone: 3,
      },
      {
        name: 'Vector Vikings',
        description: 'Semantic search for engineering docs, with an agent on top.',
        members: ['chen', 'hiro', 'ines'],
        tasksDone: 5,
        submission: {
          link: 'https://github.com/example/vector-vikings',
          description: 'DocDive indexes your wiki and answers questions with links back to the exact page.',
          at: '2026-10-24T14:10:00Z',
        },
      },
      { name: 'Token Titans', description: 'Cost aware routing between small and large models.', members: ['dina', 'jamal'], tasksDone: 1 },
      { name: 'Agent Smiths', description: 'A QA agent that explores your app and files bugs.', members: ['kira', 'liam'], tasksDone: 2 },
    ],
  },
  {
    id: 'seed-green-tech-2026',
    title: 'Green Tech Challenge',
    description:
      'Build software that helps people and companies cut their carbon footprint. Energy, transport, food and waste are all fair game.',
    start: '2026-12-05T09:00:00Z',
    end: '2026-12-07T17:00:00Z',
    location: 'Berlin, Germany',
    status: 'PUBLISHED',
    maxTeams: 24,
    maxTeamSize: 5,
    tasks: [
      ['Choose an impact area', 'Energy, transport, food, waste or something new.'],
      ['Validate with data', 'Back your idea with a real data source.'],
      ['Build the prototype', 'A clickable or working prototype.'],
      ['Pitch it', 'Prepare a 3 minute pitch with impact numbers.'],
    ],
    schedule: [
      ['Welcome and team matching', '2026-12-05T09:00:00Z'],
      ['Hacking starts', '2026-12-05T11:00:00Z'],
      ['Sustainability expert panel', '2026-12-06T13:00:00Z'],
      ['Pitches and awards', '2026-12-07T15:00:00Z'],
    ],
    teams: [
      { name: 'Carbon Crushers', description: 'A personal carbon tracker with smart suggestions.', members: ['grace', 'hiro'], tasksDone: 0 },
      { name: 'Solar Sprouts', description: 'Planning tool for community rooftop solar.', members: ['eva', 'kira'], tasksDone: 0 },
    ],
  },
  {
    id: 'seed-web3-hack-2026',
    title: 'Open Web Hack',
    description: 'Decentralised identity, payments and open protocols. Ship something people can actually use.',
    start: '2027-01-16T09:00:00Z',
    end: '2027-01-18T17:00:00Z',
    location: 'Singapore',
    status: 'PUBLISHED',
    maxTeams: 16,
    maxTeamSize: 4,
    tasks: [
      ['Pick a protocol', 'Decide which open protocol you build on.'],
      ['Working testnet demo', 'Demonstrate the flow end to end.'],
      ['Write the docs', 'A README another developer can follow.'],
    ],
    schedule: [
      ['Opening session', '2027-01-16T09:00:00Z'],
      ['Hacking starts', '2027-01-16T10:30:00Z'],
      ['Demo day', '2027-01-18T14:00:00Z'],
    ],
    teams: [{ name: 'Chain Gang', description: 'Portable reputation across communities.', members: ['farid', 'jamal'], tasksDone: 0 }],
  },
  {
    id: 'seed-open-source-2026',
    title: 'Open Source Weekend',
    description: 'Two days of contributing to open source projects, with maintainers on hand to review in real time.',
    start: '2026-09-12T09:00:00Z',
    end: '2026-09-14T17:00:00Z',
    location: 'London, UK',
    status: 'CLOSED',
    maxTeams: 12,
    maxTeamSize: 4,
    tasks: [
      ['Pick a project', 'Choose a project with a good first issue.'],
      ['Open a pull request', 'Submit at least one pull request.'],
      ['Get a review', 'Address feedback from a maintainer.'],
    ],
    schedule: [
      ['Maintainer intros', '2026-09-12T09:00:00Z'],
      ['Contribute', '2026-09-12T10:30:00Z'],
      ['Wrap up and thanks', '2026-09-14T16:00:00Z'],
    ],
    teams: [
      {
        name: 'Merge Masters',
        description: 'Documentation and tooling fixes.',
        members: ['alice', 'grace', 'kira'],
        tasksDone: 3,
        submission: {
          link: 'https://github.com/example/merge-masters',
          description: 'Twelve merged pull requests across three projects, mostly docs and CI improvements.',
          at: '2026-09-14T12:00:00Z',
        },
      },
      {
        name: 'Patch Panda',
        description: 'Fixing flaky tests.',
        members: ['bob', 'hiro'],
        tasksDone: 3,
        submission: {
          link: 'https://github.com/example/patch-panda',
          description: 'Stabilised the test suite of a popular library, cutting flaky failures by 80 percent.',
          at: '2026-09-14T13:20:00Z',
        },
      },
      {
        name: 'Issue Hunters',
        description: 'Triage and reproduction.',
        members: ['chen', 'liam'],
        tasksDone: 2,
        submission: {
          link: 'https://github.com/example/issue-hunters',
          description: 'Reproduced and labelled over 60 issues, and fixed the five easiest ones.',
          at: '2026-09-14T15:45:00Z',
        },
      },
    ],
  },
  {
    id: 'seed-health-hack-2026',
    title: 'HealthTech Hack',
    description: 'Digital tools for patients and clinicians: scheduling, triage, accessibility and wellbeing.',
    start: '2026-08-01T09:00:00Z',
    end: '2026-08-03T17:00:00Z',
    location: null,
    status: 'CLOSED',
    maxTeams: 20,
    maxTeamSize: 4,
    tasks: [
      ['Talk to a user', 'Interview a patient or clinician.'],
      ['Build the prototype', 'A working prototype with sample data.'],
      ['Privacy review', 'Explain how you protect personal data.'],
    ],
    schedule: [
      ['Kickoff', '2026-08-01T09:00:00Z'],
      ['Clinician Q and A', '2026-08-02T12:00:00Z'],
      ['Demos', '2026-08-03T15:00:00Z'],
    ],
    teams: [
      {
        name: 'Pulse',
        description: 'Appointment reminders that reduce no shows.',
        members: ['dina', 'eva', 'ines'],
        tasksDone: 3,
        submission: {
          link: 'https://github.com/example/pulse-reminders',
          description: 'Smart SMS and email reminders that learn the best time to nudge each patient.',
          at: '2026-08-03T11:30:00Z',
        },
      },
      {
        name: 'Calm Coders',
        description: 'A guided breathing and mood journal app.',
        members: ['farid', 'jamal', 'liam'],
        tasksDone: 3,
        submission: {
          link: 'https://github.com/example/calm-coders',
          description: 'A privacy first wellbeing journal that keeps all data on the device.',
          at: '2026-08-03T13:05:00Z',
        },
      },
    ],
  },
  {
    id: 'seed-draft-hackathon',
    title: 'Winter Game Jam (draft)',
    description: 'A draft event only organizers can see. Dates and details are still being finalised.',
    start: '2027-02-20T09:00:00Z',
    end: '2027-02-22T17:00:00Z',
    location: 'Online',
    status: 'DRAFT',
    maxTeams: 40,
    maxTeamSize: 4,
    tasks: [],
    schedule: [],
    teams: [],
  },
];

async function seedMore(admin: { id: string }) {
  const users = new Map<string, { id: string }>();
  for (const handle of ['alice', 'bob', 'chen', 'dina']) {
    const found = await prisma.user.findUnique({ where: { email: `${handle}@hackathon.dev` } });
    if (found) users.set(handle, found);
  }
  for (const [handle, name] of EXTRA_USERS) {
    users.set(handle, await ensureUser(`${handle}@hackathon.dev`, name));
  }

  let teams = 0;
  let members = 0;
  let tasks = 0;
  let completions = 0;
  let submissions = 0;
  let scheduleItems = 0;

  for (const h of HACKATHONS) {
    const hackathon = await prisma.hackathon.upsert({
      where: { id: h.id },
      update: {
        title: h.title,
        description: h.description,
        startDate: new Date(h.start),
        endDate: new Date(h.end),
        location: h.location,
        status: h.status,
        maxTeams: h.maxTeams,
        maxTeamSize: h.maxTeamSize,
      },
      create: {
        id: h.id,
        title: h.title,
        description: h.description,
        startDate: new Date(h.start),
        endDate: new Date(h.end),
        location: h.location,
        status: h.status,
        maxTeams: h.maxTeams,
        maxTeamSize: h.maxTeamSize,
      },
    });

    const taskRows = [];
    for (const [i, [title, description]] of h.tasks.entries()) {
      taskRows.push(
        await prisma.task.upsert({
          where: { id: `${h.id}-task-${i + 1}` },
          update: { title, description, order: i + 1 },
          create: { id: `${h.id}-task-${i + 1}`, hackathonId: hackathon.id, title, description, order: i + 1 },
        }),
      );
      tasks++;
    }

    for (const [i, [title, at]] of h.schedule.entries()) {
      await prisma.scheduleItem.upsert({
        where: { id: `${h.id}-schedule-${i + 1}` },
        update: { title, time: new Date(at) },
        create: { id: `${h.id}-schedule-${i + 1}`, hackathonId: hackathon.id, title, time: new Date(at) },
      });
      scheduleItems++;
    }

    for (const t of h.teams) {
      const team = await prisma.team.upsert({
        where: { hackathonId_name: { hackathonId: hackathon.id, name: t.name } },
        update: { description: t.description },
        create: { name: t.name, description: t.description, hackathonId: hackathon.id },
      });
      teams++;

      for (const [i, handle] of t.members.entries()) {
        const user = users.get(handle);
        if (!user) continue;
        await prisma.teamMember.upsert({
          where: { teamId_userId: { teamId: team.id, userId: user.id } },
          update: {},
          create: {
            teamId: team.id,
            userId: user.id,
            hackathonId: hackathon.id,
            role: i === 0 ? 'LEADER' : 'MEMBER',
            joinedAt: new Date(new Date(h.start).getTime() - (i + 1) * 3_600_000),
          },
        });
        members++;
      }

      const leader = users.get(t.members[0]);
      for (const task of taskRows.slice(0, t.tasksDone)) {
        await prisma.taskCompletion.upsert({
          where: { taskId_teamId: { taskId: task.id, teamId: team.id } },
          update: {},
          create: { taskId: task.id, teamId: team.id, completedByUserId: (leader ?? admin).id },
        });
        completions++;
      }

      if (t.submission) {
        await prisma.submission.upsert({
          where: { teamId: team.id },
          update: { link: t.submission.link, description: t.submission.description },
          create: {
            teamId: team.id,
            link: t.submission.link,
            description: t.submission.description,
            submittedAt: new Date(t.submission.at),
          },
        });
        submissions++;
      }
    }
  }

  console.log('Extra demo data:', {
    users: users.size,
    hackathons: HACKATHONS.length,
    teams,
    members,
    tasks,
    scheduleItems,
    completions,
    submissions,
  });
}

async function main() {
  const admin = await ensureUser('admin@hackathon.dev', 'Hackathon Admin');
  await prisma.user.update({ where: { id: admin.id }, data: { role: 'ADMIN' } });

  const participants = await Promise.all(
    [
      { email: 'alice@hackathon.dev', name: 'Alice Khan' },
      { email: 'bob@hackathon.dev', name: 'Bob Rivera' },
      { email: 'chen@hackathon.dev', name: 'Chen Wu' },
      { email: 'dina@hackathon.dev', name: 'Dina Osei' },
    ].map((u) => ensureUser(u.email, u.name)),
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
      status: 'PUBLISHED',
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
    create: { teamId: teamAlpha.id, userId: alice.id, hackathonId: hackathon.id, role: 'LEADER' },
  });
  await prisma.teamMember.upsert({
    where: { teamId_userId: { teamId: teamAlpha.id, userId: bob.id } },
    update: {},
    create: { teamId: teamAlpha.id, userId: bob.id, hackathonId: hackathon.id, role: 'MEMBER' },
  });
  await prisma.teamMember.upsert({
    where: { teamId_userId: { teamId: teamBeta.id, userId: chen.id } },
    update: {},
    create: { teamId: teamBeta.id, userId: chen.id, hackathonId: hackathon.id, role: 'LEADER' },
  });
  await prisma.teamMember.upsert({
    where: { teamId_userId: { teamId: teamBeta.id, userId: dina.id } },
    update: {},
    create: { teamId: teamBeta.id, userId: dina.id, hackathonId: hackathon.id, role: 'MEMBER' },
  });

  await seedMore(admin);

  console.log('Seed complete:', {
    admin: admin.email,
    participants: participants.map((p) => p.email),
    hackathon: hackathon.title,
    teams: [teamAlpha.name, teamBeta.name],
    password: SEED_PASSWORD,
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
