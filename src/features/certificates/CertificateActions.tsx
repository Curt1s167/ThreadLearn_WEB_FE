'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Check, Copy, Download, ExternalLink, Loader2, Printer } from 'lucide-react';
import { toast } from 'sonner';
import { certificatesService } from '../../services';
import type { Certificate } from '../../types';

export function CertificateActions({
  certificate,
  showVerificationLink = true,
  showPrint = false,
}: {
  certificate: Certificate;
  showVerificationLink?: boolean;
  showPrint?: boolean;
}) {
  const [downloading, setDownloading] = useState(false);
  const [copied, setCopied] = useState(false);

  const download = async () => {
    setDownloading(true);
    try {
      await certificatesService.savePdf(certificate.certificateCode);
      toast.success('Certificate PDF downloaded');
    } catch {
      toast.error('Could not download the certificate PDF');
    } finally {
      setDownloading(false);
    }
  };

  const copyVerificationLink = async () => {
    try {
      const verificationUrl = new URL(
        `/certificates/verify/${encodeURIComponent(certificate.certificateCode)}`,
        window.location.origin,
      ).toString();
      await navigator.clipboard.writeText(verificationUrl);
      setCopied(true);
      toast.success('Verification link copied');
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      toast.error('Could not copy the verification link');
    }
  };

  return (
    <div className="certificate-actions print:hidden">
      <button
        type="button"
        onClick={download}
        disabled={downloading}
        className="certificate-action-primary"
      >
        {downloading ? <Loader2 size={15} className="animate-spin" /> : <Download size={15} />}
        Download PDF
      </button>
      <button type="button" onClick={copyVerificationLink} className="certificate-action-secondary">
        {copied ? <Check size={15} /> : <Copy size={15} />}
        {copied ? 'Copied' : 'Copy verification link'}
      </button>
      {showVerificationLink ? (
        <Link
          href={`/certificates/verify/${encodeURIComponent(certificate.certificateCode)}`}
          className="certificate-action-secondary"
        >
          <ExternalLink size={15} />
          Verify
        </Link>
      ) : null}
      {showPrint ? (
        <button
          type="button"
          onClick={() => window.print()}
          className="certificate-action-secondary"
        >
          <Printer size={15} />
          Print
        </button>
      ) : null}
    </div>
  );
}
