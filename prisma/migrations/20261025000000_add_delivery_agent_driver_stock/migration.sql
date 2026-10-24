-- AlterTable
ALTER TABLE `inventory_transactions` MODIFY `transaction_type` ENUM('PURCHASE', 'PRODUCTION_USE', 'HARVEST_INJECTION', 'CUSTOMER_SALE', 'WASTAGE_SPOILAGE', 'RETURN', 'MANUAL_ADJUSTMENT', 'DRIVER_DISPATCH', 'DRIVER_RETURN') NOT NULL;

-- CreateTable
CREATE TABLE `driver_stock` (
    `id` VARCHAR(36) NOT NULL,
    `driver_id` VARCHAR(36) NOT NULL,
    `inventory_item_id` VARCHAR(36) NOT NULL,
    `quantity` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `uq_driver_stock`(`driver_id`, `inventory_item_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE INDEX `idx_deliveries_driver_status` ON `deliveries`(`driver_id`, `status`);

-- AddForeignKey
ALTER TABLE `driver_stock` ADD CONSTRAINT `driver_stock_driver_id_fkey` FOREIGN KEY (`driver_id`) REFERENCES `employees`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `driver_stock` ADD CONSTRAINT `driver_stock_inventory_item_id_fkey` FOREIGN KEY (`inventory_item_id`) REFERENCES `inventory_items`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
