import Link from "next/link";
import { useRouter } from "next/router";
import type { ReactNode } from "react";
import { clearSession } from "@/lib/frontend-auth";
import { getNavigationForRole } from "@/lib/navigation";
import type { CurrentUser } from "@/types/auth";

type DashboardLayoutProps = {
  children: ReactNode;
  title: string;
  user: CurrentUser;
};

export function DashboardLayout({ children, title, user }: DashboardLayoutProps) {
  const router = useRouter();
  const navigation = getNavigationForRole(user.role);

  function handleLogout() {
    clearSession();
    void router.replace("/login");
  }

  return (
    <div className="min-h-screen bg-luminoa-panel text-luminoa-ink">
      <aside className="fixed inset-y-0 left-0 z-20 hidden w-64 border-r border-luminoa-line bg-white px-4 py-5 lg:block">
        <div className="mb-8 px-2">
          <p className="text-xl font-bold tracking-normal">Luminoa</p>
          <p className="mt-1 text-sm text-luminoa-muted">Panel interno</p>
        </div>

        <nav className="space-y-1" aria-label="Navegacion principal">
          {navigation.map((item) => {
            const isActive =
              router.pathname === item.href || router.pathname.startsWith(`${item.href}/`);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`block rounded-md px-3 py-2 text-sm font-medium transition ${
                  isActive
                    ? "bg-luminoa-teal text-white"
                    : "text-slate-700 hover:bg-slate-100 hover:text-luminoa-ink"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      </aside>

      <div className="lg:pl-64">
        <header className="sticky top-0 z-10 border-b border-luminoa-line bg-white/95 backdrop-blur">
          <div className="flex min-h-16 flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <div>
              <p className="text-xs font-semibold uppercase text-luminoa-teal lg:hidden">Luminoa</p>
              <h1 className="text-xl font-semibold">{title}</h1>
            </div>

            <div className="flex items-center justify-between gap-3">
              <div className="text-sm">
                <p className="font-medium text-slate-800">{user.name}</p>
                <p className="text-xs text-luminoa-muted">{user.role}</p>
              </div>
              <button
                type="button"
                onClick={handleLogout}
                className="rounded-md border border-luminoa-line px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
              >
                Cerrar sesion
              </button>
            </div>
          </div>

          <nav className="flex gap-2 overflow-x-auto border-t border-luminoa-line px-4 py-2 lg:hidden">
            {navigation.map((item) => {
              const isActive =
                router.pathname === item.href || router.pathname.startsWith(`${item.href}/`);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`whitespace-nowrap rounded-md px-3 py-2 text-sm font-medium ${
                    isActive ? "bg-luminoa-teal text-white" : "text-slate-700"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </header>

        <main className="px-4 py-6 sm:px-6">{children}</main>
      </div>
    </div>
  );
}
