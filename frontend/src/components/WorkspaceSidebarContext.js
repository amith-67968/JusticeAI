import { createContext, useContext } from 'react';

export const SidebarContext = createContext(null);

export const useWorkspaceSidebar = () => {
  const context = useContext(SidebarContext);
  if (!context) {
    throw new Error('useWorkspaceSidebar must be used within WorkspaceLayout');
  }
  return context;
};
