import { AdminLayout } from "./AdminLayout";

export function SalesOverview() {
  return (
    <AdminLayout currentView="salesOverview">
      <div className="panel">
        <div className="panel-header">
          <div className="panel-header-row">
            <span>Sales Team Overview</span>
          </div>
        </div>
        <div className="panel-body">
          <p>Sales Team Overview content goes here</p>
        </div>
      </div>
    </AdminLayout>
  );
}
