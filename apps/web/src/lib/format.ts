export const MONTHS = [
  "Enero",
  "Febrero",
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Septiembre",
  "Octubre",
  "Noviembre",
  "Diciembre",
];

export function formatDate(value: string) {
  const date = new Date(value);
  if (!Number.isNaN(date.getTime()) && (value.includes("T") || value.includes(" "))) {
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  }
  const [year, month, day] = value.split("-");
  if (!day) {
    return date.toLocaleDateString("es-PE");
  }
  return `${day.slice(0, 2)}/${month}/${year}`;
}

export function formatDateParts(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return { day: value, time: "" };
  }
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();
  const hours = date.getHours();
  const minutes = String(date.getMinutes()).padStart(2, "0");
  const suffix = hours >= 12 ? "pm" : "am";
  const hour12 = hours % 12 || 12;
  return {
    day: `${day}/${month}/${year}`,
    time: `${hour12}:${minutes} ${suffix}`,
  };
}

export function formatReservationDay(fecha: string) {
  const [year, month, day] = fecha.split("-");
  if (!day) return fecha;
  return `${MONTHS[Number(month) - 1]} ${Number(day)}`;
}

export function formatReservationWhen(fecha: string, horaTexto: string) {
  const dayLabel = formatReservationDay(fecha);
  if (dayLabel === fecha && !fecha.includes("-")) return `${fecha} - ${horaTexto}`;
  return `${dayLabel} - ${horaTexto}`;
}

export function relativeTime(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "hace un momento";
  if (minutes < 60) return `hace ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `hace ${hours} h`;
  const days = Math.floor(hours / 24);
  return `hace ${days} dia${days === 1 ? "" : "s"}`;
}
