import { ReactNode } from "react";

type LayoutProps = {
  sidebar: ReactNode;
  header: ReactNode;
  children: ReactNode;
  isSidebarCollapsed?: boolean;
};

export function Layout(props: LayoutProps) {
  return (
    <div
      className={
        props.isSidebarCollapsed ? "app-root sidebar-collapsed" : "app-root"
      }
    >
      <aside className="app-sidebar">{props.sidebar}</aside>
      <div className="app-main">
        <header className="app-header">{props.header}</header>
        <main className="app-content">{props.children}</main>
        <div className="powered-by-footer">Powered by James</div>
      </div>
    </div>
  );
}
