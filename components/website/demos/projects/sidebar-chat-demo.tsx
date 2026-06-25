"use client";

import ChatPanel from "@/components/projects/sidebar-chat/page";

export default function SidebarChatDemo() {
	return (
		<div className="flex h-dvh min-h-0 w-full items-center justify-center overflow-hidden p-6">
			<div className="h-full max-h-[800px] min-h-0 w-[400px]">
				<ChatPanel
					onClose={() => {}}
					enableSmartWidgets={true}
					sendPromptOptions={{
						smartGeneration: {
							enabled: true,
							surface: "sidebar",
						},
					}}
				/>
			</div>
		</div>
	);
}
