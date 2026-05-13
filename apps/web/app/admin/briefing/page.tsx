"use client";

import { DailyBriefing } from "@/components/admin/daily-briefing";
import { SmartNotifications } from "@/components/admin/smart-notifications";
import { useState } from "react";

const MOCK_DATE = new Date().toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" });

const MOCK_CLIENTS = [
  { id: "1", name: "Ahmed M.", status: "green" as const, lastCheckin: "2h ago", compliancePct: 94 },
  { id: "2", name: "Sara K.", status: "green" as const, lastCheckin: "4h ago", compliancePct: 88 },
  { id: "3", name: "Omar T.", status: "yellow" as const, lastCheckin: "Yesterday", compliancePct: 65 },
  { id: "4", name: "Nour A.", status: "red" as const, lastCheckin: "3 days ago", compliancePct: 32 },
  { id: "5", name: "Karim S.", status: "green" as const, lastCheckin: "1h ago", compliancePct: 91 },
];

const MOCK_NOTIFICATIONS = [
  { id: "n1", type: "missed_checkin" as const, clientName: "Nour A.", message: "missed 3 consecutive check-ins", priority: "high" as const, timestamp: "10 min ago", read: false },
  { id: "n2", type: "low_compliance" as const, clientName: "Omar T.", message: "diet compliance dropped below 70%", priority: "medium" as const, timestamp: "1h ago", read: false },
  { id: "n3", type: "goal_reached" as const, clientName: "Ahmed M.", message: "hit target weight of 78 kg!", priority: "low" as const, timestamp: "3h ago", read: false },
  { id: "n4", type: "streak" as const, clientName: "Sara K.", message: "30-day workout streak!", priority: "low" as const, timestamp: "5h ago", read: true },
];

export default function BriefingPage() {
  const [notifications, setNotifications] = useState(MOCK_NOTIFICATIONS);

  const handleDismiss = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  return (
    <div className="mx-auto max-w-6xl space-y-8 p-6">
      <div>
        <h1 className="font-display text-text-1 text-3xl uppercase tracking-tight">Daily Briefing</h1>
        <p className="text-text-2 text-sm mt-1">Your coaching dashboard for today</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <DailyBriefing
          date={MOCK_DATE}
          totalClients={5}
          checkedInToday={3}
          atRiskCount={1}
          clients={MOCK_CLIENTS}
        />
        <SmartNotifications notifications={notifications} onDismiss={handleDismiss} />
      </div>
    </div>
  );
}
