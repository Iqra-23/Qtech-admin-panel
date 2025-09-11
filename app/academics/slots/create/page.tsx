import { AdminLayout } from "@/components/admin-layout"
import { SlotForm } from "@/components/slot-form"

export default function CreateSlotPage() {
  return (
    <AdminLayout>
      <div className="flex items-center">
        <h1 className="text-lg font-semibold md:text-2xl">Create Time Slot</h1>
      </div>

      <SlotForm />
    </AdminLayout>
  )
}
