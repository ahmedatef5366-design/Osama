"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { motion, type Variants } from "framer-motion";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Locale } from "@/types/cms";

type Props = {
  locale: Locale;
};

type Activity = "sedentary" | "light" | "moderate" | "high" | "athlete";
type Goal = "cut" | "maintain" | "bulk";
type Gender = "male" | "female";

const ACTIVITY_MULTIPLIERS: Record<Activity, number> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  high: 1.725,
  athlete: 1.9,
};

const GOAL_DELTAS: Record<Goal, number> = {
  cut: -0.2,
  maintain: 0,
  bulk: 0.15,
};

const ACTIVITY_KEYS: Activity[] = ["sedentary", "light", "moderate", "high", "athlete"];
const GOAL_KEYS: Goal[] = ["cut", "maintain", "bulk"];

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } },
};

/**
 * Interactive macro estimator. Pure client-side math (Mifflin-St Jeor)
 * — no API roundtrips, no PII stored. Acts as a lead magnet: the visitor
 * sees the calculator works, and the closing CTA invites them to a
 * call. Inputs are gently constrained so the math never returns NaN.
 *
 * Mifflin-St Jeor:
 *   male:   BMR = 10·w + 6.25·h - 5·a + 5
 *   female: BMR = 10·w + 6.25·h - 5·a - 161
 *
 * Macro split per goal (rough but defensible defaults):
 *   protein: 2.0 g/kg bodyweight
 *   fat:     0.9 g/kg bodyweight
 *   carbs:   remainder of TDEE-adjusted calories
 */
export function MacroCalculator({ locale }: Props) {
  const t = useTranslations("landing.calculator");
  const [age, setAge] = useState(30);
  const [weight, setWeight] = useState(80);
  const [height, setHeight] = useState(175);
  const [gender, setGender] = useState<Gender>("male");
  const [activity, setActivity] = useState<Activity>("moderate");
  const [goal, setGoal] = useState<Goal>("maintain");

  const result = useMemo(() => {
    const w = clamp(weight, 30, 250);
    const h = clamp(height, 100, 230);
    const a = clamp(age, 13, 99);
    const bmr =
      gender === "male"
        ? 10 * w + 6.25 * h - 5 * a + 5
        : 10 * w + 6.25 * h - 5 * a - 161;
    const tdee = bmr * ACTIVITY_MULTIPLIERS[activity];
    const calories = Math.round(tdee * (1 + GOAL_DELTAS[goal]));
    const protein = Math.round(w * 2.0);
    const fat = Math.round(w * 0.9);
    const carbsKcal = calories - (protein * 4 + fat * 9);
    const carbs = Math.max(0, Math.round(carbsKcal / 4));
    return {
      bmr: Math.round(bmr),
      tdee: Math.round(tdee),
      calories,
      protein,
      fat,
      carbs,
    };
  }, [age, weight, height, gender, activity, goal]);

  return (
    <section className="relative bg-surface py-16 sm:py-24 md:py-32" id="calculator">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <motion.div
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-80px" }}
          className="mb-12 max-w-3xl"
        >
          <span className="font-mono text-text-3 text-[11px] uppercase tracking-[0.32em]">
            {t("eyebrow")}
          </span>
          <h2 className="mt-3 font-display text-text-1 text-3xl sm:text-4xl md:text-5xl font-extrabold leading-[1.05]">
            {t("title")}
          </h2>
          <p className="mt-4 max-w-2xl text-text-2 text-base sm:text-lg">
            {t("subtitle")}
          </p>
        </motion.div>

        <div className="grid gap-6 lg:grid-cols-[3fr_2fr] lg:gap-8">
          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-60px" }}
            className="rounded-2xl border border-border bg-bg p-6 sm:p-8"
          >
            <div className="grid gap-5 sm:grid-cols-3">
              <NumberField
                label={t("fields.age")}
                value={age}
                onChange={setAge}
                min={13}
                max={99}
                locale={locale}
              />
              <NumberField
                label={t("fields.weight")}
                value={weight}
                onChange={setWeight}
                min={30}
                max={250}
                locale={locale}
              />
              <NumberField
                label={t("fields.height")}
                value={height}
                onChange={setHeight}
                min={100}
                max={230}
                locale={locale}
              />
            </div>

            <div className="mt-6">
              <FieldLabel>{t("fields.gender")}</FieldLabel>
              <div className="mt-2 inline-flex rounded-full border border-border bg-surface-high p-1">
                <PillButton
                  active={gender === "male"}
                  onClick={() => setGender("male")}
                >
                  {t("fields.male")}
                </PillButton>
                <PillButton
                  active={gender === "female"}
                  onClick={() => setGender("female")}
                >
                  {t("fields.female")}
                </PillButton>
              </div>
            </div>

            <div className="mt-6">
              <FieldLabel>{t("fields.activity")}</FieldLabel>
              <div className="mt-2 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {ACTIVITY_KEYS.map((k) => (
                  <OptionCard
                    key={k}
                    active={activity === k}
                    onClick={() => setActivity(k)}
                  >
                    {t(`activity.${k}`)}
                  </OptionCard>
                ))}
              </div>
            </div>

            <div className="mt-6">
              <FieldLabel>{t("fields.goal")}</FieldLabel>
              <div className="mt-2 grid grid-cols-3 gap-2">
                {GOAL_KEYS.map((k) => (
                  <OptionCard
                    key={k}
                    active={goal === k}
                    onClick={() => setGoal(k)}
                  >
                    {t(`goal.${k}`)}
                  </OptionCard>
                ))}
              </div>
            </div>
          </motion.div>

          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-60px" }}
            transition={{ delay: 0.1 }}
            className="relative overflow-hidden rounded-2xl border border-accent/40 bg-gradient-to-b from-surface-high via-bg to-bg p-6 sm:p-8 shadow-[0_30px_80px_-40px_rgba(200,241,53,0.4)]"
          >
            <div className="pointer-events-none absolute -top-24 -end-24 h-64 w-64 rounded-full bg-accent/15 blur-3xl" />

            <header className="space-y-1">
              <span className="font-mono text-text-3 text-[11px] uppercase tracking-[0.3em]">
                {t("results.calories")}
              </span>
              <div className="flex items-baseline gap-2">
                <p className="font-display text-accent text-5xl sm:text-6xl tabular-nums leading-none">
                  {result.calories.toLocaleString(locale === "ar" ? "ar-EG" : "en-US")}
                </p>
                <span className="font-mono text-text-3 text-xs uppercase tracking-widest">
                  {t("results.kcal")}
                </span>
              </div>
            </header>

            <dl className="mt-8 grid grid-cols-3 gap-px overflow-hidden rounded-xl border border-border bg-border">
              <Macro
                label={t("results.protein")}
                value={result.protein}
                unit={t("results.unit")}
                locale={locale}
              />
              <Macro
                label={t("results.carbs")}
                value={result.carbs}
                unit={t("results.unit")}
                locale={locale}
              />
              <Macro
                label={t("results.fat")}
                value={result.fat}
                unit={t("results.unit")}
                locale={locale}
              />
            </dl>

            <dl className="mt-6 grid grid-cols-2 gap-3 text-xs">
              <div className="rounded-md border border-border bg-bg/40 px-3 py-2">
                <dt className="font-mono text-text-3 text-[10px] uppercase tracking-widest">
                  {t("results.bmr")}
                </dt>
                <dd className="mt-1 font-mono text-text-1 text-base tabular-nums">
                  {result.bmr.toLocaleString(locale === "ar" ? "ar-EG" : "en-US")}
                </dd>
              </div>
              <div className="rounded-md border border-border bg-bg/40 px-3 py-2">
                <dt className="font-mono text-text-3 text-[10px] uppercase tracking-widest">
                  {t("results.tdee")}
                </dt>
                <dd className="mt-1 font-mono text-text-1 text-base tabular-nums">
                  {result.tdee.toLocaleString(locale === "ar" ? "ar-EG" : "en-US")}
                </dd>
              </div>
            </dl>

            <div className="mt-8 border-t border-border/70 pt-6">
              <p className="text-text-2 text-sm">{t("cta")}</p>
              <Link href="/login" className="mt-3 inline-block">
                <Button size="md" variant="accent">
                  {t("ctaButton")}
                </Button>
              </Link>
              <p className="mt-5 text-text-3 text-xs leading-relaxed">
                {t("disclaimer")}
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

function clamp(n: number, min: number, max: number): number {
  if (Number.isNaN(n)) return min;
  return Math.max(min, Math.min(max, n));
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <span className="font-mono text-text-3 text-[10px] uppercase tracking-widest">
      {children}
    </span>
  );
}

type NumberFieldProps = {
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (n: number) => void;
  locale: Locale;
};

function NumberField({ label, value, min, max, onChange, locale }: NumberFieldProps) {
  return (
    <label className="block">
      <FieldLabel>{label}</FieldLabel>
      <input
        type="number"
        inputMode="numeric"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className={cn(
          "mt-2 w-full rounded-md border border-border bg-surface-high px-3 py-2 font-mono text-text-1 text-base tabular-nums",
          "focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent/30",
        )}
        dir={locale === "ar" ? "rtl" : "ltr"}
      />
    </label>
  );
}

function PillButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-full px-4 py-1.5 font-mono text-xs uppercase tracking-widest transition-colors",
        active ? "bg-accent text-bg" : "text-text-2 hover:text-text-1",
      )}
    >
      {children}
    </button>
  );
}

function OptionCard({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-md border px-3 py-2.5 text-start text-sm transition-all",
        active
          ? "border-accent bg-accent/10 text-text-1"
          : "border-border bg-surface-high text-text-2 hover:border-border-hover hover:text-text-1",
      )}
    >
      {children}
    </button>
  );
}

function Macro({
  label,
  value,
  unit,
  locale,
}: {
  label: string;
  value: number;
  unit: string;
  locale: Locale;
}) {
  return (
    <div className="bg-bg/80 p-3 sm:p-4">
      <dt className="font-mono text-text-3 text-[10px] uppercase tracking-widest">
        {label}
      </dt>
      <dd className="mt-2 font-display text-text-1 text-2xl sm:text-3xl tabular-nums leading-none">
        {value.toLocaleString(locale === "ar" ? "ar-EG" : "en-US")}
        <span className="ms-1 font-mono text-text-3 text-xs">{unit}</span>
      </dd>
    </div>
  );
}
