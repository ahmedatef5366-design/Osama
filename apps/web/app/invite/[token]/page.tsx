import { InviteAcceptForm } from "./invite-form";

export const dynamic = "force-dynamic";

export default async function InvitePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  return (
    <main className="min-h-screen flex items-center justify-center bg-bg px-6 py-12">
      <InviteAcceptForm token={token} />
    </main>
  );
}
