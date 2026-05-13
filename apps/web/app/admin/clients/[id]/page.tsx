import { ClientProfile } from "./client-profile";

export const dynamic = "force-dynamic";

export default function AdminClientDetailPage({
  params,
}: {
  params: { id: string };
}) {
  return <ClientProfile clientId={params.id} />;
}
