import type { ComponentProps } from "react";

import type RovoP5 from "./index";

type Assert<T extends true> = T;
type IsAssignable<Source, Target> = Source extends Target ? true : false;
type ForwardedSectionChildren = Pick<ComponentProps<"section">, "children">;
type PublicRovoP5Props = ComponentProps<typeof RovoP5>;

// A caller forwarding a section prop bag must not be able to supply children
// that the fixed art surface discards while rendering its own composition.
type RejectsForwardedChildren = Assert<
	IsAssignable<ForwardedSectionChildren, PublicRovoP5Props> extends false ? true : false
>;

export type RovoP5ChildrenContract = RejectsForwardedChildren;
