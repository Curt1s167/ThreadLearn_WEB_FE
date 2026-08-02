import type { Comment, DiscussionModerationReport } from '../types';

export type DiscussionCommentWire = Omit<Comment, '_id'> & {
  id?: string;
  _id?: string;
};

export type DiscussionModerationReportWire = Omit<DiscussionModerationReport, 'comment'> & {
  comment: DiscussionCommentWire;
};

const nonEmptyId = (value?: string): string | undefined => {
  const normalized = value?.trim();
  return normalized || undefined;
};

export function normalizeDiscussionComment(comment: DiscussionCommentWire): Comment {
  const publicId = nonEmptyId(comment.id);
  const mongoId = nonEmptyId(comment._id);

  if (publicId && mongoId && publicId !== mongoId) {
    throw new Error('Discussion comment contains conflicting id and _id values.');
  }

  const canonicalId = publicId ?? mongoId;
  if (!canonicalId) {
    throw new Error('Discussion comment is missing a stable identifier.');
  }

  return {
    ...comment,
    id: publicId ?? canonicalId,
    _id: canonicalId,
  };
}

export function normalizeDiscussionComments(comments: DiscussionCommentWire[]): Comment[] {
  const seen = new Set<string>();

  return comments.reduce<Comment[]>((normalized, comment) => {
    const item = normalizeDiscussionComment(comment);
    if (seen.has(item._id)) return normalized;
    seen.add(item._id);
    normalized.push(item);
    return normalized;
  }, []);
}

export function normalizeDiscussionModerationReport(
  report: DiscussionModerationReportWire,
): DiscussionModerationReport {
  return {
    ...report,
    comment: normalizeDiscussionComment(report.comment),
  };
}
