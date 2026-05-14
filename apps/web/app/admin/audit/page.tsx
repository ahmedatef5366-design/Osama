import { useTranslations } from "next-intl";
import { AuditTable } from "./audit-table";

export const dynamic = "force-dynamic";

export default function AdminAuditPage() {
  return <AuditPageWrapper />;
}

function AuditPageWrapper() {
  const t = useTranslations("admin.audit");
  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h1 className="font-display text-4xl font-extrabold text-text-1">
          {t("title")}
        </h1>
        <p className="text-text-2 text-sm">{t("subtitle")}</p>
      </header>
      <AuditTable />
    </div>
  );
}
