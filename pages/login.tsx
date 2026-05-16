import { useRouter } from "next/router";
import { useEffect } from "react";
import { getStoredToken, getStoredUser } from "@/lib/frontend-auth";

export default function LoginPage() {
  const router = useRouter();

  useEffect(() => {
    if (getStoredToken() && getStoredUser()) {
      void router.replace("/dashboard");
    }
  }, [router]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-luminoa-panel px-4">
      <section className="w-full max-w-md rounded-lg border border-luminoa-line bg-white p-6 shadow-sm">
        <p className="text-sm font-semibold uppercase text-luminoa-teal">Luminoa</p>
        <h1 className="mt-2 text-2xl font-semibold text-luminoa-ink">Iniciar sesion</h1>
        <p className="mt-3 text-sm leading-6 text-luminoa-muted">
          La conexion real con el backend se implementa en la siguiente fase.
        </p>
      </section>
    </main>
  );
}
