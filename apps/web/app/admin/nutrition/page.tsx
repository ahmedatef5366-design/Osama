import { useTranslations } from "next-intl";
import { FoodDatabasePanel } from "./food-database-panel";

export const dynamic = "force-dynamic";

export default function AdminNutritionPage() {
  return <PageInner />;
}

function PageInner() {
  const t = useTranslations("admin.nutrition");
  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h1 className="font-display text-4xl font-extrabold text-text-1">
          {t("title")}
        </h1>
        <p className="text-text-2 text-sm">{t("subtitle")}</p>
      </header>
      <FoodDatabasePanel />
    </div>
  );
}
