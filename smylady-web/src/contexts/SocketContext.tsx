import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { socketManager } from '@/services/socket'
import { useAuth } from './AuthContext'
import { ChatMessage, Notification } from '@/types'

interface SocketContextType {
  isConnected: boolean
  connect: () => Promise<void>
  disconnect: () => void
  joinChat: (chatId: string) => void
  leaveChat: (chatId: string) => void
  sendMessage: (receiverId: string, content: string, roomId?: string) => void
  markAsRead: (roomId: string) => void
}

const SocketContext = createContext<SocketContextType | null>(null)

interface SocketProviderProps {
  children: ReactNode
}

export function SocketProvider({ children }: SocketProviderProps) {
  const { isAuthenticated, user } = useAuth()
  const queryClient = useQueryClient()
  const [isConnected, setIsConnected] = useState(false)

  // Connect to socket when authenticated
  const connect = useCallback(async () => {
    if (!isAuthenticated) return

    try {
      await socketManager.connect()
      setIsConnected(true)
    } catch (error: unknown) {
      // Only log as warning if it's a credentials issue (expected when not logged in)
      const errorMessage = error instanceof Error ? error.message : String(error)
      if (errorMessage.includes('No authentication credentials')) {
        // Silent fail - this is expected when user data isn't ready yet
        console.debug('Socket: waiting for auth credentials...')
      } else {
        console.error('Socket connection error:', error)
      }
      setIsConnected(false)
    }
  }, [isAuthenticated])

  // Disconnect socket
  const disconnect = useCallback(() => {
    socketManager.disconnect()
    setIsConnected(false)
  }, [])

  // Join chat room
  const joinChat = useCallback((chatId: string) => {
    socketManager.joinChat(chatId)
  }, [])

  // Leave chat room
  const leaveChat = useCallback((chatId: string) => {
    socketManager.leaveChat(chatId)
  }, [])

  // Send message
  const sendMessage = useCallback((receiverId: string, content: string, roomId?: string) => {
    socketManager.sendMessage(receiverId, content, roomId)
  }, [])

  // Mark messages as read
  const markAsRead = useCallback((roomId: string) => {
    socketManager.markAsRead(roomId)
  }, [])

  // Setup socket connection and event listeners
  useEffect(() => {
    if (!isAuthenticated) {
      disconnect()
      return
    }

    const initSocket = async () => {
      try {
        await connect()

        // Listen for new messages
        const unsubMessage = socketManager.on('receiveMessage', (message: unknown) => {
          const msg = message as ChatMessage
          const roomId = msg._id?.split('_')[0] // Extract roomId if needed

          // Update messages cache
          queryClient.setQueryData(['messages', roomId], (old: { messages: ChatMessage[] } | undefined) => {
            if (!old) return old

            // Check if message already exists
            const exists = old.messages.some(m => m._id === msg._id)
            if (exists) return old

            return {
              ...old,
              messages: [...old.messages, msg],
            }
          })

          // Update conversations list
          queryClient.invalidateQueries({ queryKey: ['conversations'] })
        })

        // Listen for notifications
        const unsubNotification = socketManager.on('receiveNotification', (notification: unknown) => {
          const notif = notification as Notification

          // Update notifications cache
          queryClient.setQueryData(['notifications'], (old: Notification[] | undefined) => {
            if (!old) return [notif]

            // Check if notification already exists
            const exists = old.some(n => (n.id || n._id) === (notif.id || notif._id))
            if (exists) return old

            return [notif, ...old]
          })

          // Immediately update the notification count in the header bell
          queryClient.invalidateQueries({ queryKey: ['notificationCount'] })
        })

        // Listen for message deleted
        const unsubDeleted = socketManager.on('messageDeleted', (data: unknown) => {
          const { roomId, messageId } = data as { roomId: string; messageId: string }

          queryClient.setQueryData(['messages', roomId], (old: { messages: ChatMessage[] } | undefined) => {
            if (!old) return old
            return {
              ...old,
              messages: old.messages.filter(m => m._id !== messageId),
            }
          })
        })

        // Listen for chat room deleted
        const unsubRoomDeleted = socketManager.on('chatRoomDeleted', (data: unknown) => {
          const { roomId } = data as { roomId: string }
          queryClient.removeQueries({ queryKey: ['messages', roomId] })
          queryClient.invalidateQueries({ queryKey: ['conversations'] })
        })

        // Listen for typing indicators
        const unsubTyping = socketManager.on('userTyping', (data: unknown) => {
          const { roomId, userId, isTyping } = data as { roomId: string; userId: string; isTyping: boolean }

          // Could be used to show typing indicator in UI
          queryClient.setQueryData(['typing', roomId], (old: Record<string, boolean> | undefined) => ({
            ...old,
            [userId]: isTyping,
          }))
        })

        return () => {
          unsubMessage()
          unsubNotification()
          unsubDeleted()
          unsubRoomDeleted()
          unsubTyping()
        }
      } catch (error: unknown) {
        // Silent fail for credential errors
        const errorMessage = error instanceof Error ? error.message : String(error)
        if (!errorMessage.includes('No authentication credentials')) {
          console.error('Socket initialization error:', error)
        }
      }
    }

    const cleanup = initSocket()

    return () => {
      cleanup?.then(fn => fn?.())
    }
  }, [isAuthenticated, connect, disconnect, queryClient])

  // Reconnect when user changes
  useEffect(() => {
    if (user && isAuthenticated) {
      connect()
    }
  }, [user, isAuthenticated, connect])

  const value: SocketContextType = {
    isConnected,
    connect,
    disconnect,
    joinChat,
    leaveChat,
    sendMessage,
    markAsRead,
  }

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  )
}

export function useSocket() {
  const context = useContext(SocketContext)
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider')
  }
  return context
}
