import { 
  WebSocketMessage, 
  ConnectionStatus,
  User
} from './collaborative'

export class WebSocketManager {
  private ws: WebSocket | null = null
  private reconnectAttempts = 0
  private maxReconnectAttempts = 5
  private reconnectDelay = 1000
  private heartbeatInterval: NodeJS.Timeout | null = null
  private messageQueue: WebSocketMessage[] = []
  private eventListeners: Map<string, ((data: any) => void)[]> = new Map()
  
  public status: ConnectionStatus = ConnectionStatus.DISCONNECTED
  public sessionId: string | null = null
  public userId: string | null = null

  constructor(private wsUrl: string) {}

  connect(sessionId: string, userId: string): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        resolve()
        return
      }

      this.sessionId = sessionId
      this.userId = userId
      this.status = ConnectionStatus.CONNECTING

      try {
        const wsUrlWithParams = `${this.wsUrl}?sessionId=${sessionId}&userId=${userId}`
        this.ws = new WebSocket(wsUrlWithParams)

        this.ws.onopen = () => {
          console.log('🚀 WebSocket connected')
          this.status = ConnectionStatus.CONNECTED
          this.reconnectAttempts = 0
          this.startHeartbeat()
          this.flushMessageQueue()
          this.emit('connected', { sessionId, userId })
          resolve()
        }

        this.ws.onmessage = (event) => {
          try {
            const message: WebSocketMessage = JSON.parse(event.data)
            this.handleMessage(message)
          } catch (error) {
            console.error('❌ Error parsing WebSocket message:', error)
          }
        }

        this.ws.onclose = (event) => {
          console.log('🔌 WebSocket disconnected:', event.code, event.reason)
          this.status = ConnectionStatus.DISCONNECTED
          this.stopHeartbeat()
          this.emit('disconnected', { code: event.code, reason: event.reason })
          
          if (!event.wasClean && this.reconnectAttempts < this.maxReconnectAttempts) {
            this.scheduleReconnect()
          }
        }

        this.ws.onerror = (error) => {
          console.error('❌ WebSocket error:', error)
          this.status = ConnectionStatus.ERROR
          this.emit('error', error)
          reject(error)
        }
      } catch (error) {
        this.status = ConnectionStatus.ERROR
        reject(error)
      }
    })
  }

  disconnect(): void {
    if (this.ws) {
      this.ws.close(1000, 'Client disconnect')
      this.ws = null
    }
    this.stopHeartbeat()
    this.status = ConnectionStatus.DISCONNECTED
    this.sessionId = null
    this.userId = null
  }

  send(message: Omit<WebSocketMessage, 'timestamp'>): void {
    const fullMessage: WebSocketMessage = {
      ...message,
      timestamp: Date.now()
    }

    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(fullMessage))
    } else {
      this.messageQueue.push(fullMessage)
      console.warn('⚠️ WebSocket not connected, message queued')
    }
  }

  private handleMessage(message: WebSocketMessage): void {
    switch (message.type) {
      case 'user_list':
        this.emit('userList', message.data)
        break
      case 'session_state':
        this.emit('sessionState', message.data)
        break
      case 'stroke_start':
      case 'stroke_continue':
      case 'stroke_end':
        this.emit('stroke', message)
        break
      case 'cursor_move':
        this.emit('cursorMove', message.data)
        break
      default:
        console.warn('⚠️ Unknown message type:', message.type)
    }
  }

  on(event: string, callback: (data: any) => void): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, [])
    }
    this.eventListeners.get(event)!.push(callback)
  }

  off(event: string, callback: (data: any) => void): void {
    const listeners = this.eventListeners.get(event)
    if (listeners) {
      const index = listeners.indexOf(callback)
      if (index > -1) {
        listeners.splice(index, 1)
      }
    }
  }

  private emit(event: string, data: any): void {
    const listeners = this.eventListeners.get(event)
    if (listeners) {
      listeners.forEach(callback => callback(data))
    }
  }

  private startHeartbeat(): void {
    this.heartbeatInterval = setInterval(() => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.send({
          type: 'heartbeat',
          sessionId: this.sessionId!,
          userId: this.userId!,
          data: {}
        })
      }
    }, 30000)
  }

  private stopHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval)
      this.heartbeatInterval = null
    }
  }


  private scheduleReconnect(): void {
    this.status = ConnectionStatus.RECONNECTING
    this.reconnectAttempts++
    
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1)
    console.log(`🔄 Scheduling reconnect attempt ${this.reconnectAttempts} in ${delay}ms`)
    
    setTimeout(() => {
      if (this.sessionId && this.userId) {
        this.connect(this.sessionId, this.userId).catch(error => {
          console.error('❌ Reconnect failed:', error)
        })
      }
    }, delay)
  }

  private flushMessageQueue(): void {
    while (this.messageQueue.length > 0) {
      const message = this.messageQueue.shift()
      if (message) {
        this.send(message)
      }
    }
  }

  isConnected(): boolean {
    return this.status === ConnectionStatus.CONNECTED && 
           this.ws?.readyState === WebSocket.OPEN
  }

  getConnectionStatus(): ConnectionStatus {
    return this.status
  }
}
export const wsManager = new WebSocketManager(
  process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8080'
)
