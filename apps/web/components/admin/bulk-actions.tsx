"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";

type BulkActionsProps = {
  selectedIds: string[];
  onClear: () => void;
  onSendMessage: (ids: string[]) => void;
  onToggleActive: (ids: string[], active: boolean) => void;
};

export function BulkActions({
  selectedIds,
  onClear,
  onSendMessage,
  onToggleActive,
}: BulkActionsProps) {
  const t = useTranslations("admin.bulk");
  const [showActions, setShowActions] = useState(false);

  if (selectedIds.length === 0) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
        className="fixed inset-x-4 bottom-4 z-30 flex items-center justify-between rounded-xl border border-accent/30 bg-surface p-3 shadow-lg shadow-accent/10 md:inset-x-auto md:left-1/2 md:w-auto md:min-w-[480px] md:-translate-x-1/2"
      >
        <span className="text-sm font-medium text-text-1">
          {t("selected", { count: selectedIds.length })}
        </span>
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setShowActions(!showActions)}
          >
            {t("actions")}
          </Button>
          <Button size="sm" variant="ghost" onClick={onClear}>
            {t("clear")}
          </Button>
        </div>
        <AnimatePresence>
          {showActions && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              className="absolute bottom-full left-0 mb-2 w-full rounded-lg border border-border bg-surface p-2 shadow-lg"
            >
              <button
                type="button"
                onClick={() => onSendMessage(selectedIds)}
                className="w-full rounded-md px-3 py-2 text-left text-sm text-text-1 transition-colors hover:bg-surface-high"
              >
                {t("sendMessage")}
              </button>
              <button
                type="button"
                onClick={() => onToggleActive(selectedIds, false)}
                className="w-full rounded-md px-3 py-2 text-left text-sm text-danger transition-colors hover:bg-surface-high"
              >
                {t("deactivate")}
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </AnimatePresence>
  );
}
