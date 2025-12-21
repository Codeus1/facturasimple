"use client";

import React from 'react';
import { LayoutDashboard, Users, FileText, Menu, X, Sun, Moon, LogOut } from 'lucide-react';
import { useNavigation, useTheme, useMounted, useAuth } from '@/hooks';
import { ROUTES } from '@/constants';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Link } from '@/components/Link';
import { usePathname, useRouter } from 'next/navigation';

// ============================================================================
// NAV ITEM COMPONENT
// ============================================================================

interface NavItemProps {
  route: string;
  icon: React.ElementType;
  label: string;
  onClick?: () => void;
}

const NavItem: React.FC<NavItemProps> = ({ route, icon: Icon, label, onClick }) => {
  const { isActive } = useNavigation();
  const active = isActive(route);

  return (
    <Link
      href={route}
      onClick={onClick}
      className={cn(
        'flex items-center gap-3 px-4 py-3 rounded-md transition-all w-full text-sm font-medium',
        active
          ? 'bg-primary text-primary-foreground shadow-sm'
          : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
      )}
    >
      <Icon
        size={18}
        className={active ? 'text-primary-foreground' : 'text-muted-foreground'}
      />
      <span>{label}</span>
    </Link>
  );
};

// ============================================================================
// MAIN LAYOUT COMPONENT
// ============================================================================

interface MainLayoutProps {
  children: React.ReactNode;
}

export const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  const { theme, toggleTheme } = useTheme();
  const mounted = useMounted();
  const { session, isAuthenticated, signOut, loading } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);

  const closeMobileMenu = () => setIsMobileMenuOpen(false);

  // Don't render until mounted to avoid hydration mismatch
  if (!mounted) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Cargando...</div>
      </div>
    );
  }

  if (pathname?.startsWith('/login')) {
    return <main className="min-h-screen bg-background">{children}</main>;
  }

  const handleLogout = async () => {
    await signOut();
    router.replace('/login');
  };

  return (
    <div className="min-h-screen bg-background flex text-foreground">
      {/* Sidebar - Desktop */}
      <aside className="hidden md:flex flex-col w-64 border-r border-border bg-card h-screen sticky top-0">
        <div className="p-6">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-primary-foreground font-bold text-lg">
              F
            </div>
            <span className="font-bold text-xl tracking-tight">FacturaSimple</span>
          </div>
        </div>
        
        <nav className="flex-1 px-4 space-y-2">
          <NavItem route={ROUTES.DASHBOARD} icon={LayoutDashboard} label="Dashboard" />
          <NavItem route={ROUTES.INVOICES} icon={FileText} label="Facturas" />
          <NavItem route={ROUTES.CLIENTS} icon={Users} label="Clientes" />
        </nav>

        <div className="p-4 border-t border-border">
          <div className="text-xs text-muted-foreground mb-2">
            {loading ? 'Validando sesión...' : session?.email}
          </div>
          <Button
            variant="ghost"
            className="w-full justify-start gap-3 mb-2"
            onClick={handleLogout}
            disabled={!isAuthenticated && !loading}
          >
            <LogOut size={18} />
            <span>Salir</span>
          </Button>
          <Button
            variant="ghost"
            className="w-full justify-start gap-3"
            onClick={toggleTheme}
          >
            {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
            <span>{theme === 'light' ? 'Modo Oscuro' : 'Modo Claro'}</span>
          </Button>
        </div>
      </aside>

      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-16 bg-background border-b border-border z-20 flex items-center justify-between px-4">
        <span className="font-bold">FacturaSimple</span>
        <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
          {isMobileMenuOpen ? <X /> : <Menu />}
        </button>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div
          className="md:hidden fixed inset-0 z-10 bg-background/80 backdrop-blur-sm"
          onClick={closeMobileMenu}
        >
          <div
            className="absolute right-0 top-16 w-3/4 max-w-sm bg-card h-[calc(100vh-4rem)] p-4 shadow-xl border-l border-border"
            onClick={(e) => e.stopPropagation()}
          >
            <nav className="space-y-2">
              <NavItem
                route={ROUTES.DASHBOARD}
                icon={LayoutDashboard}
                label="Dashboard"
                onClick={closeMobileMenu}
              />
              <NavItem
                route={ROUTES.INVOICES}
                icon={FileText}
                label="Facturas"
                onClick={closeMobileMenu}
              />
              <NavItem
                route={ROUTES.CLIENTS}
                icon={Users}
                label="Clientes"
                onClick={closeMobileMenu}
              />
            </nav>
            <div className="mt-8 pt-4 border-t border-border">
              <div className="text-xs text-muted-foreground mb-3">
                {loading ? 'Validando sesión...' : session?.email}
              </div>
              <Button
                variant="outline"
                className="w-full justify-start gap-3 mb-2"
                onClick={handleLogout}
                disabled={!isAuthenticated && !loading}
              >
                <LogOut size={18} />
                <span>Salir</span>
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start gap-3"
                onClick={toggleTheme}
              >
                {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
                <span>{theme === 'light' ? 'Modo Oscuro' : 'Modo Claro'}</span>
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 overflow-auto md:p-8 p-4 pt-20 md:pt-8 w-full bg-background">
        {children}
      </main>
    </div>
  );
};
