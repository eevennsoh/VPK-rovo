"use client";

import { Response } from "@/components/ui-audio/response";
import { RESPONSE_MARKDOWN } from "./demo-data-values";

function ResponsePreview({
	content = RESPONSE_MARKDOWN,
}: Readonly<{ content?: string }>) {
	return (
		<div className="h-full min-h-[360px] w-full overflow-hidden">
			<Response className="prose prose-sm size-full max-w-none overflow-auto p-10 text-text">
				{content}
			</Response>
		</div>
	);
}

export default function ResponseDemo() {
	return <ResponsePreview />;
}

export function ResponseDemoChecklist() {
	return (
		<ResponsePreview
			content={`1. Install the components\n2. Port styling to VPK tokens\n3. Publish mocked docs examples`}
		/>
	);
}
