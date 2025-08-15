"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Plus, Package, TrendingUp, Clock, Users, Heart, CheckCircle, Leaf, ArrowLeft } from "lucide-react"
import Link from "next/link"
import { supabase } from "@/lib/supabase/client"
import { useToast } from "@/hooks/use-toast"

interface Profile {
  id: string
  full_name: string | null
  canteen_id: string | null
  role: string
}

interface Canteen {
  id: string
  name: string
  location: string
}

interface FoodItem {
  id: string
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
  canteens?: { name: string; location: string }
  flash_sales?: Array<{ discount_percentage: number; end_time: string; is_active: boolean }>
}

interface Analytics {
  total_food_logged: number
  total_food_sold: number
  total_food_donated: number
  revenue_generated: number
  meals_provided: number
}

interface StaffDashboardClientProps {
  profile: Profile
  canteen: Canteen | null
  initialFoodItems: FoodItem[]
  todayAnalytics: Analytics | null
  weeklyAnalytics: Analytics[]
}

export default function StaffDashboardClient({
  profile,
  canteen,
  initialFoodItems,
  todayAnalytics,
  weeklyAnalytics,
}: StaffDashboardClientProps) {
  const [foodItems, setFoodItems] = useState<FoodItem[]>(initialFoodItems)
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  const [newItem, setNewItem] = useState({
    name: "",
    description: "",
    quantity: "",
    originalPrice: "",
    category: "",
    expiryHours: "",
  })

  // Calculate weekly totals
  const weeklyTotals = weeklyAnalytics.reduce(
    (acc, day) => ({
      totalItems: acc.totalItems + day.total_food_logged,
      totalSold: acc.totalSold + day.total_food_sold,
      totalDonated: acc.totalDonated + day.total_food_donated,
      totalRevenue: acc.totalRevenue + day.revenue_generated,
      totalMeals: acc.totalMeals + day.meals_provided,
    }),
    { totalItems: 0, totalSold: 0, totalDonated: 0, totalRevenue: 0, totalMeals: 0 },
  )

  const wasteReductionRate =
    weeklyTotals.totalItems > 0
      ? Math.round(((weeklyTotals.totalSold + weeklyTotals.totalDonated) / weeklyTotals.totalItems) * 100)
      : 0

  const handleAddItem = async () => {
    if (!newItem.name || !newItem.quantity || !newItem.originalPrice || !profile.canteen_id) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      })
      return
    }

    setLoading(true)
    try {
      // Calculate expiry time
      const expiryTime = new Date()
      expiryTime.setHours(expiryTime.getHours() + Number.parseInt(newItem.expiryHours))

      const { data, error } = await supabase
        .from("food_items")
        .insert({
          canteen_id: profile.canteen_id,
          staff_id: profile.id,
          name: newItem.name,
          description: newItem.description || null,
          category: newItem.category,
          quantity: Number.parseInt(newItem.quantity),
          original_price: Number.parseFloat(newItem.originalPrice),
          expiry_time: expiryTime.toISOString(),
          status: "available",
        })
        .select(`
          *,
          canteens(name, location)
        `)
        .single()

      if (error) throw error

      setFoodItems([data, ...foodItems])
      setNewItem({
        name: "",
        description: "",
        quantity: "",
        originalPrice: "",
        category: "",
        expiryHours: "",
      })

      toast({
        title: "Success",
        description: "Surplus item added successfully",
      })
    } catch (error) {
      console.error("Error adding item:", error)
      toast({
        title: "Error",
        description: "Failed to add surplus item",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleCreateFlashSale = async (itemId: string, discountPercentage = 40) => {
    setLoading(true)
    try {
      // Call the create_flash_sale function
      const { data, error } = await supabase.rpc("create_flash_sale", {
        item_id: itemId,
        discount_percent: discountPercentage,
        duration_minutes: 120, // 2 hours
      })

      if (error) throw error

      // Refresh food items
      const { data: updatedItems } = await supabase
        .from("food_items")
        .select(`
          *,
          canteens(name, location),
          flash_sales(*)
        `)
        .eq("staff_id", profile.id)
        .gte("created_at", new Date().toISOString().split("T")[0])
        .order("created_at", { ascending: false })

      setFoodItems(updatedItems || [])

      toast({
        title: "Success",
        description: "Flash sale created successfully",
      })
    } catch (error) {
      console.error("Error creating flash sale:", error)
      toast({
        title: "Error",
        description: "Failed to create flash sale",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleStatusChange = async (itemId: string, status: string) => {
    setLoading(true)
    try {
      const { error } = await supabase.from("food_items").update({ status }).eq("id", itemId)

      if (error) throw error

      setFoodItems(foodItems.map((item) => (item.id === itemId ? { ...item, status: status as any } : item)))

      toast({
        title: "Success",
        description: `Item status updated to ${status}`,
      })
    } catch (error) {
      console.error("Error updating status:", error)
      toast({
        title: "Error",
        description: "Failed to update item status",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "flash_sale":
        return <Badge className="bg-primary/10 text-primary">Flash Sale</Badge>
      case "donated":
        return <Badge className="bg-chart-2/10 text-chart-2">Donated</Badge>
      case "available":
        return <Badge variant="outline">Available</Badge>
      case "claimed":
        return <Badge className="bg-chart-1/10 text-chart-1">Claimed</Badge>
      case "expired":
        return <Badge variant="destructive">Expired</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  const getTimeRemaining = (expiryTime: string) => {
    const now = new Date()
    const expiry = new Date(expiryTime)
    const diffMs = expiry.getTime() - now.getTime()

    if (diffMs <= 0) return "Expired"

    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60))

    if (diffHours > 0) {
      return `${diffHours}h ${diffMinutes}m`
    }
    return `${diffMinutes}m`
  }

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
                <Leaf className="h-6 w-6 text-primary" />
                <span className="text-lg font-heading font-bold">Staff Dashboard</span>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Badge variant="outline" className="bg-primary/10 text-primary">
                {canteen?.name || "Unknown Canteen"}
              </Badge>
              <span className="text-sm text-muted-foreground">Staff: {profile.full_name || "Unknown"}</span>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                  <Package className="h-5 w-5 text-primary" />
                </div>
                <TrendingUp className="h-4 w-4 text-chart-1" />
              </div>
              <CardTitle className="text-2xl font-bold">{todayAnalytics?.total_food_logged || 0}</CardTitle>
              <CardDescription>Items Logged Today</CardDescription>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 bg-chart-2/10 rounded-full flex items-center justify-center">
                  <TrendingUp className="h-5 w-5 text-chart-2" />
                </div>
                <TrendingUp className="h-4 w-4 text-chart-1" />
              </div>
              <CardTitle className="text-2xl font-bold">
                {foodItems.filter((item) => item.status === "flash_sale").length}
              </CardTitle>
              <CardDescription>Flash Sales Active</CardDescription>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 bg-chart-3/10 rounded-full flex items-center justify-center">
                  <Heart className="h-5 w-5 text-chart-3" />
                </div>
                <TrendingUp className="h-4 w-4 text-chart-1" />
              </div>
              <CardTitle className="text-2xl font-bold">{todayAnalytics?.total_food_donated || 0}</CardTitle>
              <CardDescription>Donations Coordinated</CardDescription>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 bg-chart-4/10 rounded-full flex items-center justify-center">
                  <Users className="h-5 w-5 text-chart-4" />
                </div>
                <TrendingUp className="h-4 w-4 text-chart-1" />
              </div>
              <CardTitle className="text-2xl font-bold">{todayAnalytics?.meals_provided || 0}</CardTitle>
              <CardDescription>Students Served</CardDescription>
            </CardHeader>
          </Card>
        </div>

        <Tabs defaultValue="log-surplus" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="log-surplus">Log Surplus</TabsTrigger>
            <TabsTrigger value="manage-items">Manage Items</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          {/* Log Surplus Tab */}
          <TabsContent value="log-surplus" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Plus className="h-5 w-5" />
                  Log New Surplus Item
                </CardTitle>
                <CardDescription>Add surplus food items to the system for flash sales or donations</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="item-name">Item Name *</Label>
                    <Input
                      id="item-name"
                      placeholder="e.g., Chicken Biryani"
                      value={newItem.name}
                      onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="quantity">Quantity *</Label>
                    <Input
                      id="quantity"
                      type="number"
                      placeholder="e.g., 15"
                      value={newItem.quantity}
                      onChange={(e) => setNewItem({ ...newItem, quantity: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="original-price">Original Price (₹) *</Label>
                    <Input
                      id="original-price"
                      type="number"
                      step="0.01"
                      placeholder="e.g., 120"
                      value={newItem.originalPrice}
                      onChange={(e) => setNewItem({ ...newItem, originalPrice: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="category">Category *</Label>
                    <Select
                      value={newItem.category}
                      onValueChange={(value) => setNewItem({ ...newItem, category: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Main Course">Main Course</SelectItem>
                        <SelectItem value="Snacks">Snacks</SelectItem>
                        <SelectItem value="Beverages">Beverages</SelectItem>
                        <SelectItem value="Desserts">Desserts</SelectItem>
                        <SelectItem value="Breakfast">Breakfast</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="expiry-hours">Hours Until Expiry *</Label>
                    <Select
                      value={newItem.expiryHours}
                      onValueChange={(value) => setNewItem({ ...newItem, expiryHours: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select hours" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">1 hour</SelectItem>
                        <SelectItem value="2">2 hours</SelectItem>
                        <SelectItem value="3">3 hours</SelectItem>
                        <SelectItem value="4">4 hours</SelectItem>
                        <SelectItem value="6">6 hours</SelectItem>
                        <SelectItem value="8">8 hours</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="description">Description (Optional)</Label>
                    <Input
                      id="description"
                      placeholder="e.g., Spicy chicken with basmati rice"
                      value={newItem.description}
                      onChange={(e) => setNewItem({ ...newItem, description: e.target.value })}
                    />
                  </div>
                </div>
                <Button onClick={handleAddItem} disabled={loading} className="w-full md:w-auto">
                  <Plus className="h-4 w-4 mr-2" />
                  {loading ? "Adding..." : "Add Surplus Item"}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Manage Items Tab */}
          <TabsContent value="manage-items" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Current Surplus Items</CardTitle>
                <CardDescription>Manage and track all surplus food items in the system</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {foodItems.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      No surplus items logged today. Start by adding some items in the "Log Surplus" tab.
                    </div>
                  ) : (
                    foodItems.map((item) => (
                      <Card key={item.id} className="border-l-4 border-l-primary/50">
                        <CardContent className="pt-6">
                          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <h3 className="font-semibold text-lg">{item.name}</h3>
                                {getStatusBadge(item.status)}
                              </div>
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-muted-foreground">
                                <div>
                                  <span className="font-medium">Quantity:</span> {item.quantity}
                                </div>
                                <div>
                                  <span className="font-medium">Original:</span> ₹{item.original_price}
                                </div>
                                <div>
                                  <span className="font-medium">Discounted:</span> ₹{item.discounted_price || "N/A"}
                                </div>
                                <div className="flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  <span>{getTimeRemaining(item.expiry_time)}</span>
                                </div>
                              </div>
                              <div className="mt-2 text-sm text-muted-foreground">
                                <span className="font-medium">Category:</span> {item.category}
                                {item.description && (
                                  <>
                                    {" • "}
                                    <span className="font-medium">Description:</span> {item.description}
                                  </>
                                )}
                              </div>
                            </div>
                            <div className="flex gap-2">
                              {item.status === "available" && (
                                <>
                                  <Button
                                    size="sm"
                                    onClick={() => handleCreateFlashSale(item.id)}
                                    disabled={loading}
                                    className="bg-primary hover:bg-primary/90"
                                  >
                                    Flash Sale
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleStatusChange(item.id, "donated")}
                                    disabled={loading}
                                    className="border-chart-2 text-chart-2 hover:bg-chart-2/10"
                                  >
                                    Donate
                                  </Button>
                                </>
                              )}
                              {(item.status === "flash_sale" || item.status === "donated") && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleStatusChange(item.id, "claimed")}
                                  disabled={loading}
                                  className="border-chart-1 text-chart-1 hover:bg-chart-1/10"
                                >
                                  <CheckCircle className="h-4 w-4 mr-1" />
                                  Complete
                                </Button>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Today's Performance</CardTitle>
                  <CardDescription>Real-time metrics for today</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Items Logged</span>
                    <span className="text-2xl font-bold text-primary">{todayAnalytics?.total_food_logged || 0}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Flash Sales</span>
                    <span className="text-2xl font-bold text-chart-2">
                      {foodItems.filter((item) => item.status === "flash_sale").length}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Donations</span>
                    <span className="text-2xl font-bold text-chart-3">{todayAnalytics?.total_food_donated || 0}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Revenue Generated</span>
                    <span className="text-2xl font-bold text-chart-4">₹{todayAnalytics?.revenue_generated || 0}</span>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Weekly Trends</CardTitle>
                  <CardDescription>Performance over the last 7 days</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Total Items</span>
                    <span className="text-2xl font-bold text-primary">{weeklyTotals.totalItems}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Waste Reduced</span>
                    <span className="text-2xl font-bold text-chart-1">{wasteReductionRate}%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Students Served</span>
                    <span className="text-2xl font-bold text-chart-2">{weeklyTotals.totalMeals}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Total Revenue</span>
                    <span className="text-2xl font-bold text-chart-3">₹{weeklyTotals.totalRevenue}</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
