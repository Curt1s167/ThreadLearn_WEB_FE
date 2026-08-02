import type { CodeAssignment } from '../types';

export type CodeAssignmentWire = Omit<CodeAssignment, '_id'> & {
  id?: string;
  _id?: string;
};

const nonEmptyId = (value?: string): string | undefined => {
  const normalized = value?.trim();
  return normalized || undefined;
};

/** Keeps one canonical identifier at the API boundary for React keys and URLs. */
export function normalizeCodeAssignment(assignment: CodeAssignmentWire): CodeAssignment {
  const publicId = nonEmptyId(assignment.id);
  const mongoId = nonEmptyId(assignment._id);

  if (publicId && mongoId && publicId !== mongoId) {
    throw new Error('Code assignment contains conflicting id and _id values.');
  }

  const canonicalId = publicId ?? mongoId;
  if (!canonicalId) {
    throw new Error('Code assignment is missing a stable identifier.');
  }

  return { ...assignment, id: publicId ?? canonicalId, _id: canonicalId };
}

export function normalizeCodeAssignments(assignments: CodeAssignmentWire[]): CodeAssignment[] {
  const seen = new Set<string>();

  return assignments.reduce<CodeAssignment[]>((normalized, assignment) => {
    const item = normalizeCodeAssignment(assignment);
    if (seen.has(item._id)) return normalized;
    seen.add(item._id);
    normalized.push(item);
    return normalized;
  }, []);
}
