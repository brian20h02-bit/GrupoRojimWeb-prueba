import { PlaceholderPanel } from "@/components/dashboard/PlaceholderPanel";
import { ProtectedDashboardPage } from "@/components/dashboard/ProtectedDashboardPage";

export default function StockPage() {
  return (
    <ProtectedDashboardPage title="Stock">
      <PlaceholderPanel
        title="Stock general"
        description="Aca se visualizara el stock actual, productos bajo minimo y productos sin stock."
      />
    </ProtectedDashboardPage>
  );
}
