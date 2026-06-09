import React from 'react';
import { ShieldCheck } from 'lucide-react';
import { BrandLogo } from '../../components/shared/BrandLogo';
import type { Certificate } from '../../types';

const formatDate = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Not available';
  return new Intl.DateTimeFormat('en-US', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(date);
};

const formatDuration = (minutes: number | null) => {
  if (!minutes || minutes <= 0) return 'Self-paced';
  if (minutes < 60) return `${minutes} minutes`;
  const hours = Math.round((minutes / 60) * 10) / 10;
  return `${hours} hours`;
};

export function CertificateArtwork({ certificate }: { certificate: Certificate }) {
  const isExpired = certificate.status === 'expired';
  const skills = (certificate.course.tags ?? []).slice(0, 5);
  const description =
    certificate.course.description ||
    'This credential confirms successful completion of the published course requirements recorded by ThreadLearn.';

  return (
    <div className="certificate-scroll-frame">
      <article
        className="certificate-artwork"
        aria-label={`Certificate of completion for ${certificate.course.title}`}
      >
        <aside className="certificate-rail">
          <BrandLogo variant="full" size="sm" onDark priority />

          <div className="certificate-rail-rule" />
          <div className="certificate-rail-count">
            <strong>1</strong>
            <span>Course</span>
          </div>

          <div className="certificate-rail-program">
            <p className="certificate-rail-label">Completed program</p>
            <h3>{certificate.course.title}</h3>
          </div>

          {skills.length > 0 ? (
            <div className="certificate-rail-skills">
              <p className="certificate-rail-label">Skills demonstrated</p>
              <ul>
                {skills.map((skill) => (
                  <li key={skill}>{skill}</li>
                ))}
              </ul>
            </div>
          ) : null}

          <div className="certificate-rail-meta">
            <div>
              <p className="certificate-rail-label">Issued</p>
              <p className="certificate-rail-value">{formatDate(certificate.issuedAt)}</p>
            </div>
            <div>
              <p className="certificate-rail-label">Certificate ID</p>
              <p className="certificate-code">{certificate.certificateCode}</p>
            </div>
          </div>
        </aside>

        <div className="certificate-main">
          <div className="certificate-rosette" aria-hidden="true">
            <span className="certificate-rosette-core">
              <ShieldCheck size={34} strokeWidth={1.4} />
            </span>
          </div>
          <div className="certificate-issuer-stamp">
            <ShieldCheck size={25} strokeWidth={1.5} />
            <div>
              <strong>ThreadLearn</strong>
              <span>Official learning record</span>
            </div>
          </div>

          <div className="certificate-copy">
            <div className="certificate-eyebrow-row">
              <p className="certificate-eyebrow">Certificate of completion</p>
              <span className={isExpired ? 'certificate-status-expired' : 'certificate-status-valid'}>
                {isExpired ? 'Expired' : 'Verified'}
              </span>
            </div>

            <p className="certificate-issued-date">{formatDate(certificate.issuedAt)}</p>
            <p className="certificate-intro">ThreadLearn confirms that</p>
            <h1 className="certificate-recipient">{certificate.recipientName}</h1>
            <div className="certificate-name-rule" />
            <p className="certificate-intro certificate-course-intro">
              has successfully completed the online course
            </p>
            <h2 className="certificate-course-title">{certificate.course.title}</h2>
            <p className="certificate-description">{description}</p>

            <dl className="certificate-details">
              <div>
                <dt>Completed</dt>
                <dd>{formatDate(certificate.completedAt)}</dd>
              </div>
              <div>
                <dt>Learning level</dt>
                <dd>{certificate.course.level || 'Open level'}</dd>
              </div>
              <div>
                <dt>Language</dt>
                <dd>{certificate.course.language || 'Not specified'}</dd>
              </div>
              <div>
                <dt>Course scope</dt>
                <dd>
                  {certificate.course.totalLessons
                    ? `${certificate.course.totalLessons} lessons`
                    : formatDuration(certificate.course.estimatedDuration)}
                </dd>
              </div>
            </dl>
          </div>

          <footer className="certificate-verification">
            <div>
              <p>Verify this credential</p>
              <span>{certificate.verificationUrl}</span>
              <small>
                This certificate attests to completion of an online ThreadLearn course. Verify
                the live record using the URL above.
              </small>
            </div>
            <div className="certificate-footer-meta">
              <p>Certificate ID</p>
              <span>{certificate.certificateCode}</span>
            </div>
          </footer>
        </div>
      </article>
    </div>
  );
}
