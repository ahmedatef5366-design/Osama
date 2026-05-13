import { ClientProfile } from "./client-profile";

export const dynamic = "force-dynamic";

// Next 15 made route params async — they're now a Promise the page has
// to await before destructuring. The component itself stays the same.
export default async function AdminClientDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <ClientProfile clientId={id} />;
}
