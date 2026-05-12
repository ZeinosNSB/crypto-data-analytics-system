import { create } from 'zustand'

interface UIState {
  sidebarOpen: boolean
  rightPanelOpen: boolean
  bottomPanelOpen: boolean
  activeBottomTab: 'positions' | 'orders' | 'history' | 'assets'

  toggleSidebar: () => void
  toggleRightPanel: () => void
  toggleBottomPanel: () => void
  setActiveBottomTab: (tab: 'positions' | 'orders' | 'history' | 'assets') => void
}

export const useUIStore = create<UIState>(set => ({
  sidebarOpen: true,
  rightPanelOpen: true,
  bottomPanelOpen: true,
  activeBottomTab: 'positions',

  toggleSidebar: () => set(state => ({ sidebarOpen: !state.sidebarOpen })),
  toggleRightPanel: () => set(state => ({ rightPanelOpen: !state.rightPanelOpen })),
  toggleBottomPanel: () => set(state => ({ bottomPanelOpen: !state.bottomPanelOpen })),
  setActiveBottomTab: tab => set({ activeBottomTab: tab })
}))
