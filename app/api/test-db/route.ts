import { NextResponse } from 'next/server'
import { db } from '@/lib/database/client'

export async function GET() {
  try {
    console.log('🧪 Testing database connection...')
    
    // Test basic connection
    const { data: versionData, error: versionError } = await db.query('SELECT version()')
    if (versionError) {
      console.error('❌ Database connection failed:', versionError)
      return NextResponse.json({ 
        success: false, 
        error: 'Database connection failed', 
        details: versionError 
      }, { status: 500 })
    }
    
    console.log('✅ Database connection successful')
    console.log('📊 Database version:', versionData)
    
    // Test if notes table exists
    const { data: tableData } = await db.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'notes'
      )
    `)
    
    const tableExists = (tableData as Record<string, unknown>[])?.[0]?.exists || false
    console.log('📋 Notes table exists:', tableExists)
    
    // If table doesn't exist, create it
    if (!tableExists) {
      console.log('🔧 Creating notes table...')
      const createTableSQL = `
        CREATE TABLE notes (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          content TEXT DEFAULT '',
          x_position INTEGER DEFAULT 0,
          y_position INTEGER DEFAULT 0,
          color VARCHAR(50) DEFAULT 'yellow',
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        )
      `
      
      const { error: createError } = await db.query(createTableSQL)
      if (createError) {
        console.error('❌ Failed to create table:', createError)
        return NextResponse.json({ 
          success: false, 
          error: 'Failed to create table', 
          details: createError 
        }, { status: 500 })
      }
      
      console.log('✅ Notes table created successfully')
    }
    
    // Test a simple select
    const { data: notesData, error: notesError } = await db.select('notes')
    if (notesError) {
      console.error('❌ Failed to select from notes:', notesError)
      return NextResponse.json({ 
        success: false, 
        error: 'Failed to select from notes', 
        details: notesError 
      }, { status: 500 })
    }
    
    console.log(`✅ Successfully selected ${notesData.length} notes`)
    
    return NextResponse.json({
      success: true,
      message: 'Database connection and table access successful',
      databaseVersion: (versionData as Record<string, unknown>[])?.[0]?.version,
      tableExists: true,
      notesCount: notesData.length,
      sampleNotes: notesData.slice(0, 3) // Show first 3 notes as sample
    })
    
  } catch (error) {
    console.error('❌ Database test failed:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Database test failed', 
      details: error 
    }, { status: 500 })
  }
}