import { create } from 'zustand'
import type { ConnectionState } from '@workspace/web/types/websocket.types'

interface WebsocketState {
  connectionState: ConnectionState
  lastPing: number | null
  lastPong: number | null
  reconnectAttempts: number

  setConnectionState: (state: ConnectionState) => void
  setPingPong: (ping: number | null, pong: number | null) => void
  incReconnectAttempts: () => void
  resetReconnectAttempts: () => void
}

export const useWebsocketStore = create<WebsocketState>(set => ({
  connectionState: 'DISCONNECTED',
  lastPing: null,
  lastPong: null,
  reconnectAttempts: 0,

  setConnectionState: state => set({ connectionState: state }),
  setPingPong: (ping, pong) => set({ lastPing: ping, lastPong: pong }),
  incReconnectAttempts: () => set(state => ({ reconnectAttempts: state.reconnectAttempts + 1 })),
  resetReconnectAttempts: () => set({ reconnectAttempts: 0 })
}))
