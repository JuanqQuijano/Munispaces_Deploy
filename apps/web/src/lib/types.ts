export type Role = "ciudadano" | "admin";

export type User = {
  id: string;
  dni: string | null;
  username: string | null;
  nombre: string;
  distrito: string;
  role: Role;
  espacio_id?: string | null;
  espacio_nombre?: string | null;
  tipo_documento?: string;
  tipo_dni?: string;
  ubigeo?: string | null;
  fecha_caducidad?: string | null;
  no_caduca?: boolean;
  fecha_nacimiento?: string | null;
  distrito_bloqueado_hasta?: string | null;
};

export type Space = {
  id: string;
  code: string;
  nombre: string;
  distrito: string;
  tipo: string;
  precio_hora: number;
  precio_hora_residente: number;
  descuento_residente: number;
  precio_aplicable: number;
  es_residente: boolean;
  rating: number;
  disponible: boolean;
  imagen: string;
  direccion: string;
  lat: number;
  lng: number;
  distancia_km: number | null;
};

export type AvailabilitySlot = {
  minutos: number;
  etiqueta: string;
  ocupado: boolean;
};

export type Reservation = {
  id: string;
  public_id: string;
  space_id: string;
  fecha: string;
  slots: number[];
  hora_texto: string;
  duracion: number;
  costo: number;
  estado: string;
  qr_payload: string;
  espacio_nombre: string;
  espacio_distrito: string;
  espacio_direccion: string;
  espacio_imagen: string;
  lat: number | null;
  lng: number | null;
  created_at: string;
};

export type Report = {
  id: string;
  public_id: string;
  espacio_id?: string | null;
  espacio_nombre?: string;
  tipo: string;
  urgencia: string;
  estado: string;
  descripcion: string;
  direccion: string;
  lat: number | null;
  lng: number | null;
  fotos: string[];
  created_at: string;
};

export type Observation = {
  id: string;
  space_id: string;
  fecha: string;
  texto: string;
  autor: string;
  created_at: string;
};
