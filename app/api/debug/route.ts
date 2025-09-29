import { NextResponse } from 'next/server'

export async function GET() {
  try {
    console.log('🔍 Debug information:')
    
    // Check environment variables
    const hasDbUrl = !!process.env.DATABASE_URL
    const dbUrlLength = process.env.DATABASE_URL?.length || 0
    const nodeEnv = process.env.NODE_ENV
    
    console.log('Environment variables:')
    console.log('- NODE_ENV:', nodeEnv)
    console.log('- DATABASE_URL exists:', hasDbUrl)
    console.log('- DATABASE_URL length:', dbUrlLength)
    
    // Check available environment variables
    const envVars = Object.keys(process.env).filter(key => 
      key.includes('DATABASE') || key.includes('NEON') || key.includes('POSTGRES')
    )
    
    console.log('Database-related env vars:', envVars)
    
    return NextResponse.json({
      success: true,
      environment: {
        nodeEnv,
        hasDatabaseUrl: hasDbUrl,
        databaseUrlLength: dbUrlLength,
        databaseEnvVars: envVars,
        timestamp: new Date().toISOString()
      }
    })
    
  } catch (error) {
    console.error('❌ Debug failed:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Debug failed', 
      details: error 
    }, { status: 500 })
  }
}