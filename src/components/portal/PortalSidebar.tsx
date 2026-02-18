import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Briefcase, Calendar, Settings, LogOut, Bell, Menu, X } from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { usePortalAuth } from '@/hooks/usePortalAuth';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

const navItems = [
  { label: 'Dashboard', icon: LayoutDashboard, href: '/portal' },
  { label: 'Tjänster', icon: Briefcase, href: '/portal/positions' },
  { label: 'Intervjuer', icon: Calendar, href: '/portal/interviews' },
  { label: 'Inställningar', icon: Settings, href: '/portal/settings' },
];

export default function PortalSidebar() {
  const location = useLocation();
  const { signOut } = useAuth();
  const { companyName, userName } = usePortalAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  const isActive = (href: string) => {
    if (href === '/portal') return location.pathname === '/portal';
    return location.pathname.startsWith(href);
  };

  const sidebarContent = (
    <div className="flex flex-col h-full">
      {/* Logo / Brand */}
      <div className="p-6 border-b border-nocv-light-blue/30">
        <Link to="/portal" className="text-2xl font-heading font-bold text-white">
          NoCV
        </Link>
        {companyName && (
          <p className="text-sm text-nocv-text-muted mt-1 truncate">{companyName}</p>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1">
        {navItems.map((item) => (
          <Link
            key={item.href}
            to={item.href}
            onClick={() => setMobileOpen(false)}
            className={cn(
              'flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors',
              isActive(item.href)
                ? 'bg-nocv-light-blue text-white'
                : 'text-nocv-text-muted hover:text-white hover:bg-nocv-light-blue/50'
            )}
          >
            <item.icon className="h-5 w-5 shrink-0" />
            <span>{item.label}</span>
          </Link>
        ))}
      </nav>

      {/* User section */}
      <div className="p-4 border-t border-nocv-light-blue/30">
        <div className="flex items-center gap-3 px-4 py-2 mb-2">
          <div className="h-8 w-8 rounded-full bg-nocv-light-blue flex items-center justify-center text-white text-sm font-bold">
            {userName?.charAt(0)?.toUpperCase() || '?'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">{userName || 'Användare'}</p>
          </div>
        </div>
        <button
          onClick={() => signOut()}
          className="flex items-center gap-3 px-4 py-2 text-sm text-nocv-text-muted hover:text-white transition-colors w-full rounded-lg hover:bg-nocv-light-blue/50"
        >
          <LogOut className="h-4 w-4" />
          <span>Logga ut</span>
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile hamburger */}
      <Button
        variant="ghost"
        size="icon"
        className="fixed top-4 left-4 z-50 md:hidden text-foreground"
        onClick={() => setMobileOpen(!mobileOpen)}
      >
        {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
      </Button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed md:sticky top-0 left-0 h-screen w-64 bg-nocv-dark-blue z-40 transition-transform duration-200',
          mobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        )}
      >
        {sidebarContent}
      </aside>
    </>
  );
}
