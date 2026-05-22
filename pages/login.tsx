import Head from "next/head";
import Image from "next/image";
import { useRouter } from "next/router";
import type { FormEvent } from "react";
import { useEffect, useState } from "react";
import { ApiError, loginRequest } from "@/lib/api";
import { getStoredToken, getStoredUser, storeSession } from "@/lib/frontend-auth";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (getStoredToken() && getStoredUser()) {
      void router.replace("/dashboard");
    }
  }, [router]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (!email.trim() || !password) {
      setError("Ingresá email y contraseña para continuar.");
      return;
    }

    setIsLoading(true);

    try {
      const response = await loginRequest(email.trim(), password);
      storeSession(response.token, response.user);
      void router.replace("/dashboard");
    } catch (loginError) {
      if (loginError instanceof ApiError) {
        setError(
          loginError.status === 401
            ? "Email o contraseña incorrectos."
            : loginError.message,
        );
      } else {
        setError("No se pudo iniciar sesión. Intentá nuevamente.");
      }
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <>
      <Head>
        <title>Ingresar — Grupo Rojim</title>
        <meta name="robots" content="noindex, nofollow" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&display=swap"
          rel="stylesheet"
        />
      </Head>

      <div className="flex min-h-screen">
        {/* ── LEFT PANEL — Brand identity ── */}
        <aside className="hidden lg:flex lg:w-[58%] bg-gr-dark flex-col justify-between p-12 relative overflow-hidden select-none">

          {/* Amber left-edge accent bar */}
          <div className="absolute left-0 top-[18%] bottom-[18%] w-[3px] rounded-r-sm"
            style={{ background: "linear-gradient(to bottom, transparent, #F5A623 25%, #F5A623 75%, transparent)" }} />

          {/* Concentric rings — decorative */}
          <svg className="absolute -right-16 -top-16 opacity-[0.055] pointer-events-none" width="500" height="500" viewBox="0 0 500 500" fill="none" aria-hidden="true">
            <circle cx="420" cy="80" r="260" stroke="#F5A623" strokeWidth="1" />
            <circle cx="420" cy="80" r="180" stroke="#F5A623" strokeWidth="0.8" />
            <circle cx="420" cy="80" r="100" stroke="#F5A623" strokeWidth="0.6" />
            <line x1="160" y1="80" x2="500" y2="80" stroke="#F5A623" strokeWidth="0.6" />
            <line x1="420" y1="0" x2="420" y2="340" stroke="#F5A623" strokeWidth="0.6" />
          </svg>

          {/* Bottom ambient glow */}
          <div className="absolute bottom-0 left-1/4 right-1/4 h-48 pointer-events-none"
            style={{ background: "radial-gradient(ellipse, rgba(245,166,35,0.12) 0%, transparent 70%)" }} />

          {/* Logo + brand name */}
          <div className="flex items-center gap-3 relative z-10">
            <Image
              src="/brand/logo.png"
              alt="Grupo Rojim"
              width={52}
              height={52}
              className="object-contain"
              style={{ filter: "brightness(1.1)" }}
            />
            <span className="text-gr-amber font-black text-xl tracking-tight">
              Grupo Rojim
            </span>
          </div>

          {/* Center copy */}
          <div className="relative z-10">
            <p className="text-gr-amber text-[0.68rem] font-bold tracking-[0.16em] uppercase mb-5">
              Panel de Gestión Interna
            </p>
            <h1
              className="text-white leading-[1.1] tracking-tight mb-5"
              style={{ fontFamily: "'DM Serif Display', Georgia, serif", fontSize: "clamp(2.6rem, 3.2vw, 3.4rem)", fontWeight: 400 }}
            >
              Inventario y<br />
              <em className="not-italic text-gr-amber">control total</em><br />
              en un lugar.
            </h1>
            <p className="text-sm leading-relaxed max-w-sm" style={{ color: "rgba(255,255,255,0.52)" }}>
              Gestioná stock, movimientos y usuarios desde un sistema centralizado, diseñado para las operaciones del norte argentino.
            </p>

            {/* Feature pills */}
            <div className="flex flex-wrap gap-2 mt-7">
              {["Stock en tiempo real", "Historial de movimientos", "Gestión de usuarios"].map((feat) => (
                <span
                  key={feat}
                  className="text-[0.7rem] font-semibold px-3 py-[5px] rounded-full"
                  style={{
                    color: "rgba(245,166,35,0.9)",
                    background: "rgba(245,166,35,0.1)",
                    border: "1px solid rgba(245,166,35,0.22)",
                  }}
                >
                  {feat}
                </span>
              ))}
            </div>
          </div>

          {/* Bottom tagline */}
          <div className="relative z-10">
            <div className="h-px mb-4" style={{ background: "rgba(245,166,35,0.18)" }} />
            <p className="text-[0.72rem] tracking-wide" style={{ color: "rgba(255,255,255,0.3)" }}>
              Distribución Eléctrica · Salta y Jujuy
            </p>
          </div>
        </aside>

        {/* ── RIGHT PANEL — Form ── */}
        <main className="flex-1 bg-gr-off-white flex items-center justify-center px-6 py-12 relative">

          {/* Back to site */}
          <a
            href="/"
            className="absolute top-6 right-6 text-[0.8rem] font-semibold flex items-center gap-1 transition-opacity hover:opacity-100"
            style={{ color: "#6b5040", opacity: 0.6 }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
              <path d="M19 12H5M12 5l-7 7 7 7" />
            </svg>
            Volver al sitio
          </a>

          <div className="w-full max-w-[390px]">

            {/* Mobile-only logo */}
            <div className="flex items-center gap-2 mb-8 lg:hidden">
              <span className="font-black text-gr-amber text-lg tracking-tight">Grupo Rojim</span>
            </div>

            {/* Header */}
            <div className="mb-8">
              <h2
                className="text-gr-dark leading-tight tracking-tight mb-2"
                style={{ fontFamily: "'DM Serif Display', Georgia, serif", fontSize: "1.85rem", fontWeight: 400 }}
              >
                Bienvenido de vuelta
              </h2>
              <p className="text-sm leading-relaxed text-gr-muted">
                Ingresá con tu cuenta asignada para acceder al panel.
              </p>
            </div>

            {/* Error alert */}
            {error ? (
              <div
                role="alert"
                className="mb-5 px-4 py-3 rounded-lg text-sm font-medium"
                style={{
                  background: "rgba(185,28,28,0.07)",
                  border: "1px solid rgba(185,28,28,0.22)",
                  color: "#991b1b",
                }}
              >
                {error}
              </div>
            ) : null}

            {/* Form */}
            <form onSubmit={handleSubmit} noValidate className="space-y-5">

              {/* Email */}
              <div>
                <label htmlFor="email" className="block text-[0.75rem] font-bold tracking-[0.06em] uppercase text-gr-dark mb-[7px]">
                  Email
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="usuario@gruporojim.com"
                  disabled={isLoading}
                  className="gr-input block w-full rounded-lg bg-white px-4 py-[11px] text-sm text-gr-dark placeholder:text-stone-400 disabled:opacity-60"
                  style={{ border: "1.5px solid rgba(74,44,10,0.18)", outline: "none", fontFamily: "inherit" }}
                />
              </div>

              {/* Password */}
              <div>
                <label htmlFor="password" className="block text-[0.75rem] font-bold tracking-[0.06em] uppercase text-gr-dark mb-[7px]">
                  Contraseña
                </label>
                <div className="relative">
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    disabled={isLoading}
                    className="gr-input block w-full rounded-lg bg-white pl-4 pr-11 py-[11px] text-sm text-gr-dark placeholder:text-stone-400 disabled:opacity-60"
                    style={{ border: "1.5px solid rgba(74,44,10,0.18)", outline: "none", fontFamily: "inherit" }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gr-muted hover:text-gr-dark transition-colors"
                  >
                    {showPassword ? (
                      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                        <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                        <line x1="1" y1="1" x2="23" y2="23" />
                      </svg>
                    ) : (
                      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                        <circle cx="12" cy="12" r="3" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={isLoading}
                className="gr-btn-submit mt-1 w-full flex items-center justify-center gap-2 rounded-lg py-[13px] text-[0.9rem] font-bold tracking-[0.01em] text-gr-dark transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                style={{
                  background: "#F5A623",
                  boxShadow: "0 4px 18px rgba(245,166,35,0.38)",
                  fontFamily: "inherit",
                }}
              >
                {isLoading ? (
                  <>
                    <svg
                      className="gr-spin"
                      width="16" height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      aria-hidden="true"
                    >
                      <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
                    </svg>
                    Iniciando sesión…
                  </>
                ) : (
                  "Ingresar al panel →"
                )}
              </button>
            </form>

            {/* Footer note */}
            <p className="mt-8 text-center text-[0.73rem] leading-relaxed" style={{ color: "rgba(74,44,10,0.42)" }}>
              Acceso exclusivo para personal autorizado.<br />
              ¿Problemas para ingresar? Contactá al administrador del sistema.
            </p>
          </div>
        </main>
      </div>

      {/* Scoped styles */}
      <style>{`
        .gr-input:focus {
          border-color: #F5A623 !important;
          box-shadow: 0 0 0 3px rgba(245,166,35,0.18) !important;
        }
        .gr-btn-submit:not(:disabled):hover {
          background: #e6951a !important;
          box-shadow: 0 6px 24px rgba(245,166,35,0.52) !important;
          transform: translateY(-1px);
        }
        .gr-btn-submit:not(:disabled):active {
          transform: translateY(0);
        }
        @keyframes gr-spin {
          to { transform: rotate(360deg); }
        }
        .gr-spin {
          animation: gr-spin 0.75s linear infinite;
        }
      `}</style>
    </>
  );
}
