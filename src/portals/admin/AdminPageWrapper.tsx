import { ReactNode } from "react";
import { ProtectedRoute } from "../../components/ProtectedRoute";
import { AdminLayout } from "./AdminLayout";
import { AdminViewId } from "./AdminLayout";

type AdminPageWrapperProps = {
  children: ReactNode;
  currentView: AdminViewId;
};

export function AdminPageWrapper({ children, currentView }: AdminPageWrapperProps) {
  return (
    <ProtectedRoute allowedRoles={["admin"]}>
      <AdminLayout currentView={currentView}>
        {children}
      </AdminLayout>
    </ProtectedRoute>
  );
}
