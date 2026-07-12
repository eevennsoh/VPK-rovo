export const HTML_SELECTOR_DEMO_DOC = `<!doctype html>
<html lang="en">
<head>
	<meta charset="utf-8" />
	<title>HTML Selector demo</title>
	<style>
		/* vpk-shared:start */
		:root {
			--vpk-demo-brand: #0c66e4;
			--vpk-demo-surface: #f7f8f9;
			--vpk-demo-heading: var(--vpk-demo-brand);
		}
		body {
			margin: 0;
			background: var(--vpk-demo-surface);
			color: #172b4d;
			font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
		}
		/* vpk-shared:end */
		main {
			max-width: 760px;
			margin: 0 auto;
			padding: 48px 24px;
		}
		.hero {
			border: 1px solid rgba(9, 30, 66, 0.14);
			border-radius: 12px;
			background: white;
			padding: 28px;
			box-shadow: 0 12px 32px rgba(9, 30, 66, 0.12);
		}
		h1 {
			color: var(--vpk-demo-heading);
			font-size: 36px;
			line-height: 1.05;
			margin: 0 0 12px;
		}
		.hero p {
			color: #44546f;
			font-size: 17px;
			line-height: 1.55;
			margin: 0;
		}
		.cta {
			display: inline-flex;
			margin-top: 22px;
			border-radius: 6px;
			background: var(--vpk-demo-brand);
			color: white;
			padding: 10px 14px;
			text-decoration: none;
		}
	</style>
</head>
<body>
	<main>
		<section class="hero" data-demo-section="intro">
			<h1>Inspectable plain HTML</h1>
			<p>Select any element to leave a scoped comment and inspect which local declarations override the shared design-system block.</p>
			<a class="cta" href="#details">Review details</a>
		</section>
		<section id="details">
			<h2>Local section</h2>
			<p>This section exists so the demo has more than one selector target.</p>
		</section>
	</main>
</body>
</html>`;
