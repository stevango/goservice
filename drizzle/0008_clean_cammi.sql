CREATE TABLE `repasses` (
	`id` int AUTO_INCREMENT NOT NULL,
	`oficinaId` int NOT NULL,
	`valor` decimal(12,2) NOT NULL,
	`descricao` text NOT NULL,
	`referencia` varchar(80),
	`status` enum('pendente','aprovado','pago','cancelado') NOT NULL DEFAULT 'pendente',
	`observacoes` text,
	`criadoPorUserId` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`pagoEm` timestamp,
	CONSTRAINT `repasses_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `repasses_oficina_idx` ON `repasses` (`oficinaId`);--> statement-breakpoint
CREATE INDEX `repasses_status_idx` ON `repasses` (`status`);--> statement-breakpoint
CREATE INDEX `repasses_pago_em_idx` ON `repasses` (`pagoEm`);