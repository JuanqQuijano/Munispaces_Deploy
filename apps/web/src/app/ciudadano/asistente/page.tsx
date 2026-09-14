"use client";

import { CitizenShell } from "@/components/CitizenShell";
import { ChatPanel } from "@/components/ChatPanel";

export default function CitizenAssistantPage() {
  return (
    <CitizenShell>
      <h1 className="page-title">Asistente IA</h1>
      <p className="page-subtitle">Consulta horarios, reserva un espacio o arma un reporte ciudadano.</p>
      <ChatPanel roleLabel="ciudadano" />
    </CitizenShell>
  );
}
