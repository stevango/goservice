ALTER TABLE `import_jobs` ADD `segmento` varchar(64) DEFAULT 'oficina_mecanica' NOT NULL;--> statement-breakpoint
ALTER TABLE `oficinas` ADD `segmento` varchar(64) DEFAULT 'oficina_mecanica' NOT NULL;