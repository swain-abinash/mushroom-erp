import "server-only";
import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db";

type AuditEvent = {
  actorId: string | null;
  action: string;
  entityType: string;
  entityId: string;
  oldState?: Prisma.InputJsonValue;
  newState?: Prisma.InputJsonValue;
  ipAddress?: string | null;
};

export class AuditService {
  static async logEvent(event: AuditEvent, tx: Prisma.TransactionClient = db): Promise<void> {
    await tx.auditLog.create({
      data: {
        actorId: event.actorId,
        action: event.action,
        entityType: event.entityType,
        entityId: event.entityId,
        oldState: event.oldState,
        newState: event.newState,
        ipAddress: event.ipAddress ?? null,
      },
    });
  }
}
