CREATE TABLE `avaliacoes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`oficinaId` int NOT NULL,
	`userId` int,
	`notaGeral` int NOT NULL,
	`notaAtendimento` int,
	`notaQualidade` int,
	`notaPrazo` int,
	`notaPreco` int,
	`comentario` text,
	`nomeCliente` varchar(255),
	`tipoServico` varchar(100),
	`tipoVeiculo` varchar(100),
	`statusAvaliacao` enum('pendente','aprovada','rejeitada') NOT NULL DEFAULT 'pendente',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `avaliacoes_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `clientes_b2b` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int,
	`razaoSocial` varchar(255) NOT NULL,
	`nomeFantasia` varchar(255) NOT NULL,
	`cnpj` varchar(18) NOT NULL,
	`tipo` enum('seguradora','associacao','cooperativa') NOT NULL DEFAULT 'seguradora',
	`contatoNome` varchar(255),
	`contatoEmail` varchar(320),
	`contatoTelefone` varchar(20),
	`statusB2B` enum('ativo','inativo','pendente') NOT NULL DEFAULT 'pendente',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `clientes_b2b_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `notificacoes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tipoNotificacao` enum('novo_cadastro','nova_avaliacao','status_alterado','documento_enviado') NOT NULL,
	`titulo` varchar(255) NOT NULL,
	`mensagem` text,
	`lida` boolean DEFAULT false,
	`dados` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `notificacoes_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `oficina_documentos` (
	`id` int AUTO_INCREMENT NOT NULL,
	`oficinaId` int NOT NULL,
	`tipo` enum('alvara','cnpj_card','contrato_social','rg_frente','rg_verso','foto_fachada','foto_interior','foto_equipamentos','outro') NOT NULL,
	`url` varchar(1000) NOT NULL,
	`nome` varchar(255),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `oficina_documentos_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `oficinas` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int,
	`cnpj` varchar(18) NOT NULL,
	`razaoSocial` varchar(255) NOT NULL,
	`nomeFantasia` varchar(255) NOT NULL,
	`telefone` varchar(20),
	`whatsapp` varchar(20),
	`email` varchar(320),
	`website` varchar(500),
	`nomeRepresentante` varchar(255),
	`cpfRepresentante` varchar(14),
	`rgRepresentante` varchar(20),
	`cep` varchar(9),
	`logradouro` varchar(500),
	`numero` varchar(20),
	`complemento` varchar(255),
	`bairro` varchar(255),
	`cidade` varchar(255),
	`estado` varchar(2),
	`latitude` decimal(10,7),
	`longitude` decimal(10,7),
	`banco` varchar(100),
	`agencia` varchar(20),
	`contaCorrente` varchar(30),
	`pixTipo` enum('cpf','cnpj','telefone','email','chave_aleatoria'),
	`pixChave` varchar(255),
	`categoria` enum('premium','concessionaria','padrao') NOT NULL DEFAULT 'padrao',
	`tiposVeiculos` json,
	`tiposServicos` json,
	`franquiaAntes` boolean DEFAULT false,
	`franquiaDepois` boolean DEFAULT true,
	`parcelamentoFranquia` int DEFAULT 1,
	`fornecePecas` enum('oficina','seguradora','cliente','ambos') DEFAULT 'oficina',
	`garantiaServico` varchar(255),
	`scoreReputacao` decimal(3,1) DEFAULT '0.0',
	`totalAvaliacoes` int DEFAULT 0,
	`status` enum('pendente','ativa','bloqueada','rejeitada') NOT NULL DEFAULT 'pendente',
	`etapaCadastro` enum('dados','endereco','documentos','fotos','contrato','completo') DEFAULT 'dados',
	`observacoesAdmin` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `oficinas_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `users` MODIFY COLUMN `role` enum('user','admin','oficina','b2b') NOT NULL DEFAULT 'user';