import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { ClientsTable } from "./clients-table";

export default function AdminClientsPage() {
  return <ClientsHeader />;
}

function ClientsHeader() {
  const t = useTranslations("admin.clients");
  return (
    <div className="space-y-8">
      <header className="flex items-center justify-between">
        <h1 className="font-display text-4xl font-extrabold text-text-1">{t("title")}</h1>
        <Button size="sm">{t("newClient")}</Button>
      </header>
      <ClientsTable />
    </div>
  );
}
