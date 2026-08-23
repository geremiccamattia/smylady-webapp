'use client'

import { io, Socket } from 'socket.io-client'
import { STORAGE_KEYS } from '@/lib/constants'
import { replaceWithPath } from '@/lib/navigation'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://app.shareyourparty.de'
// Backend WebSocket Gateway uses namespace '/chat' - must append it to the URL
const WS_URL = API_URL.replace('https://', 'wss://').replace('http://', 'ws://') + '/chat'

type SocketEventHandler = (...args: unknown[]) => void

/**
 * Centralized Socket Manager for WebSocket connections
 * Singleton pattern to prevent multiple socket instances
 */
class SocketManager {
  private socket: Socket | null = null
  private isConnecting: boolean = false
  private reconnectAttempts: number = 0
  private maxReconnectAttempts: number = 5
  private reconnectDelay: number = 1000
  private eventSubscriptions: Map<string, Set<SocketEventHandler>> = new Map()
  private cachedUserId: string | null = null

  /**
   * Connect to socket server
   */
  async connect(forceReconnect: boolean = false): Promise<Socket> {
    // If already connected and not forcing, return existing socket
    if (this.socket?.connected && !forceReconnect) {
      return this.socket
    }

    // If already connecting, wait
    if (this.isConnecting) {
      return new Promise((resolve, reject) => {
        const checkConnection = setInterval(() => {
          if (!this.isConnecting) {
            clearInterval(checkConnection)
            if (this.socket?.connected) {
              resolve(this.socket)
            } else {
              reject(new Error('Connection failed'))
            }
          }
        }, 100)

        setTimeout(() => {
          clearInterval(checkConnection)
          reject(new Error('Connection timeout'))
        }, 30000)
      })
    }

    this.isConnecting = true

    try {
      // Disconnect existing socket
      if (this.socket) {
        this.socket.removeAllListeners()
        this.socket.disconnect()
        this.socket = null
      }

      // Get credentials from localStorage (use correct STORAGE_KEYS)
      const token = localStorage.getItem(STORAGE_KEYS.TOKEN)
      const userStr = localStorage.getItem(STORAGE_KEYS.USER)

      // Safely parse user - handle undefined, null, "undefined", "null"
      let user = null
      if (userStr && userStr !== 'undefined' && userStr !== 'null') {
        try {
          user = JSON.parse(userStr)
        } catch (e) {
          console.warn('Failed to parse user from localStorage:', e)
        }
      }

      const userId = user?.id || user?._id

      if (!token || !userId) {
        throw new Error('No authentication credentials found')
      }

      this.cachedUserId = userId

      // Create socket connection
      this.socket = io(WS_URL, {
        transports: ['websocket', 'polling'],
        auth: { token },
        reconnection: true,
        reconnectionAttempts: this.maxReconnectAttempts,
        reconnectionDelay: this.reconnectDelay,
        reconnectionDelayMax: 10000,
        timeout: 20000,
      })

      // Setup core listeners
      this._setupCoreListeners()

      // Re-attach subscriptions
      this._reattachSubscriptions()

      // Wait for connection
      await this._waitForConnection()

      this.reconnectAttempts = 0
      this.isConnecting = false

      return this.socket
    } catch (error) {
      this.isConnecting = false
      throw error
    }
  }

  /**
   * Wait for socket to connect
   */
  private _waitForConnection(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.socket) {
        reject(new Error('Socket not initialized'))
        return
      }

      if (this.socket.connected) {
        resolve()
        return
      }

      const timeout = setTimeout(() => {
        reject(new Error('Socket connection timeout'))
      }, 20000)

      this.socket.once('connect', () => {
        clearTimeout(timeout)
        resolve()
      })

      this.socket.once('connect_error', (error) => {
        clearTimeout(timeout)
        reject(error)
      })
    })
  }

  /**
   * Setup core socket event listeners
   */
  private _setupCoreListeners(): void {
    if (!this.socket) return

    this.socket.on('connect', () => {
      console.log('Socket connected:', this.socket?.id)
      this.reconnectAttempts = 0
    })

    this.socket.on('disconnect', (reason) => {
      console.log('Socket disconnected:', reason)

      if (reason === 'io server disconnect') {
        // Server initiated disconnect, try to reconnect
        setTimeout(() => {
          this.connect(true).catch((error) => {
            console.error('Reconnection failed:', error)
          })
        }, this.reconnectDelay)
      }
    })

    this.socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error)
      this.reconnectAttempts++
    })

    this.socket.on('error', (error: { message?: string }) => {
      // Server-JWT (7 Tage gültig) ist abgelaufen/ungültig; der Server trennt
      // die Verbindung direkt danach. Nicht einfach automatisch weiterlaufen
      // lassen: socket.io cached `auth` beim ersten connect() und schickt bei
      // jedem eingebauten Reconnect-Versuch (reconnection: true) denselben
      // toten Token erneut — ohne diesen Abbruch würde das bis zu
      // maxReconnectAttempts lang sinnlos gegen den abgelaufenen Token laufen.
      // Erneuerung ist hier bewusst "zur Anmeldung führen": es gibt aktuell
      // keinen Token-Refresh-Endpoint (siehe authService), REST-401s werden im
      // selben Fall genauso behandelt (src/services/api.ts).
      if (error?.message === 'Authentication required') {
        this.disconnect()
        localStorage.removeItem(STORAGE_KEYS.TOKEN)
        localStorage.removeItem(STORAGE_KEYS.USER)
        const localePrefix = /^\/en(?=\/|$)/.test(window.location.pathname) ? '/en' : ''
        replaceWithPath(`${localePrefix}/login`)
        return
      }

      // Tritt auf, wenn ein Client einem Raum beitreten will, in dem er laut
      // Server nicht (mehr) Teilnehmer ist — typischerweise veralteter
      // lokaler Zustand (alter Link, entfernte Konversation). Das ist im
      // Normalbetrieb erwartet, kein technischer Fehler: nur loggen, NICHT
      // erneut beitreten oder reconnecten (sonst Endlosschleife).
      if (error?.message === 'You are not a participant of this room') {
        console.warn('Socket: not a participant of this room, ignoring:', error)
        return
      }

      console.error('Socket error:', error)
    })
  }

  /**
   * Subscribe to a socket event
   */
  on(event: string, handler: SocketEventHandler): () => void {
    if (!this.eventSubscriptions.has(event)) {
      this.eventSubscriptions.set(event, new Set())
    }
    this.eventSubscriptions.get(event)!.add(handler)

    if (this.socket) {
      this.socket.on(event, handler)
    }

    return () => this.off(event, handler)
  }

  /**
   * Unsubscribe from a socket event
   */
  off(event: string, handler: SocketEventHandler): void {
    const handlers = this.eventSubscriptions.get(event)
    if (handlers) {
      handlers.delete(handler)
      if (handlers.size === 0) {
        this.eventSubscriptions.delete(event)
      }
    }

    if (this.socket) {
      this.socket.off(event, handler)
    }
  }

  /**
   * Emit a socket event
   */
  emit(event: string, ...args: unknown[]): void {
    if (!this.socket?.connected) {
      console.warn(`Cannot emit '${event}': Socket not connected`)
      return
    }

    this.socket.emit(event, ...args)
  }

  /**
   * Re-attach all subscriptions after reconnection
   */
  private _reattachSubscriptions(): void {
    if (!this.socket) return

    this.eventSubscriptions.forEach((handlers, event) => {
      handlers.forEach((handler) => {
        this.socket!.on(event, handler)
      })
    })
  }

  /**
   * Disconnect socket
   */
  disconnect(): void {
    if (this.socket) {
      this.socket.removeAllListeners()
      this.socket.disconnect()
      this.socket = null
    }

    this.isConnecting = false
    this.reconnectAttempts = 0
    this.cachedUserId = null
    this.eventSubscriptions.clear()
  }

  /**
   * Reconnect the existing socket with a freshly obtained token — e.g. once
   * a "Authentication required" error has been resolved by logging back in
   * without a full page reload.
   * socket.io caches `auth` from the first connect() and replays that exact
   * value on every reconnect; mutating `socket.auth` here BEFORE calling
   * `socket.connect()` is required, otherwise the renewed token never
   * reaches the server and the connection stays dead.
   */
  reconnectWithToken(token: string): void {
    if (!this.socket) return
    this.socket.auth = { token }
    this.socket.connect()
  }

  /**
   * Check if socket is connected
   */
  isConnected(): boolean {
    return this.socket?.connected || false
  }

  /**
   * Get socket instance
   */
  getSocket(): Socket | null {
    return this.socket
  }

  /**
   * Get cached user ID
   */
  getUserId(): string | null {
    return this.cachedUserId
  }

  /**
   * Join a chat room
   */
  joinChat(chatId: string): void {
    // userId nicht mehr mitschicken — der Server leitet die Identität aus
    // dem JWT im Handshake ab. this.cachedUserId dient hier nur noch als
    // Bereit-Flag (ist eine authentifizierte Verbindung aufgebaut).
    if (this.cachedUserId) {
      this.emit('join-chat', { chatId })
    }
  }

  /**
   * Leave a chat room
   */
  leaveChat(chatId: string): void {
    if (this.cachedUserId) {
      this.emit('leave-chat', { chatId })
    }
  }

  /**
   * Send a message via socket
   */
  sendMessage(receiverId: string, content: string, roomId?: string): void {
    if (this.cachedUserId) {
      this.emit('sendMessage', {
        senderId: this.cachedUserId,
        receiverId,
        content,
        roomId,
      })
    }
  }

  /**
   * Mark messages as read
   */
  markAsRead(roomId: string): void {
    if (this.cachedUserId) {
      this.emit('markAsRead', { roomId, userId: this.cachedUserId })
    }
  }
}

// Export singleton instance
export const socketManager = new SocketManager()
export default socketManager

