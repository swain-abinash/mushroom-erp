import { z } from "zod";
import { RoomType, BatchStatus, BedStatus } from "@prisma/client";

export const createBatchSchema = z.object({
  mushroomType: z.string().trim().min(2, "Mushroom type is required").default("Oyster Mushroom"),
  roomId: z.string().uuid("Please select a growing room"),
  spawnSupplierId: z.string().uuid().optional(),
  spawnQuantityKg: z.number().positive("Spawn quantity must be positive"),
  substrateType: z.string().trim().min(2, "Substrate type is required").default("Paddy Straw + Bran"),
  substrateDryWeightKg: z.number().positive("Substrate weight must be positive"),
  numberOfBeds: z.number().int().positive("Must allocate at least 1 bed"),
  inoculationDate: z.string().min(10, "Inoculation date required"),
  expectedHarvestDays: z.number().int().min(7).max(90).default(21),
});

export type CreateBatchInput = z.infer<typeof createBatchSchema>;

export const logHarvestSchema = z.object({
  batchId: z.string().uuid("Please select a production batch"),
  harvestDate: z.string().min(10, "Harvest date required"),
  flushNumber: z.number().int().min(1).max(5).default(1),
  totalWeightKg: z.number().positive("Total yield must be greater than zero"),
  gradeAKg: z.number().min(0).default(0),
  gradeBKg: z.number().min(0).default(0),
  gradeCDryKg: z.number().min(0).default(0),
  wastageKg: z.number().min(0).default(0),
  notes: z.string().max(255).optional(),
});

export type LogHarvestInput = z.infer<typeof logHarvestSchema>;

export const createRoomSchema = z.object({
  name: z.string().trim().min(2).max(50),
  roomType: z.nativeEnum(RoomType).default(RoomType.FRUITING),
  capacityBeds: z.number().int().min(10).max(1000).default(200),
  targetTempC: z.number().min(10).max(40).default(24.0),
  targetHumidity: z.number().min(50).max(100).default(85.0),
});

export type CreateRoomInput = z.infer<typeof createRoomSchema>;
