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

  useEffect(() => {
    if (getStoredToken() && getStoredUser()) {
      void router.replace("/dashboard");
    }
  }, [router]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (!email.trim() || !password) {
      setError("Ingresa email y contrasena para continuar.");
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
            ? "Email o contrasena incorrectos."
            : loginError.message,
        );
      } else {
        setError("No se pudo iniciar sesion. Intenta nuevamente.");
      }
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-luminoa-panel px-4 py-10">
      <section className="w-full max-w-md rounded-lg border border-luminoa-line bg-white p-6 shadow-sm">
        <div className="mb-8">
          <p className="text-sm font-semibold uppercase text-luminoa-teal">Luminoa</p>
          <h1 className="mt-2 text-2xl font-semibold text-luminoa-ink">Iniciar sesion</h1>
          <p className="mt-3 text-sm leading-6 text-luminoa-muted">
            Accede al panel interno de inventario con tu usuario asignado.
          </p>
        </div>

        <form className="space-y-5" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-slate-800">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="mt-2 block w-full rounded-md border border-luminoa-line bg-white px-3 py-2 text-sm outline-none transition placeholder:text-slate-400 focus:border-luminoa-teal focus:ring-2 focus:ring-luminoa-teal/20"
              placeholder="admin@luminoa.local"
              disabled={isLoading}
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-slate-800">
              Contrasena
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="mt-2 block w-full rounded-md border border-luminoa-line bg-white px-3 py-2 text-sm outline-none transition placeholder:text-slate-400 focus:border-luminoa-teal focus:ring-2 focus:ring-luminoa-teal/20"
              placeholder="Ingresa tu contrasena"
              disabled={isLoading}
            />
          </div>

          {error ? (
            <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </div>
          ) : null}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full rounded-md bg-luminoa-teal px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-teal-800 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isLoading ? "Iniciando sesion..." : "Iniciar sesion"}
          </button>
        </form>
      </section>
    </main>
  );
}
