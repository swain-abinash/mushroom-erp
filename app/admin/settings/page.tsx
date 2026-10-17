import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { requireStaff } from "@/lib/auth/dal";
import { db } from "@/lib/db";
import { updateBusinessSettingsAction } from "./actions";

export const metadata: Metadata = { title: "Business Settings — SporeERP Admin" };

export default async function AdminSettingsPage() {
  const user = await requireStaff("/admin/settings");
  if (!user.isFounder) {
    redirect("/admin/dashboard?error=restricted");
  }

  const rawSettings = await db.businessSetting.findMany();
  const settingsMap = new Map(rawSettings.map((s) => [s.key, s.value]));

  return (
    <div className="mx-auto max-w-4xl flex flex-col gap-8 font-body text-spore-ivory">
      <header>
        <h1 className="font-display text-2xl font-bold">Business Settings &amp; Store Profile</h1>
        <p className="mt-1 text-sm text-spore-ivory/70">
          Founder controls: Contact numbers, WhatsApp link, farm physical address, and delivery zone.
        </p>
      </header>

      <form
        action={async (formData: FormData) => {
          "use server";
          await updateBusinessSettingsAction(formData);
        }}
        className="rounded-2xl border border-spore-ivory/10 bg-surface-charcoal p-8 space-y-6 shadow-sm"
      >
        <div className="grid gap-6 sm:grid-cols-2 text-xs">
          <div className="sm:col-span-2">
            <label className="block font-semibold mb-1">Store / Farm Display Name *</label>
            <input
              type="text"
              name="store_name"
              required
              defaultValue={settingsMap.get("store_name") ?? "Spore Organic Mushroom Farm"}
              className="w-full rounded-lg border border-spore-ivory/20 bg-surface-charcoal px-3.5 py-2.5 text-sm text-spore-ivory focus:border-forest-primary focus:outline-hidden"
            />
            <p className="text-[11px] text-spore-ivory/50 mt-1">
              Shown in the customer storefront header, invoice PDFs, and Google SEO title.
            </p>
          </div>

          <div>
            <label className="block font-semibold mb-1">Customer Helpline Phone *</label>
            <input
              type="tel"
              name="contact_phone"
              defaultValue={settingsMap.get("contact_phone") ?? "+91 98765 43210"}
              className="w-full rounded-lg border border-spore-ivory/20 bg-surface-charcoal px-3 py-2 text-sm text-spore-ivory focus:border-forest-primary focus:outline-hidden"
            />
          </div>

          <div>
            <label className="block font-semibold mb-1">WhatsApp Chat Number (with country code)</label>
            <input
              type="tel"
              name="contact_whatsapp"
              defaultValue={settingsMap.get("contact_whatsapp") ?? "+919876543210"}
              placeholder="+919876543210"
              className="w-full rounded-lg border border-spore-ivory/20 bg-surface-charcoal px-3 py-2 text-sm text-spore-ivory focus:border-forest-primary focus:outline-hidden"
            />
          </div>

          <div>
            <label className="block font-semibold mb-1">Official Support Email</label>
            <input
              type="email"
              name="contact_email"
              defaultValue={settingsMap.get("contact_email") ?? "support@sporemushroom.local"}
              className="w-full rounded-lg border border-spore-ivory/20 bg-surface-charcoal px-3 py-2 text-sm text-spore-ivory focus:border-forest-primary focus:outline-hidden"
            />
          </div>

          <div>
            <label className="block font-semibold mb-1">Fresh Delivery Service Area</label>
            <input
              type="text"
              name="service_area"
              defaultValue={
                settingsMap.get("service_area") ??
                "Bhubaneswar, Cuttack & Khurda Metropolitan Region"
              }
              className="w-full rounded-lg border border-spore-ivory/20 bg-surface-charcoal px-3 py-2 text-sm text-spore-ivory focus:border-forest-primary focus:outline-hidden"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="block font-semibold mb-1">Farm / Facility Physical Address</label>
            <textarea
              rows={3}
              name="contact_address"
              defaultValue={
                settingsMap.get("contact_address") ??
                "Plot 42, Spore Agri-Bio Zone, Chandaka-Khurda Road, Bhubaneswar, Odisha 751024"
              }
              className="w-full rounded-lg border border-spore-ivory/20 bg-surface-charcoal px-3.5 py-2.5 text-sm text-spore-ivory focus:border-forest-primary focus:outline-hidden"
            />
          </div>
        </div>

        <div className="flex justify-end pt-4 border-t border-spore-ivory/10">
          <button
            type="submit"
            className="rounded-full bg-forest-primary px-8 py-3 font-display text-sm font-bold text-spore-ivory hover:bg-forest-hover transition-colors shadow-md cursor-pointer"
          >
            Save Business Settings
          </button>
        </div>
      </form>
    </div>
  );
}
