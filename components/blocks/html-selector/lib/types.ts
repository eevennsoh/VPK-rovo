export type AgentId = "claude" | "codex" | "cursor" | "rovo";

export type SelectorPinScope = "everywhere" | "element";

export interface SelectorShortcut {
	key: string;
	metaOrCtrl?: boolean;
	shift?: boolean;
	alt?: boolean;
}

export interface HtmlSelectorShortcuts {
	activate: SelectorShortcut;
	comment: SelectorShortcut;
	copyAll: SelectorShortcut;
	copyElement: SelectorShortcut;
	send: SelectorShortcut;
	styles: SelectorShortcut;
}

export interface ElementContextPayload {
	outerHtmlSnippet: string;
	pagePath: string;
	rect: {
		bottom: number;
		height: number;
		left: number;
		right: number;
		top: number;
		width: number;
	};
	selector: string;
	tagSummary: string;
}

export interface SelectorStyleEdit {
	property: string;
	previousValue: string;
	nextValue: string;
}

export interface SelectorPinSavePayload extends ElementContextPayload {
	comment?: string;
	scope?: SelectorPinScope;
	styleEdits?: SelectorStyleEdit[];
	styleFindings?: StyleReport;
}

export interface SelectorPinsMeta {
	agent: AgentId;
	otherPagesCount: number;
	otherPagesPinCount: number;
}

export interface HtmlSelectorNotification {
	message: string;
	type: "pending" | "success" | "error";
}

export interface StyleDeclarationFinding {
	origin: "design-system" | "page-local" | "inline";
	property: string;
	selector: string;
	value: string;
	winner?: boolean;
	overridden?: boolean;
	override?: boolean;
	tokenOverride?: boolean;
}

export interface TokenChainFinding {
	computedValue: string;
	origin: "design-system" | "page-local" | "inline";
	property: string;
	selector: string;
	value: string;
	chains: Array<Array<{ name: string; value: string }>>;
}

export interface StyleReport extends ElementContextPayload {
	computed: {
		box: {
			border: string;
			margin: string;
			padding: string;
			size: string;
		};
		colors: {
			background: string;
			color: string;
		};
		typography: {
			fontFamily: string;
			fontSize: string;
			fontWeight: string;
			lineHeight: string;
		};
	};
	matchedRules: {
		declarations: StyleDeclarationFinding[];
		overrides: StyleDeclarationFinding[];
		tokenChains: TokenChainFinding[];
	};
}

export interface SelectorPin {
	id: string;
	pagePath: string;
	diskPath?: string;
	selector: string;
	outerHtmlSnippet: string;
	tagSummary: string;
	comment: string;
	scope: SelectorPinScope;
	styleFindings?: StyleReport;
	styleEdits?: SelectorStyleEdit[];
	createdAt: string;
	stale?: boolean;
}

export interface HtmlSelectorBridgeState {
	active: boolean;
	activationMode: "toggle" | "hold";
	enabled: boolean;
	hoveredSelector: string | null;
}

export interface HtmlSelectorBridge {
	version: string;
	configure: (options: {
		pagePath: string;
		shortcuts: HtmlSelectorShortcuts;
		callbacks: {
			onPinSaved?: (payload: SelectorPinSavePayload) => SelectorPin | void;
			onPinRemoved?: (payload: { id: string }) => void;
			onElementContextCopied?: (payload: ElementContextPayload) => void;
			onCopyAllRequested?: (payload: { pagePath: string }) => void;
			onSendRequested?: (payload: { pagePath: string }) => void;
			onAgentChange?: (payload: { agent: AgentId }) => void;
			onStateChange?: (payload: HtmlSelectorBridgeState) => void;
		};
		agent?: AgentId;
	}) => void;
	setEnabled: (enabled: boolean) => void;
	activate: () => void;
	deactivate: () => void;
	setActivationMode: (mode: "toggle" | "hold") => void;
	setPins: (pins: SelectorPin[], meta?: SelectorPinsMeta) => void;
	notify: (notification: HtmlSelectorNotification) => void;
	inspect: (pinIdOrSelector: string) => StyleReport | null;
	destroy: () => void;
}
