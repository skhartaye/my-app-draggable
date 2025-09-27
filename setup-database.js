const { neon } = require('@neondatabase/serverless');

async function setupDatabase() {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    console.error('❌ DATABASE_URL environment variable is required');
    process.exit(1);
  }

  const sql = neon(databaseUrl);

  try {
    console.log('🚀 Setting up database tables...');

    // Create notes table
    await sql`
      CREATE TABLE IF NOT EXISTS notes (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        content TEXT DEFAULT '',
        x_position NUMERIC DEFAULT 0,
        y_position NUMERIC DEFAULT 0,
        color VARCHAR(50) DEFAULT 'yellow',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `;

    console.log('✅ Notes table created successfully');

    // Create an index on updated_at for better performance
    await sql`
      CREATE INDEX IF NOT EXISTS idx_notes_updated_at ON notes(updated_at)
    `;

    console.log('✅ Database indexes created successfully');

    // Check if table exists and show structure
    const tableInfo = await sql`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'notes'
      ORDER BY ordinal_position
    `;

    console.log('📋 Table structure:');
    console.table(tableInfo);

    console.log('🎉 Database setup complete!');

  } catch (error) {
    console.error('❌ Error setting up database:', error);
    process.exit(1);
  }
}

setupDatabase();