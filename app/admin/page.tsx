import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import AdminDashboardClient from "@/components/admin/admin-dashboard-client"

export default async function AdminDashboard() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single()

  if (!profile || profile.role !== "admin") {
    redirect("/auth/login")
  }

  // Fetch system statistics
  const [
    { count: totalUsers },
    { count: activeCanteens },
    { count: ngoPartners },
    { data: usersByRole },
    { data: canteens },
    { data: ngos },
  ] = await Promise.all([
    supabase.from("profiles").select("*", { count: "exact", head: true }),
    supabase.from("canteens").select("*", { count: "exact", head: true }),
    supabase.from("ngos").select("*", { count: "exact", head: true }),
    supabase.from("profiles").select("role"),
    supabase.from("canteens").select("*").order("name"),
    supabase.from("ngos").select("*").order("name"),
  ])

  // Calculate user distribution by role
  const roleDistribution =
    usersByRole?.reduce(
      (acc, user) => {
        acc[user.role] = (acc[user.role] || 0) + 1
        return acc
      },
      {} as Record<string, number>,
    ) || {}

  // Fetch analytics data for system stats
  const { data: analyticsData } = await supabase
    .from("analytics")
    .select("*")
    .gte("date", new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0])

  const systemStats = analyticsData?.reduce(
    (acc, analytics) => ({
      totalUsers: totalUsers || 0,
      activeCanteens: activeCanteens || 0,
      ngoPartners: ngoPartners || 0,
      totalSurplus: acc.totalSurplus + analytics.total_food_logged,
      wasteReduction: acc.wasteReduction + analytics.total_food_sold + analytics.total_food_donated,
      revenue: acc.revenue + Number(analytics.revenue_generated),
      peopleFed: acc.peopleFed + analytics.meals_provided,
      usersByRole: roleDistribution,
    }),
    {
      totalUsers: totalUsers || 0,
      activeCanteens: activeCanteens || 0,
      ngoPartners: ngoPartners || 0,
      totalSurplus: 0,
      wasteReduction: 0,
      revenue: 0,
      peopleFed: 0,
      usersByRole: roleDistribution,
    },
  ) || {
    totalUsers: totalUsers || 0,
    activeCanteens: activeCanteens || 0,
    ngoPartners: ngoPartners || 0,
    totalSurplus: 0,
    wasteReduction: 0,
    revenue: 0,
    peopleFed: 0,
    usersByRole: roleDistribution,
  }

  // Fetch daily metrics for the last 30 days
  const { data: dailyMetrics } = await supabase
    .from("analytics")
    .select("*")
    .gte("date", new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0])
    .order("date", { ascending: true })

  // Fetch canteen performance
  const { data: canteenPerformance } = await supabase
    .from("analytics")
    .select(`
      canteen_id,
      canteens(name),
      total_food_logged,
      total_food_sold,
      total_food_donated,
      revenue_generated
    `)
    .gte("date", new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0])

  // Fetch category distribution
  const { data: foodItems } = await supabase.from("food_items").select("category")
  const categoryDistribution =
    foodItems?.reduce(
      (acc, item) => {
        acc[item.category] = (acc[item.category] || 0) + 1
        return acc
      },
      {} as Record<string, number>,
    ) || {}

  // Fetch recent activities
  const { data: recentActivities } = await supabase
    .from("food_items")
    .select(`
      *,
      canteens(name),
      profiles(full_name)
    `)
    .order("created_at", { ascending: false })
    .limit(10)

  return (
    <AdminDashboardClient
      profile={profile}
      systemStats={systemStats}
      dailyMetrics={dailyMetrics || []}
      canteenPerformance={canteenPerformance || []}
      categoryDistribution={Object.entries(categoryDistribution).map(([name, value]) => ({ name, value }))}
      recentActivities={recentActivities || []}
      canteens={canteens || []}
      ngos={ngos || []}
    />
  )
}
