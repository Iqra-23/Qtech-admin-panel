import { AdminLayout } from "@/components/admin-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Plus, Edit, Trash2, Save } from "lucide-react"

const mockSessions = [
  { name: "Academic Year 2024-25", startDate: "2024-04-01", endDate: "2025-03-31", status: "Active" },
  { name: "Academic Year 2023-24", startDate: "2023-04-01", endDate: "2024-03-31", status: "Completed" },
  { name: "Summer Session 2024", startDate: "2024-05-01", endDate: "2024-06-30", status: "Completed" },
]

const mockGradingBands = [
  { grade: "A+", minMarks: 90, maxMarks: 100, gpa: 4.0, description: "Outstanding" },
  { grade: "A", minMarks: 80, maxMarks: 89, gpa: 3.7, description: "Excellent" },
  { grade: "B+", minMarks: 70, maxMarks: 79, gpa: 3.3, description: "Very Good" },
  { grade: "B", minMarks: 60, maxMarks: 69, gpa: 3.0, description: "Good" },
  { grade: "C", minMarks: 50, maxMarks: 59, gpa: 2.0, description: "Satisfactory" },
  { grade: "F", minMarks: 0, maxMarks: 49, gpa: 0.0, description: "Fail" },
]

export default function SettingsPage() {
  return (
    <AdminLayout>
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold md:text-2xl">Settings</h1>
        <Button className="gap-2">
          <Save className="h-4 w-4" />
          Save Changes
        </Button>
      </div>

      <Tabs defaultValue="profile" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="profile">School Profile</TabsTrigger>
          <TabsTrigger value="sessions">Academic Sessions</TabsTrigger>
          <TabsTrigger value="grading">Grading Bands</TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
              <CardDescription>Update your school's basic details and contact information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="school-name">School Name</Label>
                  <Input id="school-name" defaultValue="Springfield International School" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="school-code">School Code</Label>
                  <Input id="school-code" defaultValue="SIS2024" />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">Address</Label>
                <Textarea id="address" defaultValue="123 Education Street, Springfield, State 12345" />
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input id="phone" defaultValue="+1 (555) 123-4567" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" defaultValue="admin@springfield-school.edu" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="website">Website</Label>
                  <Input id="website" defaultValue="www.springfield-school.edu" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Academic Configuration</CardTitle>
              <CardDescription>Configure academic year and term settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="academic-year">Current Academic Year</Label>
                  <Select defaultValue="2024-25">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="2024-25">2024-25</SelectItem>
                      <SelectItem value="2023-24">2023-24</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="current-term">Current Term</Label>
                  <Select defaultValue="term1">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="term1">Term 1</SelectItem>
                      <SelectItem value="term2">Term 2</SelectItem>
                      <SelectItem value="term3">Term 3</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="working-days">Working Days per Week</Label>
                  <Select defaultValue="5">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="5">5 Days</SelectItem>
                      <SelectItem value="6">6 Days</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="class-duration">Class Duration (minutes)</Label>
                  <Input id="class-duration" type="number" defaultValue="45" />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sessions" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Academic Sessions</CardTitle>
                  <CardDescription>Manage academic years and session periods</CardDescription>
                </div>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button className="gap-2">
                      <Plus className="h-4 w-4" />
                      Add Session
                    </Button>
                  </DialogTrigger>
                  <DialogContent aria-describedby="session-dialog-description">
                    <DialogHeader>
                      <DialogTitle>Create New Academic Session</DialogTitle>
                      <DialogDescription id="session-dialog-description">
                        Define a new academic session with start and end dates
                      </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="space-y-2">
                        <Label htmlFor="session-name">Session Name</Label>
                        <Input id="session-name" placeholder="e.g., Academic Year 2025-26" />
                      </div>
                      <div className="grid gap-4 grid-cols-2">
                        <div className="space-y-2">
                          <Label htmlFor="start-date">Start Date</Label>
                          <Input id="start-date" type="date" />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="end-date">End Date</Label>
                          <Input id="end-date" type="date" />
                        </div>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button type="submit">Create Session</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Session Name</TableHead>
                    <TableHead>Start Date</TableHead>
                    <TableHead>End Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mockSessions.map((session, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">{session.name}</TableCell>
                      <TableCell>{session.startDate}</TableCell>
                      <TableCell>{session.endDate}</TableCell>
                      <TableCell>
                        <Badge variant={session.status === "Active" ? "default" : "secondary"}>{session.status}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button variant="outline" size="sm" className="h-8 w-8 p-0 bg-transparent">
                            <Edit className="h-3 w-3" />
                          </Button>
                          <Button variant="outline" size="sm" className="h-8 w-8 p-0 text-destructive bg-transparent">
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="grading" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Grading Bands</CardTitle>
                  <CardDescription>Configure grade boundaries and GPA calculations</CardDescription>
                </div>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button className="gap-2">
                      <Plus className="h-4 w-4" />
                      Add Grade
                    </Button>
                  </DialogTrigger>
                  <DialogContent aria-describedby="grade-dialog-description">
                    <DialogHeader>
                      <DialogTitle>Create New Grade Band</DialogTitle>
                      <DialogDescription id="grade-dialog-description">
                        Define a new grading band with marks range and GPA
                      </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="space-y-2">
                        <Label htmlFor="grade-name">Grade</Label>
                        <Input id="grade-name" placeholder="e.g., A+, B, C" />
                      </div>
                      <div className="grid gap-4 grid-cols-2">
                        <div className="space-y-2">
                          <Label htmlFor="min-marks">Minimum Marks</Label>
                          <Input id="min-marks" type="number" placeholder="0" />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="max-marks">Maximum Marks</Label>
                          <Input id="max-marks" type="number" placeholder="100" />
                        </div>
                      </div>
                      <div className="grid gap-4 grid-cols-2">
                        <div className="space-y-2">
                          <Label htmlFor="gpa">GPA</Label>
                          <Input id="gpa" type="number" step="0.1" placeholder="4.0" />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="description">Description</Label>
                          <Input id="description" placeholder="e.g., Outstanding" />
                        </div>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button type="submit">Create Grade Band</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Grade</TableHead>
                    <TableHead>Min Marks</TableHead>
                    <TableHead>Max Marks</TableHead>
                    <TableHead>GPA</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mockGradingBands.map((band, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">{band.grade}</TableCell>
                      <TableCell>{band.minMarks}</TableCell>
                      <TableCell>{band.maxMarks}</TableCell>
                      <TableCell>{band.gpa}</TableCell>
                      <TableCell>{band.description}</TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button variant="outline" size="sm" className="h-8 w-8 p-0 bg-transparent">
                            <Edit className="h-3 w-3" />
                          </Button>
                          <Button variant="outline" size="sm" className="h-8 w-8 p-0 text-destructive bg-transparent">
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </AdminLayout>
  )
}
