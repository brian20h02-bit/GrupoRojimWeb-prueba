import { PlaceholderPanel } from "@/components/dashboard/PlaceholderPanel";
import { ProtectedDashboardPage } from "@/components/dashboard/ProtectedDashboardPage";

export default function ExitsPage() {
  return (
    <ProtectedDashboardPage title="Salidas" allowedRoles={["ADMIN", "VENDEDOR"]}>
      <PlaceholderPanel
        title="Registrar salida"
        description="Formulario reservado para ADMIN y VENDEDOR. En la fase correspondiente se conectara con /api/stock/exits."
      />
    </ProtectedDashboardPage>
  );
}
