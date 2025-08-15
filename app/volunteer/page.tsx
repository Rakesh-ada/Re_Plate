import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import VolunteerDashboardClient from "@/components/volunteer/volunteer-dashboard-client"

export default async function VolunteerDashboard() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single()

  if (!profile || profile.role !== "volunteer") {
    redirect("/auth/login")
  }

  // Fetch NGO data
  const { data: ngo } = await supabase.from("ngos").select("*").eq("id", profile.ngo_id).single()

  // Fetch available donations
  const { data: availableDonations } = await supabase
    .from("donations")
    .select(`
      *,
      food_items(
        *,
        canteens(name, location, contact_phone)
      )
    `)
    .eq("ngo_id", profile.ngo_id)
    .eq("status", "available")
    .order("created_at", { ascending: false })

  // Fetch scheduled donations
  const { data: scheduledDonations } = await supabase
    .from("donations")
    .select(`
      *,
      food_items(
        *,
        canteens(name, location, contact_phone)
      )
    `)
    .eq("ngo_id", profile.ngo_id)
    .eq("status", "scheduled")
    .order("pickup_time", { ascending: true })

  // Fetch completed donations (last 30 days)
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
  const { data: completedDonations } = await supabase
    .from("donations")
    .select(`
      *,
      food_items(
        *,
        canteens(name, location)
      )
    `)
    .eq("ngo_id", profile.ngo_id)
    .eq("status", "completed")
    .gte("created_at", thirtyDaysAgo.toISOString())
    .order("created_at", { ascending: false })

  // Calculate weekly stats
  const weekAgo = new Date()
  weekAgo.setDate(weekAgo.getDate() - 7)
  const { data: weeklyDonations } = await supabase
    .from("donations")
    .select(`
      quantity,
      food_items(name)
    `)
    .eq("ngo_id", profile.ngo_id)
    .eq("status", "completed")
    .gte("created_at", weekAgo.toISOString())

  const weeklyStats = weeklyDonations?.reduce(
    (acc, donation) => ({
      totalDonations: acc.totalDonations + 1,
      totalPortions: acc.totalPortions + donation.quantity,
      estimatedWeight: acc.estimatedWeight + donation.quantity * 0.5, // Assume 0.5kg per portion
      peopleFed: acc.peopleFed + donation.quantity,
    }),
    { totalDonations: 0, totalPortions: 0, estimatedWeight: 0, peopleFed: 0 },
  ) || { totalDonations: 0, totalPortions: 0, estimatedWeight: 0, peopleFed: 0 }

  return (
    <VolunteerDashboardClient
      profile={profile}
      ngo={ngo}
      availableDonations={availableDonations || []}
      scheduledDonations={scheduledDonations || []}
      completedDonations={completedDonations || []}
      weeklyStats={weeklyStats}
    />
  )
}
