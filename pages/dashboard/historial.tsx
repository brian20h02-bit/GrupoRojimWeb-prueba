import { PlaceholderPanel } from "@/components/dashboard/PlaceholderPanel";
import { ProtectedDashboardPage } from "@/components/dashboard/ProtectedDashboardPage";

export default function HistoryPage() {
  return (
    <ProtectedDashboardPage title="Historial">
      <PlaceholderPanel
        title="Historial de movimientos"
        description="Aca se listaran entradas y salidas con filtros por producto, usuario y fechas."
      />
    </ProtectedDashboardPage>
  );
}
