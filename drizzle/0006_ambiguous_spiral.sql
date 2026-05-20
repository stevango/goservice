CREATE TABLE `atendimento_eventos` (
	`id` int AUTO_INCREMENT NOT NULL,
	`oficinaId` int NOT NULL,
	`autorUserId` int,
	`canal` enum('email','whatsapp','sms','telefone','presencial','outro') NOT NULL,
	`tipo` enum('enviado','entregue','aberto','clicado','respondeu','aceitou','recusou','nota') NOT NULL,
	`etapaNova` enum('lead_encontrado','convite_enviado','convite_entregue','visualizou','nao_respondeu','followup_1','followup_2','negociando','interesse_demonstrado','cadastro_iniciado','cadastro_concluido','ativado','operando','recusou','inativo'),
	`mensagem` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `atendimento_eventos_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `oficinas` ADD `etapaAtendimento` enum('lead_encontrado','convite_enviado','convite_entregue','visualizou','nao_respondeu','followup_1','followup_2','negociando','interesse_demonstrado','cadastro_iniciado','cadastro_concluido','ativado','operando','recusou','inativo') DEFAULT 'lead_encontrado' NOT NULL;--> statement-breakpoint
CREATE INDEX `atendimento_eventos_oficina_idx` ON `atendimento_eventos` (`oficinaId`);