import { Link, useLocation } from "react-router-dom";
import { BarChart3, Users, Database, LayoutDashboard } from "lucide-react";

const NAV = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/employees", label: "Employees", icon: Users },
  { to: "/usage", label: "Usage Records", icon: Database },
  { to: "/charts", label: "Analytics", icon: BarChart3 },
];

export default function Sidebar() {
  const { pathname } = useLocation();

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <BarChart3 size={28} />
        <span>Copilot Tracker</span>
      </div>
      <nav className="sidebar-nav">
        {NAV.map(({ to, label, icon: Icon }) => (
          <Link
            key={to}
            to={to}
            className={`nav-item ${pathname === to ? "active" : ""}`}
          >
            <Icon size={20} />
            <span>{label}</span>
          </Link>
        ))}
      </nav>
    </aside>
  );
}
