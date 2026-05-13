import { ScrollProgress } from "@/components/motion/scroll-progress";

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <ScrollProgress />
      <main className="snap-y-mandatory">{children}</main>
    </>
  );
}
