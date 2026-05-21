ALTER TABLE `oficinas` ADD `automacaoAtiva` boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `oficinas` ADD `proximaAcaoAt` timestamp;--> statement-breakpoint
ALTER TABLE `oficinas` ADD `ultimoContatoAt` timestamp;--> statement-breakpoint
ALTER TABLE `oficinas` ADD `tentativasConvite` int DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `oficinas` ADD `tokenParceiro` varchar(40);--> statement-breakpoint
CREATE INDEX `oficinas_automacao_idx` ON `oficinas` (`automacaoAtiva`,`proximaAcaoAt`);--> statement-breakpoint
CREATE INDEX `oficinas_token_parceiro_idx` ON `oficinas` (`tokenParceiro`);