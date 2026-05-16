import { PlaceholderPanel } from "@/components/dashboard/PlaceholderPanel";
import { ProtectedDashboardPage } from "@/components/dashboard/ProtectedDashboardPage";

export default function ProductsPage() {
  return (
    <ProtectedDashboardPage title="Productos">
      <PlaceholderPanel
        title="Listado de productos"
        description="Esta seccion tendra busqueda, paginacion, estado de stock y acciones administrativas."
      />
    </ProtectedDashboardPage>
  );
}
