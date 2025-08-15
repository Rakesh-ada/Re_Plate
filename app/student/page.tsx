import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import StudentDashboardClient from "@/components/student/student-dashboard-client"

export default async function StudentDashboard() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single()

  if (!profile || profile.role !== "student") {
    redirect("/auth/login")
  }

  // Fetch active flash sales
  const { data: initialFlashSales } = await supabase
    .from("flash_sales")
    .select(`
      *,
      food_items(
        *,
        canteens(name, location)
      )
    `)
    .eq("is_active", true)
    .gt("end_time", new Date().toISOString())
    .order("start_time", { ascending: true })

  // Calculate student impact
  const { data: claims } = await supabase
    .from("claims")
    .select(`
      quantity,
      amount_paid,
      food_items(original_price)
    `)
    .eq("student_id", user.id)

  const impact = claims?.reduce(
    (acc, claim) => ({
      mealsSaved: acc.mealsSaved + claim.quantity,
      moneySaved: acc.moneySaved + (claim.food_items.original_price * claim.quantity - claim.amount_paid),
      wasteReduced: acc.wasteReduced + claim.quantity * 0.5, // Assume 0.5kg per meal
    }),
    { mealsSaved: 0, moneySaved: 0, wasteReduced: 0 },
  ) || { mealsSaved: 0, moneySaved: 0, wasteReduced: 0 }

  return <StudentDashboardClient profile={profile} initialFlashSales={initialFlashSales || []} impact={impact} />
}
