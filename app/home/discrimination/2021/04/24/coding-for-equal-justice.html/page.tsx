import { permanentRedirect } from 'next/navigation';

export default function LegacyEqualJusticePage() {
  permanentRedirect('/archive');
}
