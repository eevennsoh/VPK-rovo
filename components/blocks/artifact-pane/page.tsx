import { ArtifactPane } from "@/components/blocks/artifact-pane";
import { ArtifactDetailsDemo } from "@/components/blocks/artifact-pane/artifact-details-demo";

export default function ArtifactPanePage() {
	return (
		<div className="flex min-h-[560px] w-full items-center justify-center bg-surface p-8">
			<ArtifactPane
				className="w-full max-w-[360px]"
				sections={[
					{ content: <ArtifactDetailsDemo />, defaultOpen: true, id: "details", title: "Details" },
					{
						content: <p className="text-xs leading-5 text-text-subtle">Automation rules and recent runs for this artifact appear here.</p>,
						id: "automation",
						title: "Automation",
					},
					{
						content: <p className="text-xs leading-5 text-text-subtle">Repository, branch, and pull-request activity appears here.</p>,
						id: "development",
						title: "Repositories",
					},
					{
						content: <p className="text-xs leading-5 text-text-subtle">Linked Jira, Confluence, Drive, and Slack resources appear here.</p>,
						id: "sources",
						title: "Sources",
					},
				]}
			/>
		</div>
	);
}
