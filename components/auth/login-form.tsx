"use client"

import { useActionState } from "react"
import { useFormStatus } from "react-dom"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Loader2 } from "lucide-react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { useEffect } from "react"
import { signIn } from "@/lib/actions"

function SubmitButton() {
  const { pending } = useFormStatus()

  return (
    <Button
      type="submit"
      disabled={pending}
      className="w-full bg-primary hover:bg-primary/90 text-white py-6 text-lg font-medium rounded-lg h-[60px]"
    >
      {pending ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Signing in...
        </>
      ) : (
        "Sign In"
      )}
    </Button>
  )
}

export default function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [state, formAction] = useActionState(signIn, null)

  const urlMessage = searchParams.get("message")

  useEffect(() => {
    if (state?.success) {
      router.push("/")
    }
  }, [state, router])

  return (
    <div className="w-full max-w-md space-y-8">
      <div className="space-y-2 text-center">
        <h1 className="text-4xl font-semibold tracking-tight">Welcome back</h1>
        <p className="text-lg text-muted-foreground">Sign in to RePlate Campus</p>
      </div>

      <form action={formAction} className="space-y-6">
        {urlMessage && (
          <div className="bg-destructive/10 border border-destructive/50 text-destructive px-4 py-3 rounded">
            {urlMessage}
          </div>
        )}
        {state?.error && (
          <div className="bg-destructive/10 border border-destructive/50 text-destructive px-4 py-3 rounded">
            {state.error}
          </div>
        )}

        {state?.message && (
          <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded">{state.message}</div>
        )}

        <div className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="email" className="block text-sm font-medium">
              Email
            </label>
            <Input id="email" name="email" type="email" placeholder="you@college.edu" required className="h-12" />
          </div>
          <div className="space-y-2">
            <label htmlFor="password" className="block text-sm font-medium">
              Password
            </label>
            <Input id="password" name="password" type="password" required className="h-12" />
          </div>
        </div>

        <SubmitButton />

        <div className="text-center text-muted-foreground">
          Don't have an account?{" "}
          <Link href="/auth/sign-up" className="text-primary hover:underline">
            Sign up
          </Link>
        </div>
      </form>
    </div>
  )
}
