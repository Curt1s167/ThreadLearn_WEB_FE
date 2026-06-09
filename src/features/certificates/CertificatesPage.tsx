'use client';

import React from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { Award, BookOpen, RefreshCw, ShieldCheck } from 'lucide-react';
import { certificatesService } from '../../services';
import { EmptyState, Skeleton } from '../../components/shared';
import { DemoPageRoot } from '../ui-reskin/demo-ui';
import { CertificateActions } from './CertificateActions';
import { CertificateArtwork } from './CertificateArtwork';

export function CertificatesPage() {
  const {
    data: certificates = [],
    isLoading,
    isError,
    isFetching,
    refetch,
  } = useQuery({
    queryKey: ['certificates'],
    queryFn: certificatesService.listMine,
    retry: 1,
  });

  const validCount = certificates.filter((certificate) => certificate.status === 'valid').length;

  return (
    <DemoPageRoot>
      <section className="certificate-page-hero">
        <div>
          <p className="certificate-page-kicker">Learning credentials</p>
          <h1>Certificates you have earned.</h1>
          <p>
            Every completed course creates a verifiable ThreadLearn credential that you can
            download and share.
          </p>
        </div>
        <div className="certificate-page-metric" aria-label={`${validCount} valid certificates`}>
          <ShieldCheck size={22} />
          <strong>{isLoading ? '...' : validCount}</strong>
          <span>valid credentials</span>
        </div>
      </section>

      {isLoading ? (
        <div className="space-y-5">
          <Skeleton className="h-[34rem] rounded-none" count={2} />
        </div>
      ) : isError ? (
        <EmptyState
          icon={<Award size={36} />}
          title="Could not load your certificates"
          description="The certificate service did not respond. Try again in a moment."
          action={(
            <button
              type="button"
              className="btn-primary"
              onClick={() => refetch()}
              disabled={isFetching}
            >
              <RefreshCw size={15} className={isFetching ? 'animate-spin' : ''} />
              Try again
            </button>
          )}
        />
      ) : certificates.length === 0 ? (
        <EmptyState
          icon={<Award size={36} />}
          title="Your first certificate starts with a completed course"
          description="Finish every lesson in a course and your credential will appear here automatically."
          action={(
            <Link href="/courses" className="btn-primary">
              <BookOpen size={15} />
              Browse courses
            </Link>
          )}
        />
      ) : (
        <div className="space-y-10">
          {certificates.map((certificate) => (
            <section key={certificate.certificateCode} className="certificate-record">
              {certificate.status === 'expired' ? (
                <div className="certificate-expired-notice">
                  This credential expired on{' '}
                  {certificate.expiresAt
                    ? new Date(certificate.expiresAt).toLocaleDateString()
                    : 'an unspecified date'}
                  .
                </div>
              ) : null}
              <CertificateArtwork certificate={certificate} />
              <CertificateActions certificate={certificate} />
            </section>
          ))}
        </div>
      )}
    </DemoPageRoot>
  );
}

