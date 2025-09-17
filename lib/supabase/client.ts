import { createClient as createSupabaseClient } from "@supabase/supabase-js"

let supabaseClient: ReturnType<typeof createSupabaseClient> | null = null

export function createClient() {
  // Return existing client if already created
  if (supabaseClient) {
    return supabaseClient
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl) {
    console.error("NEXT_PUBLIC_SUPABASE_URL is required but not found in environment variables")
    throw new Error("NEXT_PUBLIC_SUPABASE_URL is required but not found in environment variables")
  }

  if (!supabaseAnonKey) {
    console.error("NEXT_PUBLIC_SUPABASE_ANON_KEY is required but not found in environment variables")
    throw new Error("NEXT_PUBLIC_SUPABASE_ANON_KEY is required but not found in environment variables")
  }

  try {
    supabaseClient = createSupabaseClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
      realtime: {
        params: {
          eventsPerSecond: 10,
        },
      },
    })
    return supabaseClient
  } catch (error) {
    console.error("Failed to create Supabase client:", error)
    throw error
  }
}
