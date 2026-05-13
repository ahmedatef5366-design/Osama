import { redirect } from "next/navigation";
import { BottomNav } from "@/components/client/bottom-nav";
import { PageTransition } from "@/components/motion";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login?from=/client/today");
  if (user.role !== "client") redirect("/admin/dashboard");

  return (
    <div className="min-h-screen pb-24">
      <div className="px-5 py-8 max-w-2xl mx-auto">
        <PageTransition>{children}</PageTransition>
      </div>
      <BottomNav />
    </div>
  );
}
