CREATE TABLE `steward_briefs` (
	`id` text PRIMARY KEY NOT NULL,
	`repair_id` text NOT NULL,
	`source_checksum` text NOT NULL,
	`summary` text NOT NULL,
	`next_action` text NOT NULL,
	`blockers` text NOT NULL,
	`draft_update` text NOT NULL,
	`questions` text NOT NULL,
	`model` text NOT NULL,
	`status` text DEFAULT 'draft' NOT NULL,
	`generated_at` text NOT NULL,
	`reviewed_at` text,
	FOREIGN KEY (`repair_id`) REFERENCES `repairs`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_steward_repair_date` ON `steward_briefs` (`repair_id`,`generated_at`);--> statement-breakpoint
CREATE INDEX `idx_steward_status` ON `steward_briefs` (`status`);