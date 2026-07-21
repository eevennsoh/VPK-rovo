import type { ChangedFile, ChangesSummary } from "./types";

const PRODUCT_PAGE_OLD = `import ErrorMessage from "../../common/components/ErrorMessage";

const ProductPage: React.FC = () => {
	const [quantity, setQuantity] = useState(1);
	const [price, setPrice] = useState(0);
	const [quatityError, setQuantityError] = useState<Error | null>(null);

	useEffect(() => {
		axios
			.get(\`/api/pricing/calculate\`, { params: { quantity } })
			.then((response) => setPrice(response.data))
			.catch((error) => setQuantityError(error));
	}, [quantity]);

	const handleQuantityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		// TO DO
		console.log("quantity changed TODO!");
	};

	return (
		<section>
			<input value={quantity} onChange={handleQuantityChange} />
			<span>{price}</span>
			{quatityError ? <ErrorMessage error={quatityError} /> : null}
		</section>
	);
};`;

const PRODUCT_PAGE_NEW = `import ErrorMessage from "../../common/components/ErrorMessage";

const ProductPage: React.FC = () => {
	const [quantity, setQuantity] = useState(1);
	const [price, setPrice] = useState(0);
	const [quatityError, setQuantityError] = useState<Error | null>(null);

	useEffect(() => {
		axios
			.get(\`/api/pricing/calculate\`, { params: { quantity } })
			.then((response) => setPrice(response.data))
			.catch((error) => setQuantityError(error));
	}, [quantity]);

	const handleQuantityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const newQuantity = parseInt(e.target.value);
		if (newQuantity > 0) {
			setQuantityError(null);
			setQuantity(newQuantity);
		} else {
			setQuantityError(new Error("Quantity must be an integer greater than 0"));
		}
	};

	return (
		<section>
			<input value={quantity} onChange={handleQuantityChange} />
			<span>{price}</span>
			{quatityError ? <ErrorMessage error={quatityError} /> : null}
		</section>
	);
};`;

const PHOTO_UPLOADER: ChangedFile = {
	id: "photo-uploader",
	path: "src/components/PhotoUploader.tsx",
	status: "deleted",
	language: "tsx",
	oldContents: `export function PhotoUploader() {
	return <input type="file" accept="image/*" />;
}`,
	newContents: `export function PhotoUploader() {
	return <input type="file" />;
}`,
	additions: 2,
	deletions: 1,
	defaultExpanded: false,
};

const USER_MENU: ChangedFile = {
	id: "user-menu",
	path: "src/components/UserMenu.js",
	status: "added",
	language: "javascript",
	oldContents: "",
	newContents: `export function UserMenu({ name }) {
	return <button type="button">{name}</button>;
}`,
	additions: 2,
	deletions: 1,
	defaultExpanded: false,
};

export const USER_PROFILE_DIALOG: ChangedFile = {
	id: "user-profile-dialog",
	path: "src/components/UserProfileDialog.ts",
	status: "modified",
	language: "typescript",
	oldContents: PRODUCT_PAGE_OLD,
	newContents: PRODUCT_PAGE_NEW,
	additions: 24,
	deletions: 2,
	defaultExpanded: true,
};

export const CHANGED_FILES: readonly ChangedFile[] = [
	PHOTO_UPLOADER,
	USER_MENU,
	USER_PROFILE_DIALOG,
];

export const EDITOR_FILE: ChangedFile = {
	id: "ipc-mp-test",
	path: "ipc.mp.test.ts",
	status: "modified",
	language: "typescript",
	oldContents: PRODUCT_PAGE_OLD,
	newContents: PRODUCT_PAGE_NEW,
	additions: 7,
	deletions: 2,
	defaultExpanded: true,
	hunkHeader: "@@ -48,6 +48,11 @@ export type SmartLinkProps = {",
	inExplorer: true,
};

// Summary stats are stored verbatim from the design, not derived from per-file stats.
export const ALL_CHANGES_SUMMARY: ChangesSummary = {
	fileCount: 3,
	additions: 28,
	deletions: 11,
};
