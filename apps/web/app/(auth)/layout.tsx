import { PageTransition } from "@/components/motion";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <main className="relative isolate min-h-screen bg-mesh flex items-center justify-center px-6 py-12">
      <PageTransition>{children}</PageTransition>
    </main>
  );
}
