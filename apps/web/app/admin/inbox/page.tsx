"use client";

import { useState, useEffect, useCallback } from "react";
import { useTranslations } from "next-intl";
import { Card, CardHeader, CardBody, CardTitle } from "@/components/ui/card";
import { Avatar } from "@/components/ui/avatar";
import { EmptyState } from "@/components/ui/empty-state";
import { cn } from "@/lib/utils";
import { PageTransition } from "@/components/motion/page-transition";

type Thread = {
  id: string;
  clientName: string;
  lastMessage: string;
  timestamp: string;
  unread: boolean;
};

const API = process.env.NEXT_PUBLIC_API_URL ?? "";

export default function InboxPage() {
  const t = useTranslations("admin.inbox");
  const [threads, setThreads] = useState<Thread[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [reply, setReply] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`${API}/api/messages/threads`, {
          headers: { Authorization: `Bearer ${localStorage.getItem("token") ?? ""}` },
        });
        if (res.ok) {
          const json = await res.json();
          setThreads(json.Data ?? []);
        }
      } catch {
        /* offline fallback */
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const handleSend = useCallback(async () => {
    if (!reply.trim() || !selected) return;
    try {
      await fetch(`${API}/api/messages`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token") ?? ""}`,
        },
        body: JSON.stringify({ threadId: selected, content: reply }),
      });
      setReply("");
    } catch {
      /* offline fallback */
    }
  }, [reply, selected]);

  const selectedThread = threads.find((t) => t.id === selected);

  return (
    <PageTransition>
      <div className="flex h-[calc(100vh-80px)] gap-4">
        <Card className="w-80 shrink-0 overflow-hidden flex flex-col">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>{t("title")}</CardTitle>
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-accent text-[10px] font-bold text-bg">
                {threads.filter((th) => th.unread).length}
              </span>
            </div>
          </CardHeader>
          <CardBody className="flex-1 overflow-y-auto !p-2">
            {loading ? (
              <div className="space-y-2">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="skeleton h-16 rounded-md" />
                ))}
              </div>
            ) : threads.length === 0 ? (
              <EmptyState icon="messages" title={t("empty")} />
            ) : (
              threads.map((thread) => (
                <button
                  key={thread.id}
                  type="button"
                  onClick={() => setSelected(thread.id)}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-left transition-colors",
                    selected === thread.id
                      ? "bg-accent-dim"
                      : "hover:bg-surface-high",
                  )}
                >
                  <Avatar name={thread.clientName} size="sm" />
                  <div className="flex-1 min-w-0">
                    <p className={cn(
                      "truncate text-sm",
                      thread.unread ? "font-bold text-text-1" : "text-text-2",
                    )}>
                      {thread.clientName}
                    </p>
                    <p className="truncate text-xs text-text-3">
                      {thread.lastMessage}
                    </p>
                  </div>
                  {thread.unread && (
                    <span className="h-2 w-2 rounded-full bg-accent" />
                  )}
                </button>
              ))
            )}
          </CardBody>
        </Card>

        <Card className="flex-1 flex flex-col overflow-hidden">
          {selectedThread ? (
            <>
              <CardHeader className="border-b border-border">
                <div className="flex items-center gap-3">
                  <Avatar name={selectedThread.clientName} />
                  <div>
                    <p className="font-semibold text-text-1">
                      {selectedThread.clientName}
                    </p>
                    <p className="text-xs text-text-2">
                      {selectedThread.timestamp}
                    </p>
                  </div>
                </div>
              </CardHeader>
              <CardBody className="flex-1 overflow-y-auto">
                <div className="flex h-full items-center justify-center text-sm text-text-3">
                  {t("selectConversation")}
                </div>
              </CardBody>
              <div className="border-t border-border p-3">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={reply}
                    onChange={(e) => setReply(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSend()}
                    placeholder={t("replyPlaceholder")}
                    className="input-base flex-1 rounded-md px-3 py-2 text-sm"
                  />
                  <button
                    type="button"
                    onClick={handleSend}
                    className="rounded-md bg-accent px-4 py-2 text-sm font-semibold text-bg transition-transform active:scale-95"
                  >
                    {t("send")}
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex h-full items-center justify-center">
              <EmptyState
                icon="messages"
                title={t("selectConversation")}
                description={t("selectHint")}
              />
            </div>
          )}
        </Card>
      </div>
    </PageTransition>
  );
}
