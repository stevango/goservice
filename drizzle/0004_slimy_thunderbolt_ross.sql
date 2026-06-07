ALTER TABLE `import_jobs` ADD `faseImport` enum('coletando','inserindo') DEFAULT 'coletando' NOT NULL;--> statement-breakpoint
ALTER TABLE `import_jobs` ADD `candidatos` json;--> statement-breakpoint
ALTER TABLE `oficinas` ADD `enrichedAt` timestamp;