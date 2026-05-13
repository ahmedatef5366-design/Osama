"use client";

import { motion } from "framer-motion";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";

type Badge = {
  id: string;
  icon: string;
  labelKey: string;
  earned: boolean;
};

type AchievementBadgesProps = {
  streak: number;
  totalWorkouts: number;
  totalCheckins: number;
};

function getBadges(
  streak: number,
  totalWorkouts: number,
  totalCheckins: number,
): Badge[] {
  return [
    { id: "first-workout", icon: "🏋️", labelKey: "firstWorkout", earned: totalWorkouts >= 1 },
    { id: "week-streak", icon: "🔥", labelKey: "weekStreak", earned: streak >= 7 },
    { id: "month-streak", icon: "⭐", labelKey: "monthStreak", earned: streak >= 30 },
    { id: "ten-workouts", icon: "💪", labelKey: "tenWorkouts", earned: totalWorkouts >= 10 },
    { id: "fifty-workouts", icon: "🏆", labelKey: "fiftyWorkouts", earned: totalWorkouts >= 50 },
    { id: "perfect-week", icon: "✨", labelKey: "perfectWeek", earned: totalCheckins >= 7 },
  ];
}

export function AchievementBadges({
  streak,
  totalWorkouts,
  totalCheckins,
}: AchievementBadgesProps) {
  const t = useTranslations("client.badges");
  const badges = getBadges(streak, totalWorkouts, totalCheckins);

  return (
    <div className="grid grid-cols-3 gap-3">
      {badges.map((badge, i) => (
        <motion.div
          key={badge.id}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: i * 0.08, duration: 0.3 }}
          className={cn(
            "flex flex-col items-center gap-1 rounded-lg border p-3 text-center transition-colors",
            badge.earned
              ? "border-accent/30 bg-accent-dim"
              : "border-border bg-surface opacity-50 grayscale",
          )}
        >
          <span className="text-2xl">{badge.icon}</span>
          <span className="text-[10px] font-medium text-text-2">
            {t(badge.labelKey)}
          </span>
        </motion.div>
      ))}
    </div>
  );
}
