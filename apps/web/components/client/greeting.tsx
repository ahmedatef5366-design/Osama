"use client";

import { useTranslations } from "next-intl";

type GreetingProps = {
  name: string;
};

function getTimeOfDay(): "morning" | "afternoon" | "evening" {
  const hour = new Date().getHours();
  if (hour < 12) return "morning";
  if (hour < 18) return "afternoon";
  return "evening";
}

export function Greeting({ name }: GreetingProps) {
  const t = useTranslations("client.greeting");
  const timeKey = getTimeOfDay();

  return (
    <div className="mb-6">
      <h1 className="font-display text-3xl font-extrabold text-text-1">
        {t(timeKey, { name })}
      </h1>
      <p className="mt-1 text-sm text-text-2">{t("subtitle")}</p>
    </div>
  );
}
