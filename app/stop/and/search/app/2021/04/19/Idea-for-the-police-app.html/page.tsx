import { permanentRedirect } from 'next/navigation';

export default function LegacyPoliceAppPage() {
  permanentRedirect('/archive');
}
