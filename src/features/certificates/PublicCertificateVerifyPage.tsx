'use client';

import React from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { AlertTriangle, ArrowLeft, ShieldCheck, XCircle } from 'lucide-react';
import { BrandLogo } from '../../components/shared/BrandLogo';
import { certificatesService } from '../../services';
import { CertificateActions } from './CertificateActions';
import { CertificateArtwork } from './CertificateArtwork';

export function PublicCertificateVerifyPage() {
  const params = useParams<{ code: string }>();
  const code = String(params.code ?? '').trim();
  const {
    data: certificate,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ['certificate-verification', code],
    queryFn: () => certificatesService.verify(code),
    enabled: Boolean(code),
    retry: false,
  });

  return (
    <main id="main-content" className="certificate-public-page">
      <header className="certificate-public-header">
        <Link href="/" aria-label="ThreadLearn home">
          <BrandLogo variant="full" size="md" priority />
        </Link>
        <Link href="/" className="certificate-public-back">
          <ArrowLeft size={15} />
          Back to ThreadLearn
        </Link>
      </header>

      {isLoading ? (
        <section className="certificate-public-state" aria-live="polite">
          <div className="h-10 w-10 animate-pulse rounded-full bg-black/10" />
          <h1>Checking this credential</h1>
          <p>ThreadLearn is matching the certificate ID with its official record.</p>
        </section>
      ) : isError || !certificate ? (
        <section className="certificate-public-state certificate-public-invalid">
          <XCircle size={40} />
          <h1>Certificate not found</h1>
          <p>
            This certificate ID does not match a ThreadLearn credential. Check the link or ask
            the learner for the original verification URL.
          </p>
          <code>{code || 'No certificate ID provided'}</code>
        </section>
      ) : (
        <>
          <section
            className={
              certificate.status === 'expired'
                ? 'certificate-verification-banner certificate-verification-expired'
                : 'certificate-verification-banner certificate-verification-valid'
            }
          >
            {certificate.status === 'expired' ? (
              <AlertTriangle size={22} />
            ) : (
              <ShieldCheck size={22} />
            )}
            <div>
              <h1>
                {certificate.status === 'expired'
                  ? 'Credential record found, but expired'
                  : 'Verified ThreadLearn credential'}
              </h1>
              <p>
                Issued to {certificate.recipientName} for completing{' '}
                {certificate.course.title}.
              </p>
            </div>
          </section>

          <CertificateArtwork certificate={certificate} />
          <CertificateActions
            certificate={certificate}
            showVerificationLink={false}
            showPrint
          />
        </>
      )}

      <footer className="certificate-public-footer">
        Verification checks the live ThreadLearn record. A screenshot alone is not proof of
        validity.
      </footer>
    </main>
  );
}

