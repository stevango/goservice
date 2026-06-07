CREATE TABLE `import_jobs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`termo` varchar(255) NOT NULL,
	`cidade` varchar(255) NOT NULL,
	`estado` varchar(2) NOT NULL,
	`statusImport` enum('pendente','rodando','concluido','cancelado','erro') NOT NULL DEFAULT 'pendente',
	`nextPageToken` text,
	`pagina` int NOT NULL DEFAULT 0,
	`encontrados` int NOT NULL DEFAULT 0,
	`importados` int NOT NULL DEFAULT 0,
	`duplicados` int NOT NULL DEFAULT 0,
	`erro` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `import_jobs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `oficinas` ADD `googlePlaceId` varchar(128);--> statement-breakpoint
CREATE INDEX `import_jobs_status_idx` ON `import_jobs` (`statusImport`);--> statement-breakpoint
CREATE INDEX `oficinas_google_place_id_idx` ON `oficinas` (`googlePlaceId`);