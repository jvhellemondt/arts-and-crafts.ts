/**
 * Encapsulates a single business rule as a named, testable, composable predicate.
 *
 * An EvaluateCandidate answers one question about a candidate: does it satisfy
 * this rule? It keeps business rules explicit, reusable across use cases,
 * and independently testable without going through a decider.
 *
 * @example
 * const membershipIsInitial: EvaluateCandidate<MembershipState> = {
 *   isSatisfiedBy: (candidate) => candidate.status === 'initial',
 * };
 *
 * if (!membershipIsInitial.isSatisfiedBy(state)) {
 *   return { accepted: false, rejection: { code: 'MEMBERSHIP_ALREADY_EXISTS', reason: '...' } };
 * }
 */
export interface EvaluateCandidate<TCandidate> {
  isSatisfiedBy(candidate: TCandidate): boolean;
}
