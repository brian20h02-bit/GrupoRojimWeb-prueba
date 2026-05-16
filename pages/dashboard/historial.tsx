import { ProtectedDashboardPage } from "@/components/dashboard/ProtectedDashboardPage";
import { MovementHistory } from "@/components/stock/MovementHistory";

export default function HistoryPage() {
  return (
    <ProtectedDashboardPage title="Historial">
      <MovementHistory />
    </ProtectedDashboardPage>
  );
}
