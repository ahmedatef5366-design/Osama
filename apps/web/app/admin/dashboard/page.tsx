import { useTranslations } from "next-intl";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";

export default function AdminDashboardPage() {
  return <DashboardContent />;
}

function DashboardContent() {
  const t = useTranslations("admin.dashboard");
  const stats: Array<{ key: "activeClients" | "avgCompliance" | "atRisk" | "todayCheckins" }> = [
    { key: "activeClients" },
    { key: "avgCompliance" },
    { key: "atRisk" },
    { key: "todayCheckins" },
  ];
  return (
    <div className="space-y-8">
      <h1 className="font-display text-4xl font-extrabold text-text-1">{t("title")}</h1>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s) => (
          <Card key={s.key}>
            <CardHeader>
              <CardTitle>{t(`stats.${s.key}`)}</CardTitle>
            </CardHeader>
            <CardBody>
              <div className="font-display text-4xl font-extrabold text-text-1">—</div>
            </CardBody>
          </Card>
        ))}
      </div>
      <p className="text-text-3 text-sm">{t("soon")}</p>
    </div>
  );
}
