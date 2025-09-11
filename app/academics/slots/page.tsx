"use client";

import React from "react";
import Link from "next/link";
import { AdminLayout } from "@/components/admin-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MoreHorizontal, Plus, Edit, Trash2, UserCheck } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// --- CONFIG ---
const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:5000";
const SLOTS_API = `${API_BASE}/api/timetable-slots`;

// If you need auth headers, add them here (else keep it empty)
function authHeaders(): HeadersInit {
  return {};
}

// --- TYPES mirrored from your backend shape (with populates) ---
type PopulatedRef = { _id: string; name?: string; code?: string };

type ApiSlot = {
  _id: string;
  day: string; // "Monday" | ...
  startTime: string; // "09:00"
  endTime: string;   // "10:00"
  location?: { room?: string; link?: string };
  class: PopulatedRef;           // populated with {name}
  subject: PopulatedRef;         // populated with {name, code}
  instructorName?: string;
  instructorId?: string;
  createdAt?: string;
  updatedAt?: string;
};

// View model for the UI (derives delivery + location text)
type UiSlot = {
  id: string;
  day: string;
  startTime: string;
  endTime: string;
  delivery: "room" | "online";
  locationText: string; // "Room 101" or URL
  className: string;
  course: string;       // subject.name (optionally include code)
  instructor: string;
};

// Normalize API -> UI
function toUiSlot(s: ApiSlot): UiSlot {
  const hasLink = !!s.location?.link;
  const delivery: UiSlot["delivery"] = hasLink ? "online" : "room";
  const locationText = hasLink ? (s.location!.link as string) : (s.location?.room || "—");
  const subjectName = s.subject?.name || "—";
  return {
    id: s._id,
    day: s.day,
    startTime: s.startTime,
    endTime: s.endTime,
    delivery,
    locationText,
    className: s.class?.name || "—",
    course: subjectName,
    instructor: s.instructorName || "—",
  };
}

// Days used in calendar header
const WEEK_DAYS: string[] = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

// Utility: stable sort by "HH:MM"
function sortTimesAsc(times: string[]) {
  const toMin = (t: string) => {
    const [h, m] = t.split(":").map(Number);
    return h * 60 + m;
  };
  return [...times].sort((a, b) => toMin(a) - toMin(b));
}

// ✅ Guard to avoid invalid href on <a>
function isValidHttpUrl(u?: string) {
  if (!u || typeof u !== "string") return false;
  try {
    const x = new URL(u);
    return x.protocol === "http:" || x.protocol === "https:";
  } catch {
    return false;
  }
}

export default function SlotsPage() {
  const [slots, setSlots] = React.useState<UiSlot[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  // Fetch all slots (apply query params here if needed)
  const fetchSlots = React.useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const res = await fetch(SLOTS_API, {
        headers: { "Content-Type": "application/json", ...authHeaders() },
        cache: "no-store",
      });
      if (!res.ok) {
        const t = await res.text();
        throw new Error(`Failed to fetch: ${res.status} ${t}`);
      }
      const json = await res.json();
      // expecting { success: true, data: ApiSlot[] }
      const list: ApiSlot[] = json?.data || [];
      setSlots(list.map(toUiSlot));
    } catch (e: any) {
      setError(e?.message || "Failed to load slots.");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchSlots();
  }, [fetchSlots]);

  const onDelete = async (id: string) => {
    if (!confirm("Delete this slot?")) return;
    try {
      const res = await fetch(`${SLOTS_API}/${id}`, {
        method: "DELETE",
        headers: { ...authHeaders() },
      });
      if (!res.ok) {
        const t = await res.text();
        throw new Error(`Delete failed: ${res.status} ${t}`);
      }
      // Optimistic refresh
      setSlots(prev => prev.filter(s => s.id !== id));
    } catch (e: any) {
      alert(e?.message || "Failed to delete slot.");
    }
  };

  // Build calendar grid from fetched data
  const uniqueStartTimes = React.useMemo(
    () => sortTimesAsc(Array.from(new Set(slots.map(s => s.startTime)))),
    [slots]
  );

  const getSlotForDayAndTime = React.useCallback(
    (day: string, time: string) => slots.find(s => s.day === day && s.startTime === time),
    [slots]
  );

  const todayISO = React.useMemo(() => new Date().toISOString().split("T")[0], []);

  return (
    <AdminLayout>
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold md:text-2xl">Timetables &amp; Slot Management</h1>
        <Link href="/academics/slots/create">
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Add Slot
          </Button>
        </Link>
      </div>

      <Tabs defaultValue="table" className="space-y-4">
        <TabsList>
          <TabsTrigger value="table">Table View</TabsTrigger>
          <TabsTrigger value="calendar">Calendar View</TabsTrigger>
        </TabsList>

        <TabsContent value="table">
          <Card>
            <CardHeader>
              <CardTitle>All Time Slots</CardTitle>
              <CardDescription>Manage teaching slots and timetables</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-sm text-muted-foreground">Loading slots…</div>
              ) : error ? (
                <div className="text-sm text-destructive">Error: {error}</div>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Day</TableHead>
                        <TableHead>Time</TableHead>
                        <TableHead>Location</TableHead>
                        <TableHead>Class</TableHead>
                        <TableHead>Course</TableHead>
                        <TableHead>Instructor</TableHead>
                        <TableHead className="w-[70px]">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {slots.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={7} className="text-center text-sm text-muted-foreground">
                            No slots found.
                          </TableCell>
                        </TableRow>
                      ) : (
                        slots.map((slot) => (
                          <TableRow key={slot.id}>
                            <TableCell className="font-medium">{slot.day}</TableCell>
                            <TableCell>
                              {slot.startTime} - {slot.endTime}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Badge variant={slot.delivery === "room" ? "default" : "secondary"}>
                                  {slot.delivery === "room" ? "Room" : "Online"}
                                </Badge>
                                {slot.delivery === "online" && isValidHttpUrl(slot.locationText) ? (
                                  <a
                                    className="text-sm text-muted-foreground underline underline-offset-4"
                                    href={slot.locationText}
                                    target="_blank"
                                    rel="noreferrer"
                                  >
                                    {slot.locationText}
                                  </a>
                                ) : (
                                  <span className="text-sm text-muted-foreground">
                                    {slot.delivery === "online" ? (slot.locationText || "—") : slot.locationText}
                                  </span>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>{slot.className}</TableCell>
                            <TableCell>{slot.course}</TableCell>
                            <TableCell className="text-muted-foreground">{slot.instructor}</TableCell>
                            <TableCell>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" className="h-8 w-8 p-0">
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem asChild>
                                    <Link href={`/academics/slots/${slot.id}/edit`}>
                                      <Edit className="mr-2 h-4 w-4" />
                                      Edit Slot
                                    </Link>
                                  </DropdownMenuItem>
                                  <DropdownMenuItem asChild>
                                    <Link href={`/attendance?slot=${slot.id}&date=${todayISO}`}>
                                      <UserCheck className="mr-2 h-4 w-4" />
                                      Mark Attendance
                                    </Link>
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem className="text-destructive" onClick={() => onDelete(slot.id)}>
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Delete
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="calendar">
          <Card>
            <CardHeader>
              <CardTitle>Weekly Timetable</CardTitle>
              <CardDescription>Calendar view of all scheduled slots</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-sm text-muted-foreground">Loading calendar…</div>
              ) : error ? (
                <div className="text-sm text-destructive">Error: {error}</div>
              ) : (
                <div className="overflow-x-auto">
                  <div className="grid grid-cols-8 gap-1 min-w-[900px]">
                    {/* Header */}
                    <div className="p-2 font-medium text-center bg-muted">Time</div>
                    {WEEK_DAYS.map((day) => (
                      <div key={day} className="p-2 font-medium text-center bg-muted">
                        {day}
                      </div>
                    ))}

                    {/* Rows */}
                    {uniqueStartTimes.length === 0 ? (
                      <div className="col-span-8 p-4 text-center text-sm text-muted-foreground">
                        No slots to show.
                      </div>
                    ) : (
                      uniqueStartTimes.map((time) => (
                        <React.Fragment key={time}>
                          <div className="p-2 text-sm text-center bg-muted/50 font-medium">{time}</div>
                          {WEEK_DAYS.map((day) => {
                            const slot = getSlotForDayAndTime(day, time);
                            return (
                              <div key={`${day}-${time}`} className="p-1 min-h-[80px] border border-border">
                                {slot && (
                                  <div className="h-full rounded bg-primary/10 p-2 text-xs">
                                    <div className="font-medium text-primary">{slot.course}</div>
                                    <div className="text-muted-foreground">{slot.className}</div>
                                    <div className="text-muted-foreground">
                                      {slot.delivery === "online" && isValidHttpUrl(slot.locationText) ? (
                                        <a
                                          className="underline underline-offset-4"
                                          href={slot.locationText}
                                          target="_blank"
                                          rel="noreferrer"
                                        >
                                          {slot.locationText}
                                        </a>
                                      ) : (
                                        slot.locationText || "—"
                                      )}
                                    </div>
                                    <div className="mt-1">
                                      <Link href={`/attendance?slot=${slot.id}&date=${todayISO}`}>
                                        <Button size="sm" variant="outline" className="h-6 text-xs bg-transparent">
                                          <UserCheck className="h-3 w-3 mr-1" />
                                          Attendance
                                        </Button>
                                      </Link>
                                    </div>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </React.Fragment>
                      ))
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </AdminLayout>
  );
}
