import { PlaceholderPanel } from "@/components/dashboard/PlaceholderPanel";
import { ProtectedDashboardPage } from "@/components/dashboard/ProtectedDashboardPage";

export default function EntriesPage() {
  return (
    <ProtectedDashboardPage title="Entradas" allowedRoles={["ADMIN", "RECEPCIONISTA"]}>
      <PlaceholderPanel
        title="Registrar entrada"
        description="Formulario reservado para ADMIN y RECEPCIONISTA. En la fase correspondiente se conectara con /api/stock/entries."
      />
    </ProtectedDashboardPage>
  );
}
