"use client"

import { useActionState } from "react"
import { useFormStatus } from "react-dom"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2 } from "lucide-react"
import Link from "next/link"
import { signUp } from "@/lib/actions"
import { useState } from "react"

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
          Signing up...
        </>
      ) : (
        "Sign Up"
      )}
    </Button>
  )
}

export default function SignUpForm() {
  const [state, formAction] = useActionState(signUp, null)
  const [role, setRole] = useState<string>("")

  return (
    <div className="w-full max-w-md space-y-8">
      <div className="space-y-2 text-center">
        <h1 className="text-4xl font-semibold tracking-tight">Join RePlate Campus</h1>
        <p className="text-lg text-muted-foreground">Create your account to reduce food waste</p>
      </div>

      <form action={formAction} className="space-y-6">
        {state?.error && (
          <div className="bg-destructive/10 border border-destructive/50 text-destructive px-4 py-3 rounded">
            {state.error}
          </div>
        )}

        {state?.success && (
          <div className="bg-green-500/10 border border-green-500/50 text-green-700 px-4 py-3 rounded">
            {state.success}
          </div>
        )}

        <div className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="fullName" className="block text-sm font-medium">
              Full Name
            </label>
            <Input id="fullName" name="fullName" type="text" placeholder="John Doe" required className="h-12" />
          </div>
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
          <div className="space-y-2">
            <label htmlFor="role" className="block text-sm font-medium">
              Role
            </label>
            <Select name="role" value={role} onValueChange={setRole} required>
              <SelectTrigger className="h-12">
                <SelectValue placeholder="Select your role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="student">Student</SelectItem>
                <SelectItem value="staff">Canteen Staff</SelectItem>
                <SelectItem value="volunteer">NGO Volunteer</SelectItem>
                <SelectItem value="admin">Administrator</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <SubmitButton />

        <div className="text-center text-muted-foreground">
          Already have an account?{" "}
          <Link href="/auth/login" className="text-primary hover:underline">
            Log in
          </Link>
        </div>
      </form>
    </div>
  )
}
