"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { CalendarIcon, Save, Copy, Download, Users } from "lucide-react"
import { cn } from "@/lib/utils"
import { format } from "date-fns"
import { toast } from "@/hooks/use-toast"

const mockStudents = [
  { id: "1", regNo: "ST2024001", name: "John Doe", class: "Grade 10-A" },
  { id: "2", regNo: "ST2024002", name: "Sarah Wilson", class: "Grade 10-A" },
  { id: "3", regNo: "ST2024003", name: "Michael Brown", class: "Grade 10-A" },
  { id: "4", regNo: "ST2024004", name: "Emily Davis", class: "Grade 10-A" },
  { id: "5", regNo: "ST2024005", name: "David Johnson", class: "Grade 10-A" },
]

const mockSlots = [
  { id: "1", time: "09:00 - 10:00", subject: "Mathematics", room: "Room 101" },
  { id: "2", time: "10:15 - 11:15", subject: "Physics", room: "Lab 1" },
  { id: "3", time: "11:30 - 12:30", subject: "English", room: "Room 203" },
]

type AttendanceStatus = "present" | "absent" | "late"

interface AttendanceRecord {
  studentId: string
  status: AttendanceStatus
  notes: string
}

export function AttendanceMarking() {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [selectedSlot, setSelectedSlot] = useState("")
  const [selectedClass, setSelectedClass] = useState("")
  const [attendance, setAttendance] = useState<Record<string, AttendanceRecord>>({})
  const [isSaving, setIsSaving] = useState(false)

  const handleStatusChange = (studentId: string, status: AttendanceStatus) => {
    setAttendance((prev) => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        studentId,
        status,
        notes: prev[studentId]?.notes || "",
      },
    }))
  }

  const handleNotesChange = (studentId: string, notes: string) => {
    setAttendance((prev) => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        studentId,
        status: prev[studentId]?.status || "present",
        notes,
      },
    }))
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000))
      toast({
        title: "Attendance Saved",
        description: "Attendance has been recorded successfully.",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save attendance. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleCopyPrevious = () => {
    // Mock copying previous day's attendance
    const mockPreviousAttendance: Record<string, AttendanceRecord> = {}
    mockStudents.forEach((student) => {
      mockPreviousAttendance[student.id] = {
        studentId: student.id,
        status: "present",
        notes: "",
      }
    })
    setAttendance(mockPreviousAttendance)
    toast({
      title: "Previous Day Copied",
      description: "Attendance from previous day has been copied.",
    })
  }

  const getStatusCounts = () => {
    const counts = { present: 0, absent: 0, late: 0, total: mockStudents.length }
    Object.values(attendance).forEach((record) => {
      counts[record.status]++
    })
    return counts
  }

  const statusCounts = getStatusCounts()

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Mark Attendance</CardTitle>
          <CardDescription>Record daily attendance for students</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <div className="space-y-2">
              <Label>Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !selectedDate && "text-muted-foreground",
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {selectedDate ? format(selectedDate, "PPP") : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar mode="single" required={true} selected={selectedDate} onSelect={setSelectedDate} initialFocus />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label>Time Slot</Label>
              <Select value={selectedSlot} onValueChange={setSelectedSlot}>
                <SelectTrigger>
                  <SelectValue placeholder="Select slot" />
                </SelectTrigger>
                <SelectContent>
                  {mockSlots.map((slot) => (
                    <SelectItem key={slot.id} value={slot.id}>
                      {slot.time} - {slot.subject}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Class</Label>
              <Select value={selectedClass} onValueChange={setSelectedClass}>
                <SelectTrigger>
                  <SelectValue placeholder="Select class" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="grade-10-a">Grade 10-A</SelectItem>
                  <SelectItem value="grade-10-b">Grade 10-B</SelectItem>
                  <SelectItem value="grade-11-a">Grade 11-A</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-end gap-2">
              <Button onClick={handleCopyPrevious} variant="outline" className="gap-2 bg-transparent">
                <Copy className="h-4 w-4" />
                Copy Previous
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-4">
        <div className="lg:col-span-3">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Student Attendance</CardTitle>
                  <CardDescription>Mark attendance for each student</CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">{mockStudents.length} students</span>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {mockStudents.map((student) => {
                  const record = attendance[student.id]
                  return (
                    <div key={student.id} className="rounded-lg border p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="font-medium">{student.name}</div>
                          <div className="text-sm text-muted-foreground">
                            {student.regNo} • {student.class}
                          </div>
                        </div>

                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant={record?.status === "present" ? "default" : "outline"}
                            onClick={() => handleStatusChange(student.id, "present")}
                          >
                            Present
                          </Button>
                          <Button
                            size="sm"
                            variant={record?.status === "absent" ? "destructive" : "outline"}
                            onClick={() => handleStatusChange(student.id, "absent")}
                          >
                            Absent
                          </Button>
                          <Button
                            size="sm"
                            variant={record?.status === "late" ? "secondary" : "outline"}
                            onClick={() => handleStatusChange(student.id, "late")}
                          >
                            Late
                          </Button>
                        </div>
                      </div>

                      {record && (
                        <div className="mt-3">
                          <Textarea
                            placeholder="Add notes (optional)..."
                            value={record.notes}
                            onChange={(e) => handleNotesChange(student.id, e.target.value)}
                            rows={2}
                            className="text-sm"
                          />
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Attendance Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm">Present:</span>
                  <Badge variant="default">{statusCounts.present}</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Absent:</span>
                  <Badge variant="destructive">{statusCounts.absent}</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Late:</span>
                  <Badge variant="secondary">{statusCounts.late}</Badge>
                </div>
                <div className="flex justify-between border-t pt-2">
                  <span className="text-sm font-medium">Total:</span>
                  <Badge variant="outline">{statusCounts.total}</Badge>
                </div>
              </div>

              <div className="space-y-2">
                <Button onClick={handleSave} disabled={isSaving} className="w-full gap-2">
                  <Save className="h-4 w-4" />
                  {isSaving ? "Saving..." : "Save Attendance"}
                </Button>
                <Button variant="outline" className="w-full gap-2 bg-transparent">
                  <Download className="h-4 w-4" />
                  Export Daily Report
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
