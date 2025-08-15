"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Heart, MapPin, Clock, Users, CheckCircle, Calendar, Phone, ArrowLeft, Package, TrendingUp } from "lucide-react"
import Link from "next/link"
import { supabase } from "@/lib/supabase/client"
import { useToast } from "@/hooks/use-toast"

interface Profile {
  id: string
  full_name: string | null
  ngo_id: string | null
  role: string
}

interface NGO {
  id: string
  name: string
  contact_person: string | null
  capacity_per_day: number
}

interface FoodItem {
  id: string
  name: string
  description: string | null
  category: string
  quantity: number
  original_price: number | null
  expiry_time: string
  created_at: string
  canteens?: { name: string; location: string; contact_phone: string | null }
  profiles?: { full_name: string | null; phone: string | null }
}

interface Donation {
  id: string
  food_item_id: string
  quantity: number
  pickup_time: string | null
  status: "pending" | "scheduled" | "picked_up" | "completed"
  notes: string | null
  created_at: string
  updated_at: string
  food_items?: FoodItem
  profiles?: { full_name: string | null }
}

interface WeeklyStats {
  totalDonations: number
  totalPortions: number
  estimatedWeight: number
  peopleFed: number
}

interface VolunteerDashboardClientProps {
  profile: Profile
  ngo: NGO | null
  availableDonations: FoodItem[]
  scheduledDonations: Donation[]
  completedDonations: Donation[]
  weeklyStats: WeeklyStats
}

export default function VolunteerDashboardClient({
  profile,
  ngo,
  availableDonations: initialAvailable,
  scheduledDonations: initialScheduled,
  completedDonations,
  weeklyStats,
}: VolunteerDashboardClientProps) {
  const [availableDonations, setAvailableDonations] = useState<FoodItem[]>(initialAvailable)
  const [scheduledDonations, setScheduledDonations] = useState<Donation[]>(initialScheduled)
  const [selectedDonation, setSelectedDonation] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  const [pickupDetails, setPickupDetails] = useState({
    volunteer: profile.full_name || "",
    pickupTime: "",
    vehicle: "",
    notes: "",
  })

  const handleSchedulePickup = async (foodItemId: string) => {
    if (!pickupDetails.pickupTime || !profile.ngo_id) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      })
      return
    }

    setLoading(true)
    try {
      // Create donation record
      const { data, error } = await supabase
        .from("donations")
        .insert({
          food_item_id: foodItemId,
          ngo_id: profile.ngo_id,
          volunteer_id: profile.id,
          quantity: availableDonations.find((d) => d.id === foodItemId)?.quantity || 1,
          pickup_time: pickupDetails.pickupTime,
          status: "scheduled",
          notes: pickupDetails.notes || null,
        })
        .select(`
          *,
          food_items(
            *,
            canteens(name, location, contact_phone),
            profiles!food_items_staff_id_fkey(full_name, phone)
          ),
          profiles!donations_volunteer_id_fkey(full_name)
        `)
        .single()

      if (error) throw error

      // Remove from available donations
      setAvailableDonations((prev) => prev.filter((d) => d.id !== foodItemId))

      // Add to scheduled donations
      setScheduledDonations((prev) => [data, ...prev])

      setSelectedDonation(null)
      setPickupDetails({
        volunteer: profile.full_name || "",
        pickupTime: "",
        vehicle: "",
        notes: "",
      })

      toast({
        title: "Success",
        description: "Pickup scheduled successfully",
      })
    } catch (error) {
      console.error("Error scheduling pickup:", error)
      toast({
        title: "Error",
        description: "Failed to schedule pickup",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleCompletePickup = async (donationId: string) => {
    setLoading(true)
    try {
      const { error } = await supabase
        .from("donations")
        .update({
          status: "completed",
          updated_at: new Date().toISOString(),
        })
        .eq("id", donationId)

      if (error) throw error

      // Remove from scheduled donations
      setScheduledDonations((prev) => prev.filter((d) => d.id !== donationId))

      toast({
        title: "Success",
        description: "Donation marked as completed",
      })
    } catch (error) {
      console.error("Error completing pickup:", error)
      toast({
        title: "Error",
        description: "Failed to complete pickup",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "available":
        return <Badge className="bg-chart-2/10 text-chart-2">Available</Badge>
      case "pending":
        return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>
      case "scheduled":
        return <Badge className="bg-primary/10 text-primary">Scheduled</Badge>
      case "completed":
        return <Badge className="bg-chart-1/10 text-chart-1">Completed</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  const getTimeRemaining = (expiryTime: string) => {
    const now = new Date()
    const expiry = new Date(expiryTime)
    const diffMs = expiry.getTime() - now.getTime()

    if (diffMs <= 0) return "Expired"

    const hours = Math.floor(diffMs / (1000 * 60 * 60))
    if (hours > 0) {
      return `${hours}h remaining`
    }
    const minutes = Math.floor(diffMs / (1000 * 60))
    return `${minutes}m remaining`
  }

  const formatPickupTime = (pickupTime: string | null) => {
    if (!pickupTime) return "Not scheduled"
    return new Date(pickupTime).toLocaleString()
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
                <Heart className="h-6 w-6 text-primary" />
                <span className="text-lg font-heading font-bold">Volunteer Portal</span>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Badge variant="outline" className="bg-chart-2/10 text-chart-2">
                {ngo?.name || "Unknown NGO"}
              </Badge>
              <span className="text-sm text-muted-foreground">Volunteer: {profile.full_name || "Unknown"}</span>
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
                <div className="w-10 h-10 bg-chart-2/10 rounded-full flex items-center justify-center">
                  <Package className="h-5 w-5 text-chart-2" />
                </div>
                <TrendingUp className="h-4 w-4 text-chart-1" />
              </div>
              <CardTitle className="text-2xl font-bold">{availableDonations.length}</CardTitle>
              <CardDescription>Available Donations</CardDescription>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                  <Clock className="h-5 w-5 text-primary" />
                </div>
                <TrendingUp className="h-4 w-4 text-chart-1" />
              </div>
              <CardTitle className="text-2xl font-bold">{scheduledDonations.length}</CardTitle>
              <CardDescription>Scheduled Pickups</CardDescription>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 bg-chart-1/10 rounded-full flex items-center justify-center">
                  <CheckCircle className="h-5 w-5 text-chart-1" />
                </div>
                <TrendingUp className="h-4 w-4 text-chart-1" />
              </div>
              <CardTitle className="text-2xl font-bold">{weeklyStats.totalDonations}</CardTitle>
              <CardDescription>Completed This Week</CardDescription>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 bg-chart-3/10 rounded-full flex items-center justify-center">
                  <Users className="h-5 w-5 text-chart-3" />
                </div>
                <TrendingUp className="h-4 w-4 text-chart-1" />
              </div>
              <CardTitle className="text-2xl font-bold">{weeklyStats.peopleFed}</CardTitle>
              <CardDescription>People Fed This Week</CardDescription>
            </CardHeader>
          </Card>
        </div>

        <Tabs defaultValue="available" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="available">Available ({availableDonations.length})</TabsTrigger>
            <TabsTrigger value="scheduled">Scheduled ({scheduledDonations.length})</TabsTrigger>
            <TabsTrigger value="completed">Completed</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          {/* Available Donations */}
          <TabsContent value="available" className="space-y-6">
            <div className="space-y-4">
              {availableDonations.map((donation) => (
                <Card key={donation.id} className="border-l-4 border-l-chart-2">
                  <CardHeader>
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-3 mb-2">
                          <CardTitle className="text-xl">{donation.canteens?.name || "Unknown Canteen"}</CardTitle>
                          {getStatusBadge("available")}
                        </div>
                        <div className="flex items-center gap-2 text-muted-foreground mb-2">
                          <MapPin className="h-4 w-4" />
                          <span>{donation.canteens?.location || "Unknown Location"}</span>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            <span>{getTimeRemaining(donation.expiry_time)}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Package className="h-4 w-4" />
                            <span>{donation.quantity} portions</span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-chart-2 mb-1">{donation.quantity}</div>
                        <div className="text-sm text-muted-foreground">Portions Available</div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <h4 className="font-semibold mb-2">Food Item:</h4>
                      <div className="p-3 bg-muted rounded-lg">
                        <div className="flex justify-between items-center">
                          <div>
                            <span className="font-medium">{donation.name}</span>
                            <div className="text-sm text-muted-foreground mt-1">
                              Category: {donation.category}
                              {donation.description && ` • ${donation.description}`}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col md:flex-row gap-4 p-4 bg-muted/50 rounded-lg">
                      <div className="flex-1">
                        <h4 className="font-semibold mb-2">Contact Information:</h4>
                        <div className="space-y-1 text-sm">
                          <div>
                            <span className="font-medium">Staff:</span>{" "}
                            {donation.profiles?.full_name || "Unknown Staff"}
                          </div>
                          {donation.canteens?.contact_phone && (
                            <div className="flex items-center gap-2">
                              <Phone className="h-4 w-4" />
                              <span>{donation.canteens.contact_phone}</span>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          onClick={() => setSelectedDonation(donation.id)}
                          disabled={loading}
                          className="bg-chart-2 hover:bg-chart-2/90"
                        >
                          <Calendar className="h-4 w-4 mr-2" />
                          Schedule Pickup
                        </Button>
                        {donation.canteens?.contact_phone && (
                          <Button variant="outline">
                            <Phone className="h-4 w-4 mr-2" />
                            Call Staff
                          </Button>
                        )}
                      </div>
                    </div>

                    {selectedDonation === donation.id && (
                      <Card className="border-primary/20">
                        <CardHeader>
                          <CardTitle className="text-lg">Schedule Pickup</CardTitle>
                          <CardDescription>Coordinate pickup details for this donation</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label htmlFor="volunteer">Assigned Volunteer</Label>
                              <Input
                                id="volunteer"
                                placeholder="Enter volunteer name"
                                value={pickupDetails.volunteer}
                                onChange={(e) => setPickupDetails({ ...pickupDetails, volunteer: e.target.value })}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="pickup-time">Pickup Time</Label>
                              <Input
                                id="pickup-time"
                                type="datetime-local"
                                value={pickupDetails.pickupTime}
                                onChange={(e) => setPickupDetails({ ...pickupDetails, pickupTime: e.target.value })}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="vehicle">Vehicle Type</Label>
                              <Select
                                value={pickupDetails.vehicle}
                                onValueChange={(value) => setPickupDetails({ ...pickupDetails, vehicle: value })}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Select vehicle" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="bike">Motorcycle</SelectItem>
                                  <SelectItem value="car">Car</SelectItem>
                                  <SelectItem value="van">Van</SelectItem>
                                  <SelectItem value="truck">Small Truck</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="notes">Additional Notes</Label>
                            <Textarea
                              id="notes"
                              placeholder="Any special instructions or notes..."
                              value={pickupDetails.notes}
                              onChange={(e) => setPickupDetails({ ...pickupDetails, notes: e.target.value })}
                            />
                          </div>
                          <div className="flex gap-2">
                            <Button onClick={() => handleSchedulePickup(donation.id)} disabled={loading}>
                              <CheckCircle className="h-4 w-4 mr-2" />
                              {loading ? "Scheduling..." : "Confirm Schedule"}
                            </Button>
                            <Button variant="outline" onClick={() => setSelectedDonation(null)}>
                              Cancel
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>

            {availableDonations.length === 0 && (
              <div className="text-center py-12">
                <Heart className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">No Available Donations</h3>
                <p className="text-muted-foreground">All current donations have been scheduled or completed.</p>
              </div>
            )}
          </TabsContent>

          {/* Scheduled Pickups */}
          <TabsContent value="scheduled" className="space-y-6">
            <div className="space-y-4">
              {scheduledDonations.map((donation) => (
                <Card key={donation.id} className="border-l-4 border-l-primary">
                  <CardHeader>
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-3 mb-2">
                          <CardTitle className="text-xl">
                            {donation.food_items?.canteens?.name || "Unknown Canteen"}
                          </CardTitle>
                          {getStatusBadge(donation.status)}
                        </div>
                        <div className="flex items-center gap-2 text-muted-foreground mb-2">
                          <MapPin className="h-4 w-4" />
                          <span>{donation.food_items?.canteens?.location || "Unknown Location"}</span>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            <span>Pickup: {formatPickupTime(donation.pickup_time)}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Users className="h-4 w-4" />
                            <span>{donation.profiles?.full_name || "Unknown Volunteer"}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <div className="text-2xl font-bold text-primary mb-1">{donation.quantity}</div>
                          <div className="text-sm text-muted-foreground">Portions</div>
                        </div>
                        <Button
                          onClick={() => handleCompletePickup(donation.id)}
                          disabled={loading}
                          className="bg-chart-1 hover:bg-chart-1/90"
                        >
                          <CheckCircle className="h-4 w-4 mr-2" />
                          {loading ? "Completing..." : "Mark Complete"}
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  {donation.notes && (
                    <CardContent>
                      <div className="p-3 bg-muted/50 rounded-lg">
                        <h4 className="font-semibold mb-1">Notes:</h4>
                        <p className="text-sm text-muted-foreground">{donation.notes}</p>
                      </div>
                    </CardContent>
                  )}
                </Card>
              ))}
            </div>

            {scheduledDonations.length === 0 && (
              <div className="text-center py-12">
                <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">No Scheduled Pickups</h3>
                <p className="text-muted-foreground">Schedule pickups from the Available tab to see them here.</p>
              </div>
            )}
          </TabsContent>

          {/* Completed Donations */}
          <TabsContent value="completed" className="space-y-6">
            <div className="space-y-4">
              {completedDonations.map((donation) => (
                <Card key={donation.id} className="border-l-4 border-l-chart-1">
                  <CardHeader>
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-3 mb-2">
                          <CardTitle className="text-xl">
                            {donation.food_items?.canteens?.name || "Unknown Canteen"}
                          </CardTitle>
                          {getStatusBadge(donation.status)}
                        </div>
                        <div className="flex items-center gap-2 text-muted-foreground mb-2">
                          <MapPin className="h-4 w-4" />
                          <span>{donation.food_items?.canteens?.location || "Unknown Location"}</span>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <CheckCircle className="h-4 w-4" />
                            <span>Completed: {new Date(donation.updated_at).toLocaleDateString()}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Heart className="h-4 w-4" />
                            <span>{ngo?.name || "Unknown NGO"}</span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-chart-1 mb-1">{donation.quantity}</div>
                        <div className="text-sm text-muted-foreground">Portions Donated</div>
                      </div>
                    </div>
                  </CardHeader>
                </Card>
              ))}
            </div>

            {completedDonations.length === 0 && (
              <div className="text-center py-12">
                <CheckCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">No Completed Donations</h3>
                <p className="text-muted-foreground">Completed donations from this week will appear here.</p>
              </div>
            )}
          </TabsContent>

          {/* Analytics */}
          <TabsContent value="analytics" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Weekly Impact</CardTitle>
                  <CardDescription>Your organization's contribution this week</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Total Donations</span>
                    <span className="text-2xl font-bold text-chart-2">{weeklyStats.totalDonations}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">People Fed</span>
                    <span className="text-2xl font-bold text-chart-1">{weeklyStats.peopleFed}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Food Weight</span>
                    <span className="text-2xl font-bold text-chart-3">{weeklyStats.estimatedWeight.toFixed(1)}kg</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">NGO Capacity</span>
                    <span className="text-2xl font-bold text-primary">{ngo?.capacity_per_day || 0}/day</span>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Organization Details</CardTitle>
                  <CardDescription>NGO information and contact details</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Organization</span>
                    <span className="text-lg font-bold text-chart-2">{ngo?.name || "Unknown"}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Contact Person</span>
                    <span className="text-lg font-bold text-chart-1">{ngo?.contact_person || "Unknown"}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Daily Capacity</span>
                    <span className="text-lg font-bold text-chart-3">{ngo?.capacity_per_day || 0} meals</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Active Volunteer</span>
                    <span className="text-lg font-bold text-primary">{profile.full_name || "Unknown"}</span>
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
