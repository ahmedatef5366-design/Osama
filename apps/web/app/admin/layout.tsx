import { redirect } from "next/navigation";
import { Sidebar } from "@/components/admin/sidebar";
import { Topbar } from "@/components/admin/topbar";
import { CommandPaletteWrapper } from "@/components/admin/command-palette-wrapper";
import { PageTransition } from "@/components/motion";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login?from=/admin/dashboard");
  if (user.role !== "admin") redirect("/client/today");

  return (
    <div className="min-h-screen flex">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Topbar user={user} />
        <div className="flex-1 px-6 py-8 max-w-7xl w-full mx-auto">
          <PageTransition>{children}</PageTransition>
        </div>
      </div>
      <CommandPaletteWrapper />
    </div>
  );
}
