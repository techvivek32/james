import { useRouter } from "next/router";
import { Sidebar } from "./Sidebar";

const sidebarItems = [
  { id: "dashboard", label: "Dashboard" },
  { id: "plan", label: "Business Planner" },
  { id: "training", label: "Training Center" },
  { id: "aiChat", label: "Jay's AI Clone (coming soon)" },
  { id: "apps-tools", label: "Apps & Tools" },
  { id: "profile", label: "My Profile" },
  // Hidden modules - don't delete
  // { id: "materials", label: "Marketing Materials" },
  // { id: "webPage", label: "My Web Page" },
];

type SalesSidebarProps = {
  activeId: string;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
};

export function SalesSidebar({ activeId, isCollapsed, onToggleCollapse }: SalesSidebarProps) {
  const router = useRouter();

  function handleNavigation(id: string) {
    router.push(`/sales/${id}`);
  }

  return (
    <Sidebar
      header={<div className="sidebar-title">Sales Team Portal</div>}
      items={sidebarItems}
      activeId={activeId}
      onSelect={handleNavigation}
      isCollapsed={isCollapsed}
      onToggleCollapse={onToggleCollapse}
    />
  );
}
