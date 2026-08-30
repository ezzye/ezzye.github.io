PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_outcomes` (
	`id` text PRIMARY KEY NOT NULL,
	`repair_id` text NOT NULL,
	`title` text NOT NULL,
	`activity` text NOT NULL,
	`observed_effect` text NOT NULL,
	`evidence` text NOT NULL,
	`evidence_url` text,
	`confidence` text NOT NULL,
	`verifier_name` text NOT NULL,
	`who_benefited` text NOT NULL,
	`what_did_not_change` text NOT NULL,
	`learning` text NOT NULL,
	`source_mode` text DEFAULT 'public_evidence_only' NOT NULL,
	`source_reply_count` integer DEFAULT 0 NOT NULL,
	`publication_revision` integer DEFAULT 1 NOT NULL,
	`reviewed_revision` integer,
	`reviewed_snapshot_hash` text,
	`published_snapshot_hash` text,
	`consent_checked_at` text,
	`created_at` text DEFAULT '' NOT NULL,
	`updated_at` text DEFAULT '' NOT NULL,
	`published_at` text,
	`is_published` integer DEFAULT false NOT NULL,
	`sort_order` integer DEFAULT 0 NOT NULL,
	FOREIGN KEY (`repair_id`) REFERENCES `repairs`(`id`) ON UPDATE no action ON DELETE cascade
);--> statement-breakpoint
INSERT INTO `__new_outcomes` (
	`id`, `repair_id`, `title`, `activity`, `observed_effect`, `evidence`,
	`evidence_url`, `confidence`, `verifier_name`, `who_benefited`,
	`what_did_not_change`, `learning`, `source_mode`, `source_reply_count`,
	`publication_revision`, `reviewed_revision`, `reviewed_snapshot_hash`,
	`published_snapshot_hash`, `consent_checked_at`, `created_at`, `updated_at`,
	`published_at`, `is_published`, `sort_order`
)
SELECT
	`id`, `repair_id`, `title`, `activity`, `observed_effect`, `evidence`,
	`evidence_url`, `confidence`, `verifier_name`, `who_benefited`,
	`what_did_not_change`, `learning`, 'public_evidence_only', 0, 1,
	NULL, NULL, NULL, NULL, `published_at`, `published_at`, `published_at`,
	`is_published`, `sort_order`
FROM `outcomes`;--> statement-breakpoint
DROP TABLE `outcomes`;--> statement-breakpoint
ALTER TABLE `__new_outcomes` RENAME TO `outcomes`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE INDEX `idx_outcomes_repair_sort` ON `outcomes` (`repair_id`,`sort_order`);--> statement-breakpoint
CREATE INDEX `idx_outcomes_public_date` ON `outcomes` (`is_published`,`published_at`);--> statement-breakpoint
CREATE UNIQUE INDEX `idx_outcomes_one_draft_per_repair` ON `outcomes` (`repair_id`) WHERE `is_published` = 0;--> statement-breakpoint
CREATE TABLE `outcome_response_sources` (
	`outcome_id` text NOT NULL,
	`response_id` text NOT NULL,
	`selected_at` text NOT NULL,
	PRIMARY KEY(`outcome_id`, `response_id`),
	FOREIGN KEY (`outcome_id`) REFERENCES `outcomes`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`response_id`) REFERENCES `action_responses`(`id`) ON UPDATE no action ON DELETE cascade
);--> statement-breakpoint
CREATE INDEX `idx_outcome_sources_response` ON `outcome_response_sources` (`response_id`);--> statement-breakpoint
CREATE TABLE `retention_sweeps` (
	`id` text PRIMARY KEY NOT NULL,
	`last_started_at` text,
	`last_completed_at` text,
	`last_records_deleted` integer DEFAULT 0 NOT NULL,
	`run_count` integer DEFAULT 0 NOT NULL,
	`last_error_at` text
);--> statement-breakpoint
ALTER TABLE `repair_updates` ADD `publication_revision` integer DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE `repair_updates` ADD `published_snapshot_hash` text;--> statement-breakpoint
ALTER TABLE `repairs` ADD `publication_revision` integer DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE `repairs` ADD `published_snapshot_hash` text;--> statement-breakpoint

UPDATE `action_cards`
SET `evidence_required` = 'Five private replies may guide a private page edit. They stay private and cannot be the source of a public result. Any public result needs separate public proof that anyone can open. We still record every safety worry and what we did.'
WHERE `id` = 'CFJ-A004' AND `evidence_required` LIKE '%nameless%';--> statement-breakpoint

UPDATE `repairs`
SET `desired_change` = 'A new visitor can say what the site is, who it is for and what they can do next, and the page feels warm rather than official. The private test guides page edits only; it is not proof for a public result.'
WHERE `id` = 'CFJ-R002' AND `desired_change` LIKE 'Four out of five readers%';--> statement-breakpoint

UPDATE `repairs`
SET `safeguards` = 'Test the page, not the person. This is a small friends-and-peers check, not proof that the site works for everyone. Ask for no name, email, diagnosis, life story or case details. Record no screen, voice or face. Keep full replies private and delete them by the stated date. They cannot be the source of a public result. Any public result needs separate public proof. Anyone may stop at any time. Do not change the home page while replies come in. Stop after five replies or on the review date shown.'
WHERE `id` = 'CFJ-R002' AND `safeguards` LIKE '%nameless%';--> statement-breakpoint

CREATE TRIGGER `repair_publication_revision_after_content_update`
AFTER UPDATE OF
	`slug`, `title`, `summary`, `scope`, `affected_groups`, `known_facts`,
	`unknowns`, `disputed_claims`, `desired_change`, `smallest_test`,
	`safeguards`, `owner_name`, `partner_name`, `review_date`
ON `repairs`
WHEN OLD.`is_published` = 0 AND NEW.`is_published` = 0
BEGIN
	UPDATE `repairs`
	SET `publication_revision` = OLD.`publication_revision` + 1,
		`published_snapshot_hash` = NULL
	WHERE `id` = NEW.`id`;
END;--> statement-breakpoint

CREATE TRIGGER `repair_publication_revision_after_action_insert`
AFTER INSERT ON `action_cards`
BEGIN
	UPDATE `repairs`
	SET `publication_revision` = `publication_revision` + 1,
		`published_snapshot_hash` = NULL
	WHERE `id` = NEW.`repair_id` AND `is_published` = 0;
END;--> statement-breakpoint

CREATE TRIGGER `repair_publication_revision_after_action_update`
AFTER UPDATE OF
	`repair_id`, `title`, `intended_output`, `why_it_matters`, `time_size`, `compensation`,
	`participation_mode`, `response_questions`, `response_path`, `is_preview`,
	`skills_needed`, `location_mode`, `owner_name`, `reviewer_name`, `capacity`,
	`status`, `evidence_required`, `review_date`, `stop_condition`, `sort_order`
ON `action_cards`
BEGIN
	UPDATE `repairs`
	SET `publication_revision` = `publication_revision` + 1,
		`published_snapshot_hash` = NULL
	WHERE `id` IN (OLD.`repair_id`, NEW.`repair_id`) AND `is_published` = 0;
END;--> statement-breakpoint

CREATE TRIGGER `repair_publication_revision_after_action_delete`
AFTER DELETE ON `action_cards`
BEGIN
	UPDATE `repairs`
	SET `publication_revision` = `publication_revision` + 1,
		`published_snapshot_hash` = NULL
	WHERE `id` = OLD.`repair_id` AND `is_published` = 0;
END;--> statement-breakpoint

CREATE TRIGGER `action_card_publication_identity_is_immutable`
BEFORE UPDATE OF `id`, `repair_id` ON `action_cards`
WHEN OLD.`id` != NEW.`id` OR OLD.`repair_id` != NEW.`repair_id`
BEGIN
	SELECT RAISE(ABORT, 'A job cannot be moved to another repair.');
END;--> statement-breakpoint

CREATE TRIGGER `repair_update_publication_revision_after_content_update`
AFTER UPDATE OF
	`repair_id`, `title`, `body`, `evidence_changed`, `remains_unfair`,
	`next_owner`, `next_review_date`
ON `repair_updates`
WHEN OLD.`is_published` = 0 AND NEW.`is_published` = 0
BEGIN
	UPDATE `repair_updates`
	SET `publication_revision` = OLD.`publication_revision` + 1,
		`published_snapshot_hash` = NULL
	WHERE `id` = NEW.`id`;
END;--> statement-breakpoint

CREATE TRIGGER `outcome_publication_revision_after_content_update`
AFTER UPDATE OF
	`repair_id`, `title`, `activity`, `observed_effect`, `evidence`, `evidence_url`,
	`confidence`, `verifier_name`, `who_benefited`, `what_did_not_change`,
	`learning`, `source_mode`, `sort_order`
ON `outcomes`
WHEN OLD.`is_published` = 0 AND NEW.`is_published` = 0
BEGIN
	UPDATE `outcomes`
	SET `publication_revision` = OLD.`publication_revision` + 1,
		`reviewed_revision` = NULL,
		`reviewed_snapshot_hash` = NULL,
		`consent_checked_at` = NULL,
		`published_snapshot_hash` = NULL
	WHERE `id` = NEW.`id`;
END;--> statement-breakpoint

CREATE TRIGGER `outcome_publication_revision_after_source_insert`
AFTER INSERT ON `outcome_response_sources`
BEGIN
	UPDATE `outcomes`
	SET `publication_revision` = `publication_revision` + 1,
		`reviewed_revision` = NULL,
		`reviewed_snapshot_hash` = NULL,
		`consent_checked_at` = NULL,
		`published_snapshot_hash` = NULL
	WHERE `id` = NEW.`outcome_id` AND `is_published` = 0;
END;--> statement-breakpoint

CREATE TRIGGER `outcome_publication_revision_after_source_delete`
AFTER DELETE ON `outcome_response_sources`
BEGIN
	UPDATE `outcomes`
	SET `publication_revision` = `publication_revision` + 1,
		`reviewed_revision` = NULL,
		`reviewed_snapshot_hash` = NULL,
		`consent_checked_at` = NULL,
		`published_snapshot_hash` = NULL
	WHERE `id` = OLD.`outcome_id` AND `is_published` = 0;
END;--> statement-breakpoint

CREATE TRIGGER `outcome_publication_revision_after_response_change`
AFTER UPDATE OF
	`action_id`, `invite_id`, `consent_private_use`, `consent_anonymous_summary`, `confirmed_adult`,
	`status`, `delete_after`, `updated_at`
ON `action_responses`
BEGIN
	UPDATE `outcomes`
	SET `publication_revision` = `publication_revision` + 1,
		`reviewed_revision` = NULL,
		`reviewed_snapshot_hash` = NULL,
		`consent_checked_at` = NULL,
		`published_snapshot_hash` = NULL
	WHERE `is_published` = 0
		AND `id` IN (
			SELECT `outcome_id` FROM `outcome_response_sources`
			WHERE `response_id` = NEW.`id`
		);
END;--> statement-breakpoint

CREATE TRIGGER `outcome_response_sources_are_immutable`
BEFORE UPDATE ON `outcome_response_sources`
BEGIN
	SELECT RAISE(ABORT, 'Replace outcome sources instead of editing them.');
END;--> statement-breakpoint

CREATE TRIGGER `action_response_answers_are_immutable`
BEFORE UPDATE OF `questions`, `answers` ON `action_responses`
WHEN OLD.`questions` != NEW.`questions` OR OLD.`answers` != NEW.`answers`
BEGIN
	SELECT RAISE(ABORT, 'Submitted replies cannot be edited.');
END;--> statement-breakpoint

CREATE TRIGGER `outcomes_cannot_start_public`
BEFORE INSERT ON `outcomes`
WHEN NEW.`is_published` = 1
BEGIN
	SELECT RAISE(ABORT, 'An outcome must start as a private draft.');
END;--> statement-breakpoint

CREATE TRIGGER `outcomes_require_exact_review_before_publication`
BEFORE UPDATE OF `is_published` ON `outcomes`
WHEN OLD.`is_published` = 0 AND NEW.`is_published` = 1 AND (
	NEW.`reviewed_revision` IS NULL
	OR NEW.`reviewed_revision` != NEW.`publication_revision`
	OR NEW.`reviewed_snapshot_hash` IS NULL
	OR NEW.`published_snapshot_hash` IS NULL
	OR NEW.`consent_checked_at` IS NULL
)
BEGIN
	SELECT RAISE(ABORT, 'The exact outcome draft must be reviewed before publication.');
END;
