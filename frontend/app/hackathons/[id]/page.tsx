import { HackathonDetailClient } from './HackathonDetailClient';

export const instant = false;

export default async function HackathonDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <HackathonDetailClient id={id} />;
}
