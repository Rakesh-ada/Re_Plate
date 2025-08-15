"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Progress } from "@/components/ui/progress"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
} from "recharts"
import {
  Shield,
  TrendingUp,
  Package,
  Heart,
  DollarSign,
  MapPin,
  ArrowLeft,
  Settings,
  Download,
  AlertTriangle,
  CheckCircle,
} from "lucide-react"
import Link from "next/link"

interface Profile {
  id: string
  full_name: string | null
  role: string
}

interface SystemStats {
  totalUsers: number
  activeCanteens: number
  ngoPartners: number
  totalSurplus: number
  wasteReduction: number
  revenue: number
  peopleFed: number
  usersByRole: Record<string, number>
}

interface DailyMetric {
  day: string
  surplus: number
  flashSales: number
  donations: number
  revenue: number
}

interface CanteenPerformance {
  id: string
  name: string
  location: string
  efficiency: number
  surplus: number
  revenue: number
}

interface CategoryDistribution {
  name: string
  value: number
  color: string
}

interface RecentActivity {
  id: string
  name: string
  status: string
  created_at: string
  canteens?: { name: string }
  profiles?: { full_name: string | null }
  flash_sales?: any[]
  donations?: Array<{ ngos: { name: string } }>
}

interface Canteen {
  id: string
  name: string
  location: string
  contact_email: string | null
  contact_phone: string | null
}

interface NGO {
  id: string
  name: string
  contact_person: string | null
  capacity_per_day: number
}

interface AdminDashboardClientProps {
  profile: Profile
  systemStats: SystemStats
  dailyMetrics: DailyMetric[]
  canteenPerformance: CanteenPerformance[]
  categoryDistribution: CategoryDistribution[]
  recentActivities: RecentActivity[]
  canteens: Canteen[]
  ngos: NGO[]
}

export default function AdminDashboardClient({
  profile,
  systemStats,
  dailyMetrics,
  canteenPerformance,
  categoryDistribution,
  recentActivities,
  canteens,
  ngos,
}: AdminDashboardClientProps) {
  const [timeRange, setTimeRange] = useState("7d")

  const getActivityIcon = (activity: RecentActivity) => {
    if (activity.flash_sales && activity.flash_sales.length > 0) {
      return <Package className="h-4 w-4 text-primary" />
    }
    if (activity.donations && activity.donations.length > 0) {
      return <Heart className="h-4 w-4 text-chart-2" />
    }
    if (activity.status === "expired") {
      return <AlertTriangle className="h-4 w-4 text-destructive" />
    }
    return <CheckCircle className="h-4 w-4 text-chart-1" />
  }

  const getActivityMessage = (activity: RecentActivity) => {
    if (activity.flash_sales && activity.flash_sales.length > 0) {
      return `${activity.canteens?.name || "Unknown Canteen"} created flash sale for ${activity.name}`
    }
    if (activity.donations && activity.donations.length > 0) {
      const ngoName = activity.donations[0]?.ngos?.name || "Unknown NGO"
      return `${ngoName} scheduled pickup for ${activity.name} from ${activity.canteens?.name || "Unknown Canteen"}`
    }
    if (activity.status === "expired") {
      return `${activity.name} from ${activity.canteens?.name || "Unknown Canteen"} expired`
    }
    return `${activity.profiles?.full_name || "Staff"} logged ${activity.name} at ${activity.canteens?.name || "Unknown Canteen"}`
  }

  const getStatusBadge = (activity: RecentActivity) => {
    if (activity.flash_sales && activity.flash_sales.length > 0) {
      return <Badge className="bg-primary/10 text-primary">Flash Sale</Badge>
    }
    if (activity.donations && activity.donations.length > 0) {
      return <Badge className="bg-chart-2/10 text-chart-2">Donation</Badge>
    }
    if (activity.status === "expired") {
      return <Badge variant="destructive">Expired</Badge>
    }
    return <Badge className="bg-chart-1/10 text-chart-1">Active</Badge>
  }

  const getTimeAgo = (dateString: string) => {
    const now = new Date()
    const date = new Date(dateString)
    const diffMs = now.getTime() - date.getTime()
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    const diffMinutes = Math.floor(diffMs / (1000 * 60))

    if (diffHours > 0) {
      return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`
    }
    return `${diffMinutes} minute${diffMinutes > 1 ? "s" : ""} ago`
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
                <Shield className="h-6 w-6 text-primary" />
                <span className="text-lg font-heading font-bold">Admin Dashboard</span>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Select value={timeRange} onValueChange={setTimeRange}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="24h">Last 24h</SelectItem>
                  <SelectItem value="7d">Last 7 days</SelectItem>
                  <SelectItem value="30d">Last 30 days</SelectItem>
                  <SelectItem value="90d">Last 90 days</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
              <Button variant="outline" size="sm">
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                  <Package className="h-5 w-5 text-primary" />
                </div>
                <TrendingUp className="h-4 w-4 text-chart-1" />
              </div>
              <CardTitle className="text-2xl font-bold">{systemStats.totalSurplus.toLocaleString()}</CardTitle>
              <CardDescription>Total Surplus Items</CardDescription>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 bg-chart-1/10 rounded-full flex items-center justify-center">
                  <TrendingUp className="h-5 w-5 text-chart-1" />
                </div>
                <TrendingUp className="h-4 w-4 text-chart-1" />
              </div>
              <CardTitle className="text-2xl font-bold">{systemStats.wasteReduction}%</CardTitle>
              <CardDescription>Waste Reduction</CardDescription>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 bg-chart-2/10 rounded-full flex items-center justify-center">
                  <DollarSign className="h-5 w-5 text-chart-2" />
                </div>
                <TrendingUp className="h-4 w-4 text-chart-1" />
              </div>
              <CardTitle className="text-2xl font-bold">₹{systemStats.revenue.toLocaleString()}</CardTitle>
              <CardDescription>Revenue Generated</CardDescription>
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
              <CardTitle className="text-2xl font-bold">{systemStats.peopleFed.toLocaleString()}</CardTitle>
              <CardDescription>People Fed</CardDescription>
            </CardHeader>
          </Card>
        </div>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="canteens">Canteens</TabsTrigger>
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="reports">Reports</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Daily Metrics Chart */}
              <Card className="col-span-1 lg:col-span-2">
                <CardHeader>
                  <CardTitle>Daily Performance Metrics</CardTitle>
                  <CardDescription>Surplus items, flash sales, and donations over the last 7 days</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={dailyMetrics}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="day" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="surplus" fill="#15803d" name="Surplus Items" />
                      <Bar dataKey="flashSales" fill="#84cc16" name="Flash Sales" />
                      <Bar dataKey="donations" fill="#10b981" name="Donations" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Category Distribution */}
              <Card>
                <CardHeader>
                  <CardTitle>Food Category Distribution</CardTitle>
                  <CardDescription>Breakdown of surplus food by category</CardDescription>
                </CardHeader>
                <CardContent>
                  {categoryDistribution.length > 0 ? (
                    <ResponsiveContainer width="100%" height={250}>
                      <PieChart>
                        <Pie
                          data={categoryDistribution}
                          cx="50%"
                          cy="50%"
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        >
                          {categoryDistribution.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex items-center justify-center h-[250px] text-muted-foreground">
                      No data available
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Recent Activities */}
              <Card>
                <CardHeader>
                  <CardTitle>Recent Activities</CardTitle>
                  <CardDescription>Latest system activities and alerts</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {recentActivities.slice(0, 5).map((activity) => (
                      <div key={activity.id} className="flex items-start gap-3 p-3 rounded-lg border">
                        <div className="mt-0.5">{getActivityIcon(activity)}</div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground">{getActivityMessage(activity)}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs text-muted-foreground">{getTimeAgo(activity.created_at)}</span>
                            {getStatusBadge(activity)}
                          </div>
                        </div>
                      </div>
                    ))}
                    {recentActivities.length === 0 && (
                      <div className="text-center py-8 text-muted-foreground">No recent activities</div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Revenue Trend */}
              <Card className="col-span-1 lg:col-span-2">
                <CardHeader>
                  <CardTitle>Revenue Trend</CardTitle>
                  <CardDescription>Daily revenue from flash sales over the last 7 days</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={dailyMetrics}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="day" />
                      <YAxis />
                      <Tooltip formatter={(value) => [`₹${value}`, "Revenue"]} />
                      <Line type="monotone" dataKey="revenue" stroke="#15803d" strokeWidth={3} />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* System Health */}
              <Card>
                <CardHeader>
                  <CardTitle>System Health</CardTitle>
                  <CardDescription>Overall platform performance metrics</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Waste Reduction Rate</span>
                      <span>{systemStats.wasteReduction}%</span>
                    </div>
                    <Progress value={systemStats.wasteReduction} className="h-2" />
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Active Canteens</span>
                      <span>
                        {Math.round((systemStats.activeCanteens / Math.max(systemStats.activeCanteens, 10)) * 100)}%
                      </span>
                    </div>
                    <Progress
                      value={Math.round((systemStats.activeCanteens / Math.max(systemStats.activeCanteens, 10)) * 100)}
                      className="h-2"
                    />
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>NGO Partnerships</span>
                      <span>
                        {Math.round((systemStats.ngoPartners / Math.max(systemStats.ngoPartners, 20)) * 100)}%
                      </span>
                    </div>
                    <Progress
                      value={Math.round((systemStats.ngoPartners / Math.max(systemStats.ngoPartners, 20)) * 100)}
                      className="h-2"
                    />
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>User Engagement</span>
                      <span>92%</span>
                    </div>
                    <Progress value={92} className="h-2" />
                  </div>
                </CardContent>
              </Card>

              {/* Key Insights */}
              <Card>
                <CardHeader>
                  <CardTitle>Key Insights</CardTitle>
                  <CardDescription>System insights and recommendations</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="p-3 bg-primary/10 rounded-lg border border-primary/20">
                    <div className="flex items-center gap-2 mb-2">
                      <TrendingUp className="h-4 w-4 text-primary" />
                      <span className="font-medium text-primary">System Growth</span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {systemStats.totalUsers} users across {systemStats.activeCanteens} canteens generating impact.
                    </p>
                  </div>
                  <div className="p-3 bg-chart-2/10 rounded-lg border border-chart-2/20">
                    <div className="flex items-center gap-2 mb-2">
                      <Heart className="h-4 w-4 text-chart-2" />
                      <span className="font-medium text-chart-2">Community Impact</span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {systemStats.peopleFed.toLocaleString()} people fed through {systemStats.ngoPartners} NGO
                      partnerships.
                    </p>
                  </div>
                  <div className="p-3 bg-chart-3/10 rounded-lg border border-chart-3/20">
                    <div className="flex items-center gap-2 mb-2">
                      <Package className="h-4 w-4 text-chart-3" />
                      <span className="font-medium text-chart-3">Waste Reduction</span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {systemStats.wasteReduction}% waste reduction rate across all campus locations.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Canteens Tab */}
          <TabsContent value="canteens" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Canteen Performance</CardTitle>
                <CardDescription>Performance metrics for all registered canteens</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {canteenPerformance.map((canteen) => (
                    <Card key={canteen.id} className="border-l-4 border-l-primary/50">
                      <CardContent className="pt-6">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h3 className="font-semibold text-lg">{canteen.name}</h3>
                              <Badge
                                className={
                                  canteen.efficiency >= 90
                                    ? "bg-chart-1/10 text-chart-1"
                                    : canteen.efficiency >= 80
                                      ? "bg-yellow-100 text-yellow-800"
                                      : "bg-destructive/10 text-destructive"
                                }
                              >
                                {canteen.efficiency}% Efficiency
                              </Badge>
                            </div>
                            <div className="text-sm text-muted-foreground mb-2">{canteen.location}</div>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                              <div>
                                <span className="font-medium text-muted-foreground">Surplus Items:</span>
                                <div className="text-lg font-bold text-primary">{canteen.surplus}</div>
                              </div>
                              <div>
                                <span className="font-medium text-muted-foreground">Revenue:</span>
                                <div className="text-lg font-bold text-chart-2">
                                  ₹{canteen.revenue.toLocaleString()}
                                </div>
                              </div>
                              <div>
                                <span className="font-medium text-muted-foreground">Efficiency:</span>
                                <Progress value={canteen.efficiency} className="h-2 mt-1" />
                              </div>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button variant="outline" size="sm">
                              <MapPin className="h-4 w-4 mr-2" />
                              View Details
                            </Button>
                            <Button variant="outline" size="sm">
                              <Settings className="h-4 w-4 mr-2" />
                              Manage
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                  {canteenPerformance.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">No canteen data available</div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Users Tab */}
          <TabsContent value="users" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>User Statistics</CardTitle>
                  <CardDescription>Platform user breakdown</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Total Users</span>
                    <span className="text-2xl font-bold text-primary">{systemStats.totalUsers.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Students</span>
                    <span className="text-lg font-bold text-chart-1">{systemStats.usersByRole.student || 0}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Staff</span>
                    <span className="text-lg font-bold text-chart-2">{systemStats.usersByRole.staff || 0}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Volunteers</span>
                    <span className="text-lg font-bold text-chart-3">{systemStats.usersByRole.volunteer || 0}</span>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Active Canteens</CardTitle>
                  <CardDescription>Registered canteen locations</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Total Canteens</span>
                    <span className="text-2xl font-bold text-primary">{systemStats.activeCanteens}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Active This Week</span>
                    <span className="text-lg font-bold text-chart-1">
                      {Math.max(1, systemStats.activeCanteens - 1)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Avg Efficiency</span>
                    <span className="text-lg font-bold text-chart-2">
                      {canteenPerformance.length > 0
                        ? Math.round(
                            canteenPerformance.reduce((sum, c) => sum + c.efficiency, 0) / canteenPerformance.length,
                          )
                        : 0}
                      %
                    </span>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>NGO Partners</CardTitle>
                  <CardDescription>Registered NGO organizations</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Total NGOs</span>
                    <span className="text-2xl font-bold text-primary">{systemStats.ngoPartners}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Active This Week</span>
                    <span className="text-lg font-bold text-chart-1">{Math.max(1, systemStats.ngoPartners - 3)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Total Capacity</span>
                    <span className="text-lg font-bold text-chart-2">
                      {ngos.reduce((sum, ngo) => sum + ngo.capacity_per_day, 0)}/day
                    </span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Reports Tab */}
          <TabsContent value="reports" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Generate Reports</CardTitle>
                  <CardDescription>Create custom reports for stakeholders</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Button className="w-full justify-start">
                    <Download className="h-4 w-4 mr-2" />
                    Weekly Performance Report
                  </Button>
                  <Button className="w-full justify-start bg-transparent" variant="outline">
                    <Download className="h-4 w-4 mr-2" />
                    Monthly Impact Summary
                  </Button>
                  <Button className="w-full justify-start bg-transparent" variant="outline">
                    <Download className="h-4 w-4 mr-2" />
                    Financial Analytics
                  </Button>
                  <Button className="w-full justify-start bg-transparent" variant="outline">
                    <Download className="h-4 w-4 mr-2" />
                    User Engagement Report
                  </Button>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>System Overview</CardTitle>
                  <CardDescription>Current system status and metrics</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <div className="font-medium">Platform Status</div>
                      <div className="text-sm text-muted-foreground">All systems operational</div>
                    </div>
                    <Badge className="bg-chart-1/10 text-chart-1">Healthy</Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <div className="font-medium">Data Sync</div>
                      <div className="text-sm text-muted-foreground">Last updated: Just now</div>
                    </div>
                    <Badge className="bg-chart-1/10 text-chart-1">Active</Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <div className="font-medium">Backup Status</div>
                      <div className="text-sm text-muted-foreground">Daily backups enabled</div>
                    </div>
                    <Badge className="bg-chart-1/10 text-chart-1">Secure</Badge>
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
