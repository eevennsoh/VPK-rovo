"use client";

type PreHydrationScriptProps = {
	html: string;
	id: string;
};

export function PreHydrationScript({ html, id }: PreHydrationScriptProps) {
	return (
		// oxlint-disable-next-line react-doctor/nextjs-no-native-script -- Next 16.3 requires an inert client-rendered script type for synchronous pre-hydration bootstrap code.
		<script
			id={id}
			type={typeof window === "undefined" ? "text/javascript" : "text/plain"}
			suppressHydrationWarning
			dangerouslySetInnerHTML={{ __html: html }}
		/>
	);
}
