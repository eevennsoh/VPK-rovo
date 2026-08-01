import type { ComponentProps } from "react";

import type { TWGAppstackProps } from "./twg-appstack";

type Assert<T extends true> = T;
type IsAssignable<Source, Target> = Source extends Target ? true : false;
type ForwardedDivProps = {
	sources: [];
} & Pick<ComponentProps<"div">, "children">;

// A caller forwarding a div prop bag must not be able to supply children that
// the app stack discards while rendering its sources.
type RejectsForwardedChildren = Assert<
	IsAssignable<ForwardedDivProps, TWGAppstackProps> extends false ? true : false
>;

export type TWGAppstackChildrenContract = RejectsForwardedChildren;
