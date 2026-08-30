CREATE TABLE `action_cards` (
	`id` text PRIMARY KEY NOT NULL,
	`repair_id` text NOT NULL,
	`title` text NOT NULL,
	`intended_output` text NOT NULL,
	`why_it_matters` text NOT NULL,
	`time_size` text NOT NULL,
	`skills_needed` text NOT NULL,
	`location_mode` text NOT NULL,
	`owner_name` text NOT NULL,
	`reviewer_name` text NOT NULL,
	`capacity` integer NOT NULL,
	`status` text NOT NULL,
	`evidence_required` text NOT NULL,
	`review_date` text NOT NULL,
	`stop_condition` text NOT NULL,
	`sort_order` integer DEFAULT 0 NOT NULL,
	FOREIGN KEY (`repair_id`) REFERENCES `repairs`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_actions_repair_sort` ON `action_cards` (`repair_id`,`sort_order`);--> statement-breakpoint
CREATE INDEX `idx_actions_status` ON `action_cards` (`status`);--> statement-breakpoint
CREATE TABLE `action_offers` (
	`id` text PRIMARY KEY NOT NULL,
	`action_id` text NOT NULL,
	`chosen_name` text NOT NULL,
	`email` text NOT NULL,
	`contribution` text NOT NULL,
	`accessibility_need` text,
	`covenant_version` text NOT NULL,
	`consent_contact` integer DEFAULT false NOT NULL,
	`status` text NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`action_id`) REFERENCES `action_cards`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_offers_action_status` ON `action_offers` (`action_id`,`status`);--> statement-breakpoint
CREATE TABLE `appeals` (
	`id` text PRIMARY KEY NOT NULL,
	`item_reference` text NOT NULL,
	`request_type` text NOT NULL,
	`explanation` text NOT NULL,
	`evidence_links` text NOT NULL,
	`email` text NOT NULL,
	`accessibility_need` text,
	`status` text NOT NULL,
	`reviewer_id` text,
	`decision_note` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_appeals_status_date` ON `appeals` (`status`,`created_at`);--> statement-breakpoint
CREATE TABLE `corrections` (
	`id` text PRIMARY KEY NOT NULL,
	`repair_id` text,
	`item_reference` text NOT NULL,
	`summary` text NOT NULL,
	`changed_at` text NOT NULL,
	`is_published` integer DEFAULT false NOT NULL,
	FOREIGN KEY (`repair_id`) REFERENCES `repairs`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `idx_corrections_public_date` ON `corrections` (`is_published`,`changed_at`);--> statement-breakpoint
CREATE TABLE `outcomes` (
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
	`published_at` text NOT NULL,
	`is_published` integer DEFAULT false NOT NULL,
	`sort_order` integer DEFAULT 0 NOT NULL,
	FOREIGN KEY (`repair_id`) REFERENCES `repairs`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_outcomes_repair_sort` ON `outcomes` (`repair_id`,`sort_order`);--> statement-breakpoint
CREATE INDEX `idx_outcomes_public_date` ON `outcomes` (`is_published`,`published_at`);--> statement-breakpoint
CREATE TABLE `proposals` (
	`id` text PRIMARY KEY NOT NULL,
	`working_title` text NOT NULL,
	`problem` text NOT NULL,
	`broad_location` text,
	`affected_groups` text NOT NULL,
	`evidence_state` text NOT NULL,
	`source_links` text NOT NULL,
	`desired_change` text NOT NULL,
	`first_step` text NOT NULL,
	`help_needed` text NOT NULL,
	`relationship` text NOT NULL,
	`chosen_name` text,
	`email` text,
	`contact_preference` text,
	`accessibility_need` text,
	`privacy_concern` text,
	`consent_contact` integer DEFAULT false NOT NULL,
	`consent_redacted_draft` integer DEFAULT false NOT NULL,
	`background_only` integer DEFAULT true NOT NULL,
	`consent_credit` integer DEFAULT false NOT NULL,
	`consent_ai` integer DEFAULT false NOT NULL,
	`status` text NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_proposals_status_date` ON `proposals` (`status`,`created_at`);--> statement-breakpoint
CREATE INDEX `idx_proposals_email` ON `proposals` (`email`);--> statement-breakpoint
CREATE TABLE `rate_limits` (
	`key` text PRIMARY KEY NOT NULL,
	`count` integer NOT NULL,
	`reset_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_rate_limits_reset` ON `rate_limits` (`reset_at`);--> statement-breakpoint
CREATE TABLE `repair_updates` (
	`id` text PRIMARY KEY NOT NULL,
	`repair_id` text NOT NULL,
	`title` text NOT NULL,
	`body` text NOT NULL,
	`evidence_changed` text NOT NULL,
	`remains_unfair` text NOT NULL,
	`next_owner` text NOT NULL,
	`next_review_date` text NOT NULL,
	`published_at` text NOT NULL,
	`is_published` integer DEFAULT false NOT NULL,
	FOREIGN KEY (`repair_id`) REFERENCES `repairs`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_updates_repair_date` ON `repair_updates` (`repair_id`,`published_at`);--> statement-breakpoint
CREATE TABLE `repairs` (
	`id` text PRIMARY KEY NOT NULL,
	`slug` text NOT NULL,
	`title` text NOT NULL,
	`summary` text NOT NULL,
	`stage` text NOT NULL,
	`scope` text NOT NULL,
	`affected_groups` text NOT NULL,
	`known_facts` text NOT NULL,
	`unknowns` text NOT NULL,
	`disputed_claims` text NOT NULL,
	`desired_change` text NOT NULL,
	`smallest_test` text NOT NULL,
	`safeguards` text NOT NULL,
	`owner_name` text NOT NULL,
	`partner_name` text,
	`review_date` text NOT NULL,
	`updated_at` text NOT NULL,
	`is_demo` integer DEFAULT false NOT NULL,
	`is_published` integer DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_repairs_slug` ON `repairs` (`slug`);--> statement-breakpoint
CREATE INDEX `idx_repairs_public_stage` ON `repairs` (`is_published`,`stage`);--> statement-breakpoint
INSERT INTO `repairs` (`id`, `slug`, `title`, `summary`, `stage`, `scope`, `affected_groups`, `known_facts`, `unknowns`, `disputed_claims`, `desired_change`, `smallest_test`, `safeguards`, `owner_name`, `partner_name`, `review_date`, `updated_at`, `is_demo`, `is_published`) VALUES ('CFJ-R001', 'public-consultation', 'Make one public consultation easier to understand', 'Test whether a 250-word plain-language guide helps readers find the proposed decision, deadline and response route without assistance.', 'acting', 'A fictional council consultation notice created only to demonstrate the repair process. It does not describe a real authority, policy or resident.', 'Adults who may face dense official language, limited time, cognitive load, low digital confidence or communication barriers.', 'A consultation response requires a reader to identify what may change, the deadline and how to respond.', 'Whether a plain-language guide changes real participation, trust or decision quality.', 'There are no disputed claims about a real institution because the notice and test records are fictional.', 'A reader can identify the decision, deadline and response route without assistance.', 'Create a 250-word guide and test it with five consenting adult readers.', 'No personal data; no real authority; demonstration label on every page; stop if test material contains identifiable information.', 'Coding for Justice', NULL, '2026-09-13', '2026-08-30T09:00:00.000Z', 1, 1);--> statement-breakpoint
INSERT INTO `action_cards` (`id`, `repair_id`, `title`, `intended_output`, `why_it_matters`, `time_size`, `skills_needed`, `location_mode`, `owner_name`, `reviewer_name`, `capacity`, `status`, `evidence_required`, `review_date`, `stop_condition`, `sort_order`) VALUES ('CFJ-A001', 'CFJ-R001', 'Review the 250-word guide', 'A short response identifying the proposed decision, deadline and response route, plus one confusing phrase.', 'The repair must work for readers rather than only for its author.', '20 minutes', 'Careful reading; no specialist knowledge', 'Remote', 'Workshop editor', 'Accessibility reviewer', 2, 'ready', 'Completed three-question review with no personal information.', '2026-09-06', 'Stop when two suitable reviews are accepted or if the source notice changes.', 1);--> statement-breakpoint
INSERT INTO `action_cards` (`id`, `repair_id`, `title`, `intended_output`, `why_it_matters`, `time_size`, `skills_needed`, `location_mode`, `owner_name`, `reviewer_name`, `capacity`, `status`, `evidence_required`, `review_date`, `stop_condition`, `sort_order`) VALUES ('CFJ-A002', 'CFJ-R001', 'Check keyboard and 200% zoom use', 'A pass or failure note for keyboard order, focus visibility, reflow and text enlargement.', 'Plain language is not useful if the interface itself excludes people.', '1 hour', 'Accessibility testing', 'Remote', 'Workshop developer', 'Independent accessibility reviewer', 1, 'doing', 'Browser, viewport and observed result for each check.', '2026-09-06', 'Stop and repair immediately if a blocking accessibility defect is found.', 2);--> statement-breakpoint
INSERT INTO `action_cards` (`id`, `repair_id`, `title`, `intended_output`, `why_it_matters`, `time_size`, `skills_needed`, `location_mode`, `owner_name`, `reviewer_name`, `capacity`, `status`, `evidence_required`, `review_date`, `stop_condition`, `sort_order`) VALUES ('CFJ-A003', 'CFJ-R001', 'Design the real partner test', 'A one-page protocol with consent, baseline, success measure and stop rule.', 'The fictional demonstration must not be mistaken for evidence that the method works in public life.', 'Half-day', 'Research design or service design', 'Remote', 'Workshop lead', 'Affected-person reviewer', 2, 'ready', 'Protocol approved by a partner and affected-person reviewer.', '2026-09-13', 'Stop if there is no adoption owner or the test would require sensitive case data.', 3);--> statement-breakpoint
INSERT INTO `outcomes` (`id`, `repair_id`, `title`, `activity`, `observed_effect`, `evidence`, `evidence_url`, `confidence`, `verifier_name`, `who_benefited`, `what_did_not_change`, `learning`, `published_at`, `is_published`, `sort_order`) VALUES ('CFJ-O001', 'CFJ-R001', 'The deadline needed to move', 'Five fictional reader records were created to test the demonstration guide.', 'Four records found all three facts; one missed the deadline until it was moved into the opening paragraph.', 'Demonstration records only. No real people participated and no claim about public participation can be made.', NULL, 'claimed', 'Coding for Justice demonstration', 'The fictional readers represented by the test scenarios.', 'There is no evidence that the guide increases real consultation participation or changes an institutional decision.', 'Completed activity is not the same as demonstrated social effect. The real pilot needs consenting readers, a baseline and an external owner.', '2026-08-30T09:00:00.000Z', 1, 1);--> statement-breakpoint
INSERT INTO `repair_updates` (`id`, `repair_id`, `title`, `body`, `evidence_changed`, `remains_unfair`, `next_owner`, `next_review_date`, `published_at`, `is_published`) VALUES ('CFJ-U001', 'CFJ-R001', 'The workshop is open for a bounded review', 'The fictional notice, guide and initial test record are ready. The next step is a human review of the wording and interface.', 'The demonstration now has an explicit scope, evidence label and stop condition.', 'No real public-service process has yet been repaired.', 'Workshop editor', '2026-09-06', '2026-08-30T09:00:00.000Z', 1);
