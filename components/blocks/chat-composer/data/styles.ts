import { composerUpwardShadow, textareaCSS } from "@/components/projects/shared/components/rovo-composer-styles";
import { token } from "@/lib/tokens";

export { textareaCSS };

export const composerStyles = {
	wrapper: {
		width: "100%",
	},
	container: {
		position: "relative" as const,
		zIndex: 10,
		borderRadius: token("radius.xlarge"),
		border: `1px solid ${token("color.border")}`,
		backgroundColor: token("elevation.surface"),
		paddingTop: token("space.200"),
		paddingRight: token("space.200"),
		paddingBottom: token("space.150"),
		paddingLeft: token("space.200"),
		boxShadow: composerUpwardShadow,
	},
	actionsRow: {
		marginTop: token("space.150"),
		display: "flex",
		alignItems: "center",
		justifyContent: "space-between",
	},
	buttonGroup: {
		display: "flex",
		alignItems: "center",
		gap: token("space.050"),
	},
} as const;
