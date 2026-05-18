import { ProtectedDashboardPage } from "@/components/dashboard/ProtectedDashboardPage";
import { StockOverview } from "@/components/stock/StockOverview";

export default function StockPage() {
  return (
    <ProtectedDashboardPage title="Stock">
      <StockOverview />
    </ProtectedDashboardPage>
  );
}
