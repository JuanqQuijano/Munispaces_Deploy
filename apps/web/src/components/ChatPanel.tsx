"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { api } from "@/lib/api";
import {
  parseReservationUrl,
  ReservationConfirmModal,
  type ReservationDraft,
} from "@/components/ReservationConfirmModal";
import { ReportConfirmModal, type ReportDraft } from "@/components/ReportConfirmModal";

type ChatImage = { id: string; preview: string };
type Message = { role: "user" | "assistant"; content: string; images?: ChatImage[] };
type AgentResponse = {
  respuesta: string;
  accion?: { type: string; url?: string; draft?: ReportDraft };
};

function cleanAssistantText(text: string) {
  return text
    .replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+|\/ciudadano\/espacios\/[^)\s]+)\)/gi, "$1")
    .replace(/https?:\/\/[^\s)]+/gi, "")
    .replace(/\/ciudadano\/espacios\/[0-9a-fA-F-]{36}\/reservar[^\s]*/gi, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export function ChatPanel({ roleLabel }: { roleLabel: string }) {
  const isAdmin = roleLabel === "admin";
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: isAdmin
        ? "Hola, puedo enviar reportes directos a Telegram y resumir el historial."
        : "Hola, puedo ayudarte a encontrar horarios cerca de ti o a armar un reporte ciudadano.",
    },
  ]);
  const [input, setInput] = useState("");
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [composerImages, setComposerImages] = useState<ChatImage[]>([]);
  const [evidenceIds, setEvidenceIds] = useState<string[]>([]);
  const [draft, setDraft] = useState<ReservationDraft | null>(null);
  const [reportDraft, setReportDraft] = useState<ReportDraft | null>(null);
  const logRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    logRef.current?.scrollTo({ top: logRef.current.scrollHeight });
  }, [messages]);

  async function send(event: FormEvent) {
    event.preventDefault();
    const text = input.trim();
    if (busy || uploading) return;
    if (!text && !composerImages.length) return;

    const content = text || "Quiero reportar un problema.";
    const sentImages = composerImages;
    const nextIds = [...new Set([...evidenceIds, ...sentImages.map((item) => item.id)])].slice(0, 2);
    const next: Message[] = [
      ...messages,
      { role: "user", content, images: sentImages.length ? sentImages : undefined },
    ];
    setMessages(next);
    setInput("");
    setComposerImages([]);
    setEvidenceIds(nextIds);
    setBusy(true);
    try {
      const data = await api<AgentResponse>("/api/v1/agent/chat", {
        method: "POST",
        body: JSON.stringify({
          mensajes: next.map(({ role, content: messageText }) => ({ role, content: messageText })),
          adjuntos: nextIds.map((id) => ({ tipo: "imagen", evidencia_id: id })),
          lat: coords?.lat,
          lng: coords?.lng,
        }),
      });

      const reservation =
        data.accion?.type === "navigate" && data.accion.url
          ? parseReservationUrl(data.accion.url)
          : null;
      const report = data.accion?.type === "report_draft" ? data.accion.draft || null : null;

      let reply = data.respuesta;
      if (reservation) {
        setDraft(reservation);
        reply = cleanAssistantText(reply);
        if (!/confirm/i.test(reply)) {
          reply = `${reply}\n\nAbri un resumen para que confirmes la reserva sin salir del chat.`.trim();
        }
      } else if (report) {
        setReportDraft({
          ...report,
          evidencia_ids: report.evidencia_ids?.length ? report.evidencia_ids : nextIds,
          lat: report.lat ?? coords?.lat ?? null,
          lng: report.lng ?? coords?.lng ?? null,
        });
        reply = cleanAssistantText(reply);
        if (!/confirm/i.test(reply)) {
          reply = `${reply}\n\nAbri un resumen para que confirmes el reporte.`.trim();
        }
      }

      setMessages([...next, { role: "assistant", content: reply }]);
    } catch (error) {
      setMessages([
        ...next,
        {
          role: "assistant",
          content: error instanceof Error ? error.message : "No se pudo responder.",
        },
      ]);
    } finally {
      setBusy(false);
    }
  }

  function locate() {
    navigator.geolocation.getCurrentPosition((position) => {
      setCoords({ lat: position.coords.latitude, lng: position.coords.longitude });
    });
  }

  async function onFiles(files: FileList | null) {
    if (!files?.length || isAdmin) return;
    const remaining = 2 - evidenceIds.length - composerImages.length;
    const selected = Array.from(files)
      .filter((file) => file.type.startsWith("image/"))
      .slice(0, Math.max(0, remaining));
    if (!selected.length) return;

    setUploading(true);
    try {
      const uploaded: ChatImage[] = [];
      for (const file of selected) {
        const body = new FormData();
        body.append("file", file);
        const evidence = await api<{ id: string; data_url: string }>("/api/v1/evidencias", {
          method: "POST",
          body,
        });
        uploaded.push({ id: evidence.id, preview: evidence.data_url });
      }
      setComposerImages((current) => [...current, ...uploaded].slice(0, 2));
    } catch (error) {
      setMessages((current) => [
        ...current,
        {
          role: "assistant",
          content: error instanceof Error ? error.message : "No se pudo adjuntar la foto.",
        },
      ]);
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  return (
    <>
      <section className="chat-panel">
        {!isAdmin ? (
          <div className="chat-toolbar">
            <button type="button" onClick={locate}>
              {coords ? "Ubicacion lista" : "Usar mi ubicacion"}
            </button>
          </div>
        ) : null}

        <div className="chat-mensajes" ref={logRef}>
          {messages.map((message, index) => (
            <div key={index} className={`chat-message ${message.role}`}>
              {message.images?.length ? (
                <div className="chat-message-images">
                  {message.images.map((image) => (
                    <img key={image.id} src={image.preview} alt="Evidencia adjunta" />
                  ))}
                </div>
              ) : null}
              {message.content}
            </div>
          ))}
          {busy ? <div className="chat-message assistant">Escribiendo...</div> : null}
        </div>

        <form className={`chat-form${isAdmin ? "" : " has-attach"}`} onSubmit={send}>
          {!isAdmin ? (
            <div className="chat-attach-wrap">
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                capture="environment"
                hidden
                onChange={(event) => onFiles(event.target.files)}
              />
              <button
                type="button"
                className="chat-attach"
                onClick={() => fileRef.current?.click()}
                disabled={busy || uploading || evidenceIds.length + composerImages.length >= 2}
                aria-label="Adjuntar foto"
              >
                {uploading ? "..." : "+"}
              </button>
            </div>
          ) : null}
          <div className="chat-composer">
            {!isAdmin && composerImages.length ? (
              <div className="chat-composer-thumbs">
                {composerImages.map((item) => (
                  <div key={item.id} className="chat-pending-thumb">
                    <img src={item.preview} alt="Se enviara con el mensaje" />
                    <button
                      type="button"
                      className="upload-remove"
                      onClick={() =>
                        setComposerImages((current) => current.filter((entry) => entry.id !== item.id))
                      }
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            ) : null}
            <input
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder={
                isAdmin
                  ? "Ej. Haz un reporte directo para los ultimos 2 reportes"
                  : "Ej. Quiero reportar una banca rota"
              }
              autoComplete="off"
            />
          </div>
          <button type="submit" disabled={busy || uploading}>
            Enviar
          </button>
        </form>
      </section>

      {draft ? (
        <ReservationConfirmModal
          draft={draft}
          onClose={() => setDraft(null)}
          onBooked={() => {
            setMessages((current) => [
              ...current,
              {
                role: "assistant",
                content: "Listo. Tu reserva quedo confirmada. Puedes verla en Mis reservas.",
              },
            ]);
          }}
        />
      ) : null}

      {reportDraft ? (
        <ReportConfirmModal
          draft={reportDraft}
          onClose={() => setReportDraft(null)}
          onReported={() => {
            setComposerImages([]);
            setEvidenceIds([]);
            setMessages((current) => [
              ...current,
              {
                role: "assistant",
                content: "Listo. Tu reporte quedo registrado. Puedes verlo en Mis reportes.",
              },
            ]);
          }}
        />
      ) : null}
    </>
  );
}
