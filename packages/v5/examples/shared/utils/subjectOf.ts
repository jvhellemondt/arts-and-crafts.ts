import type { Tag } from "@core/shapes/Tag.ts";

/**
 * Returns the value of the first tag with the given `key`, or `undefined` when
 * no such tag is present. Used to recover a subject identifier from an event's
 * tags on the read side, where the originating command is no longer available.
 */
export function subjectOf(tags: readonly Tag[], key: string): string | undefined {
  return tags.find((tag) => tag.key === key)?.value;
}
