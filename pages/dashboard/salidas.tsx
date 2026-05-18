import { ProtectedDashboardPage } from "@/components/dashboard/ProtectedDashboardPage";
import { StockExitForm } from "@/components/stock/StockExitForm";

export default function ExitsPage() {
  return (
    <ProtectedDashboardPage title="Salidas" allowedRoles={["ADMIN", "VENDEDOR"]}>
      <StockExitForm />
    </ProtectedDashboardPage>
  );
}
