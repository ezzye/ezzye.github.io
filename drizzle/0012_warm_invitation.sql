UPDATE `action_cards`
SET
	`response_questions` = '["After reading the home page, how would you explain Coding for Justice to someone else?","What did the page add, clear up or leave muddled about the goal?","What would you click first?","How does the page feel? What on the page made it feel that way?","Did anything feel unclear, unsafe or pushy?"]',
	`why_it_matters` = 'The invitation gives people the broad aim. The page still needs to make that aim clear, show a useful next step and feel warm rather than official.'
WHERE `id` = 'CFJ-A004'
	AND `repair_id` = 'CFJ-R002'
	AND `participation_mode` = 'direct_response'
	AND `response_path` = '/tests/home-page'
	AND `is_preview` = 1
	AND `status` = 'ready'
	AND `pilot_terms_approved_at` IS NULL
	AND `pilot_approval_snapshot` IS NULL
	AND `why_it_matters` = 'If people cannot say what the site is or what to click, the page is still getting in their way.'
	AND `response_questions` = '["What do you think this site is?","Who might find this site useful, and why?","What would you click first?","How does the page feel? What on the page made it feel that way?","Did anything feel unclear, unsafe or pushy?"]'
	AND EXISTS (
		SELECT 1
		FROM `repairs`
		WHERE `id` = 'CFJ-R002' AND `is_published` = 1 AND `is_demo` = 0
	)
	AND NOT EXISTS (
		SELECT 1 FROM `action_invites` WHERE `action_id` = 'CFJ-A004'
	)
	AND NOT EXISTS (
		SELECT 1 FROM `action_responses` WHERE `action_id` = 'CFJ-A004'
	);
