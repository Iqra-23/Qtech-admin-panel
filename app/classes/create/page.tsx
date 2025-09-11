// app/classes/create/page.tsx
"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export default function CreateClassPage() {
  const router = useRouter();

  const API_BASE = useMemo(
    () =>
      (process.env.NEXT_PUBLIC_API_BASE_URL ||
        process.env.NEXT_PUBLIC_API_BASE ||
        "http://localhost:5000"
      ).replace(/\/$/, ""),
    []
  );

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  // Optional: simple CSV to populate the `courses: string[]`
  const [coursesCsv, setCoursesCsv] = useState("");

  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      setErr("Name is required");
      return;
    }
    try {
      setSaving(true);
      setErr(null);

      const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
      const headers: HeadersInit = token
        ? { "Content-Type": "application/json", Authorization: `Bearer ${token}` }
        : { "Content-Type": "application/json" };

      const payload = {
        name: name.trim(),
        description: description.trim() || undefined,
        courses: coursesCsv
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
      };

      const res = await fetch(`${API_BASE}/api/classes`, {
        method: "POST",
        headers,
        body: JSON.stringify(payload),
      });
      const json = await res.json();

      if (!res.ok || json?.success === false) {
        throw new Error(json?.message || json?.error || `Failed (status ${res.status})`);
      }

      // go back to list & force refresh so the new class appears
      router.push("/classes");
      router.refresh();
    } catch (e: any) {
      setErr(e?.message || "Failed to create class");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold md:text-2xl">Create Class</h1>
        <Link href="/classes">
          <Button variant="outline">Back</Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>New Class</CardTitle>
          <CardDescription>Enter details and save</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <label htmlFor="name" className="text-sm font-medium">Name *</label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Grade 10 - A"
                required
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="description" className="text-sm font-medium">Description</label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Optional description"
                rows={3}
              />
            </div>

            {/* optional helper for your Class.courses: string[] */}
            <div className="space-y-2">
              <label htmlFor="courses" className="text-sm font-medium">Courses (comma-separated)</label>
              <Input
                id="courses"
                value={coursesCsv}
                onChange={(e) => setCoursesCsv(e.target.value)}
                placeholder="e.g. Algebra I, Geometry"
              />
              <p className="text-xs text-muted-foreground">
                These are saved as strings into the <code>courses</code> array.
              </p>
            </div>

            {err && <div className="text-sm text-red-600">{err}</div>}

            <div className="flex gap-3">
              <Button type="submit" disabled={saving}>
                {saving ? "Saving…" : "Create"}
              </Button>
              <Link href="/classes">
                <Button type="button" variant="outline">Cancel</Button>
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
