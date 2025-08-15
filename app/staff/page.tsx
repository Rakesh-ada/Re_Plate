import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import StaffDashboardClient from "@/components/staff/staff-dashboard-client"

export default async function StaffDashboard() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single()

  if (!profile || profile.role !== "staff") {
    redirect("/auth/login")
  }

  // Fetch canteen data
  const { data: canteen } = await supabase.from("canteens").select("*").eq("id", profile.canteen_id).single()

  // Fetch initial food items
  const { data: initialFoodItems } = await supabase
    .from("food_items")
    .select(`
      *,
      canteens(name, location),
      flash_sales(*)
    `)
    .eq("canteen_id", profile.canteen_id)
    .order("created_at", { ascending: false })

  // Fetch today's analytics
  const today = new Date().toISOString().split("T")[0]
  const { data: todayAnalytics } = await supabase
    .from("analytics")
    .select("*")
    .eq("canteen_id", profile.canteen_id)
    .eq("date", today)
    .single()

  // Fetch weekly analytics
  const weekAgo = new Date()
  weekAgo.setDate(weekAgo.getDate() - 7)
  const { data: weeklyAnalytics } = await supabase
    .from("analytics")
    .select("*")
    .eq("canteen_id", profile.canteen_id)
    .gte("date", weekAgo.toISOString().split("T")[0])
    .order("date", { ascending: true })

  return (
    <StaffDashboardClient
      profile={profile}
      canteen={canteen}
      initialFoodItems={initialFoodItems || []}
      todayAnalytics={todayAnalytics}
      weeklyAnalytics={weeklyAnalytics || []}
    />
  )
}
