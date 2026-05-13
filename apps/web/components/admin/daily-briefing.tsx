"use client";

import { motion, type Variants } from "framer-motion";

type AlertLevel = "green" | "yellow" | "red";

type ClientBrief = {
  id: string;
  name: string;
  status: AlertLevel;
  lastCheckin: string;
  compliancePct: number;
  note?: string;
};

type DailyBriefingProps = {
  date: string;
  totalClients: number;
  checkedInToday: number;
  atRiskCount: number;
  clients: ClientBrief[];
};

const stagger: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.05 } },
};

const fadeIn: Variants = {
  hidden: { opacity: 0, y: 8 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
};

const STATUS_COLORS: Record<AlertLevel, string> = {
  green: "bg-success",
  yellow: "bg-warning",
  red: "bg-danger",
};

const STATUS_LABELS: Record<AlertLevel, string> = {
  green: "On track",
  yellow: "Needs attention",
  red: "At risk",
};

export function DailyBriefing({ date, totalClients, checkedInToday, atRiskCount, clients }: DailyBriefingProps) {
  const checkinRate = totalClients > 0 ? Math.round((checkedInToday / totalClients) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Header stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard label="Today" value={date} />
        <StatCard label="Check-ins" value={`${checkedInToday}/${totalClients}`} accent={`${checkinRate}%`} />
        <StatCard label="At risk" value={String(atRiskCount)} danger={atRiskCount > 0} />
        <StatCard label="Active clients" value={String(totalClients)} />
      </div>

      {/* Client list with traffic light */}
      <motion.div
        className="rounded-xl border border-border bg-surface overflow-hidden"
        variants={stagger}
        initial="hidden"
        animate="visible"
      >
        <div className="px-4 py-3 border-b border-border">
          <h3 className="font-display text-text-1 text-lg uppercase tracking-tight">Client Overview</h3>
        </div>
        <div className="divide-y divide-border">
          {clients.map((client) => (
            <motion.div
              key={client.id}
              variants={fadeIn}
              className="flex items-center gap-4 px-4 py-3 hover:bg-surface-high/50 transition-colors"
            >
              {/* Traffic light dot */}
              <span className={`size-3 rounded-full shrink-0 ${STATUS_COLORS[client.status]}`} />

              {/* Name + status */}
              <div className="flex-1 min-w-0">
                <p className="text-text-1 text-sm font-medium truncate">{client.name}</p>
                <p className="text-text-3 text-xs">{STATUS_LABELS[client.status]}</p>
              </div>

              {/* Compliance bar */}
              <div className="hidden sm:flex items-center gap-2 w-32">
                <div className="flex-1 h-1.5 rounded-full bg-surface-high overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${
                      client.compliancePct >= 80 ? "bg-success" : client.compliancePct >= 60 ? "bg-warning" : "bg-danger"
                    }`}
                    style={{ width: `${client.compliancePct}%` }}
                  />
                </div>
                <span className="text-text-3 text-xs font-mono w-8 text-end">{client.compliancePct}%</span>
              </div>

              {/* Last check-in */}
              <span className="text-text-3 text-xs font-mono hidden md:block">{client.lastCheckin}</span>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}

function StatCard({ label, value, accent, danger }: { label: string; value: string; accent?: string; danger?: boolean }) {
  return (
    <div className="rounded-xl border border-border bg-bg p-4">
      <p className="text-text-3 text-xs font-mono uppercase tracking-wider">{label}</p>
      <p className={`mt-1 font-display text-2xl uppercase ${danger ? "text-danger" : "text-text-1"}`}>{value}</p>
      {accent ? <p className="text-accent text-xs font-mono mt-0.5">{accent}</p> : null}
    </div>
  );
}
