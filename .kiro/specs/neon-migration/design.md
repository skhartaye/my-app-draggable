# Design Document - Neon Database Migration

## Overview

This design outlines the migration from Supabase to Neon PostgreSQL database for the draggable notes application. The migration will improve real-time performance, fix sync issues, and provide a more reliable database foundation.

## Architecture

### Current Architecture (Supabase)
```
Client App → Supabase Client → Supabase Database
                ↓
         Real-time WebSocket
```

### New Architecture (Neon + Real-time Layer)
```
Client App → Database Client → Neon PostgreSQL
                ↓
         Real-time Layer (WebSocket/SSE)
                ↓
         Pusher/Ably/Socket.io
```

## Components and Interfaces

### 1. Database Client Layer

#### Neon Connection Manager
```typescript
interface DatabaseClient {
  connect(): Promise<void>
  disconnect(): Promise<void>
  query<T>(sql: string, params?: any[]): Promise<T[]>
  transaction<T>(callback: (client: DatabaseClient) => Promise<T>): Promise<T>
}

class NeonClient implements DatabaseClient {
  private pool: Pool
  private connectionString: string
  
  constructor(connectionString: string)
  async connect(): Promise<void>
  async disconnect(): Promise<void>
  async query<T>(sql: string, params?: any[]): Promise<T[]>
  async transaction<T>(callback: (client: DatabaseClient) => Promise<T>): Promise<T>
}
```

#### Database Operations
```typescript
interface NotesRepository {
  findAll(): Promise<Note[]>
  findById(id: string): Promise<Note | null>
  create(note: Omit<Note, 'id' | 'created_at' | 'updated_at'>): Promise<Note>
  update(id: string, updates: Partial<Note>): Promise<Note>
  delete(id: string): Promise<void>
  deleteAll(): Promise<void>
}

class PostgresNotesRepository implements NotesRepository {
  constructor(private client: DatabaseClient)
  // Implementation methods...
}
```

### 2. Real-time Layer

#### Real-time Service Interface
```typescript
interface RealtimeService {
  connect(): Promise<void>
  disconnect(): Promise<void>
  subscribe(channel: string, callback: (event: RealtimeEvent) => void): void
  publish(channel: string, event: RealtimeEvent): Promise<void>
  onConnectionChange(callback: (connected: boolean) => void): void
}

interface RealtimeEvent {
  type: 'INSERT' | 'UPDATE' | 'DELETE'
  table: string
  data: any
  old?: any
}
```

#### Real-time Implementation Options

**Option 1: Pusher (Recommended)**
- Managed service, reliable
- WebSocket with fallbacks
- Built-in presence channels
- Easy integration

**Option 2: Ably**
- Similar to Pusher
- Good performance
- More expensive

**Option 3: Socket.io + Custom Server**
- Full control
- Requires server management
- More complex setup

### 3. Data Access Layer

#### Notes Service
```typescript
class NotesService {
  constructor(
    private repository: NotesRepository,
    private realtime: RealtimeService
  ) {}

  async getAllNotes(): Promise<Note[]>
  async createNote(noteData: CreateNoteData): Promise<Note>
  async updateNote(id: string, updates: UpdateNoteData): Promise<Note>
  async deleteNote(id: string): Promise<void>
  async clearAllNotes(): Promise<void>
  
  // Real-time methods
  subscribeToChanges(callback: (event: NoteChangeEvent) => void): void
  unsubscribeFromChanges(): void
}
```

## Data Models

### Database Schema (PostgreSQL)

```sql
-- Notes table
CREATE TABLE notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    content TEXT NOT NULL DEFAULT '',
    x_position DECIMAL(10,2) NOT NULL,
    y_position DECIMAL(10,2) NOT NULL,
    color VARCHAR(50) NOT NULL DEFAULT 'yellow',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_notes_created_at ON notes(created_at);
CREATE INDEX idx_notes_updated_at ON notes(updated_at);
CREATE INDEX idx_notes_position ON notes(x_position, y_position);

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_notes_updated_at 
    BEFORE UPDATE ON notes 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();
```

### TypeScript Models

```typescript
interface Note {
  id: string
  content: string
  x: number
  y: number
  color: string
  created_at: string
  updated_at: string
}

interface CreateNoteData {
  content: string
  x: number
  y: number
  color: string
}

interface UpdateNoteData {
  content?: string
  x?: number
  y?: number
  color?: string
}

interface NoteChangeEvent {
  type: 'created' | 'updated' | 'deleted'
  note: Note
  oldNote?: Note
}
```

## Error Handling

### Database Error Handling
```typescript
class DatabaseError extends Error {
  constructor(
    message: string,
    public code: string,
    public originalError?: Error
  ) {
    super(message)
    this.name = 'DatabaseError'
  }
}

class ConnectionError extends DatabaseError {
  constructor(originalError: Error) {
    super('Database connection failed', 'CONNECTION_ERROR', originalError)
  }
}

class QueryError extends DatabaseError {
  constructor(query: string, originalError: Error) {
    super(`Query failed: ${query}`, 'QUERY_ERROR', originalError)
  }
}
```

### Real-time Error Handling
```typescript
class RealtimeError extends Error {
  constructor(
    message: string,
    public code: string,
    public recoverable: boolean = true
  ) {
    super(message)
    this.name = 'RealtimeError'
  }
}

// Error recovery strategies
interface ErrorRecoveryStrategy {
  canRecover(error: Error): boolean
  recover(error: Error): Promise<void>
}

class ConnectionRecoveryStrategy implements ErrorRecoveryStrategy {
  async canRecover(error: Error): boolean
  async recover(error: Error): Promise<void>
}
```

## Testing Strategy

### Unit Tests
- Database client operations
- Repository methods
- Real-time service functionality
- Error handling scenarios

### Integration Tests
- End-to-end note operations
- Real-time synchronization
- Connection recovery
- Performance benchmarks

### Migration Tests
- Data integrity verification
- Performance comparison
- Rollback procedures
- Load testing

## Migration Strategy

### Phase 1: Setup Neon Database
1. Create Neon project
2. Set up database schema
3. Configure connection pooling
4. Test basic connectivity

### Phase 2: Implement Database Layer
1. Create Neon client
2. Implement repository pattern
3. Add error handling
4. Write unit tests

### Phase 3: Add Real-time Layer
1. Choose real-time service (Pusher recommended)
2. Implement real-time client
3. Add event publishing/subscribing
4. Test real-time functionality

### Phase 4: Data Migration
1. Export data from Supabase
2. Import data to Neon
3. Verify data integrity
4. Test application functionality

### Phase 5: Deployment
1. Update environment variables
2. Deploy to staging
3. Test thoroughly
4. Deploy to production
5. Monitor performance

## Performance Optimizations

### Database Optimizations
- Connection pooling with pg-pool
- Prepared statements for frequent queries
- Proper indexing strategy
- Query optimization

### Real-time Optimizations
- Event batching for bulk operations
- Debounced updates for position changes
- Efficient conflict resolution
- Connection management

### Caching Strategy
- In-memory caching for frequently accessed notes
- Cache invalidation on updates
- Optimistic updates with rollback

## Security Considerations

### Database Security
- Connection string encryption
- SQL injection prevention
- Row-level security (if needed)
- Audit logging

### Real-time Security
- Channel authentication
- Event validation
- Rate limiting
- CORS configuration

## Monitoring and Observability

### Database Monitoring
- Connection pool metrics
- Query performance
- Error rates
- Resource usage

### Real-time Monitoring
- Connection status
- Event delivery rates
- Latency metrics
- Error tracking

### Application Monitoring
- User experience metrics
- Performance benchmarks
- Error reporting
- Usage analytics