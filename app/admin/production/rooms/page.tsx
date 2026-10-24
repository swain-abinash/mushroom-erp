import type { Metadata } from "next";
import Link from "next/link";
import { requireStaff } from "@/lib/auth/dal";
import { ProductionService } from "@/services/production.service";
import { RoomMatrixClient, CreateRoomForm } from "./room-matrix-client";

export const instant = false;
export const metadata: Metadata = { title: "Growing Rooms & Bed Matrix — SporeERP Admin" };

export default async function AdminRoomsPage({
  searchParams,
}: {
  searchParams: Promise<{ roomId?: string }>;
}) {
  await requireStaff("/admin/production/rooms");

  const { roomId } = await searchParams;
  const rooms = await ProductionService.listRooms();

  const selectedRoomId = roomId ?? rooms[0]?.id;
  const currentRoom = selectedRoomId
    ? await ProductionService.getRoomMatrix(selectedRoomId)
    : null;

  return (
    <div className="flex flex-col gap-8 font-body text-stone-900 dark:text-spore-ivory">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <nav aria-label="Breadcrumb" className="text-xs text-stone-600 dark:text-spore-ivory/60 mb-2">
            <Link href="/admin/production" className="hover:underline">
              Cultivation Hub
            </Link>{" "}
            / Growing Rooms
          </nav>
          <h1 className="font-display text-2xl font-bold">Growing Rooms &amp; Bed Matrix</h1>
          <p className="mt-1 text-sm text-stone-700 dark:text-spore-ivory/70">
            Visual rack layout of mushroom beds, colonization status, pinning, and harvest readiness.
          </p>
        </div>
        <CreateRoomForm />
      </header>

      {/* Room Selector Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-stone-200 dark:border-spore-ivory/10 pb-3">
        <div className="flex flex-wrap gap-2">
          {rooms.map((room) => {
            const active = room.id === selectedRoomId;
            return (
              <Link
                key={room.id}
                href={`/admin/production/rooms?roomId=${room.id}`}
                className={`rounded-full px-4 py-1.5 text-xs font-semibold transition-colors ${
                  active
                    ? "bg-forest-primary text-spore-ivory"
                    : "bg-surface-charcoal border border-stone-200 dark:border-spore-ivory/10 text-spore-ivory/70 hover:text-spore-ivory"
                }`}
              >
                {room.name} ({room._count.beds} beds)
              </Link>
            );
          })}
        </div>

        {currentRoom && (
          <div className="flex items-center gap-4 text-xs font-data">
            <span className="flex items-center gap-1 text-amber-700 dark:text-warning-amber">
              🌡️ Target: {Number(currentRoom.targetTempC)}°C
            </span>
            <span className="flex items-center gap-1 text-green-700 dark:text-success-mint">
              💧 Humidity: {Number(currentRoom.targetHumidity)}% RH
            </span>
          </div>
        )}
      </div>

      {currentRoom ? (
        <RoomMatrixClient beds={currentRoom.beds} />
      ) : (
        <div className="rounded-2xl border border-stone-200 dark:border-spore-ivory/10 bg-white dark:bg-surface-charcoal p-12 text-center text-stone-600 dark:text-spore-ivory/60">
          No rooms configured. Add a growing room using the button above.
        </div>
      )}
    </div>
  );
}
