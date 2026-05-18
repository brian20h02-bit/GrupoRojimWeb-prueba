import { ProtectedDashboardPage } from "@/components/dashboard/ProtectedDashboardPage";
import { UserManagement } from "@/components/users/UserManagement";

export default function UsersPage() {
  return (
    <ProtectedDashboardPage title="Usuarios" allowedRoles={["ADMIN"]}>
      <UserManagement />
    </ProtectedDashboardPage>
  );
}
