CREATE TABLE `leads` (
	`id` text PRIMARY KEY NOT NULL,
	`partner_id` text,
	`referrer_id` text,
	`name` text NOT NULL,
	`email` text NOT NULL,
	`company` text NOT NULL,
	`role` text NOT NULL,
	`source` text NOT NULL,
	`stage` text DEFAULT 'New' NOT NULL,
	`next_step` text DEFAULT '' NOT NULL,
	`follow_up` text DEFAULT '' NOT NULL,
	`owner` text DEFAULT '' NOT NULL,
	`value_cents` integer DEFAULT 0 NOT NULL,
	`notes` text DEFAULT '' NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`partner_id`) REFERENCES `partners`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`referrer_id`) REFERENCES `partners`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_leads_stage` ON `leads` (`stage`);--> statement-breakpoint
CREATE INDEX `idx_leads_referrer` ON `leads` (`referrer_id`);--> statement-breakpoint
CREATE TABLE `partners` (
	`id` text PRIMARY KEY NOT NULL,
	`email` text NOT NULL,
	`name` text NOT NULL,
	`company` text NOT NULL,
	`role` text NOT NULL,
	`markets` text DEFAULT '' NOT NULL,
	`website` text DEFAULT '' NOT NULL,
	`notes` text DEFAULT '' NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `requests` (
	`id` text PRIMARY KEY NOT NULL,
	`partner_id` text NOT NULL,
	`store_id` text NOT NULL,
	`campaign` text NOT NULL,
	`notes` text DEFAULT '' NOT NULL,
	`billing` text NOT NULL,
	`status` text DEFAULT 'requested' NOT NULL,
	`rate_cents` integer NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`partner_id`) REFERENCES `partners`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`store_id`) REFERENCES `stores`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_requests_store_status` ON `requests` (`store_id`,`status`);--> statement-breakpoint
CREATE INDEX `idx_requests_partner` ON `requests` (`partner_id`);--> statement-breakpoint
CREATE TABLE `stores` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`city` text NOT NULL,
	`state` text NOT NULL,
	`type` text NOT NULL,
	`capacity` integer DEFAULT 30 NOT NULL,
	`monthly_cents` integer DEFAULT 10000 NOT NULL,
	`annual_cents` integer DEFAULT 100000 NOT NULL,
	`status` text DEFAULT 'draft' NOT NULL,
	`partner_id` text,
	`description` text DEFAULT '' NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`partner_id`) REFERENCES `partners`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_stores_status` ON `stores` (`status`);--> statement-breakpoint
CREATE INDEX `idx_stores_partner` ON `stores` (`partner_id`);