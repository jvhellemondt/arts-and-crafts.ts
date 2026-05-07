/**
 * Encapsulates a single business rule as a named, testable, composable predicate.
 *
 * A Specification answers one question about a candidate: does it satisfy
 * this rule? It keeps business rules explicit, reusable across use cases,
 * and independently testable without going through a decider.
 *
 * @example
 * const membershipIsInitial: Specification<MembershipState> = {
 *   isSatisfiedBy: (state) => state.status === 'initial',
 * };
 *
 * if (!membershipIsInitial.isSatisfiedBy(state)) {
 *   return { accepted: false, rejection: { code: 'MEMBERSHIP_ALREADY_EXISTS', reason: '...' } };
 * }
 */
export interface Specification<TCandidate> {
  isSatisfiedBy(candidate: TCandidate): boolean;
}
