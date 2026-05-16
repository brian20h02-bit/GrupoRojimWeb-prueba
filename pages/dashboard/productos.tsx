import { ProtectedDashboardPage } from "@/components/dashboard/ProtectedDashboardPage";
import { ProductsView } from "@/components/products/ProductsView";

export default function ProductsPage() {
  return (
    <ProtectedDashboardPage title="Productos">
      <ProductsView />
    </ProtectedDashboardPage>
  );
}
