import { createContext, useContext, useState } from 'react';

const AdminUIContext = createContext(null);

export function AdminUIProvider({ children }) {
  const [collapsed, setCollapsed] = useState(false); // desktop: icon-only mode
  const [mobileOpen, setMobileOpen] = useState(false); // mobile: off-canvas drawer

  const value = {
    collapsed,
    toggleCollapsed: () => setCollapsed((c) => !c),
    mobileOpen,
    openMobile: () => setMobileOpen(true),
    closeMobile: () => setMobileOpen(false),
    toggleMobile: () => setMobileOpen((o) => !o),
  };

  return <AdminUIContext.Provider value={value}>{children}</AdminUIContext.Provider>;
}

export function useAdminUI() {
  const ctx = useContext(AdminUIContext);
  if (!ctx) throw new Error('useAdminUI must be used inside AdminUIProvider');
  return ctx;
}
