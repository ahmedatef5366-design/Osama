"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Card, CardHeader, CardBody, CardTitle } from "@/components/ui/card";

type Note = {
  id: string;
  text: string;
  createdAt: string;
  pinned: boolean;
};

type QuickNotesProps = {
  notes: Note[];
  onAdd: (text: string) => void;
  onDelete: (id: string) => void;
  onTogglePin: (id: string) => void;
};

export function QuickNotes({ notes, onAdd, onDelete, onTogglePin }: QuickNotesProps) {
  const t = useTranslations("admin.notes");
  const [draft, setDraft] = useState("");

  function handleSubmit() {
    const text = draft.trim();
    if (!text) return;
    onAdd(text);
    setDraft("");
  }

  const sorted = [...notes].sort((a, b) => {
    if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("title")}</CardTitle>
      </CardHeader>
      <CardBody>
        <div className="mb-3 flex gap-2">
          <input
            type="text"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
            placeholder={t("placeholder")}
            className="input-base flex-1 rounded-md px-3 py-1.5 text-sm"
          />
          <button
            type="button"
            onClick={handleSubmit}
            className="rounded-md bg-accent px-3 py-1.5 text-sm font-medium text-bg transition-transform active:scale-95"
          >
            {t("add")}
          </button>
        </div>
        {sorted.length === 0 ? (
          <p className="text-sm text-text-2">{t("empty")}</p>
        ) : (
          <ul className="space-y-1.5">
            {sorted.map((note) => (
              <li
                key={note.id}
                className="flex items-start gap-2 rounded-md bg-surface-high px-3 py-2"
              >
                <button
                  type="button"
                  onClick={() => onTogglePin(note.id)}
                  className="mt-0.5 text-xs"
                  aria-label={note.pinned ? t("unpin") : t("pin")}
                >
                  {note.pinned ? "📌" : "📍"}
                </button>
                <p className="flex-1 text-sm text-text-1">{note.text}</p>
                <button
                  type="button"
                  onClick={() => onDelete(note.id)}
                  className="text-xs text-text-3 transition-colors hover:text-danger"
                  aria-label={t("delete")}
                >
                  ×
                </button>
              </li>
            ))}
          </ul>
        )}
      </CardBody>
    </Card>
  );
}
