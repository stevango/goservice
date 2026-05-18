CREATE INDEX `avaliacoes_oficina_status_idx` ON `avaliacoes` (`oficinaId`,`statusAvaliacao`);--> statement-breakpoint
CREATE INDEX `avaliacoes_status_created_idx` ON `avaliacoes` (`statusAvaliacao`,`createdAt`);--> statement-breakpoint
CREATE INDEX `clientes_b2b_user_id_idx` ON `clientes_b2b` (`userId`);--> statement-breakpoint
CREATE INDEX `notificacoes_lida_created_idx` ON `notificacoes` (`lida`,`createdAt`);--> statement-breakpoint
CREATE INDEX `oficina_documentos_oficina_id_idx` ON `oficina_documentos` (`oficinaId`);--> statement-breakpoint
CREATE INDEX `oficinas_status_score_idx` ON `oficinas` (`status`,`scoreReputacao`);--> statement-breakpoint
CREATE INDEX `oficinas_user_id_idx` ON `oficinas` (`userId`);--> statement-breakpoint
CREATE INDEX `oficinas_estado_idx` ON `oficinas` (`estado`);--> statement-breakpoint
CREATE INDEX `oficinas_categoria_idx` ON `oficinas` (`categoria`);