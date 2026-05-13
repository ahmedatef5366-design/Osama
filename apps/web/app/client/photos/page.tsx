"use client";

import { useCallback, useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import Image from "next/image";
import { apiData, api } from "@/lib/api";
import { Card, CardHeader, CardBody, CardTitle } from "@/components/ui/card";
import type { ProgressPhoto } from "@/types/api";

export default function PhotosPage() {
  const t = useTranslations("client.photos");
  const [photos, setPhotos] = useState<ProgressPhoto[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiData<ProgressPhoto[]>("/api/photos");
      setPhotos(data);
    } catch {
      // noop
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleDelete = async (id: string) => {
    if (!confirm(t("confirmDelete"))) return;
    try {
      await api(`/api/photos/${id}`, { method: "DELETE" });
      load();
    } catch {
      // noop
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="font-display text-4xl font-extrabold text-text-1">
        {t("title")}
      </h1>

      <Card>
        <CardHeader>
          <CardTitle>{t("title")}</CardTitle>
        </CardHeader>
        <CardBody>
          {loading ? (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="aspect-square animate-pulse rounded-lg bg-surface-high"
                />
              ))}
            </div>
          ) : photos.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-4 rounded-xl border border-dashed border-border bg-surface/50 py-12 px-6 text-center">
              <span
                aria-hidden
                className="grid h-14 w-14 place-items-center rounded-full bg-accent/10 text-accent ring-1 ring-accent/30"
              >
                <svg
                  width="22"
                  height="22"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden
                >
                  <rect x="3" y="5" width="18" height="14" rx="2" />
                  <circle cx="12" cy="12" r="3.2" />
                  <path d="M8 5l1.5-2h5L16 5" />
                </svg>
              </span>
              <p className="max-w-xs text-text-2 text-sm">{t("empty")}</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {photos.map((photo) => (
                <div
                  key={photo.id}
                  className="group relative aspect-square overflow-hidden rounded-lg bg-surface-high"
                >
                  <Image
                    src={photo.photoUrl}
                    alt={photo.pose ?? "progress"}
                    fill
                    className="object-cover"
                    sizes="(max-width: 640px) 50vw, 33vw"
                  />
                  <div className="absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-bg/80 to-transparent p-2 opacity-0 transition-opacity group-hover:opacity-100">
                    <span className="text-xs font-medium text-text-1">
                      {photo.takenAt}
                    </span>
                    {photo.pose && (
                      <span className="text-xs text-text-2">{photo.pose}</span>
                    )}
                    <button
                      onClick={() => handleDelete(photo.id)}
                      className="mt-1 text-xs text-danger hover:underline"
                    >
                      {t("delete")}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
