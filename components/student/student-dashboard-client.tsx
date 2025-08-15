"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { MapPin, Search, ShoppingBag, Zap, Leaf, ArrowLeft, Timer, Users, Percent } from "lucide-react"
import Link from "next/link"
import { supabase } from "@/lib/supabase/client"
import { useToast } from "@/hooks/use-toast"

interface Profile {
  id: string
  full_name: string | null
  role: string
}

interface FlashSale {
  id: string
  name: string
  description: string | null
  category: string
  quantity: number
  original_price: number | null
  discounted_price: number | null
  expiry_time: string
  image_url: string | null
  canteens?: { name: string; location: string }
  flash_sales: Array<{
    id: string
    discount_percentage: number
    start_time: string
    end_time: string
    max_claims: number | null
    current_claims: number
    is_active: boolean
  }>
}

interface Impact {
  mealsSaved: number
  moneySaved: number
  wasteReduced: number
}

interface StudentDashboardClientProps {
  profile: Profile
  initialFlashSales: FlashSale[]
  impact: Impact
}

export default function StudentDashboardClient({ profile, initialFlashSales, impact }: StudentDashboardClientProps) {
  const [flashSales, setFlashSales] = useState<FlashSale[]>(initialFlashSales)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  // Real-time updates for flash sales
  useEffect(() => {
    const refreshFlashSales = async () => {
      const { data } = await supabase
        .from("food_items")
        .select(`
          *,
          canteens(name, location),
          flash_sales!inner(
            id,
            discount_percentage,
            start_time,
            end_time,
            max_claims,
            current_claims,
            is_active
          )
        `)
        .eq("status", "flash_sale")
        .eq("flash_sales.is_active", true)
        .gt("flash_sales.end_time", new Date().toISOString())
        .gt("quantity", 0)
        .order("created_at", { ascending: false })

      if (data) {
        setFlashSales(data)
      }
    }

    // Refresh every 30 seconds
    const interval = setInterval(refreshFlashSales, 30000)
    return () => clearInterval(interval)
  }, [])

  const getTimeRemaining = (endTime: string) => {
    const now = new Date()
    const end = new Date(endTime)
    const diffMs = end.getTime() - now.getTime()

    if (diffMs <= 0) return "Expired"

    const hours = Math.floor(diffMs / (1000 * 60 * 60))
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60))

    if (hours > 0) {
      return `${hours}h ${minutes}m`
    }
    return `${minutes}m`
  }

  const handleClaim = async (foodItemId: string, quantity = 1) => {
    setLoading(true)
    try {
      const { data, error } = await supabase.rpc("claim_food_item", {
        item_id: foodItemId,
        student_uuid: profile.id,
        claim_quantity: quantity,
      })

      if (error) throw error

      // Refresh flash sales after successful claim
      const { data: updatedSales } = await supabase
        .from("food_items")
        .select(`
          *,
          canteens(name, location),
          flash_sales!inner(
            id,
            discount_percentage,
            start_time,
            end_time,
            max_claims,
            current_claims,
            is_active
          )
        `)
        .eq("status", "flash_sale")
        .eq("flash_sales.is_active", true)
        .gt("flash_sales.end_time", new Date().toISOString())
        .gt("quantity", 0)
        .order("created_at", { ascending: false })

      setFlashSales(updatedSales || [])

      toast({
        title: "Success!",
        description: "Food item claimed successfully. Check your orders for pickup details.",
      })
    } catch (error) {
      console.error("Error claiming item:", error)
      toast({
        title: "Error",
        description: "Failed to claim item. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const filteredSales = flashSales.filter((sale) => {
    const matchesSearch =
      sale.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sale.canteens?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sale.category.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = selectedCategory === "all" || sale.category === selectedCategory

    // Check if flash sale is still active
    const flashSale = sale.flash_sales[0]
    const isActive = flashSale && new Date(flashSale.end_time) > new Date()

    return matchesSearch && matchesCategory && isActive
  })

  const categories = ["all", "Main Course", "Snacks", "Beverages", "Desserts", "Breakfast"]

  const averageDiscount =
    filteredSales.length > 0
      ? Math.round(
          filteredSales.reduce((acc, sale) => acc + (sale.flash_sales[0]?.discount_percentage || 0), 0) /
            filteredSales.length,
        )
      : 0

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-4">
              <Link href="/">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Home
                </Button>
              </Link>
              <div className="flex items-center gap-2">
                <Zap className="h-6 w-6 text-primary" />
                <span className="text-lg font-heading font-bold">Flash Sales</span>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Badge variant="outline" className="bg-primary/10 text-primary">
                <Users className="h-3 w-3 mr-1" />
                {profile.full_name || "Student"}
              </Badge>
              <Button variant="outline" size="sm">
                <ShoppingBag className="h-4 w-4 mr-2" />
                My Orders
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Hero Banner */}
        <div className="bg-gradient-to-r from-primary/10 to-accent/10 rounded-xl p-6 mb-8 border border-primary/20">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-heading font-bold text-foreground mb-2">Live Flash Sales</h1>
              <p className="text-muted-foreground">Grab surplus food at amazing discounts while reducing waste!</p>
            </div>
            <div className="flex items-center gap-4 text-center">
              <div className="bg-card rounded-lg p-3 border">
                <div className="text-2xl font-bold text-primary">{filteredSales.length}</div>
                <div className="text-xs text-muted-foreground">Active Sales</div>
              </div>
              <div className="bg-card rounded-lg p-3 border">
                <div className="text-2xl font-bold text-chart-1">{averageDiscount}%</div>
                <div className="text-xs text-muted-foreground">Avg Discount</div>
              </div>
            </div>
          </div>
        </div>

        {/* Search and Filter */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search food items, locations, or categories..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex gap-2 overflow-x-auto">
            {categories.map((category) => (
              <Button
                key={category}
                variant={selectedCategory === category ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCategory(category)}
                className="whitespace-nowrap"
              >
                {category === "all" ? "All Items" : category}
              </Button>
            ))}
          </div>
        </div>

        {/* Flash Sales Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredSales.map((sale) => {
            const flashSale = sale.flash_sales[0]
            const availableQuantity = flashSale?.max_claims
              ? Math.min(sale.quantity, flashSale.max_claims - flashSale.current_claims)
              : sale.quantity

            return (
              <Card
                key={sale.id}
                className="overflow-hidden hover:shadow-lg transition-shadow border-l-4 border-l-primary/50"
              >
                <div className="relative">
                  <img
                    src={
                      sale.image_url || `/placeholder.svg?height=200&width=400&query=${encodeURIComponent(sale.name)}`
                    }
                    alt={sale.name}
                    className="w-full h-48 object-cover"
                  />
                  <div className="absolute top-3 left-3 flex gap-2">
                    <Badge className="bg-destructive text-destructive-foreground">
                      <Percent className="h-3 w-3 mr-1" />
                      {flashSale?.discount_percentage || 0}% OFF
                    </Badge>
                  </div>
                  <div className="absolute top-3 right-3">
                    <Badge variant="secondary" className="bg-card/90 text-foreground">
                      <Timer className="h-3 w-3 mr-1" />
                      {getTimeRemaining(flashSale?.end_time || "")}
                    </Badge>
                  </div>
                </div>

                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">{sale.name}</CardTitle>
                      <CardDescription className="text-sm">
                        {sale.description || "Delicious food item available at discounted price"}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl font-bold text-primary">₹{sale.discounted_price || 0}</span>
                      <span className="text-sm text-muted-foreground line-through">₹{sale.original_price || 0}</span>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {sale.category}
                    </Badge>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <MapPin className="h-4 w-4" />
                      <span>{sale.canteens?.name || "Unknown Location"}</span>
                    </div>
                    <div className="text-xs text-muted-foreground pl-6">{sale.canteens?.location}</div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Available</span>
                      <span className="font-medium">{availableQuantity} items</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div
                        className="bg-primary h-2 rounded-full transition-all"
                        style={{
                          width: `${Math.max(0, (availableQuantity / (flashSale?.max_claims || sale.quantity)) * 100)}%`,
                        }}
                      />
                    </div>
                  </div>

                  <Button
                    onClick={() => handleClaim(sale.id)}
                    disabled={availableQuantity <= 0 || loading}
                    className="w-full"
                    size="lg"
                  >
                    {availableQuantity <= 0 ? (
                      "Sold Out"
                    ) : loading ? (
                      "Claiming..."
                    ) : (
                      <>
                        <Zap className="h-4 w-4 mr-2" />
                        Claim Now - ₹{sale.discounted_price}
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {filteredSales.length === 0 && (
          <div className="text-center py-12">
            <Leaf className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">No Flash Sales Found</h3>
            <p className="text-muted-foreground">
              {searchTerm || selectedCategory !== "all"
                ? "Try adjusting your search or filter criteria"
                : "Check back soon for new flash sales!"}
            </p>
          </div>
        )}

        {/* Impact Section */}
        <div className="mt-12 bg-muted/30 rounded-xl p-6">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-heading font-bold text-foreground mb-2">Your Impact</h2>
            <p className="text-muted-foreground">Every purchase helps reduce food waste on campus</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-3">
                <Leaf className="h-8 w-8 text-primary" />
              </div>
              <div className="text-2xl font-bold text-primary mb-1">{impact.mealsSaved}</div>
              <div className="text-sm text-muted-foreground">Meals Saved</div>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-chart-2/10 rounded-full flex items-center justify-center mx-auto mb-3">
                <ShoppingBag className="h-8 w-8 text-chart-2" />
              </div>
              <div className="text-2xl font-bold text-chart-2 mb-1">₹{Math.round(impact.moneySaved)}</div>
              <div className="text-sm text-muted-foreground">Money Saved</div>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-chart-3/10 rounded-full flex items-center justify-center mx-auto mb-3">
                <Users className="h-8 w-8 text-chart-3" />
              </div>
              <div className="text-2xl font-bold text-chart-3 mb-1">{impact.wasteReduced.toFixed(1)}kg</div>
              <div className="text-sm text-muted-foreground">Waste Prevented</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
