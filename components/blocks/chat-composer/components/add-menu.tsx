"use client";

import { RovoAppComposerAddMenu } from "@/components/projects/shared/components/rovo-app-composer-add-menu";

interface AddMenuProps {
	onClose: () => void;
}

export default function AddMenu({ onClose }: Readonly<AddMenuProps>): React.ReactElement {
	return <RovoAppComposerAddMenu onClose={onClose} />;
}
