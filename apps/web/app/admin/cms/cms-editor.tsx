"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { useEffect, useMemo, useState } from "react";
import { api, apiData } from "@/lib/api";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import type { Section, SectionHistoryEntry, SectionKey } from "@/types/cms";

const SECTIONS: SectionKey[] = [
  "announcement",
  "hero",
  "banner",
  "valueProps",
  "features",
  "transformations",
  "beforeAfter",
  "featuredStories",
  "processSteps",
  "testimonials",
  "customerActivity",
  "pricing",
  "faq",
  "footer",
];

/**
 * Three-pane editor:
 *   left:   list of sections, with a "dirty" dot on whichever the admin is
 *           editing (so a switch with unsaved changes is obvious)
 *   center: JSON textarea + Save / Reset buttons
 *   right:  revision history list — clicking a row previews it; a separate
 *           "Restore" button promotes that revision to be the live one.
 */
export function CmsEditor() {
  const t = useTranslations("admin.cms");
  const qc = useQueryClient();
  const [active, setActive] = useState<SectionKey>("hero");
  const [draft, setDraft] = useState<string>("");
  const [error, setError] = useState<string | null>(null);

  const sectionQuery = useQuery({
    queryKey: ["cms", "section", active],
    queryFn: () => apiData<Section>(`/api/site-content/${active}`),
  });

  // Reset the draft whenever we land on a new section.
  useEffect(() => {
    if (sectionQuery.data) {
      setDraft(JSON.stringify(sectionQuery.data.content, null, 2));
      setError(null);
    }
  }, [sectionQuery.data, active]);

  const original = useMemo(
    () => (sectionQuery.data ? JSON.stringify(sectionQuery.data.content, null, 2) : ""),
    [sectionQuery.data],
  );
  const dirty = draft !== original && original !== "";

  const saveMutation = useMutation({
    mutationFn: async (content: unknown) =>
      apiData<Section>(`/api/site-content/${active}`, {
        method: "PUT",
        body: { content },
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["cms", "section", active] });
      qc.invalidateQueries({ queryKey: ["cms", "history", active] });
    },
  });

  const restoreMutation = useMutation({
    mutationFn: async (historyId: string) =>
      apiData<Section>(`/api/site-content/${active}/rollback`, {
        method: "POST",
        body: { historyId },
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["cms", "section", active] });
      qc.invalidateQueries({ queryKey: ["cms", "history", active] });
    },
  });

  function onSave() {
    let parsed: unknown;
    try {
      parsed = JSON.parse(draft);
    } catch (e) {
      setError(t("errors.invalidJson") + " (" + (e as Error).message + ")");
      return;
    }
    setError(null);
    saveMutation.mutate(parsed);
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[200px_minmax(0,1fr)_280px]">
      <SectionList active={active} setActive={setActive} dirty={dirty} />
      <section className="rounded-lg border border-border bg-surface p-4">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-display text-text-1 text-xl font-semibold">{t(`sections.${active}`)}</h2>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="ghost"
              disabled={!dirty}
              onClick={() => setDraft(original)}
            >
              {t("reset")}
            </Button>
            <Button
              size="sm"
              variant="accent"
              disabled={!dirty || saveMutation.isPending}
              onClick={onSave}
            >
              {saveMutation.isPending ? t("saving") : t("save")}
            </Button>
          </div>
        </div>

        {sectionQuery.isLoading ? (
          <Skeleton className="h-[480px] w-full rounded-md" />
        ) : (
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            spellCheck={false}
            dir="ltr"
            className="block h-[480px] w-full resize-y rounded-md border border-border bg-bg p-3 font-mono text-sm text-text-1 focus:border-border-hover"
          />
        )}
        {error ? (
          <p className="mt-2 text-danger text-xs" role="alert">
            {error}
          </p>
        ) : saveMutation.isError ? (
          <p className="mt-2 text-danger text-xs" role="alert">
            {(saveMutation.error as Error).message}
          </p>
        ) : saveMutation.isSuccess ? (
          <p className="mt-2 text-success text-xs">{t("saved")}</p>
        ) : null}
      </section>
      <HistoryPanel sectionKey={active} onRestore={(id) => restoreMutation.mutate(id)} />
    </div>
  );
}

function SectionList({
  active,
  setActive,
  dirty,
}: {
  active: SectionKey;
  setActive: (k: SectionKey) => void;
  dirty: boolean;
}) {
  const t = useTranslations("admin.cms.sections");
  return (
    <aside className="rounded-lg border border-border bg-surface p-2">
      <ul className="space-y-1">
        {SECTIONS.map((key) => {
          const isActive = key === active;
          return (
            <li key={key}>
              <button
                type="button"
                onClick={() => setActive(key)}
                className={
                  "flex w-full items-center justify-between gap-2 rounded-md px-3 py-2 text-sm transition-colors " +
                  (isActive
                    ? "bg-accent-dim text-accent"
                    : "text-text-2 hover:bg-bg hover:text-text-1")
                }
              >
                <span>{t(key)}</span>
                {isActive && dirty ? (
                  <span aria-hidden className="size-2 rounded-full bg-warning" />
                ) : null}
              </button>
            </li>
          );
        })}
      </ul>
    </aside>
  );
}

function HistoryPanel({
  sectionKey,
  onRestore,
}: {
  sectionKey: SectionKey;
  onRestore: (id: string) => void;
}) {
  const t = useTranslations("admin.cms");
  const historyQuery = useQuery({
    queryKey: ["cms", "history", sectionKey],
    queryFn: () => api<SectionHistoryEntry[]>(`/api/site-content/${sectionKey}/history?pageSize=20`),
  });

  return (
    <aside className="rounded-lg border border-border bg-surface p-3">
      <h3 className="mb-3 text-text-2 text-xs uppercase tracking-[0.16em]">
        {t("history")}
      </h3>
      {historyQuery.isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-full rounded-md" />
          ))}
        </div>
      ) : !historyQuery.data?.data || historyQuery.data.data.length === 0 ? (
        <p className="text-text-3 text-xs">{t("historyEmpty")}</p>
      ) : (
        <ul className="space-y-2">
          {historyQuery.data.data.map((row) => (
            <li
              key={row.id}
              className="rounded-md border border-border bg-bg p-2"
            >
              <div className="font-mono text-text-2 text-xs tabular-nums">
                {new Date(row.savedAt).toLocaleString()}
              </div>
              <div className="mt-1 flex items-center justify-between">
                {row.savedBy ? (
                  <span className="text-text-3 text-xs">{row.savedBy.slice(0, 8)}…</span>
                ) : (
                  <span />
                )}
                <button
                  type="button"
                  onClick={() => {
                    if (window.confirm(t("confirmRestore"))) {
                      onRestore(row.id);
                    }
                  }}
                  className="text-accent text-xs hover:underline"
                >
                  {t("restore")}
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </aside>
  );
}
