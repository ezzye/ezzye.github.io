CREATE TABLE `retention_events` (
	`id` text PRIMARY KEY NOT NULL,
	`data_type` text NOT NULL,
	`trigger` text NOT NULL,
	`due_date` text NOT NULL,
	`records_deleted` integer NOT NULL,
	`completed_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_retention_events_date` ON `retention_events` (`completed_at`);--> statement-breakpoint
ALTER TABLE `action_responses` ADD `delete_after` text;
--> statement-breakpoint
CREATE TRIGGER `action_response_retention_required_insert`
BEFORE INSERT ON `action_responses`
WHEN NEW.`delete_after` IS NULL
  OR datetime(NEW.`delete_after`) IS NULL
  OR datetime(NEW.`delete_after`) <= datetime('now')
BEGIN
	SELECT RAISE(ABORT, 'A future deletion deadline is required');
END;
--> statement-breakpoint
CREATE TRIGGER `action_response_retention_cannot_extend_update`
BEFORE UPDATE OF `delete_after` ON `action_responses`
WHEN NEW.`delete_after` IS NULL
  OR datetime(NEW.`delete_after`) IS NULL
  OR OLD.`delete_after` IS NULL
  OR datetime(OLD.`delete_after`) IS NULL
  OR (
	datetime(NEW.`delete_after`) > datetime(OLD.`delete_after`)
  )
BEGIN
	SELECT RAISE(ABORT, 'The deletion deadline cannot be removed or extended');
END;
--> statement-breakpoint
CREATE TRIGGER `action_response_consent_required_insert`
BEFORE INSERT ON `action_responses`
WHEN NEW.`consent_private_use` != 1 OR NEW.`confirmed_adult` != 1
BEGIN
	SELECT RAISE(ABORT, 'Private-use consent and adult confirmation are required');
END;
--> statement-breakpoint
CREATE TRIGGER `action_response_consent_cannot_remove_update`
BEFORE UPDATE OF `consent_private_use`, `confirmed_adult` ON `action_responses`
WHEN NEW.`consent_private_use` != 1 OR NEW.`confirmed_adult` != 1
BEGIN
	SELECT RAISE(ABORT, 'Private-use consent and adult confirmation cannot be removed');
END;
