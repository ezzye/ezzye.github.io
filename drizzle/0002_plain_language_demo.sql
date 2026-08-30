UPDATE `repairs`
SET
  `title` = 'Make a council web page easier to read',
  `summary` = 'A made-up council page hides three key facts: what may change, the last day to reply and where to send a reply.',
  `scope` = 'This is a made-up council page. It is here to show how the site works. It is not about a real town or person.',
  `affected_groups` = 'People who find long official pages hard to read, use a phone, need more time or have trouble with dense words.',
  `known_facts` = 'A reader needs to find three things: what may change, the last day to reply and where to send a reply.',
  `unknowns` = 'We do not know if a short guide would help more people reply to a real council page.',
  `disputed_claims` = 'There is no real council or claim to argue about. The whole page is made up.',
  `desired_change` = 'A reader can find all three key facts without help.',
  `smallest_test` = 'Write a short guide. Ask five people if they can find the three key facts.',
  `safeguards` = 'Use no names or private facts. Name no real council. Stop if any real person can be known from the page.'
WHERE `id` = 'CFJ-R001' AND `is_demo` = 1;
--> statement-breakpoint
UPDATE `action_cards`
SET
  `title` = 'Read the guide and mark what is hard to follow',
  `intended_output` = 'Write down the three key facts and mark one bit that is hard to follow.',
  `why_it_matters` = 'The guide must make sense to a reader, not just to the person who wrote it.',
  `skills_needed` = 'Careful reading. No expert skill needed.',
  `location_mode` = 'At home',
  `owner_name` = 'Guide writer',
  `reviewer_name` = 'Access checker',
  `evidence_required` = 'Three short answers with no names or private facts.',
  `stop_condition` = 'Stop after two clear replies, or if the made-up page changes.'
WHERE `id` = 'CFJ-A001';
--> statement-breakpoint
UPDATE `action_cards`
SET
  `title` = 'Try it with a keyboard and text twice the size',
  `intended_output` = 'Say what works and what breaks when you use only a keyboard and make the text twice as big.',
  `why_it_matters` = 'Clear words do not help if the page itself is hard to use.',
  `location_mode` = 'At home',
  `owner_name` = 'Site maker',
  `reviewer_name` = 'A second access checker',
  `evidence_required` = 'Name the browser and say what worked or broke.',
  `stop_condition` = 'Stop if the page cannot be used. Fix that fault before doing more.'
WHERE `id` = 'CFJ-A002';
--> statement-breakpoint
UPDATE `action_cards`
SET
  `title` = 'Plan a safe test with a real group',
  `intended_output` = 'One page that says who takes part, what they agree to, what success means and when to stop.',
  `why_it_matters` = 'A made-up test cannot prove that the idea works for real people.',
  `skills_needed` = 'Planning a fair test with people',
  `location_mode` = 'At home',
  `owner_name` = 'Test lead',
  `reviewer_name` = 'A person from the group',
  `evidence_required` = 'The group and the person who checks the test both say yes.',
  `stop_condition` = 'Stop if no group will use the result, or if the test needs private case files.'
WHERE `id` = 'CFJ-A003';
--> statement-breakpoint
UPDATE `outcomes`
SET
  `title` = 'In the made-up test, putting the date first worked better',
  `activity` = 'We made five pretend reader notes and used them to check the guide.',
  `observed_effect` = 'Four found all three facts. One missed the last day to reply until we put it in the first paragraph.',
  `evidence` = 'This was made up. No real people took part, so it proves nothing about a real council page.',
  `verifier_name` = 'Coding for Justice made-up test',
  `who_benefited` = 'Only the pretend readers in the example.',
  `what_did_not_change` = 'We do not know if the guide would help more real people reply or change a real choice.',
  `learning` = 'Doing a task is not the same as helping people. A real test needs real readers who say yes and a group that will use the result.'
WHERE `id` = 'CFJ-O001';
--> statement-breakpoint
UPDATE `repair_updates`
SET
  `title` = 'The made-up page is ready to check',
  `body` = 'The made-up council page and short guide are ready. The next step is for a person to check the words and the page.',
  `evidence_changed` = 'The example now says what it covers, what we saw and when to stop.',
  `remains_unfair` = 'No real form, rule or service has been fixed yet.',
  `next_owner` = 'Guide writer'
WHERE `id` = 'CFJ-U001';
