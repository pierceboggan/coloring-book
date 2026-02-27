export interface User {
  id: string
  name: string
  email?: string
  color: string
  isOnline: boolean
  lastSeen: Date
}

export interface DrawingPoint {
  x: number
  y: number
  color: string
  size: number
  pressure?: number
  tool: 'pen' | 'marker' | 'brush'
  timestamp: number
  userId: string
}

export interface DrawingStroke {
  id: string
  points: DrawingPoint[]
  userId: string
  tool: 'pen' | 'marker' | 'brush'
  color: string
  size: number
  timestamp: number
  version: number
}

export interface CollaborativeSession {
  id: string
  name: string
  imageId: string
  createdBy: string
  participants: User[]
  strokes: DrawingStroke[]
  isActive: boolean
  createdAt: Date
  updatedAt: Date
  shareCode: string
}

export interface WebSocketMessage {
  type: 'join' | 'leave' | 'stroke_start' | 'stroke_continue' | 'stroke_end' | 'cursor_move' | 'user_list' | 'session_state' | 'heartbeat'
  sessionId: string
  userId: string
  data: any
  timestamp: number
}

export interface DrawingOperation {
  type: 'add_stroke' | 'modify_stroke' | 'delete_stroke' | 'add_point' | 'clear_canvas'
  strokeId?: string
  stroke?: DrawingStroke
  point?: DrawingPoint
  userId: string
  timestamp: number
  version: number
}

export enum ConflictResolution {
  LAST_WRITER_WINS = 'last_writer_wins',
  OPERATIONAL_TRANSFORM = 'operational_transform',
  CRDT = 'crdt'
}

export interface SyncEvent {
  type: 'user_joined' | 'user_left' | 'stroke_added' | 'stroke_modified' | 'cursor_moved' | 'session_updated'
  userId: string
  sessionId: string
  data: any
  timestamp: number
}

export interface SessionState {
  session: CollaborativeSession
  currentStrokes: Map<string, DrawingStroke>
  userCursors: Map<string, { x: number; y: number; timestamp: number }>
  pendingOperations: DrawingOperation[]
  lastSyncVersion: number
  isConnected: boolean
}

export enum ConnectionStatus {
  CONNECTING = 'connecting',
  CONNECTED = 'connected',
  DISCONNECTED = 'disconnected',
  RECONNECTING = 'reconnecting',
  ERROR = 'error'
}

export interface CollaborativeCanvas {
  sessionId: string
  userId: string
  canvas: HTMLCanvasElement
  context: CanvasRenderingContext2D
  localStrokes: Map<string, DrawingStroke>
  remoteStrokes: Map<string, DrawingStroke>
  currentStroke: DrawingStroke | null
  isDrawing: boolean
  
  startStroke(point: DrawingPoint): void
  continueStroke(point: DrawingPoint): void
  endStroke(): void
  applyRemoteOperation(operation: DrawingOperation): void
  
  syncWithServer(): Promise<void>
  handleWebSocketMessage(message: WebSocketMessage): void
  
  resolveConflict(localOp: DrawingOperation, remoteOp: DrawingOperation): DrawingOperation
}

export const COLLABORATIVE_SESSIONS_TABLE = 'collaborative_sessions'
export const COLLABORATIVE_PARTICIPANTS_TABLE = 'collaborative_participants'
export const COLLABORATIVE_STROKES_TABLE = 'collaborative_strokes'

export const COLLABORATIVE_SCHEMA = `
CREATE TABLE IF NOT EXISTS collaborative_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  image_id UUID NOT NULL REFERENCES images(id),
  created_by TEXT NOT NULL REFERENCES auth.users(id),
  is_active BOOLEAN DEFAULT true,
  share_code TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS collaborative_participants (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID NOT NULL REFERENCES collaborative_sessions(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES auth.users(id),
  user_name TEXT NOT NULL,
  user_color TEXT NOT NULL DEFAULT '#FF6B6B',
  is_online BOOLEAN DEFAULT false,
  last_seen TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(session_id, user_id)
);

CREATE TABLE IF NOT EXISTS collaborative_strokes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID NOT NULL REFERENCES collaborative_sessions(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES auth.users(id),
  stroke_data JSONB NOT NULL,
  version INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_collaborative_sessions_share_code ON collaborative_sessions(share_code);
CREATE INDEX IF NOT EXISTS idx_collaborative_participants_session_id ON collaborative_participants(session_id);
CREATE INDEX IF NOT EXISTS idx_collaborative_strokes_session_id ON collaborative_strokes(session_id);
CREATE INDEX IF NOT EXISTS idx_collaborative_strokes_created_at ON collaborative_strokes(created_at);

ALTER TABLE collaborative_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE collaborative_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE collaborative_strokes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view sessions they participate in" ON collaborative_sessions 
  FOR SELECT USING (
    created_by = auth.uid() OR 
    id IN (
      SELECT session_id FROM collaborative_participants 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create sessions" ON collaborative_sessions 
  FOR INSERT WITH CHECK (created_by = auth.uid());

CREATE POLICY "Session creators can update their sessions" ON collaborative_sessions 
  FOR UPDATE USING (created_by = auth.uid());

CREATE POLICY "Users can view participants in their sessions" ON collaborative_participants 
  FOR SELECT USING (
    user_id = auth.uid() OR 
    session_id IN (
      SELECT id FROM collaborative_sessions 
      WHERE created_by = auth.uid() OR 
      id IN (
        SELECT session_id FROM collaborative_participants 
        WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can join sessions" ON collaborative_participants 
  FOR INSERT WITH CHECK (
    user_id = auth.uid() AND 
    session_id IN (
      SELECT id FROM collaborative_sessions 
      WHERE is_active = true
    )
  );

CREATE POLICY "Users can update their participant status" ON collaborative_participants 
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can view strokes in their sessions" ON collaborative_strokes 
  FOR SELECT USING (
    user_id = auth.uid() OR 
    session_id IN (
      SELECT session_id FROM collaborative_participants 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create strokes in their sessions" ON collaborative_strokes 
  FOR INSERT WITH CHECK (
    user_id = auth.uid() AND 
    session_id IN (
      SELECT session_id FROM collaborative_participants 
      WHERE user_id = auth.uid()
    )
  );
`

export const generateShareCode = (): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let result = ''
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

export const generateUserColor = (): string => {
  const colors = [
    '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
    '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E2'
  ]
  return colors[Math.floor(Math.random() * colors.length)]
}

export const createSessionState = (session: CollaborativeSession): SessionState => ({
  session,
  currentStrokes: new Map(),
  userCursors: new Map(),
  pendingOperations: [],
  lastSyncVersion: 0,
  isConnected: false
})
