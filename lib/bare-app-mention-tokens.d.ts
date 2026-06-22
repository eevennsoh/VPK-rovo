export interface BareAppMentionAlias {
	readonly id: string;
	readonly name?: string | null;
}

export type BareAppMentionConverter = (text: string) => string;

export function convertBareAppMentionsToTokens(
	text: string,
	aliases: ReadonlyArray<BareAppMentionAlias>,
): string;

export function createBareAppMentionConverter(
	aliases: ReadonlyArray<BareAppMentionAlias>,
): BareAppMentionConverter;
