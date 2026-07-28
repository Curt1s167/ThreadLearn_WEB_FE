import type { Metadata } from 'next';
import { PublicCertificateVerifyPage } from '@/features/certificates/PublicCertificateVerifyPage';

export const metadata: Metadata = {
  title: 'Verify certificate',
  description: 'Verify an official ThreadLearn course completion certificate.',
};

export default function Page() {
  return <PublicCertificateVerifyPage />;
}
