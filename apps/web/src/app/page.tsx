import Link from "next/link";
import { SiteFooter, SiteHeader } from "@/components/SiteHeader";

export default function HomePage() {
  return (
    <div className="page-shell">
      <SiteHeader />
      <main>
        <section className="hero" id="inicio">
          <div className="hero-content">
            <h1>Muni Spaces</h1>
            <p>
              NeoMuni Platforms propone la modernizacion del proceso de reserva de espacios
              publicos. Ingresa tus datos para comenzar con la creacion de tu cuenta y poder
              iniciar el proceso.
            </p>
            <Link className="cta" href="/login">
              Ingresar sesion y reservar
            </Link>
          </div>
          <div className="hero-image">
            <img
              src="https://images.unsplash.com/photo-1526232761682-d26e03ac148e?auto=format&fit=crop&w=1600&q=80"
              alt="Espacio municipal deportivo"
            />
          </div>
        </section>

        <section className="features">
          <h2>Todo lo que la comunidad necesita</h2>
          <div className="features-panel">
            <article className="feature-card">
              <div className="feature-icon" style={{ background: "#91E4AC" }}>
                <svg width="22" height="22" viewBox="0 0 24 24">
                  <path
                    fill="currentColor"
                    d="M7 2h2v2h6V2h2v2h3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h3V2Zm13 8H4v10h16V10ZM4 8h16V6H4v2Z"
                  />
                </svg>
              </div>
              <h3>Reservar espacios</h3>
              <p>Encuentra y agenda rapidamente canchas, salones y parques.</p>
            </article>
            <article className="feature-card">
              <div className="feature-icon" style={{ background: "#FFDAD6" }}>
                <svg width="24" height="22" viewBox="0 0 24 24">
                  <path
                    fill="#93000A"
                    d="M12 2 1 21h22L12 2Zm0 6 6.7 11H5.3L12 8Zm-1 3h2v4h-2v-4Zm0 5h2v2h-2v-2Z"
                  />
                </svg>
              </div>
              <h3>Reporte ciudadano</h3>
              <p>Notifica sobre danos, falta de mantenimiento o problemas de seguridad. Tu anonimato esta asegurado.</p>
            </article>
            <article className="feature-card">
              <div className="feature-icon" style={{ background: "#1E40AF", color: "#fff" }}>
                <svg width="24" height="18" viewBox="0 0 24 24">
                  <path
                    fill="#FFFFFF"
                    d="M12 3C7 3 2.7 6.1 1 10.5 2.7 14.9 7 18 12 18s9.3-3.1 11-7.5C21.3 6.1 17 3 12 3Zm0 12.5a5 5 0 1 1 0-10 5 5 0 0 1 0 10Zm0-2a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z"
                  />
                </svg>
              </div>
              <h3>Ver disponibilidad</h3>
              <p>Explora un mapa interactivo para descubrir nuevos espacios y ver su ocupacion.</p>
            </article>
          </div>
        </section>

        <section className="testimonials">
          <h2>Experiencias de la comunidad</h2>
          <div className="testimonial-grid">
            <article className="testimonial-card">
              <div className="stars">★★★★★</div>
              <p>
                "Reservar la cancha de baloncesto para el torneo vecinal fue increiblemente facil.
                La plataforma es clara y transparente con los horarios."
              </p>
              <div className="person">
                <div className="avatar">MG</div>
                <div>
                  <strong>Maria Gonzalez</strong>
                  <p>Vecina del Distrito Central</p>
                </div>
              </div>
            </article>
            <article className="testimonial-card">
              <div className="stars">★★★★★</div>
              <p>
                "Pude reportar un juego infantil danado en el parque y en menos de una semana estaba
                reparado. Excelente herramienta de gestion comunitaria."
              </p>
              <div className="person">
                <div className="avatar">CM</div>
                <div>
                  <strong>Carlos Mendoza</strong>
                  <p>Presidente Junta de Vecinos</p>
                </div>
              </div>
            </article>
            <article className="testimonial-card">
              <div className="stars">★★★★★</div>
              <p>
                "Conseguir el salon municipal para nuestras reuniones de club de lectura nunca fue
                tan organizado. Ver el calendario en tiempo real es una gran ventaja."
              </p>
              <div className="person">
                <div className="avatar">ER</div>
                <div>
                  <strong>Elena Ramirez</strong>
                  <p>Coordinadora Cultural</p>
                </div>
              </div>
            </article>
          </div>
        </section>

        <section className="faq-section">
          <h2>Preguntas Frecuentes</h2>
          <div className="faq-list">
            <details>
              <summary>¿Tiene algun costo reservar un espacio municipal?</summary>
              <p className="answer">
                Depende del tipo de espacio y de las normas de cada municipio. La plataforma muestra
                la informacion antes de confirmar la reserva.
              </p>
            </details>
            <details>
              <summary>¿Con cuanta anticipacion debo hacer una reserva?</summary>
              <p className="answer">
                Se recomienda reservar con varios dias de anticipacion para asegurar disponibilidad y
                permitir la revision de la solicitud.
              </p>
            </details>
            <details>
              <summary>¿Que pasa si encuentro el espacio en malas condiciones?</summary>
              <p className="answer">
                Puedes registrar un reporte ciudadano para que el municipio revise el caso y realice
                el mantenimiento correspondiente.
              </p>
            </details>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
