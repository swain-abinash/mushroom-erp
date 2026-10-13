import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { db } from "@/lib/db";

export const SETTINGS_TAG = "settings";

/** Storefront-facing keys in `business_settings`. Empty values are hidden in the UI. */
export const STORE_SETTING_KEYS = [
  "store_name",
  "contact_phone",
  "contact_whatsapp",
  "contact_email",
  "contact_address",
  "service_area",
] as const;

export type StoreSettings = Record<(typeof STORE_SETTING_KEYS)[number], string>;

export async function getStoreSettings(): Promise<StoreSettings> {
  "use cache";
  cacheTag(SETTINGS_TAG);
  // Minutes, not hours: there is no settings screen yet, so edits made directly in the table
  // (Prisma Studio / SQL) should show up quickly. A future settings screen should call updateTag(SETTINGS_TAG).
  cacheLife("minutes");

  const rows = await db.businessSetting.findMany({
    where: { key: { in: [...STORE_SETTING_KEYS] } },
    select: { key: true, value: true },
  });
  const settings = Object.fromEntries(STORE_SETTING_KEYS.map((key) => [key, ""])) as StoreSettings;
  for (const row of rows) settings[row.key as keyof StoreSettings] = row.value.trim();
  settings.store_name ||= "SporeERP";
  return settings;
}
