// app/classes/[id]/edit/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { AdminLayout } from "@/components/admin-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

type ClassFromApi = {
  _id: string;
  name: string;
  description?: string;
  subjects?: string[];
  students?: string[];
  courses?: string[];
};

export default function EditClassPage() {
  const router = useRouter();
  const params = useParams<{ id: string | string[] }>();
  const id = Array.isArray(params?.id) ? params.id[0] : params?.id;

  const API_BASE = useMemo(
    () =>
      (process.env.NEXT_PUBLIC_API_BASE_URL ||
        process.env.NEXT_PUBLIC_API_BASE ||
        "http://localhost:5000"
      ).replace(/\/$/, ""),
    []
  );

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const [name, setName] = useState<string>("");
  const [description, setDescription] = useState<string>("");

  useEffect(() => {
    if (!id) return;
    let alive = true;

    (async () => {
      try {
        setLoading(true);
        setErr(null);

        const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
        const headers: HeadersInit = token
          ? { "Content-Type": "application/json", Authorization: `Bearer ${token}` }
          : { "Content-Type": "application/json" };

        const res = await fetch(`${API_BASE}/api/classes/${id}`, {
          headers,
          cache: "no-store",
        });
        const json = await res.json();
        if (!alive) return;

        if (!res.ok || !json?.success || !json?.data) {
          throw new Error(json?.message || json?.error || `Failed to fetch (status ${res.status})`);
        }

        const c: ClassFromApi = json.data;
        setName(c?.name || "");
        setDescription(c?.description || "");
      } catch (e: any) {
        if (!alive) return;
        setErr(e?.message || "Failed to load class");
      } finally {
        if (alive) setLoading(false);
      }
    })();

    return () => { alive = false; };
  }, [API_BASE, id]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!id) return;
    if (!name.trim()) {
      alert("Name is required.");
      return;
    }
    try {
      setSaving(true);

      const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
      const headers: HeadersInit = token
        ? { "Content-Type": "application/json", Authorization: `Bearer ${token}` }
        : { "Content-Type": "application/json" };

      const res = await fetch(`${API_BASE}/api/classes/${id}`, {
        method: "PATCH",
        headers,
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim() || undefined,
          // Add subjects/students/courses here if you add UI for them
        }),
      });
      const json = await res.json();
      if (!res.ok || !json?.success) {
        throw new Error(json?.message || json?.error || `Failed to update (status ${res.status})`);
      }

      router.push("/classes");
      router.refresh(); // ensure listing refreshes
    } catch (e: any) {
      alert(e?.message || "Failed to save changes");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!id) return;
    if (!confirm("Delete this class? This cannot be undone.")) return;
    try {
      setDeleting(true);

      const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
      const headers: HeadersInit = token
        ? { Authorization: `Bearer ${token}` }
        : {};

      const res = await fetch(`${API_BASE}/api/classes/${id}`, { method: "DELETE", headers });
      const json = await res.json();
      if (!res.ok || !json?.success) {
        throw new Error(json?.message || json?.error || `Failed to delete (status ${res.status})`);
      }

      router.push("/classes");
      router.refresh(); // ensure listing refreshes
    } catch (e: any) {
      alert(e?.message || "Failed to delete class");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <AdminLayout>
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold md:text-2xl">Edit Class</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => router.back()}>Back</Button>
          <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
            {deleting ? "Deleting…" : "Delete"}
          </Button>
        </div>
      </div>

      {loading ? (
        <Card className="mt-4">
          <CardContent className="py-10 text-center text-muted-foreground">Loading…</CardContent>
        </Card>
      ) : err ? (
        <Card className="mt-4">
          <CardHeader>
            <CardTitle>Error</CardTitle>
            <CardDescription>Could not load class.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-red-600">{err}</div>
          </CardContent>
        </Card>
      ) : (
        <Card className="mt-4">
          <CardHeader>
            <CardTitle>Class Details</CardTitle>
            <CardDescription>Update class information</CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-6" onSubmit={handleSave}>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium" htmlFor="name">Name *</label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Grade 10 - A"
                    required
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <label className="text-sm font-medium" htmlFor="description">Description</label>
                  <Textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Optional description of the class"
                    rows={3}
                  />
                </div>
              </div>

              <div className="flex gap-3">
                <Button type="submit" disabled={saving}>
                  {saving ? "Saving…" : "Save Changes"}
                </Button>
                <Button type="button" variant="outline" onClick={() => router.push("/classes")}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}
    </AdminLayout>
  );
}
