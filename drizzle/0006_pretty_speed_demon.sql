CREATE TABLE `action_invites` (
	`id` text PRIMARY KEY NOT NULL,
	`action_id` text NOT NULL,
	`token_hash` text NOT NULL,
	`expires_at` text NOT NULL,
	`used_at` text,
	`revoked_at` text,
	`created_at` text NOT NULL,
	FOREIGN KEY (`action_id`) REFERENCES `action_cards`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_action_invites_token_hash` ON `action_invites` (`token_hash`);--> statement-breakpoint
CREATE INDEX `idx_action_invites_action_expiry` ON `action_invites` (`action_id`,`expires_at`);--> statement-breakpoint
ALTER TABLE `action_responses` ADD `invite_id` text REFERENCES action_invites(id);--> statement-breakpoint
CREATE UNIQUE INDEX `idx_action_responses_invite` ON `action_responses` (`invite_id`);
--> statement-breakpoint
CREATE TRIGGER `action_response_invite_required_insert`
BEFORE INSERT ON `action_responses`
WHEN NEW.`invite_id` IS NULL
BEGIN
	SELECT RAISE(ABORT, 'Invitation is required for new responses');
END;
--> statement-breakpoint
CREATE TRIGGER `action_response_invite_matches_insert`
BEFORE INSERT ON `action_responses`
WHEN NEW.`invite_id` IS NOT NULL AND NOT EXISTS (
	SELECT 1 FROM `action_invites`
	WHERE `id` = NEW.`invite_id` AND `action_id` = NEW.`action_id`
)
BEGIN
	SELECT RAISE(ABORT, 'Invitation does not belong to this action');
END;
--> statement-breakpoint
CREATE TRIGGER `action_response_invite_matches_update`
BEFORE UPDATE OF `invite_id`, `action_id` ON `action_responses`
WHEN NEW.`invite_id` IS NOT NULL AND NOT EXISTS (
	SELECT 1 FROM `action_invites`
	WHERE `id` = NEW.`invite_id` AND `action_id` = NEW.`action_id`
)
BEGIN
	SELECT RAISE(ABORT, 'Invitation does not belong to this action');
END;
--> statement-breakpoint
UPDATE `action_cards`
SET `evidence_required` = 'We need five private replies. We publish only nameless totals or a short summary from people who separately allowed that. If too few allow it, we say so. This small check does not show the site works for everyone. We list every safety worry and what we did.'
WHERE `id` = 'CFJ-A004';
--> statement-breakpoint
UPDATE `action_cards`
SET `stop_condition` = 'Stop after five replies or on the closing date shown, whichever comes first. Check the five replies. Make a replacement link only if a reply cannot be used. Stop sooner if the page breaks, a question upsets someone or anyone sends private details.'
WHERE `id` = 'CFJ-A004';
--> statement-breakpoint
UPDATE `repairs`
SET `safeguards` = 'Test the page, not the person. This is a small friends-and-peers check, not proof that the site works for everyone. Ask for no name, email, diagnosis, life story or case details. Record no screen, voice or face. Keep full replies private. Publish only allowed nameless totals or a short summary. Anyone may stop at any time. Do not change the home page while replies come in. Stop after five replies or on the review date shown.'
WHERE `id` = 'CFJ-R002';
--> statement-breakpoint
UPDATE `repairs`
SET `summary` = 'This small test asks whether a new visitor can tell what the site is and what to do next. It asks for no name, email or personal story.'
WHERE `id` = 'CFJ-R002';
