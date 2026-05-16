import { PlaceholderPanel } from "@/components/dashboard/PlaceholderPanel";
import { ProtectedDashboardPage } from "@/components/dashboard/ProtectedDashboardPage";

export default function DashboardPage() {
  return (
    <ProtectedDashboardPage title="Dashboard">
      <PlaceholderPanel
        title="Resumen operativo"
        description="Aca se mostraran indicadores de stock, productos bajo minimo y accesos rapidos segun rol."
      />
    </ProtectedDashboardPage>
  );
}
