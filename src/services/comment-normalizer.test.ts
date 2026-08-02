import {
  normalizeDiscussionComment,
  normalizeDiscussionComments,
  normalizeDiscussionModerationReport,
  type DiscussionCommentWire,
} from './comment-normalizer';

const comment = (identifier: Partial<Pick<DiscussionCommentWire, 'id' | '_id'>>): DiscussionCommentWire => ({
  ...identifier,
  content: 'Need help with this lesson',
  isAnonymous: false,
  likes: [],
  createdAt: '2026-08-01T00:00:00.000Z',
  updatedAt: '2026-08-01T00:00:00.000Z',
});

describe('discussion comment API normalization', () => {
  it('maps the backend public id to the stable frontend _id', () => {
    expect(normalizeDiscussionComment(comment({ id: 'comment-1' }))).toMatchObject({
      id: 'comment-1',
      _id: 'comment-1',
    });
  });

  it('keeps compatibility with legacy _id responses', () => {
    expect(normalizeDiscussionComment(comment({ _id: 'comment-legacy' }))).toMatchObject({
      id: 'comment-legacy',
      _id: 'comment-legacy',
    });
  });

  it('deduplicates list entries by their canonical identifier', () => {
    const normalized = normalizeDiscussionComments([
      comment({ id: 'comment-1' }),
      comment({ _id: 'comment-1' }),
      comment({ id: 'comment-2' }),
    ]);

    expect(normalized.map((item) => item._id)).toEqual(['comment-1', 'comment-2']);
  });

  it('normalizes nested comments in moderation reports', () => {
    const report = normalizeDiscussionModerationReport({
      id: 'report-1',
      reason: 'SPAM',
      status: 'OPEN',
      createdAt: '2026-08-01T00:00:00.000Z',
      comment: comment({ id: 'comment-1' }),
    });

    expect(report.comment._id).toBe('comment-1');
  });

  it('rejects missing or conflicting identifiers', () => {
    expect(() => normalizeDiscussionComment(comment({}))).toThrow('missing a stable identifier');
    expect(() => normalizeDiscussionComment(comment({ id: 'public-id', _id: 'other-id' }))).toThrow(
      'conflicting id and _id',
    );
  });
});
