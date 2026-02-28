import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { Layout } from "../../components/Layout";
import { Sidebar } from "../../components/Sidebar";
import { Header } from "../../components/Header";
import { AuthenticatedUser, Course, UserProfile } from "../../types";

type AdminViewId =
  | "dashboard"
  | "userManagement"
  | "roleHierarchy"
  | "businessUnits"
  | "salesOverview"
  | "marketingOverview"
  | "courseManagement"
  | "materialsLibrary"
  | "approvalWorkflows"
  | "aiBots"
  | "webTemplates"
  | "appsTools";

const sidebarItems: { id: AdminViewId; label: string; route: string }[] = [
  { id: "dashboard", label: "Dashboard", route: "/admin/dashboard" },
  { id: "userManagement", label: "User Management", route: "/admin/user-management" },
  { id: "roleHierarchy", label: "Role & Hierarchy Manager", route: "/admin/role-hierarchy" },
  { id: "businessUnits", label: "Business Units", route: "/admin/business-units" },
  { id: "salesOverview", label: "Sales Team Overview", route: "/admin/sales-overview" },
  { id: "marketingOverview", label: "Marketing Overview", route: "/admin/marketing-overview" },
  { id: "courseManagement", label: "Course Management", route: "/admin/course-management" },
  { id: "materialsLibrary", label: "Marketing Materials Library", route: "/admin/materials-library" },
  { id: "approvalWorkflows", label: "Approval Workflows", route: "/admin/approval-workflows" },
  { id: "aiBots", label: "AI Bot Management", route: "/admin/ai-bots" },
  { id: "webTemplates", label: "Web Page Templates", route: "/admin/web-templates" },
  { id: "appsTools", label: "Apps/Tool", route: "/admin/apps-tools" }
];

type AdminLayoutProps = {
  children: React.ReactNode;
  currentView: AdminViewId;
};

export function AdminLayout({ children, currentView }: AdminLayoutProps) {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<AuthenticatedUser | null>(null);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  useEffect(() => {
    async function loadData() {
      try {
        const [usersRes, coursesRes] = await Promise.all([
          fetch("/api/users"),
          fetch("/api/courses")
        ]);
        if (usersRes.ok && coursesRes.ok) {
          setUsers(await usersRes.json());
          setCourses(await coursesRes.json());
        }
      } catch (error) {
        console.error("Failed to load data:", error);
      }
    }
    loadData();
  }, []);

  function handleLogout() {
    setCurrentUser(null);
    router.push("/");
  }

  function handleNavigation(viewId: AdminViewId) {
    const item = sidebarItems.find((i) => i.id === viewId);
    if (item) {
      router.push(item.route);
    }
  }

  return (
    <Layout
      isSidebarCollapsed={isSidebarCollapsed}
      header={
        <Header
          title="Sales & Marketing OS"
          subtitle="Enterprise control center"
          userName={currentUser?.name ?? "Admin"}
          roleLabel={currentUser?.role ?? "Admin"}
          onLogout={handleLogout}
        />
      }
      sidebar={
        <Sidebar
          header={<div className="sidebar-title">Admin Portal</div>}
          items={sidebarItems.map((item) => ({ id: item.id, label: item.label }))}
          activeId={currentView}
          onSelect={handleNavigation}
          isCollapsed={isSidebarCollapsed}
          onToggleCollapse={() => setIsSidebarCollapsed((prev) => !prev)}
        />
      }
    >
      {children}
    </Layout>
  );
}

export { sidebarItems };
export type { AdminViewId };
