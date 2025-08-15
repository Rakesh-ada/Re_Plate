import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"

// Check if Supabase environment variables are available
export const isSupabaseConfigured =
  typeof process.env.NEXT_PUBLIC_SUPABASE_URL === "string" &&
  process.env.NEXT_PUBLIC_SUPABASE_URL.length > 0 &&
  typeof process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY === "string" &&
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY.length > 0

// Create a singleton instance of the Supabase client for Client Components
export const supabase = createClientComponentClient()

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          full_name: string | null
          role: "staff" | "student" | "volunteer" | "admin"
          phone: string | null
          student_id: string | null
          canteen_id: string | null
          ngo_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          role?: "staff" | "student" | "volunteer" | "admin"
          phone?: string | null
          student_id?: string | null
          canteen_id?: string | null
          ngo_id?: string | null
        }
        Update: {
          full_name?: string | null
          role?: "staff" | "student" | "volunteer" | "admin"
          phone?: string | null
          student_id?: string | null
          canteen_id?: string | null
          ngo_id?: string | null
        }
      }
      food_items: {
        Row: {
          id: string
          canteen_id: string
          staff_id: string
          name: string
          description: string | null
          category: string
          quantity: number
          original_price: number | null
          discounted_price: number | null
          expiry_time: string
          status: "available" | "flash_sale" | "donated" | "claimed" | "expired"
          image_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          canteen_id: string
          staff_id: string
          name: string
          description?: string | null
          category: string
          quantity: number
          original_price?: number | null
          discounted_price?: number | null
          expiry_time: string
          status?: "available" | "flash_sale" | "donated" | "claimed" | "expired"
          image_url?: string | null
        }
        Update: {
          name?: string
          description?: string | null
          category?: string
          quantity?: number
          original_price?: number | null
          discounted_price?: number | null
          expiry_time?: string
          status?: "available" | "flash_sale" | "donated" | "claimed" | "expired"
          image_url?: string | null
        }
      }
    }
  }
}
