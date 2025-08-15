import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { type NextRequest, NextResponse } from "next/server"
import type { Database } from "@/lib/supabase/client"

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get("code")
  const error = requestUrl.searchParams.get("error")
  const errorDescription = requestUrl.searchParams.get("error_description")

  if (error) {
    console.log("[v0] Auth callback error:", error, errorDescription)

    // Redirect to login with error message
    const loginUrl = new URL("/auth/login", requestUrl.origin)
    if (error === "otp_expired") {
      loginUrl.searchParams.set("message", "Email link has expired. Please try signing in again.")
    } else {
      loginUrl.searchParams.set("message", errorDescription || "Authentication failed. Please try again.")
    }

    return NextResponse.redirect(loginUrl)
  }

  if (code) {
    const cookieStore = cookies()
    const supabase = createRouteHandlerClient<Database>({ cookies: () => cookieStore })

    try {
      const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)

      if (exchangeError) {
        console.log("[v0] Code exchange error:", exchangeError)
        const loginUrl = new URL("/auth/login", requestUrl.origin)
        loginUrl.searchParams.set("message", "Authentication failed. Please try signing in again.")
        return NextResponse.redirect(loginUrl)
      }

      // Create profile after successful email confirmation
      if (data.user) {
        const { error: profileError } = await supabase.from("profiles").insert({
          id: data.user.id,
          email: data.user.email!,
          full_name: data.user.user_metadata?.full_name || null,
          role: data.user.user_metadata?.role || "student",
        })

        if (profileError) {
          console.log("[v0] Profile creation error:", profileError)
          // Continue anyway - user can update profile later
        }
      }

      const userRole = data.user?.user_metadata?.role || "student"
      const dashboardUrl = new URL(`/${userRole}`, requestUrl.origin)
      return NextResponse.redirect(dashboardUrl)
    } catch (error) {
      console.log("[v0] Callback error:", error)
      const loginUrl = new URL("/auth/login", requestUrl.origin)
      loginUrl.searchParams.set("message", "Something went wrong. Please try signing in again.")
      return NextResponse.redirect(loginUrl)
    }
  }

  return NextResponse.redirect(requestUrl.origin)
}
