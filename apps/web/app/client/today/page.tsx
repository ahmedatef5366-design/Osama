import { useTranslations } from "next-intl";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";

export default function TodayPage() {
  return <TodayContent />;
}

function TodayContent() {
  const t = useTranslations("client.today");
  return (
    <div className="space-y-6">
      <h1 className="font-display text-4xl font-extrabold text-text-1">{t("title")}</h1>
      <Card>
        <CardHeader>
          <CardTitle>{t("title")}</CardTitle>
        </CardHeader>
        <CardBody>
          <p className="text-text-2 text-sm">{t("soon")}</p>
        </CardBody>
      </Card>
    </div>
  );
}
