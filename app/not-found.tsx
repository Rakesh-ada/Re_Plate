"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Leaf, Home, ArrowLeft } from "lucide-react"

export default function NotFound() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md text-center">
        <CardHeader className="pb-6">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
              <Leaf className="h-8 w-8 text-primary" />
            </div>
          </div>
          <CardTitle className="text-2xl font-heading">Page Not Found</CardTitle>
          <CardDescription className="text-base">
            Oops! The page you're looking for seems to have been composted. Let's get you back to reducing food waste!
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-6xl font-bold text-muted-foreground mb-4">404</div>
          <div className="space-y-2">
            <Link href="/">
              <Button className="w-full">
                <Home className="h-4 w-4 mr-2" />
                Back to Home
              </Button>
            </Link>
            <Button variant="outline" onClick={() => window.history.back()} className="w-full">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Go Back
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
