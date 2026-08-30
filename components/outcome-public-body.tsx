import type { Outcome } from '@/lib/types';

type PublicOutcome = Pick<
  Outcome,
  | 'title'
  | 'activity'
  | 'observedEffect'
  | 'evidence'
  | 'evidenceUrl'
  | 'confidence'
  | 'verifierName'
  | 'whoBenefited'
  | 'whatDidNotChange'
  | 'learning'
>;

export function OutcomePublicBody({ outcome }: { outcome: PublicOutcome }) {
  return (
    <div className="outcome-content">
      <h3>{outcome.title}</h3>
      <div>
        <p className="mini-label">What we did</p>
        <p>{outcome.activity}</p>
      </div>
      <div>
        <p className="mini-label">What changed</p>
        <p>{outcome.observedEffect}</p>
      </div>
      <div>
        <p className="mini-label">Our proof</p>
        <p>{outcome.evidence}</p>
        {outcome.evidenceUrl && (
          <p>
            <a
              className="repair-link"
              href={outcome.evidenceUrl}
              rel="noreferrer"
              target="_blank"
            >
              Open the public proof
            </a>
          </p>
        )}
      </div>
      <div>
        <p className="mini-label">How sure are we?</p>
        <p>{outcome.confidence.replaceAll('_', ' ')}</p>
      </div>
      <div>
        <p className="mini-label">Who checked it?</p>
        <p>{outcome.verifierName}</p>
      </div>
      <div>
        <p className="mini-label">Who did this help?</p>
        <p>{outcome.whoBenefited}</p>
      </div>
      <div className="outcome-limit">
        <p className="mini-label">What did not change</p>
        <p>{outcome.whatDidNotChange}</p>
      </div>
      <div>
        <p className="mini-label">What we learnt and what happens next</p>
        <p>{outcome.learning}</p>
      </div>
      <div>
        <p className="mini-label">Where this result came from</p>
        <p>Public proof only. No private reply was used.</p>
      </div>
    </div>
  );
}
