import type { Tag } from "@core/shapes/Tag.ts";

/** Tag key that scopes the dynamic consistency boundary of one membership. */
export const MEMBERSHIP_TAG_KEY = "membership";

/** The boundary tag for the membership identified by `id`. */
export const membershipTag = (id: string): Tag => ({ key: MEMBERSHIP_TAG_KEY, value: id });
