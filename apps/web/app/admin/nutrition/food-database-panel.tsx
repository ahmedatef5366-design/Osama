"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { APIError, api, apiData } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import type { Envelope, Food } from "@/types/api";

export function FoodDatabasePanel() {
  const t = useTranslations("admin.nutrition");
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [importing, setImporting] = useState(false);
  const [importMsg, setImportMsg] = useState<string | null>(null);
  const [importErr, setImportErr] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["food-db", search, page],
    queryFn: () =>
      api<Food[]>(
        `/api/food-database?page=${page}&pageSize=20${
          search ? `&search=${encodeURIComponent(search)}` : ""
        }`,
      ),
  });
  const items = (data as Envelope<Food[]> | undefined)?.data ?? [];
  const total = (data as Envelope<Food[]> | undefined)?.meta?.total ?? 0;

  const create = useMutation({
    mutationFn: async (body: Partial<Food>) =>
      apiData<Food>(`/api/food-database`, { method: "POST", body }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["food-db"] }),
  });

  const del = useMutation({
    mutationFn: async (id: string) =>
      api(`/api/food-database/${id}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["food-db"] }),
  });

  const handleCsv = async (file: File) => {
    setImporting(true);
    setImportErr(null);
    setImportMsg(null);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080"}/api/food-database/import`,
        { method: "POST", body: fd, credentials: "include" },
      );
      const json = (await res.json()) as Envelope<{ imported: number }>;
      if (!res.ok) {
        throw new APIError(res.status, json.code ?? "import_failed", json.error ?? "import failed");
      }
      setImportMsg(t("imported", { count: json.data?.imported ?? 0 }));
      qc.invalidateQueries({ queryKey: ["food-db"] });
    } catch (e) {
      setImportErr(e instanceof APIError ? e.message : "error");
    } finally {
      setImporting(false);
    }
  };

  return (
    <Card>
      <CardHeader className="space-y-4">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <CardTitle>{t("foodDatabase")}</CardTitle>
          <div className="flex items-center gap-2">
            <label className="cursor-pointer">
              <input
                type="file"
                accept=".csv,text/csv"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) void handleCsv(f);
                  e.target.value = "";
                }}
              />
              <span
                className={
                  "inline-flex items-center justify-center h-9 px-3 text-sm rounded-md border border-border text-text-2 hover:text-text-1 " +
                  (importing ? "opacity-50 pointer-events-none" : "")
                }
              >
                {importing ? "…" : t("importCsv")}
              </span>
            </label>
            <CreateFoodForm onCreate={(body) => create.mutate(body)} />
          </div>
        </div>
        <Input
          type="search"
          placeholder={t("search")}
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          className="max-w-md"
        />
        {importMsg && <p className="text-success text-sm">{importMsg}</p>}
        {importErr && <p className="text-danger text-sm">{importErr}</p>}
      </CardHeader>
      <CardBody className="space-y-3">
        {isLoading ? (
          <Skeleton className="h-48 w-full" />
        ) : items.length === 0 ? (
          <p className="text-text-3 text-sm py-6 text-center">{t("noResults")}</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-start text-text-3 text-xs uppercase tracking-[0.12em]">
                  <th className="text-start py-2">{t("col.name")}</th>
                  <th className="text-end py-2">{t("col.kcal")}</th>
                  <th className="text-end py-2">{t("col.p")}</th>
                  <th className="text-end py-2">{t("col.c")}</th>
                  <th className="text-end py-2">{t("col.f")}</th>
                  <th className="py-2"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {items.map((f) => (
                  <tr key={f.id} className="hover:bg-surface">
                    <td className="py-2 text-text-1">
                      <div>{f.name}</div>
                      {f.nameAr && <div className="text-text-3 text-xs">{f.nameAr}</div>}
                    </td>
                    <td className="text-end tabular-nums">{f.caloriesPer100g}</td>
                    <td className="text-end tabular-nums">{f.proteinPer100g}</td>
                    <td className="text-end tabular-nums">{f.carbsPer100g}</td>
                    <td className="text-end tabular-nums">{f.fatPer100g}</td>
                    <td className="text-end">
                      <button
                        className="text-text-3 hover:text-danger text-xs"
                        onClick={() => del.mutate(f.id)}
                      >
                        {t("delete")}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {total > 20 && (
          <div className="flex items-center justify-end gap-2 text-sm pt-2">
            <Button
              size="sm"
              variant="outline"
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
            >
              ‹
            </Button>
            <span className="text-text-3">
              {t("page", { page, totalPages: Math.ceil(total / 20) })}
            </span>
            <Button
              size="sm"
              variant="outline"
              disabled={page >= Math.ceil(total / 20)}
              onClick={() => setPage((p) => p + 1)}
            >
              ›
            </Button>
          </div>
        )}
      </CardBody>
    </Card>
  );
}

function CreateFoodForm({
  onCreate,
}: {
  onCreate: (body: Partial<Food>) => void;
}) {
  const t = useTranslations("admin.nutrition");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    name: "",
    nameAr: "",
    caloriesPer100g: 0,
    proteinPer100g: 0,
    carbsPer100g: 0,
    fatPer100g: 0,
  });

  if (!open)
    return (
      <Button size="sm" onClick={() => setOpen(true)}>
        {t("newFood")}
      </Button>
    );

  return (
    <div className="absolute z-20 top-16 end-6 w-80 bg-surface border border-border rounded-md p-4 space-y-2 shadow-lg">
      <Input
        placeholder="name"
        value={form.name}
        onChange={(e) => setForm({ ...form, name: e.target.value })}
      />
      <Input
        placeholder="nameAr"
        value={form.nameAr}
        onChange={(e) => setForm({ ...form, nameAr: e.target.value })}
      />
      <div className="grid grid-cols-4 gap-2">
        <Input
          type="number"
          placeholder="kcal"
          value={form.caloriesPer100g}
          onChange={(e) =>
            setForm({ ...form, caloriesPer100g: Number(e.target.value) })
          }
        />
        <Input
          type="number"
          placeholder="P"
          value={form.proteinPer100g}
          onChange={(e) =>
            setForm({ ...form, proteinPer100g: Number(e.target.value) })
          }
        />
        <Input
          type="number"
          placeholder="C"
          value={form.carbsPer100g}
          onChange={(e) =>
            setForm({ ...form, carbsPer100g: Number(e.target.value) })
          }
        />
        <Input
          type="number"
          placeholder="F"
          value={form.fatPer100g}
          onChange={(e) =>
            setForm({ ...form, fatPer100g: Number(e.target.value) })
          }
        />
      </div>
      <div className="flex justify-end gap-2">
        <Button size="sm" variant="ghost" onClick={() => setOpen(false)}>
          {t("cancel")}
        </Button>
        <Button
          size="sm"
          onClick={() => {
            if (!form.name) return;
            onCreate({
              ...form,
              nameAr: form.nameAr || undefined,
            });
            setForm({
              name: "",
              nameAr: "",
              caloriesPer100g: 0,
              proteinPer100g: 0,
              carbsPer100g: 0,
              fatPer100g: 0,
            });
            setOpen(false);
          }}
        >
          {t("save")}
        </Button>
      </div>
    </div>
  );
}
