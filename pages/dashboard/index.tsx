import { DashboardHome } from "@/components/dashboard/DashboardHome";
import { ProtectedDashboardPage } from "@/components/dashboard/ProtectedDashboardPage";

export default function DashboardPage() {
  return (
    <ProtectedDashboardPage title="Dashboard">
      <DashboardHome />
    </ProtectedDashboardPage>
  );
}
