import "server-only";
import { Prisma, BatchStatus, BedStatus, RoomType, InventoryTxType, ItemCategory } from "@prisma/client";
import { db } from "@/lib/db";
import { ServiceError } from "@/lib/errors";
import { AuditService } from "@/services/audit.service";
import type { CreateBatchInput, LogHarvestInput, CreateRoomInput } from "@/lib/validations/production";

export class ProductionService {
  /**
   * List growing rooms (auto-seeds defaults if empty)
   */
  static async listRooms() {
    let rooms = await db.growingRoom.findMany({
      include: {
        _count: { select: { beds: true } },
      },
      orderBy: { name: "asc" },
    });

    if (rooms.length === 0) {
      await db.growingRoom.createMany({
        data: [
          { name: "Fruiting Room 1 (Main)", roomType: RoomType.FRUITING, capacityBeds: 200, targetTempC: 24.0, targetHumidity: 85.0 },
          { name: "Incubation Room 2", roomType: RoomType.INCUBATION, capacityBeds: 150, targetTempC: 26.0, targetHumidity: 70.0 },
        ],
      });
      rooms = await db.growingRoom.findMany({
        include: { _count: { select: { beds: true } } },
        orderBy: { name: "asc" },
      });
    }

    return rooms;
  }

  /**
   * Create a growing room
   */
  static async createRoom(input: CreateRoomInput) {
    return await db.growingRoom.create({
      data: {
        name: input.name,
        roomType: input.roomType,
        capacityBeds: input.capacityBeds,
        targetTempC: new Prisma.Decimal(input.targetTempC),
        targetHumidity: new Prisma.Decimal(input.targetHumidity),
      },
    });
  }

  /**
   * Get room with all its beds
   */
  static async getRoomMatrix(roomId: string) {
    const room = await db.growingRoom.findUnique({
      where: { id: roomId },
      include: {
        beds: {
          include: {
            batch: { select: { batchNumber: true, mushroomType: true } },
          },
          orderBy: [{ rackIdentifier: "asc" }, { bedIdentifier: "asc" }],
        },
      },
    });

    if (!room) {
      throw new ServiceError("ROOM_NOT_FOUND", "Growing room not found", 404);
    }

    return room;
  }

  /**
   * List production batches with status filter
   */
  static async listBatches(status?: BatchStatus) {
    const where: Prisma.ProductionBatchWhereInput = status ? { status } : {};

    return await db.productionBatch.findMany({
      where,
      include: {
        creator: { select: { name: true } },
        spawnSupplier: { select: { name: true } },
        beds: {
          select: { id: true, status: true, roomId: true },
        },
        harvests: {
          select: { id: true, totalWeightKg: true, flushNumber: true, harvestDate: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  /**
   * Create a new cultivation batch and allocate beds in the selected room
   */
  static async createBatch(input: CreateBatchInput, actorId: string) {
    return await db.$transaction(async (tx) => {
      const count = await tx.productionBatch.count();
      const dateStr = new Date().toISOString().slice(0, 7).replace("-", "");
      const batchNumber = `BATCH-${dateStr}-${String(count + 1).padStart(3, "0")}`;

      const inocDate = new Date(input.inoculationDate);
      const expectedHarvest = new Date(inocDate);
      expectedHarvest.setDate(expectedHarvest.getDate() + input.expectedHarvestDays);

      const batch = await tx.productionBatch.create({
        data: {
          batchNumber,
          mushroomType: input.mushroomType,
          spawnSupplierId: input.spawnSupplierId ?? null,
          spawnQuantityKg: new Prisma.Decimal(input.spawnQuantityKg),
          substrateType: input.substrateType,
          substrateDryWeightKg: new Prisma.Decimal(input.substrateDryWeightKg),
          numberOfBeds: input.numberOfBeds,
          inoculationDate: inocDate,
          expectedHarvestDate: expectedHarvest,
          status: BatchStatus.PREPARATION,
          createdBy: actorId,
        },
      });

      // Create beds in the selected room
      const bedsData: Array<{
        batchId: string;
        roomId: string;
        rackIdentifier: string;
        bedIdentifier: string;
        spawnWeightGrams: number;
        status: BedStatus;
      }> = [];

      const bedsPerRack = 10;
      for (let i = 1; i <= input.numberOfBeds; i++) {
        const rackNum = Math.ceil(i / bedsPerRack);
        const bedNum = ((i - 1) % bedsPerRack) + 1;
        bedsData.push({
          batchId: batch.id,
          roomId: input.roomId,
          rackIdentifier: `RACK-${rackNum}`,
          bedIdentifier: `BED-${String(bedNum).padStart(3, "0")}`,
          spawnWeightGrams: Math.round((input.spawnQuantityKg * 1000) / input.numberOfBeds),
          status: BedStatus.COLONIZING,
        });
      }

      await tx.growingBed.createMany({ data: bedsData });

      await AuditService.logEvent(
        {
          actorId,
          action: "PRODUCTION_BATCH_CREATED",
          entityType: "BATCH",
          entityId: batch.id,
          newState: { batchNumber, mushroomType: batch.mushroomType, bedsCount: input.numberOfBeds },
        },
        tx,
      );

      return batch;
    });
  }

  /**
   * Update batch lifecycle status
   */
  static async updateBatchStatus(batchId: string, status: BatchStatus, actorId: string) {
    return await db.$transaction(async (tx) => {
      const prev = await tx.productionBatch.findUnique({ where: { id: batchId } });
      if (!prev) throw new ServiceError("NOT_FOUND", "Batch not found", 404);

      const updated = await tx.productionBatch.update({
        where: { id: batchId },
        data: { status },
      });

      // If batch marked completed or contaminated, update bed statuses
      if (status === BatchStatus.COMPLETED) {
        await tx.growingBed.updateMany({
          where: { batchId },
          data: { status: BedStatus.EXHAUSTED },
        });
      } else if (status === BatchStatus.CONTAMINATED) {
        await tx.growingBed.updateMany({
          where: { batchId },
          data: { status: BedStatus.CONTAMINATED, contaminationType: "Trichoderma / Green Mold" },
        });
      }

      await AuditService.logEvent(
        {
          actorId,
          action: "BATCH_STATUS_UPDATED",
          entityType: "BATCH",
          entityId: batchId,
          oldState: { status: prev.status },
          newState: { status },
        },
        tx,
      );

      return updated;
    });
  }

  /**
   * Update individual bed status (e.g. Pinning, Ready to Harvest, Contaminated)
   */
  static async updateBedStatus(
    bedId: string,
    status: BedStatus,
    contaminationType?: string,
  ) {
    return await db.growingBed.update({
      where: { id: bedId },
      data: {
        status,
        contaminationType: status === BedStatus.CONTAMINATED ? (contaminationType ?? "Identified Mold") : null,
      },
    });
  }

  /**
   * Rapid Harvest Logger (<30s entry):
   * Records yield, calculates biological efficiency, and AUTO-INJECTS Grade A/B into Finished Goods Inventory!
   */
  static async logHarvest(input: LogHarvestInput, actorId: string) {
    return await db.$transaction(async (tx) => {
      const batch = await tx.productionBatch.findUnique({
        where: { id: input.batchId },
      });

      if (!batch) {
        throw new ServiceError("NOT_FOUND", "Production batch not found", 404);
      }

      const harvest = await tx.harvest.create({
        data: {
          batchId: batch.id,
          harvestDate: new Date(input.harvestDate),
          flushNumber: input.flushNumber,
          totalWeightKg: new Prisma.Decimal(input.totalWeightKg),
          gradeAKg: new Prisma.Decimal(input.gradeAKg),
          gradeBKg: new Prisma.Decimal(input.gradeBKg),
          gradeCDryKg: new Prisma.Decimal(input.gradeCDryKg),
          wastageKg: new Prisma.Decimal(input.wastageKg),
          notes: input.notes ?? null,
          harvestedBy: actorId,
        },
      });

      // Update batch cumulative yield & Biological Efficiency %
      const newTotalHarvested = Number(batch.totalHarvestedKg) + input.totalWeightKg;
      const substrateDry = Number(batch.substrateDryWeightKg);
      const biologicalEfficiency = substrateDry > 0 ? (newTotalHarvested / substrateDry) * 100 : 0;

      await tx.productionBatch.update({
        where: { id: batch.id },
        data: {
          totalHarvestedKg: new Prisma.Decimal(newTotalHarvested),
          biologicalEfficiency: new Prisma.Decimal(biologicalEfficiency),
          status: BatchStatus.HARVESTING,
        },
      });

      // AUTO-INJECT Grade A & Grade B into Finished Goods Inventory
      const sellableHarvestKg = input.gradeAKg + input.gradeBKg;
      if (sellableHarvestKg > 0) {
        // Look for existing finished product inventory item for this mushroom type
        let invItem = await tx.inventoryItem.findFirst({
          where: {
            itemCategory: ItemCategory.FINISHED_PRODUCT,
            itemName: { contains: batch.mushroomType },
          },
        });

        if (!invItem) {
          // Fall back to first finished product inventory item
          invItem = await tx.inventoryItem.findFirst({
            where: { itemCategory: ItemCategory.FINISHED_PRODUCT },
          });
        }

        if (invItem) {
          const updatedInv = await tx.inventoryItem.update({
            where: { id: invItem.id },
            data: {
              availableStock: { increment: sellableHarvestKg },
            },
          });

          await tx.inventoryTransaction.create({
            data: {
              inventoryItemId: invItem.id,
              transactionType: InventoryTxType.HARVEST_INJECTION,
              quantity: new Prisma.Decimal(sellableHarvestKg),
              balanceAfter: updatedInv.availableStock,
              referenceType: "HARVEST",
              referenceId: harvest.id,
              reason: `Harvest Flush #${input.flushNumber} from ${batch.batchNumber} (Grade A: ${input.gradeAKg}kg, Grade B: ${input.gradeBKg}kg)`,
              performedBy: actorId,
            },
          });
        }
      }

      await AuditService.logEvent(
        {
          actorId,
          action: "HARVEST_LOGGED",
          entityType: "HARVEST",
          entityId: harvest.id,
          newState: {
            batchNumber: batch.batchNumber,
            totalYieldKg: input.totalWeightKg,
            flushNumber: input.flushNumber,
            injectedKg: sellableHarvestKg,
          },
        },
        tx,
      );

      return harvest;
    });
  }

  /**
   * List recent harvests
   */
  static async listHarvests(limit = 25) {
    return await db.harvest.findMany({
      take: limit,
      include: {
        batch: { select: { batchNumber: true, mushroomType: true } },
        recorder: { select: { name: true } },
      },
      orderBy: { harvestDate: "desc" },
    });
  }
}
