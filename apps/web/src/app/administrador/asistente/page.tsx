"use client";

import { AdminShell } from "@/components/AdminShell";
import { ChatPanel } from "@/components/ChatPanel";

export default function AdminAssistantPage() {
  return (
    <AdminShell>
      <h1 className="page-title">Asistente IA administrador</h1>
      <p className="page-subtitle">Pide reportes directos a Telegram o consultas sobre el historial</p>
      <ChatPanel roleLabel="admin" />
    </AdminShell>
  );
}
