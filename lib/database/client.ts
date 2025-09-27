import { neon } from '@neondatabase/serverless'

let dbClient: ReturnType<typeof neon> | null = null

export function createClient() {
  // Return existing client if already created
  if (dbClient) {
    return dbClient
  }

  const databaseUrl = process.env.DATABASE_URL

  if (!databaseUrl) {
    console.error("DATABASE_URL is required but not found in environment variables")
    throw new Error("DATABASE_URL is required but not found in environment variables")
  }

  try {
    dbClient = neon(databaseUrl)
    console.log("Neon database client created successfully")
    return dbClient
  } catch (error) {
    console.error("Failed to create Neon database client:", error)
    throw error
  }
}

// Database operations helper functions
export const db = {
  async query(sql: string, params: unknown[] = []) {
    const client = createClient()
    try {
      const result = await client(sql, params)
      return { data: result, error: null }
    } catch (error) {
      console.error("Database query error:", error)
      return { data: null, error }
    }
  },

  async select(table: string, conditions: string = '', params: unknown[] = []) {
    const whereClause = conditions ? `WHERE ${conditions}` : ''
    const sql = `SELECT * FROM ${table} ${whereClause} ORDER BY created_at ASC`
    const result = await this.query(sql, params)
    return { 
      data: Array.isArray(result.data) ? result.data : [], 
      error: result.error 
    }
  },

  async insert(table: string, data: Record<string, unknown>) {
    const columns = Object.keys(data).join(', ')
    const placeholders = Object.keys(data).map((_, i) => `$${i + 1}`).join(', ')
    const values = Object.values(data)

    const sql = `INSERT INTO ${table} (${columns}) VALUES (${placeholders}) RETURNING *`
    const result = await this.query(sql, values)
    return { 
      data: Array.isArray(result.data) ? result.data : [], 
      error: result.error 
    }
  },

  async update(table: string, data: Record<string, unknown>, conditions: string, params: unknown[] = []) {
    const dataKeys = Object.keys(data)
    const setClause = dataKeys.map((key, i) => `${key} = $${i + 1}`).join(', ')
    
    // Replace parameter placeholders in conditions to start after SET clause parameters
    let adjustedConditions = conditions
    for (let i = params.length; i >= 1; i--) {
      adjustedConditions = adjustedConditions.replace(`$${i}`, `$${dataKeys.length + i}`)
    }
    
    const values = [...Object.values(data), ...params]

    const sql = `UPDATE ${table} SET ${setClause} WHERE ${adjustedConditions} RETURNING *`
    const result = await this.query(sql, values)
    return { 
      data: Array.isArray(result.data) ? result.data : [], 
      error: result.error 
    }
  },

  async delete(table: string, conditions: string, params: unknown[] = []) {
    const sql = `DELETE FROM ${table} WHERE ${conditions} RETURNING *`
    return this.query(sql, params)
  }
}