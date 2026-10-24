import { Prisma } from '../../generated/prisma/client.js';

export function isUniqueViolation(error: unknown, ...fields: string[]): boolean {
  if (!(error instanceof Prisma.PrismaClientKnownRequestError) || error.code !== 'P2002') {
    return false;
  }
  if (fields.length === 0) return true;

  // The constraint name shows up in different places depending on the driver: classic Prisma
  // populates `meta.target` (string[] or string); the pg driver adapter instead nests it under
  // `meta.driverAdapterError.cause.constraint.index`. Search every shape, plus the message itself
  // (which always names the constraint), so detection doesn't silently miss and fall through to a 500.
  const meta = error.meta as Record<string, unknown> | undefined;
  const target = meta?.target;
  const driverConstraint = (
    meta?.driverAdapterError as { cause?: { constraint?: { index?: string } } } | undefined
  )?.cause?.constraint?.index;

  const haystacks = [
    ...(Array.isArray(target) ? target.map(String) : typeof target === 'string' ? [target] : []),
    ...(driverConstraint ? [driverConstraint] : []),
    error.message,
  ];

  return fields.some((field) => haystacks.some((h) => h.includes(field)));
}

export function isNotFound(error: unknown): boolean {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025';
}
