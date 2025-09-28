-- Create notes table if it doesn't exist
CREATE TABLE IF NOT EXISTS notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content TEXT DEFAULT '',
  x_position INTEGER DEFAULT 0,
  y_position INTEGER DEFAULT 0,
  color VARCHAR(50) DEFAULT 'yellow',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_notes_created_at ON notes(created_at);

-- Sample data for testing (optional)
-- INSERT INTO notes (content, x_position, y_position, color) 
-- VALUES 
--   ('Welcome to your notes app!', 100, 100, 'yellow'),
--   ('Drag me around!', 300, 200, 'blue')
-- ON CONFLICT DO NOTHING;