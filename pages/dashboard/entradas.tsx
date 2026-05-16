import { ProtectedDashboardPage } from "@/components/dashboard/ProtectedDashboardPage";
import { StockEntryForm } from "@/components/stock/StockEntryForm";

export default function EntriesPage() {
  return (
    <ProtectedDashboardPage title="Entradas" allowedRoles={["ADMIN", "RECEPCIONISTA"]}>
      <StockEntryForm />
    </ProtectedDashboardPage>
  );
}
