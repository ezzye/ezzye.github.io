ALTER TABLE `action_cards` ADD `response_path` text;--> statement-breakpoint
ALTER TABLE `action_cards` ADD `is_preview` integer DEFAULT false NOT NULL;--> statement-breakpoint
UPDATE `action_cards`
SET `response_path` = '/tests/home-page', `is_preview` = 1
WHERE `id` = 'CFJ-A004';
