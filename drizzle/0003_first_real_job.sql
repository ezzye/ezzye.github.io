CREATE TABLE `action_responses` (
	`id` text PRIMARY KEY NOT NULL,
	`action_id` text NOT NULL,
	`questions` text NOT NULL,
	`answers` text NOT NULL,
	`consent_anonymous_summary` integer DEFAULT false NOT NULL,
	`status` text DEFAULT 'new' NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`action_id`) REFERENCES `action_cards`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_action_responses_action_status` ON `action_responses` (`action_id`,`status`);--> statement-breakpoint
ALTER TABLE `action_cards` ADD `compensation` text DEFAULT 'Pay not set — job cannot open' NOT NULL;--> statement-breakpoint
ALTER TABLE `action_cards` ADD `participation_mode` text DEFAULT 'offer' NOT NULL;--> statement-breakpoint
ALTER TABLE `action_cards` ADD `response_questions` text DEFAULT '[]' NOT NULL;--> statement-breakpoint
UPDATE `action_cards`
SET `compensation` = 'Not applicable — made-up example'
WHERE `repair_id` = 'CFJ-R001';--> statement-breakpoint
INSERT INTO `repairs` (
	`id`, `slug`, `title`, `summary`, `stage`, `scope`, `affected_groups`,
	`known_facts`, `unknowns`, `disputed_claims`, `desired_change`,
	`smallest_test`, `safeguards`, `owner_name`, `partner_name`, `review_date`,
	`updated_at`, `is_demo`, `is_published`
) VALUES (
	'CFJ-R002',
	'read-the-home-page',
	'Make the home page clear to a new visitor',
	'This owner-only preview asks whether a new visitor can tell what the site is and what to do next. Do not invite testers yet.',
	'acting',
	'The Coding for Justice home page as it looks now. We are not testing the rest of the site yet.',
	'Anyone who gets lost in long, foggy or official-sounding web pages. No one has to prove this about themselves.',
	'The first version confused its first reader. We rewrote it around three plain questions: What is this? Why does it matter? What do I do?',
	'We do not know if someone who has never seen the plan can now answer those questions.',
	'We have no row to settle. We are testing the page, not the reader.',
	'Four out of five readers can say what the site is and what they would click next. Four out of five call it warm or welcoming. No one thinks they must share a private story in public.',
	'Ask five adults to look at the home page without reading the plan, then answer five short questions.',
	'Test the page, not the person. This is an unpaid friends-and-peers check, not proof that the site works for everyone. Ask for no name, email, diagnosis, life story or case details. Record no screen, voice or face. Keep full replies private. Publish only allowed nameless totals or a short summary. Anyone may stop at any time. Do not change the home page while replies come in. Stop after five replies or at the end of 6 September 2026.',
	'Coding for Justice',
	NULL,
	'2026-09-06',
	'2026-08-30T10:42:09.000Z',
	0,
	1
);--> statement-breakpoint
INSERT INTO `action_cards` (
	`id`, `repair_id`, `title`, `intended_output`, `why_it_matters`,
	`time_size`, `compensation`, `participation_mode`, `response_questions`,
	`skills_needed`, `location_mode`, `owner_name`, `reviewer_name`, `capacity`,
	`status`, `evidence_required`, `review_date`, `stop_condition`, `sort_order`
) VALUES (
	'CFJ-A004',
	'CFJ-R002',
	'Tell us if this home page makes sense',
	'Look at the home page. Then answer five short questions in your own words.',
	'If people cannot say what the site is or what to click, the page is still getting in their way.',
	'Up to 10 minutes',
	'Unpaid friends-and-peers check. Stop after 10 minutes. Spend no money.',
	'direct_response',
	'["What do you think this site is?","Who might find this site useful, and why?","What would you click first?","How does the page feel? What on the page made it feel that way?","Did anything feel unclear, unsafe or pushy?"]',
	'No special skill. Best if you did not help plan or build the site.',
	'At home, on your phone or computer',
	'Coding for Justice',
	'Site owner',
	5,
	'ready',
	'Five private replies. We count only the replies that allow nameless public totals. We say this small check does not show the site works for everyone. We list each safety worry and say what we did about it.',
	'2026-09-06',
	'Stop after five replies or at the end of 6 September 2026, whichever comes first. Check the five replies. Reopen one place only if a reply cannot be used. Stop sooner if the page breaks, a question upsets someone or anyone sends private details.',
	1
);
