import { TWGAgentCard } from "@/components/blocks/twg-agent-card";

export default function TWGAgentCardDemo(): React.ReactElement {
	return (
		<div className="flex w-full justify-center p-6">
			<TWGAgentCard onSelect={() => {}} />
		</div>
	);
}
