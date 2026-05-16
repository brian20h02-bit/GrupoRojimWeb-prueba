import { PlaceholderPanel } from "@/components/dashboard/PlaceholderPanel";
import { ProtectedDashboardPage } from "@/components/dashboard/ProtectedDashboardPage";

export default function UsersPage() {
  return (
    <ProtectedDashboardPage title="Usuarios" allowedRoles={["ADMIN"]}>
      <PlaceholderPanel
        title="Gestion de usuarios"
        description="Seccion exclusiva para ADMIN. En la fase correspondiente se conectara con /api/users."
      />
    </ProtectedDashboardPage>
  );
}
