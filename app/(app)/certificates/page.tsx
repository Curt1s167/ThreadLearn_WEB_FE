import type { Metadata } from 'next';
import { CertificatesPage } from '@/features/certificates/CertificatesPage';

export const metadata: Metadata = {
  title: 'Certificates',
  description: 'View, download, and verify your ThreadLearn course certificates.',
};

export default function Page() {
  return <CertificatesPage />;
}

