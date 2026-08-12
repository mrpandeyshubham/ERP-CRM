import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const NAV = [
  { to: '/', label: 'Dashboard', icon: 'dashboard' },
  { to: '/customers', label: 'Customers', icon: 'group' },
  { to: '/products', label: 'Products', icon: 'inventory_2' },
  { to: '/challans', label: 'Sales Challans', icon: 'receipt_long' },
];

export default function Layout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="bg-background text-on-background font-body-md min-h-[100dvh] flex overflow-hidden selection:bg-primary-container selection:text-on-primary-container">
      {/* Mobile Nav Overlay */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 bg-inverse-surface/50 z-40 md:hidden" onClick={() => setMobileMenuOpen(false)}></div>
      )}

      {/* SideNavBar */}
      <nav className={`fixed left-0 top-0 h-full w-[260px] flex flex-col py-md px-sm bg-surface-container-low border-r border-outline-variant z-50 transform transition-transform duration-200 ease-in-out md:relative md:translate-x-0 ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="px-sm pb-md border-b border-outline-variant mb-md flex items-center justify-between gap-sm">
          <div className="flex items-center gap-sm">
            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-on-primary shrink-0">
              <span className="material-symbols-outlined text-[18px]">inventory</span>
            </div>
            <div>
              <h1 className="font-title-sm text-[length:var(--text-title-sm)] leading-[var(--text-title-sm--line-height)] font-[var(--text-title-sm--font-weight)] text-primary">Distro Core</h1>
              <p className="font-label-caps text-[length:var(--text-label-caps)] tracking-[var(--text-label-caps--letter-spacing)] font-[var(--text-label-caps--font-weight)] text-on-surface-variant">Operations Hub</p>
            </div>
          </div>
          <button className="md:hidden text-on-surface-variant" onClick={() => setMobileMenuOpen(false)}>
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>
        <div className="flex-1 overflow-y-auto flex flex-col gap-xs">
          {NAV.map((item) => {
            const active = location.pathname === item.to;
            return (
              <Link
                key={item.to}
                to={item.to}
                className={active 
                  ? "bg-secondary-container text-on-secondary-container font-bold rounded-lg flex items-center gap-sm px-md py-sm duration-200 ease-in-out cursor-pointer transition-all"
                  : "text-on-surface-variant hover:bg-surface-variant flex items-center gap-sm px-md py-sm duration-200 ease-in-out rounded-lg cursor-pointer transition-all"}
              >
                <span className="material-symbols-outlined" style={active ? { fontVariationSettings: "'FILL' 1" } : {}}>{item.icon}</span>
                <span className="font-label-caps text-[length:var(--text-label-caps)] tracking-[var(--text-label-caps--letter-spacing)] font-[var(--text-label-caps--font-weight)]">{item.label}</span>
              </Link>
            );
          })}
        </div>
        <div className="pt-md border-t border-outline-variant mt-auto flex flex-col gap-xs">
          <button onClick={logout} className="text-on-surface-variant hover:bg-surface-variant flex items-center gap-sm px-md py-sm duration-200 ease-in-out rounded-lg cursor-pointer transition-all w-full text-left">
            <span className="material-symbols-outlined">logout</span>
            <span className="font-label-caps text-[length:var(--text-label-caps)] tracking-[var(--text-label-caps--letter-spacing)] font-[var(--text-label-caps--font-weight)]">Logout</span>
          </button>
        </div>
      </nav>
      {/* Main Content Wrapper */}
      <div className="flex-1 flex flex-col md:ml-[260px] min-h-screen overflow-hidden">
        {/* TopNavBar */}
        <header className="flex justify-between items-center w-full px-md h-16 bg-surface border-b border-outline-variant z-10 shrink-0">
          <div className="flex items-center gap-md h-full">
            <button className="md:hidden text-on-surface-variant" onClick={() => setMobileMenuOpen(true)}>
              <span className="material-symbols-outlined">menu</span>
            </button>
            <div className="md:hidden font-title-sm text-[length:var(--text-title-sm)] font-[var(--text-title-sm--font-weight)] text-primary">Distro Core</div>
            <nav className="hidden md:flex items-center gap-md h-full">
              {NAV.map((item) => {
                 const active = location.pathname === item.to;
                 return (
                   <Link key={item.to} to={item.to} className={`h-full flex items-center border-b-2 ${active ? 'border-primary text-primary' : 'border-transparent text-on-surface-variant hover:text-primary'} transition-colors cursor-pointer font-body-md text-[length:var(--text-body-md)]`}>
                     {item.label}
                   </Link>
                 )
              })}
            </nav>
          </div>
          <div className="flex items-center gap-md">
            <div className="flex items-center gap-3 mr-4">
              <span className="text-sm font-label-caps text-[length:var(--text-label-caps)] text-on-surface-variant">
                {user?.name} · <span className="text-primary font-bold">{user?.role}</span>
              </span>
            </div>
            <div className="flex items-center gap-sm">
              <button className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-surface-variant text-on-surface-variant transition-colors">
                <span className="material-symbols-outlined">notifications</span>
              </button>
            </div>
            <div className="w-8 h-8 rounded-full overflow-hidden border border-outline-variant shrink-0 bg-surface-container cursor-pointer flex items-center justify-center">
              <span className="material-symbols-outlined text-primary">person</span>
            </div>
          </div>
        </header>
        {/* Main Canvas */}
        <main className="flex-1 overflow-y-auto p-gutter bg-background">
           <div className="max-w-7xl mx-auto flex flex-col gap-gutter">
             {children}
           </div>
        </main>
      </div>
    </div>
  );
}
