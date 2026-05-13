"use client";

import { useTranslations } from "next-intl";
import { Card, CardBody } from "@/components/ui/card";

// Progress tab placeholder. Phase 4 (Client Portal) will populate weight log,
// body measurements, photos, daily check-ins.
export function ProgressTab({ clientId }: { clientId: string }) {
  const t = useTranslations("admin.clientDetail.progress");
  return (
    <Card>
      <CardBody className="py-12 text-center space-y-2">
        <p className="text-text-1 font-medium">{t("title")}</p>
        <p className="text-text-3 text-sm">{t("comingSoon")}</p>
        <p className="text-text-3 text-xs">id: {clientId}</p>
      </CardBody>
    </Card>
  );
}
