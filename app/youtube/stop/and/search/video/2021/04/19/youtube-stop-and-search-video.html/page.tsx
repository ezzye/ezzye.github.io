import { permanentRedirect } from 'next/navigation';

export default function LegacyVideoPage() {
  permanentRedirect('/archive');
}
