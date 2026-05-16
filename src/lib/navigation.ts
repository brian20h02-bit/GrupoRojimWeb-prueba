import type { Role } from "@/types/auth";

export type DashboardNavItem = {
  label: string;
  href: string;
  roles: Role[];
};

export const dashboardNavItems: DashboardNavItem[] = [
  { label: "Dashboard", href: "/dashboard", roles: ["ADMIN", "RECEPCIONISTA", "VENDEDOR"] },
  { label: "Productos", href: "/dashboard/productos", roles: ["ADMIN", "RECEPCIONISTA", "VENDEDOR"] },
  { label: "Stock", href: "/dashboard/stock", roles: ["ADMIN", "RECEPCIONISTA", "VENDEDOR"] },
  { label: "Entradas", href: "/dashboard/entradas", roles: ["ADMIN", "RECEPCIONISTA"] },
  { label: "Salidas", href: "/dashboard/salidas", roles: ["ADMIN", "VENDEDOR"] },
  { label: "Historial", href: "/dashboard/historial", roles: ["ADMIN", "RECEPCIONISTA", "VENDEDOR"] },
  { label: "Usuarios", href: "/dashboard/usuarios", roles: ["ADMIN"] },
];

export function getNavigationForRole(role: Role) {
  return dashboardNavItems.filter((item) => item.roles.includes(role));
}
