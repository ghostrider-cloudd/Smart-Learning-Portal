import React from 'react';
import { BookOpen, LogOut } from 'lucide-react';
import { logout } from '@/lib/storage';
import { useNavigate } from 'react-router-dom';

interface SidebarItem {
  id: string;
  label: string;
  icon: React.ReactNode;
}

interface DashboardSidebarProps {
  items: SidebarItem[];
  activeId: string;
  onSelect: (id: string) => void;
  userName: string;
  role: string;
}

const DashboardSidebar = ({ items, activeId, onSelect, userName, role }: DashboardSidebarProps) => {
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = React.useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const sidebarContent = (
    <div className="flex flex-col h-full bg-sidebar">
      <div className="p-5 border-b border-sidebar-border">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-sidebar-primary flex items-center justify-center">
            <BookOpen className="w-5 h-5 text-sidebar-primary-foreground" />
          </div>
          <div>
            <div className="text-sm font-semibold text-sidebar-foreground">Smart Learning</div>
            <div className="text-xs text-sidebar-foreground/60 capitalize">{role} Panel</div>
          </div>
        </div>
      </div>

      <div className="p-3 border-b border-sidebar-border">
        <div className="px-4 py-3 rounded-lg bg-sidebar-accent/50">
          <div className="text-sm font-medium text-sidebar-foreground truncate">{userName}</div>
          <div className="text-xs text-sidebar-foreground/60 capitalize">{role}</div>
        </div>
      </div>

      <nav className="flex-1 p-3 space-y-1">
        {items.map(item => (
          <button
            key={item.id}
            onClick={() => { onSelect(item.id); setMobileOpen(false); }}
            className={`sidebar-link w-full ${activeId === item.id ? 'sidebar-link-active' : ''}`}
          >
            {item.icon}
            <span className="text-sm">{item.label}</span>
          </button>
        ))}
      </nav>

      <div className="p-3 border-t border-sidebar-border">
        <button onClick={handleLogout} className="sidebar-link w-full text-sidebar-foreground/60 hover:text-red-300">
          <LogOut className="w-5 h-5" />
          <span className="text-sm">Logout</span>
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile hamburger */}
      <button
        onClick={() => setMobileOpen(!mobileOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-lg bg-primary text-primary-foreground shadow-lg"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={mobileOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"} />
        </svg>
      </button>

      {/* Mobile overlay */}
      {mobileOpen && <div className="lg:hidden fixed inset-0 bg-foreground/50 z-40" onClick={() => setMobileOpen(false)} />}

      {/* Sidebar */}
      <aside className={`fixed lg:static inset-y-0 left-0 z-40 w-64 transform transition-transform duration-200 ${mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        {sidebarContent}
      </aside>
    </>
  );
};

export default DashboardSidebar;
