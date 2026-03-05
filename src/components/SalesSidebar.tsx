import { useRouter } from "next/router";
import { Sidebar } from "./Sidebar";

const sidebarItems = [
  { id: "dashboard", label: "My Dashboard" },
  { id: "plan", label: "My Business Plan" },
  { id: "training", label: "Training Center" },
  { id: "materials", label: "Marketing Materials" },
  { id: "aiChat", label: "Jay Miller's Clone" },
  { id: "webPage", label: "My Web Page" },
  { id: "apps-tools", label: "Apps & Tools" },
  { id: "profile", label: "My Profile" }
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
