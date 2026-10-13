/*
  Warnings:

  - You are about to drop the column `b2b_price` on the `products` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `products` DROP COLUMN `b2b_price`,
    ADD COLUMN `allow_backorder` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `is_featured` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `nutrition_info` TEXT NULL,
    ADD COLUMN `short_description` VARCHAR(255) NULL,
    ADD COLUMN `storage_tips` TEXT NULL,
    ADD COLUMN `variety` VARCHAR(60) NULL;

-- CreateTable
CREATE TABLE `product_pricing_tiers` (
    `id` VARCHAR(36) NOT NULL,
    `product_id` VARCHAR(36) NOT NULL,
    `customer_type` ENUM('RETAIL', 'B2B_RESTAURANT', 'WHOLESALE') NOT NULL,
    `price` DECIMAL(10, 2) NOT NULL,
    `min_qty` DECIMAL(8, 2) NOT NULL DEFAULT 1.00,

    UNIQUE INDEX `uq_pricing_tier_product_type`(`product_id`, `customer_type`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `stock_notifications` (
    `id` VARCHAR(36) NOT NULL,
    `product_id` VARCHAR(36) NOT NULL,
    `email` VARCHAR(150) NOT NULL,
    `user_id` VARCHAR(36) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `notified_at` DATETIME(3) NULL,

    UNIQUE INDEX `uq_stock_notification_product_email`(`product_id`, `email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE INDEX `idx_prod_variety` ON `products`(`variety`);

-- AddForeignKey
ALTER TABLE `product_pricing_tiers` ADD CONSTRAINT `product_pricing_tiers_product_id_fkey` FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `stock_notifications` ADD CONSTRAINT `stock_notifications_product_id_fkey` FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `stock_notifications` ADD CONSTRAINT `stock_notifications_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
