"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { BrandMark, DniPreview } from "@/components/DniPreview";
import { SiteFooter, SiteHeader } from "@/components/SiteHeader";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { LIMA_DISTRITOS } from "@/lib/lima";

type DniKind = "azul" | "electronico";

const emptyForm = {
  dni: "",
  nombre: "",
  distrito: "",
  ubigeo: "",
  fechaCaducidad: "",
  noCaduca: false,
  fechaNacimiento: "",
  password: "",
  passwordConfirm: "",
  aceptoTerminos: false,
};

export default function RegisterPage() {
  const router = useRouter();
  const { refresh } = useAuth();
  const [tab, setTab] = useState<DniKind>("azul");
  const [distritos, setDistritos] = useState<string[]>([...LIMA_DISTRITOS]);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    api<{ distritos: string[] }>("/api/v1/catalog/distritos")
      .then((data) => {
        if (data.distritos?.length) setDistritos(data.distritos);
      })
      .catch(() => undefined);
  }, []);

  function update<K extends keyof typeof emptyForm>(key: K, value: (typeof emptyForm)[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setError("");
    if (!form.aceptoTerminos) {
      setError("Debes aceptar los terminos y condiciones.");
      return;
    }
    if (form.password !== form.passwordConfirm) {
      setError("Las contrasenas no coinciden.");
      return;
    }
    if (!form.distrito) {
      setError("Selecciona tu distrito de residencia.");
      return;
    }
    setSubmitting(true);
    try {
      await api("/api/v1/auth/register", {
        method: "POST",
        body: JSON.stringify({
          dni: form.dni,
          password: form.password,
          password_confirm: form.passwordConfirm,
          nombre: form.nombre.trim() || `Ciudadano ${form.dni}`,
          distrito: form.distrito,
          tipo_documento: "DNI",
          tipo_dni: tab,
          ubigeo: tab === "azul" ? form.ubigeo : null,
          fecha_caducidad: tab === "azul" && !form.noCaduca ? form.fechaCaducidad || null : null,
          no_caduca: tab === "azul" ? form.noCaduca : false,
          fecha_nacimiento: tab === "azul" ? form.fechaNacimiento || null : null,
          acepto_terminos: true,
        }),
      });
      await refresh();
      router.push("/ciudadano");
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo registrar.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="page-shell">
      <SiteHeader />
      <main className="auth-layout">
        <section className="auth-info">
          <h1>Verificacion de Identidad</h1>
          <p className="subtitle">
            Para garantizar la seguridad de su cuenta y cumplir con las normativas municipales,
            por favor complete los detalles de su documento de identidad.
          </p>
          <div className="secure-box">
            <h3>PROCESO SEGURO</h3>
            <p>Su informacion esta cifrada y solo se utilizara para validacion institucional.</p>
          </div>
          <BrandMark />
        </section>

        <form className="auth-card" onSubmit={onSubmit}>
          <div className="auth-tabs">
            <button className={tab === "azul" ? "auth-tab active" : "auth-tab"} type="button" onClick={() => setTab("azul")}>
              DNI Azul
            </button>
            <button
              className={tab === "electronico" ? "auth-tab active" : "auth-tab"}
              type="button"
              onClick={() => setTab("electronico")}
            >
              DNI Electronico
            </button>
          </div>

          {tab === "azul" ? (
            <div className="form-grid two-cols">
              <div className="form-field">
                <label htmlFor="tipoDoc">Tipo Documento</label>
                <select id="tipoDoc" defaultValue="DNI">
                  <option>DNI</option>
                </select>
              </div>
              <DniPreview />
              <div className="form-field">
                <label htmlFor="numeroDni">Numero de DNI</label>
                <input
                  id="numeroDni"
                  value={form.dni}
                  onChange={(event) => update("dni", event.target.value.replace(/\D/g, "").slice(0, 8))}
                  placeholder="Ingrese su DNI"
                  minLength={8}
                  maxLength={8}
                  required
                />
              </div>
              <div className="form-field">
                <label htmlFor="nombreCiudadano">Nombre completo</label>
                <input
                  id="nombreCiudadano"
                  value={form.nombre}
                  onChange={(event) => update("nombre", event.target.value)}
                  placeholder="Ingrese su nombre"
                  required
                />
              </div>
              <div className="form-field">
                <label htmlFor="ubigeo">Ubigeo</label>
                <input
                  id="ubigeo"
                  value={form.ubigeo}
                  onChange={(event) => update("ubigeo", event.target.value.replace(/\D/g, "").slice(0, 6))}
                  placeholder="Ingrese su codigo de ubigeo"
                  required
                />
              </div>
              <div className="form-field">
                <label htmlFor="caducidad">Fecha de caducidad</label>
                <input
                  id="caducidad"
                  type="date"
                  value={form.fechaCaducidad}
                  onChange={(event) => update("fechaCaducidad", event.target.value)}
                  disabled={form.noCaduca}
                  required={!form.noCaduca}
                />
              </div>
              <label className="checkbox-row" htmlFor="noCaduca">
                <input
                  id="noCaduca"
                  type="checkbox"
                  checked={form.noCaduca}
                  onChange={(event) => update("noCaduca", event.target.checked)}
                />
                No caduca
              </label>
              <div className="form-field">
                <label htmlFor="nacimiento">Fecha de nacimiento</label>
                <input
                  id="nacimiento"
                  type="date"
                  value={form.fechaNacimiento}
                  onChange={(event) => update("fechaNacimiento", event.target.value)}
                  required
                />
              </div>
              <DistrictField distritos={distritos} value={form.distrito} onChange={(value) => update("distrito", value)} />
            </div>
          ) : (
            <div className="form-grid">
              <div className="form-field">
                <label htmlFor="numeroDniE">Numero de DNI Electronico</label>
                <input
                  id="numeroDniE"
                  value={form.dni}
                  onChange={(event) => update("dni", event.target.value.replace(/\D/g, "").slice(0, 8))}
                  placeholder="Ingrese su DNI"
                  minLength={8}
                  maxLength={8}
                  required
                />
              </div>
              <div className="form-field">
                <label htmlFor="nombreCiudadanoE">Nombre completo</label>
                <input
                  id="nombreCiudadanoE"
                  value={form.nombre}
                  onChange={(event) => update("nombre", event.target.value)}
                  placeholder="Ingrese su nombre"
                  required
                />
              </div>
              <DistrictField
                id="distritoE"
                distritos={distritos}
                value={form.distrito}
                onChange={(value) => update("distrito", value)}
              />
            </div>
          )}

          <label className="checkbox-row" htmlFor="terminos" style={{ marginTop: 18 }}>
            <input
              id="terminos"
              type="checkbox"
              checked={form.aceptoTerminos}
              onChange={(event) => update("aceptoTerminos", event.target.checked)}
            />
            Acepto los terminos y condiciones
          </label>

          <div className="form-grid two-cols registro-password-grid">
            <div className="form-field">
              <label htmlFor="passwordRegistro">Contrasena</label>
              <input
                id="passwordRegistro"
                type="password"
                value={form.password}
                onChange={(event) => update("password", event.target.value)}
                placeholder="Minimo 6 caracteres"
                minLength={6}
                required
              />
            </div>
            <div className="form-field">
              <label htmlFor="passwordRegistroConfirmar">Confirmar contrasena</label>
              <input
                id="passwordRegistroConfirmar"
                type="password"
                value={form.passwordConfirm}
                onChange={(event) => update("passwordConfirm", event.target.value)}
                placeholder="Repite tu contrasena"
                minLength={6}
                required
              />
            </div>
          </div>

          {error ? <p className="flash">{error}</p> : null}
          <button className="btn-continuar" type="submit" disabled={submitting}>
            {submitting ? "Registrando..." : "Continuar →"}
          </button>
        </form>
      </main>
      <SiteFooter />
    </div>
  );
}

function DistrictField({
  distritos,
  value,
  onChange,
  id = "distrito",
}: {
  distritos: string[];
  value: string;
  onChange: (value: string) => void;
  id?: string;
}) {
  return (
    <div className="form-field">
      <label htmlFor={id}>Distrito de residencia</label>
      <select id={id} value={value} onChange={(event) => onChange(event.target.value)} required>
        <option value="">Seleccione su distrito</option>
        {distritos.map((distrito) => (
          <option key={distrito} value={distrito}>
            {distrito}
          </option>
        ))}
      </select>
      <p className="form-note">
        Nota: El distrito de residencia no podra ser cambiado hasta dentro de 5 meses para evitar
        fraude.
      </p>
    </div>
  );
}
