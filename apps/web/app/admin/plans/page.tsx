import { useTranslations } from "next-intl";
import { ExerciseLibraryPanel } from "./exercise-library-panel";
import { TemplatesPanel } from "./templates-panel";

export const dynamic = "force-dynamic";

export default function AdminPlansPage() {
  return <PageInner />;
}

function PageInner() {
  const t = useTranslations("admin.plans");
  return (
    <div className="space-y-8">
      <header className="space-y-1">
        <h1 className="font-display text-4xl font-extrabold text-text-1">
          {t("title")}
        </h1>
        <p className="text-text-2 text-sm">{t("subtitle")}</p>
      </header>
      <ExerciseLibraryPanel />
      <TemplatesPanel />
    </div>
  );
}
