"use client"

import { useEffect, useMemo, useState } from "react"
import { AdminLayout } from "@/components/admin-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { BarChart3, Save, Download } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:5000"

// --- Types
interface PopStudent {
  _id: string
  name?: string
  regNo?: string
}
interface PopClass { _id: string; name?: string }
interface PopTimeslot {
  _id: string
  name?: string
  subject?: string
  label?: string
  startTime?: string
  endTime?: string
}
interface AttendanceDoc {
  _id: string
  date: string
  class?: PopClass
  timeslot?: PopTimeslot
  totalStudents: number
  presentStudents: PopStudent[]
  absentStudents: PopStudent[]
  lateStudents: PopStudent[]
  notes?: string
  createdAt: string
}
type Mark = "present" | "absent" | "late" | "unmarked"

function todayUtc() {
  const d = new Date()
  return new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()))
}

function toYMD(date: Date) {
  const y = date.getUTCFullYear()
  const m = `${date.getUTCMonth() + 1}`.padStart(2, "0")
  const d = `${date.getUTCDate()}`.padStart(2, "0")
  return `${y}-${m}-${d}`
}
function slotText(t?: PopTimeslot) {
  if (!t) return "—"
  if (t.startTime && t.endTime) return `${t.startTime} - ${t.endTime}`
  return t.label || t.name || "—"
}
function subjectText(t?: PopTimeslot) { return t?.subject || t?.name || "—" }
function classText(c?: PopClass) { return c?.name || "—" }

export default function AttendancePage() {
  // ---- Filters
  const [selectedDate, setSelectedDate] = useState<Date>(() => todayUtc())
  const [selectedMonth, setSelectedMonth] = useState<Date>(() => {
    const d = todayUtc()
    return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1))
  })
  const [classId, setClassId] = useState<string>("")
  const [timeslotId, setTimeslotId] = useState<string>("")

  // ---- Dropdown data
  const [classes, setClasses] = useState<PopClass[]>([])
  const [classesLoading, setClassesLoading] = useState(false)
  const [classesError, setClassesError] = useState<string | null>(null)

  const [slots, setSlots] = useState<PopTimeslot[]>([])
  const [slotsLoading, setSlotsLoading] = useState(false)
  const [slotsError, setSlotsError] = useState<string | null>(null)

  // ---- Students & marking
  const [students, setStudents] = useState<PopStudent[]>([])
  const [marks, setMarks] = useState<Record<string, Mark>>({})
  const [notes, setNotes] = useState<string>("")
  const [studentsLoading, setStudentsLoading] = useState(false)
  const [studentsError, setStudentsError] = useState<string | null>(null)

  // ---- Daily & Monthly
  const [dailyRows, setDailyRows] = useState<AttendanceDoc[]>([])
  const [dailyLoading, setDailyLoading] = useState(false)
  const [dailyError, setDailyError] = useState<string | null>(null)

  const [monthlyAgg, setMonthlyAgg] = useState<
    { studentId: string; student: string; regNo: string; present: number; absent: number; late: number; percentage: number }[]
  >([])
  const [monthlyLoading, setMonthlyLoading] = useState(false)
  const [monthlyError, setMonthlyError] = useState<string | null>(null)

  // =========================
  // Fetch CLASSES (dropdown)
  // =========================
  async function fetchClasses() {
    try {
      setClassesLoading(true); setClassesError(null)
      const res = await fetch(`${API_BASE}/api/classes`)
      if (!res.ok) throw new Error(`Failed to fetch classes: ${res.status} ${res.statusText}`)
      const json = await res.json()
      if (!json?.success) throw new Error(json?.message || "Failed to fetch classes")
      const list: PopClass[] = (json.data || []).map((c: any) => ({ _id: c._id, name: c.name }))
      setClasses(list)
      if (classId && !list.find(c => c._id === classId)) {
        setClassId("")
        setTimeslotId("")
        setSlots([])
      }
    } catch (e: any) {
      setClassesError(e?.message || "Failed to fetch classes")
      setClasses([])
    } finally {
      setClassesLoading(false)
    }
  }
  useEffect(() => { fetchClasses() }, [])

  // =========================
  // Fetch TIMESLOTS (dropdown) filtered by class
  // =========================
  async function fetchSlotsForClass(cid: string) {
    if (!cid) { setSlots([]); setSlotsError(null); return }
    try {
      setSlotsLoading(true); setSlotsError(null)
      const res = await fetch(`${API_BASE}/api/timetable-slots?classId=${cid}`)
      if (!res.ok) throw new Error(`Failed to fetch timeslots: ${res.status} ${res.statusText}`)
      const json = await res.json()
      if (!json?.success) throw new Error(json?.message || "Failed to fetch timeslots")
      const list: PopTimeslot[] = (json.data || []).map((t: any) => ({
        _id: t._id,
        name: t.name,
        subject: t.subject?.name || t.subject?.code || t.subject,
        label: t.label,
        startTime: t.startTime,
        endTime: t.endTime,
      }))
      setSlots(list)
      if (timeslotId && !list.find(s => s._id === timeslotId)) setTimeslotId("")
    } catch (e: any) {
      setSlotsError(e?.message || "Failed to fetch timeslots")
      setSlots([])
      setTimeslotId("")
    } finally {
      setSlotsLoading(false)
    }
  }
  useEffect(() => { fetchSlotsForClass(classId) }, [classId])

  // =========================
  // Fetch Students by Class
  // =========================
  async function fetchStudents() {
    if (!classId || classId.trim().length < 8) {
      setStudents([]); setMarks({}); setStudentsError(null); return
    }
    try {
      setStudentsLoading(true)
      setStudentsError(null)
      const res = await fetch(`${API_BASE}/api/students/class/${classId}?limit=500&sortBy=name&sortOrder=asc`)
      if (!res.ok) throw new Error(`Failed to fetch students: ${res.status} ${res.statusText}`)
      const json = await res.json()
      if (!json?.success) throw new Error(json?.message || "Failed to fetch students")
      const list: PopStudent[] = (json.data || []).map((s: any) => ({
        _id: s._id, name: s.name, regNo: s.regNo
      }))
      setStudents(list)
      setMarks({})
    } catch (e: any) {
      setStudentsError(e?.message || "Failed to fetch students")
      setStudents([]); setMarks({})
    } finally {
      setStudentsLoading(false)
    }
  }
  useEffect(() => { fetchStudents() /* eslint-disable-next-line */ }, [classId])

  // =========================
  // Reset form after save
  // =========================
  function resetForm() {
    setClassId("")
    setTimeslotId("")
    setNotes("")
    setMarks({})
    setStudents([])
    setSlots([])
    setSelectedDate(todayUtc())
  }

  // =========================
  // Save Attendance (/api/attendance)
  // =========================
  async function saveAttendance() {
    if (!classId) return alert("Please select a Class.")
    if (!timeslotId) return alert("Please select a Timeslot.")
    if (!selectedDate) return alert("Please pick a valid date.")

    const presentStudents: string[] = []
    const absentStudents: string[] = []
    const lateStudents: string[] = []
    students.forEach((s) => {
      const m = marks[s._id] || "unmarked"
      if (m === "present") presentStudents.push(s._id)
      else if (m === "absent") absentStudents.push(s._id)
      else if (m === "late") lateStudents.push(s._id)
    })

    const all = [...presentStudents, ...absentStudents, ...lateStudents]
    const unique = new Set(all)
    if (unique.size !== all.length) return alert("A student cannot be in multiple buckets.")

    const payload = {
      date: toYMD(selectedDate),
      timeslot: timeslotId,
      class: classId,
      totalStudents: students.length,
      presentStudents,
      absentStudents,
      lateStudents,
      notes: notes?.trim() || undefined,
    }

    try {
      const res = await fetch(`${API_BASE}/api/attendance`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      const json = await res.json()
      if (!res.ok || !json?.success) return alert(json?.message || `Failed to save (${res.status})`)

      alert("Attendance saved.")
      await fetchDaily()
      await fetchMonthly()
      resetForm()
    } catch (e: any) {
      alert(e?.message || "Failed to save attendance")
    }
  }

  // =========================
  // Daily & Monthly (/api/attendance)
  // =========================
  async function fetchDaily() {
    try {
      setDailyLoading(true); setDailyError(null)
      const params = new URLSearchParams()
      params.set("date", toYMD(selectedDate))
      if (classId) params.set("classId", classId)
      if (timeslotId) params.set("timeslotId", timeslotId)

      const res = await fetch(`${API_BASE}/api/attendance?${params.toString()}`)
      if (!res.ok) throw new Error(`Daily fetch failed: ${res.status} ${res.statusText}`)
      const json = await res.json()
      if (!json?.success) throw new Error(json?.message || "Daily fetch failed")
      setDailyRows(json.data as AttendanceDoc[])
    } catch (e: any) {
      setDailyError(e?.message || "Failed to fetch daily summary")
      setDailyRows([])
    } finally {
      setDailyLoading(false)
    }
  }
  useEffect(() => { fetchDaily() /* eslint-disable-next-line */ }, [selectedDate, classId, timeslotId])

  function allMonthDates(baseMonth: Date) {
    const start = new Date(Date.UTC(baseMonth.getUTCFullYear(), baseMonth.getUTCMonth(), 1))
    const next = new Date(Date.UTC(baseMonth.getUTCFullYear(), baseMonth.getUTCMonth() + 1, 1))
    const days: Date[] = []
    for (let d = new Date(start); d < next; d.setUTCDate(d.getUTCDate() + 1)) days.push(new Date(d))
    return days
  }

  async function fetchMonthly() {
    try {
      setMonthlyLoading(true); setMonthlyError(null)
      const days = allMonthDates(selectedMonth)
      const requests = days.map((d) => {
        const params = new URLSearchParams()
        params.set("date", toYMD(d))
        if (classId) params.set("classId", classId)
        if (timeslotId) params.set("timeslotId", timeslotId)
        return fetch(`${API_BASE}/api/attendance?${params.toString()}`).then(async (r) => {
          if (!r.ok) throw new Error(`Monthly fetch failed for ${toYMD(d)}: ${r.status}`)
          const j = await r.json()
          if (!j?.success) throw new Error(j?.message || `Monthly fetch failed for ${toYMD(d)}`)
          return j.data as AttendanceDoc[]
        })
      })
      const perDay = await Promise.all(requests)
      const allDocs = perDay.flat()

      type Row = { name: string; regNo: string; present: number; absent: number; late: number }
      const byStudent = new Map<string, Row>()

      for (const doc of allDocs) {
        for (const s of doc.presentStudents || []) {
          const key = (s as any)._id
          const row = byStudent.get(key) || { name: (s as any).name || "—", regNo: (s as any).regNo || "—", present: 0, absent: 0, late: 0 }
          row.present += 1; byStudent.set(key, row)
        }
        for (const s of doc.absentStudents || []) {
          const key = (s as any)._id
          const row = byStudent.get(key) || { name: (s as any).name || "—", regNo: (s as any).regNo || "—", present: 0, absent: 0, late: 0 }
          row.absent += 1; byStudent.set(key, row)
        }
        for (const s of doc.lateStudents || []) {
          const key = (s as any)._id
          const row = byStudent.get(key) || { name: (s as any).name || "—", regNo: (s as any).regNo || "—", present: 0, absent: 0, late: 0 }
          row.late += 1; byStudent.set(key, row)
        }
      }

      const rows = Array.from(byStudent.entries()).map(([studentId, r]) => {
        const totalMarks = r.present + r.absent + r.late
        const percentage = totalMarks > 0 ? Math.round((r.present / totalMarks) * 100) : 0
        return { studentId, student: r.name, regNo: r.regNo, present: r.present, absent: r.absent, late: r.late, percentage }
      })
      rows.sort((a, b) => a.student.localeCompare(b.student))
      setMonthlyAgg(rows)
    } catch (e: any) {
      setMonthlyError(e?.message || "Failed to fetch monthly report")
      setMonthlyAgg([])
    } finally {
      setMonthlyLoading(false)
    }
  }
  useEffect(() => { fetchMonthly() /* eslint-disable-next-line */ }, [selectedMonth, classId, timeslotId])

  const todayLabel = useMemo(() => selectedDate.toISOString().slice(0, 10), [selectedDate])
  const monthLabel = useMemo(() => {
    const y = selectedMonth.getUTCFullYear()
    const m = selectedMonth.toLocaleString("en-US", { month: "long", timeZone: "UTC" })
    return `${m} ${y}`
  }, [selectedMonth])

  function setMark(studentId: string, mark: Mark) {
    setMarks((prev) => ({ ...prev, [studentId]: mark }))
  }

  const totals = useMemo(() => {
    let present = 0, absent = 0, late = 0, unmarked = 0
    students.forEach(s => {
      const m = marks[s._id] || "unmarked"
      if (m === "present") present++
      else if (m === "absent") absent++
      else if (m === "late") late++
      else unmarked++
    })
    return { present, absent, late, unmarked, total: students.length }
  }, [students, marks])

  return (
    <AdminLayout>
      <div className="flex items-center gap-3">
        <h1 className="text-lg font-semibold md:text-2xl">Attendance Management</h1>
      </div>

      <Tabs defaultValue="marking" className="space-y-4">
        <TabsList>
          <TabsTrigger value="marking">Daily Marking</TabsTrigger>
          <TabsTrigger value="reports">Reports &amp; Analytics</TabsTrigger>
        </TabsList>

        {/* ======================== MARKING TAB ======================== */}
        <TabsContent value="marking" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Select Filters</CardTitle>
              <CardDescription>Choose Class, Timeslot and Date to mark attendance</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3 md:grid-cols-4">
              {/* CLASS DROPDOWN */}
              <div className="space-y-1">
                <label className="text-sm font-medium">Class</label>
                <Select
                  value={classId}
                  onValueChange={(v) => setClassId(v)}
                  disabled={classesLoading}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={classesLoading ? "Loading classes..." : "Select class"} />
                  </SelectTrigger>
                  <SelectContent>
                    {classesError && <div className="px-3 py-2 text-sm text-destructive">{classesError}</div>}
                    {classes.map((c) => (
                      <SelectItem key={c._id} value={c._id}>
                        {c.name || c._id}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* TIMESLOT DROPDOWN */}
              <div className="space-y-1">
                <label className="text-sm font-medium">Timeslot</label>
                <Select
                  value={timeslotId}
                  onValueChange={(v) => setTimeslotId(v)}
                  disabled={!classId || slotsLoading || slots.length === 0}
                >
                  <SelectTrigger>
                    <SelectValue
                      placeholder={
                        !classId
                          ? "Select class first"
                          : slotsLoading
                            ? "Loading timeslots..."
                            : (slots.length ? "Select timeslot" : "No timeslots")
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {slotsError && <div className="px-3 py-2 text-sm text-destructive">{slotsError}</div>}
                    {slots.map((t) => (
                      <SelectItem key={t._id} value={t._id}>
                        {slotText(t)} • {subjectText(t)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* DATE */}
              <div className="space-y-1">
                <label className="text-sm font-medium">Date (UTC)</label>
                <Input
                  type="date"
                  value={toYMD(selectedDate)}
                  onChange={(e) => {
                    const [y, m, d] = e.target.value.split("-").map(Number)
                    if (!y || !m || !d) return
                    setSelectedDate(new Date(Date.UTC(y, m - 1, d)))
                  }}
                />
              </div>

              {/* NOTES */}
              <div className="space-y-1 md:col-span-1">
                <label className="text-sm font-medium">Notes (optional)</label>
                <Textarea placeholder="Any notes for this attendance record" value={notes} onChange={(e) => setNotes(e.target.value)} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Mark Attendance</CardTitle>
                  <CardDescription>
                    {studentsLoading ? "Loading students..." : `Total students: ${students.length}`}
                    {studentsError ? <span className="text-destructive"> • {studentsError}</span> : null}
                  </CardDescription>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-sm">
                    <Badge className="mr-1">Present: {totals.present}</Badge>
                    <Badge variant="destructive" className="mr-1">Absent: {totals.absent}</Badge>
                    <Badge variant="secondary" className="mr-1">Late: {totals.late}</Badge>
                    <Badge variant="outline">Unmarked: {totals.unmarked}</Badge>
                  </div>
                  <Button onClick={saveAttendance} disabled={!classId || !timeslotId || studentsLoading} className="gap-2">
                    <Save className="h-4 w-4" /> Save Attendance
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead style={{ width: 240 }}>Student</TableHead>
                      <TableHead>Reg No</TableHead>
                      <TableHead className="text-center">Present</TableHead>
                      <TableHead className="text-center">Absent</TableHead>
                      <TableHead className="text-center">Late</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {studentsLoading ? (
                      <TableRow>
                        <TableCell colSpan={5} className="py-8 text-center text-muted-foreground">
                          Loading students by class…
                        </TableCell>
                      </TableRow>
                    ) : students.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="py-8 text-center text-muted-foreground">
                          {classId ? "No students found for this class." : "Select a Class to load students."}
                        </TableCell>
                      </TableRow>
                    ) : (
                      students.map((s) => {
                        const value = marks[s._id] || "unmarked"
                        return (
                          <TableRow key={s._id}>
                            <TableCell className="font-medium">{s.name || "—"}</TableCell>
                            <TableCell>{s.regNo || "—"}</TableCell>
                            <TableCell className="text-center">
                              <input
                                type="radio"
                                name={`mark-${s._id}`}
                                checked={value === "present"}
                                onChange={() => setMark(s._id, value === "present" ? "unmarked" : "present")}
                                aria-label="Present"
                              />
                            </TableCell>
                            <TableCell className="text-center">
                              <input
                                type="radio"
                                name={`mark-${s._id}`}
                                checked={value === "absent"}
                                onChange={() => setMark(s._id, value === "absent" ? "unmarked" : "absent")}
                                aria-label="Absent"
                              />
                            </TableCell>
                            <TableCell className="text-center">
                              <input
                                type="radio"
                                name={`mark-${s._id}`}
                                checked={value === "late"}
                                onChange={() => setMark(s._id, value === "late" ? "unmarked" : "late")}
                                aria-label="Late"
                              />
                            </TableCell>
                          </TableRow>
                        )
                      })
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ======================== REPORTS TAB ======================== */}
        <TabsContent value="reports" className="space-y-6">
          {/* Daily Summary */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Daily Summary</CardTitle>
                  <CardDescription>
                    Attendance for <span className="font-medium">{todayLabel}</span>
                    {classId ? <> • Class: <span className="font-medium">{classId}</span></> : null}
                    {timeslotId ? <> • Slot: <span className="font-medium">{timeslotId}</span></> : null}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {dailyError && (
                <div className="mb-3 rounded-md bg-destructive/15 p-3 text-sm text-destructive">
                  <strong>Error:</strong> {dailyError}
                </div>
              )}
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Slot</TableHead>
                      <TableHead>Subject</TableHead>
                      <TableHead>Class</TableHead>
                      <TableHead>Present</TableHead>
                      <TableHead>Absent</TableHead>
                      <TableHead>Late</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {dailyLoading ? (
                      <TableRow>
                        <TableCell colSpan={6} className="py-8 text-center text-muted-foreground">
                          Loading daily summary…
                        </TableCell>
                      </TableRow>
                    ) : dailyRows.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="py-8 text-center text-muted-foreground">
                          No attendance records for this date.
                        </TableCell>
                      </TableRow>
                    ) : (
                      dailyRows.map((doc) => (
                        <TableRow key={doc._id}>
                          <TableCell className="font-medium">{slotText(doc.timeslot)}</TableCell>
                          <TableCell>{subjectText(doc.timeslot)}</TableCell>
                          <TableCell>{classText(doc.class)}</TableCell>
                          <TableCell><Badge variant="default">{doc.presentStudents?.length ?? 0}</Badge></TableCell>
                          <TableCell><Badge variant="destructive">{doc.absentStudents?.length ?? 0}</Badge></TableCell>
                          <TableCell><Badge variant="secondary">{doc.lateStudents?.length ?? 0}</Badge></TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Stats</CardTitle>
              <CardDescription>Overall attendance statistics (today)</CardDescription>
            </CardHeader>
            <CardContent>
              {dailyRows.length === 0 ? (
                <div className="text-sm text-muted-foreground">No data to summarize.</div>
              ) : (
                <div className="space-y-4">
                  {(() => {
                    const present = dailyRows.reduce((acc, d) => acc + (d.presentStudents?.length || 0), 0)
                    const absent  = dailyRows.reduce((acc, d) => acc + (d.absentStudents?.length || 0), 0)
                    const late    = dailyRows.reduce((acc, d) => acc + (d.lateStudents?.length || 0), 0)
                    const totalMarks = present + absent + late
                    const avg = totalMarks ? Math.round((present / totalMarks) * 100) : 0
                    return (
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="text-center">
                            <div className="text-2xl font-bold text-green-600">{avg}%</div>
                            <div className="text-xs text-muted-foreground">Average Attendance</div>
                          </div>
                          <div className="text-center">
                            <div className="text-2xl font-bold text-blue-600">
                              {dailyRows.reduce((acc, d) => Math.max(acc, d.totalStudents || 0), 0)}
                            </div>
                            <div className="text-xs text-muted-foreground">Max Class Size</div>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span>Present Today:</span>
                            <span className="font-medium text-green-600">{present}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span>Absent Today:</span>
                            <span className="font-medium text-red-600">{absent}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span>Late Today:</span>
                            <span className="font-medium text-orange-600">{late}</span>
                          </div>
                        </div>

                        <Button className="w-full gap-2">
                          <BarChart3 className="h-4 w-4" />
                          View Detailed Analytics
                        </Button>
                      </div>
                    )
                  })()}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Monthly Student Report */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Monthly Student Report</CardTitle>
                  <CardDescription>
                    Individual attendance for <span className="font-medium">{monthLabel}</span>
                    {classId ? <> • Class: <span className="font-medium">{classId}</span></> : null}
                    {timeslotId ? <> • Slot: <span className="font-medium">{timeslotId}</span></> : null}
                  </CardDescription>
                </div>
                {/* Export PDF button (restored) */}
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-2 bg-transparent"
                    onClick={fetchMonthly}
                    disabled={monthlyLoading}
                  >
                    <Download className="h-4 w-4" />
                    Export PDF
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {monthlyError && (
                <div className="mb-3 rounded-md bg-destructive/15 p-3 text-sm text-destructive">
                  <strong>Error:</strong> {monthlyError}
                </div>
              )}
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Student</TableHead>
                      <TableHead>Reg No</TableHead>
                      <TableHead>Present</TableHead>
                      <TableHead>Absent</TableHead>
                      <TableHead>Late</TableHead>
                      <TableHead>Percentage</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {monthlyLoading ? (
                      <TableRow>
                        <TableCell colSpan={6} className="py-8 text-center text-muted-foreground">
                          Building monthly report…
                        </TableCell>
                      </TableRow>
                    ) : monthlyAgg.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="py-8 text-center text-muted-foreground">
                          No data for this month.
                        </TableCell>
                      </TableRow>
                    ) : (
                      monthlyAgg.map((s) => (
                        <TableRow key={s.studentId}>
                          <TableCell className="font-medium">{s.student}</TableCell>
                          <TableCell>{s.regNo}</TableCell>
                          <TableCell><Badge variant="default">{s.present}</Badge></TableCell>
                          <TableCell><Badge variant="destructive">{s.absent}</Badge></TableCell>
                          <TableCell><Badge variant="secondary">{s.late}</Badge></TableCell>
                          <TableCell>
                            <Badge variant={s.percentage >= 90 ? "default" : s.percentage >= 75 ? "secondary" : "destructive"}>
                              {s.percentage}%
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </AdminLayout>
  )
}
