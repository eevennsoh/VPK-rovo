const SLIDE_SECTION = /<section\b[^>]*\bclass=["'][^"']*\bslide\b[^"']*["'][^>]*>/gi;

function escapeHtml(value) {
	return value
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;");
}

function ensureBodyAttribute(html, name, value = null) {
	const bodyOpen = /<body\b([^>]*)>/i.exec(html);
	if (!bodyOpen) return html;
	const tag = bodyOpen[0];
	const attrPattern = new RegExp(`\\s${name}(?:=["'][^"']*["'])?`, "i");
	if (attrPattern.test(tag)) return html;
	const attribute = value === null ? name : `${name}="${value}"`;
	return html.replace(tag, tag.replace(/>$/, ` ${attribute}>`));
}

function escapeRegExp(value) {
	return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function injectStyle(html, css, marker) {
	if (html.includes(marker)) {
		const markerPattern = escapeRegExp(marker);
		return html.replace(
			new RegExp(`\\n?/\\* ${markerPattern} \\*/[\\s\\S]*?(?=\\n</style>)`, "i"),
			`\n${css}`,
		);
	}
	return html.replace(/<\/style>/i, `\n${css}\n</style>`);
}

function injectBodyScript(html, js, marker) {
	if (html.includes(marker)) {
		const markerPattern = escapeRegExp(marker);
		return html.replace(
			new RegExp(`\\n?<script\\b(?=[^>]*\\b${markerPattern}\\b)[^>]*>[\\s\\S]*?</script>\\s*`, "i"),
			`<script ${marker}>\n${js}\n</script>\n`,
		);
	}
	return html.replace(/<\/body>/i, `<script ${marker}>\n${js}\n</script>\n</body>`);
}

function removeLegacyDeckRuntime(html) {
	return html.replace(/\n?<script>\s*[\s\S]*?(?:IntersectionObserver|scrollIntoView)[\s\S]*?<\/script>\s*/gi, "\n");
}

export function isDeck(html) {
	return [...html.matchAll(SLIDE_SECTION)].length >= 2;
}

export function buildPresentationCss() {
	return `/* vpk presentation mode */
.speaker-notes {
\tdisplay: none !important;
}

@media screen {
\tbody[data-vpk-motion="deck"] {
\t\tbackground: var(--paper-background);
\t\toverflow: hidden;
\t}

\tbody[data-vpk-motion="deck"] main {
\t\theight: 100vh;
\t\tpadding: 0;
\t\tposition: relative;
\t\twidth: 100vw;
\t}

\tbody[data-vpk-motion="deck"] .slide {
\t\t--vpk-slide-rest-transform: translate(-50%, -50%) scale(var(--vpk-slide-scale, 1));
\t\t--vpk-slide-enter-from: translate(calc(-50% + 24px), -50%) scale(var(--vpk-slide-scale, 1));
\t\t--vpk-slide-enter-to: var(--vpk-slide-rest-transform);
\t\tdisplay: none;
\t\tleft: 50%;
\t\tposition: absolute;
\t\ttop: 50%;
\t\ttransform: var(--vpk-slide-rest-transform);
\t\ttransform-origin: center center;
\t}

\tbody[data-vpk-motion="deck"]:not([data-vpk-deck-ready="true"]) .slide:first-of-type,
\tbody[data-vpk-motion="deck"] .slide.is-active {
\t\tdisplay: block;
\t}

\tbody[data-vpk-motion="deck"] .slide.is-active {
\t\tanimation: vpk-slide-in var(--vpk-dur-enter) var(--ease-out) both;
\t}

\tbody[data-vpk-motion="deck"] .slide.is-leaving {
\t\tanimation: vpk-slide-out var(--vpk-dur-slide-out) var(--ease-out) both;
\t}

\t.vpk-slide-counter {
\t\talign-items: center;
\t\tbackground: var(--surface-raised);
\t\tborder: 1px solid var(--rule);
\t\tbottom: 18px;
\t\tbox-shadow: var(--shadow);
\t\tcolor: var(--muted-text);
\t\tdisplay: inline-flex;
\t\tfont-family: var(--font-mono);
\t\tfont-size: 12px;
\t\tgap: 6px;
\t\tletter-spacing: 0.04em;
\t\tpadding: 8px 10px;
\t\tposition: fixed;
\t\tright: 18px;
\t\tz-index: 20;
\t}

\thtml[data-vpk-presenter="true"],
\thtml[data-vpk-presenter="true"] body {
\t\theight: 100%;
\t\toverflow: hidden;
\t}

\tbody.vpk-presenter-window {
\t\tbackground: var(--paper-background);
\t\tcolor: var(--ink);
\t\tfont-family: var(--font-body);
\t}

\t.vpk-presenter {
\t\tdisplay: grid;
\t\tgap: 24px;
\t\tgrid-template-columns: minmax(0, 1fr) minmax(280px, 0.44fr);
\t\theight: 100vh;
\t\tpadding: 24px;
\t}

\t.vpk-presenter-preview,
\t.vpk-presenter-notes {
\t\tbackground: var(--surface-raised);
\t\tborder: 1px solid var(--rule);
\t\tbox-shadow: var(--shadow);
\t\tmin-width: 0;
\t\tpadding: 18px;
\t}

\t.vpk-presenter-preview-frame {
\t\talign-items: center;
\t\taspect-ratio: 280 / 158;
\t\tbackground: var(--paper);
\t\tborder: 1px solid var(--rule);
\t\tdisplay: flex;
\t\tjustify-content: center;
\t\toverflow: hidden;
\t}

\t.vpk-presenter-preview-frame .slide {
\t\tdisplay: block !important;
\t\tposition: static !important;
\t\ttransform: scale(0.28) !important;
\t\ttransform-origin: center center !important;
\t}

\t.vpk-presenter-kicker {
\t\tcolor: var(--primary-blue);
\t\tfont-family: var(--font-mono);
\t\tfont-size: 11px;
\t\tletter-spacing: 0.08em;
\t\tmargin-bottom: 10px;
\t\ttext-transform: uppercase;
\t}

\t.vpk-presenter-notes-text {
\t\tfont-size: 22px;
\t\tline-height: 1.45;
\t\twhite-space: pre-wrap;
\t}

\t.vpk-presenter-timer {
\t\tcolor: var(--muted-text);
\t\tfont-family: var(--font-mono);
\t\tfont-size: 14px;
\t\tmargin-top: 20px;
\t}
}

@media print {
\t.speaker-notes,
\t.vpk-slide-counter,
\t.vpk-presenter {
\t\tdisplay: none !important;
\t}
}`;
}

export function buildPresentationJs() {
	return `(() => {
\tconst slides = [...document.querySelectorAll('section.slide')];
\tif (slides.length < 2) return;

\tconst channel = (() => {
\t\ttry { return new BroadcastChannel('vpk-deck'); }
\t\tcatch { return null; }
\t})();
\tlet index = readIndexFromHash();
\tlet startedAt = Date.now();
\tlet presenterWindow = null;

\tfunction readIndexFromHash() {
\t\tconst match = location.hash.match(/slide-(\\d+)/);
\t\tif (!match) return 0;
\t\treturn Math.max(0, Math.min(slides.length - 1, Number(match[1]) - 1));
\t}

\tfunction slideTitle(slide) {
\t\treturn (slide.querySelector('h1,h2,h3,.title')?.textContent || 'Slide').trim();
\t}

\tfunction slideNotes(slide) {
\t\treturn (slide.querySelector('.speaker-notes')?.textContent || '').trim() || 'No speaker notes for this slide.';
\t}

\tfunction ensureCounter() {
\t\tlet counter = document.querySelector('[data-vpk-slide-counter]');
\t\tif (counter) return counter;
\t\tcounter = document.createElement('div');
\t\tcounter.className = 'vpk-slide-counter';
\t\tcounter.dataset.vpkSlideCounter = 'true';
\t\tdocument.body.append(counter);
\t\treturn counter;
\t}

\tfunction fitSlide() {
\t\tconst slide = slides[0];
\t\tif (!slide) return;
\t\tconst scale = Math.min(window.innerWidth / slide.offsetWidth, window.innerHeight / slide.offsetHeight) * 0.96;
\t\tdocument.documentElement.style.setProperty('--vpk-slide-scale', String(Math.max(0.1, scale)));
\t}

\tfunction broadcast() {
\t\tconst payload = { type: 'state', index, total: slides.length, title: slideTitle(slides[index]), notes: slideNotes(slides[index]) };
\t\ttry { channel?.postMessage(payload); } catch { /* noop */ }
\t\ttry { presenterWindow?.postMessage({ source: 'vpk-deck', ...payload }, '*'); } catch { /* noop */ }
\t}

\tfunction show(next, shouldBroadcast = true) {
\t\tconst bounded = Math.max(0, Math.min(slides.length - 1, next));
\t\tif (bounded === index && document.querySelector('.slide.is-active')) {
\t\t\tif (shouldBroadcast) broadcast();
\t\t\treturn;
\t\t}
\t\tconst previous = slides[index];
\t\tindex = bounded;
\t\tslides.forEach(slide => slide.classList.remove('is-active', 'is-leaving'));
\t\tif (previous && previous !== slides[index]) previous.classList.add('is-leaving');
\t\tslides[index].classList.add('is-active');
\t\tensureCounter().textContent = String(index + 1).padStart(2, '0') + ' / ' + String(slides.length).padStart(2, '0');
\t\tif (!location.hash.startsWith('#presenter')) history.replaceState(null, '', '#slide-' + String(index + 1));
\t\tif (shouldBroadcast) broadcast();
\t}

\tfunction openPresenter() {
\t\tconst url = new URL(location.href);
\t\turl.hash = 'presenter-slide-' + String(index + 1);
\t\ttry { presenterWindow = window.open(url.href, 'vpk-presenter', 'popup,width=1180,height=760'); }
\t\tcatch { /* noop */ }
\t}

\tfunction buildPresenter() {
\t\tdocument.documentElement.dataset.vpkPresenter = 'true';
\t\tdocument.body.className = (document.body.className + ' vpk-presenter-window').trim();
\t\tdocument.body.innerHTML = '<main class="vpk-presenter"><section class="vpk-presenter-preview"><p class="vpk-presenter-kicker">Next slide</p><div class="vpk-presenter-preview-frame" data-vpk-next-preview></div></section><section class="vpk-presenter-notes"><p class="vpk-presenter-kicker" data-vpk-presenter-title></p><div class="vpk-presenter-notes-text" data-vpk-presenter-notes></div><p class="vpk-presenter-timer" data-vpk-presenter-timer></p></section></main>';
\t\tconst title = document.querySelector('[data-vpk-presenter-title]');
\t\tconst notes = document.querySelector('[data-vpk-presenter-notes]');
\t\tconst timer = document.querySelector('[data-vpk-presenter-timer]');
\t\tconst preview = document.querySelector('[data-vpk-next-preview]');
\t\tfunction render(payload = {}) {
\t\t\tconst current = payload.index ?? index;
\t\t\tconst next = slides[Math.min(slides.length - 1, current + 1)]?.cloneNode(true);
\t\t\tif (title) title.textContent = 'Slide ' + String(current + 1) + ' / ' + slides.length + ' - ' + (payload.title || slideTitle(slides[current]));
\t\t\tif (notes) notes.textContent = payload.notes || slideNotes(slides[current]);
\t\t\tif (preview) {
\t\t\t\tpreview.textContent = '';
\t\t\t\tif (next) preview.append(next);
\t\t\t}
\t\t}
\t\trender();
\t\tsetInterval(() => {
\t\t\tconst elapsed = Math.floor((Date.now() - startedAt) / 1000);
\t\t\tif (timer) timer.textContent = Math.floor(elapsed / 60) + ':' + String(elapsed % 60).padStart(2, '0');
\t\t}, 500);
\t\tchannel?.addEventListener('message', event => {
\t\t\tif (event.data?.type === 'state') render(event.data);
\t\t});
\t\twindow.addEventListener('message', event => {
\t\t\tif (event.data?.source === 'vpk-deck' && event.data?.type === 'state') render(event.data);
\t\t});
\t\tdocument.addEventListener('keydown', event => {
\t\t\tif (event.key === 'ArrowRight') {
\t\t\t\tif (channel) channel.postMessage({ type: 'request', delta: 1 });
\t\t\t\telse { index = Math.min(slides.length - 1, index + 1); render(); }
\t\t\t}
\t\t\tif (event.key === 'ArrowLeft') {
\t\t\t\tif (channel) channel.postMessage({ type: 'request', delta: -1 });
\t\t\t\telse { index = Math.max(0, index - 1); render(); }
\t\t\t}
\t\t});
\t}

\tif (location.hash.startsWith('#presenter')) {
\t\tbuildPresenter();
\t\treturn;
\t}

\twindow.addEventListener('resize', fitSlide);
\tdocument.addEventListener('keydown', event => {
\t\tif (event.defaultPrevented || event.metaKey || event.ctrlKey || event.altKey) return;
\t\tconst editable = event.target?.closest?.('input, textarea, select, [contenteditable="true"]');
\t\tif (editable) return;
\t\tif (event.key === 'ArrowRight') { event.preventDefault(); show(index + 1); }
\t\telse if (event.key === 'ArrowLeft') { event.preventDefault(); show(index - 1); }
\t\telse if (event.key === 'Home') { event.preventDefault(); show(0); }
\t\telse if (event.key === 'End') { event.preventDefault(); show(slides.length - 1); }
\t\telse if (event.key.toLowerCase() === 'p') { event.preventDefault(); openPresenter(); }
\t});
\tchannel?.addEventListener('message', event => {
\t\tif (event.data?.type === 'request') show(index + Number(event.data.delta || 0));
\t});
\twindow.addEventListener('hashchange', () => show(readIndexFromHash()));
\tfitSlide();
\tdocument.body.dataset.vpkDeckReady = 'true';
\tshow(index);
})();`;
}

export function buildDocNavJs() {
	return `(() => {
\tif (!document.body.matches('[data-vpk-docnav]')) return;
\tconst sectionTargets = [...document.querySelectorAll('main > section')]
\t\t.filter(el => el.getBoundingClientRect().height > 0);
\tconst targets = sectionTargets.length >= 2
\t\t? sectionTargets
\t\t: [...document.querySelectorAll('main h1, main h2, main section[id]')]
\t\t\t.filter(el => el.getBoundingClientRect().height > 0);
\tif (targets.length < 2) return;
\tlet activeIndex = 0;
\tlet focusTimer = 0;
\tlet manualTimer = 0;

\tif (!document.querySelector('style[data-vpk-docnav-style]')) {
\t\tconst style = document.createElement('style');
\t\tstyle.dataset.vpkDocnavStyle = 'true';
\t\tstyle.textContent = \`
@media screen {
\tbody[data-vpk-docnav] main > section {
\t\tscroll-margin-top: 32px;
\t\ttransition:
\t\t\topacity 560ms cubic-bezier(0.16, 1, 0.3, 1),
\t\t\tfilter 560ms cubic-bezier(0.16, 1, 0.3, 1),
\t\t\ttransform 420ms cubic-bezier(0.16, 1, 0.3, 1);
\t}

\tbody[data-vpk-docnav][data-docnav-focus="true"] main > section:not(.is-docnav-active) {
\t\topacity: 0.34 !important;
\t\tfilter: grayscale(0.14) !important;
\t}

\tbody[data-vpk-docnav][data-docnav-focus="true"] main > section.is-docnav-active {
\t\topacity: 1 !important;
\t\tfilter: none !important;
\t\ttransform: translateY(-2px) !important;
\t}

\t.docnav-controls {
\t\tposition: fixed;
\t\tright: 24px;
\t\tbottom: 24px;
\t\tz-index: 50;
\t\tdisplay: flex;
\t\talign-items: center;
\t\tgap: 6px;
\t\tpadding: 6px;
\t\tbackground: color-mix(in srgb, var(--paper) 88%, transparent);
\t\tborder: 0;
\t\tborder-radius: 999px;
\t\tbox-shadow: var(--shadow);
\t\tbackdrop-filter: blur(10px);
\t}

\t.docnav-controls button {
\t\twidth: 36px;
\t\theight: 36px;
\t\tborder: 1px solid var(--rule);
\t\tborder-radius: 999px;
\t\tbackground: var(--surface-raised);
\t\tcolor: var(--ink);
\t\tfont-family: var(--font-mono);
\t\tfont-size: 18px;
\t\tline-height: 1;
\t\tcursor: pointer;
\t}

\t.docnav-controls button:hover,
\t.docnav-controls button:focus-visible {
\t\tcolor: var(--primary-blue);
\t\tborder-color: var(--primary-blue);
\t\toutline: none;
\t}

\t.docnav-controls button:disabled {
\t\topacity: 0.35;
\t\tcursor: default;
\t}

\t.docnav-counter {
\t\tmin-width: 46px;
\t\ttext-align: center;
\t\tcolor: var(--muted-text);
\t\tfont-family: var(--font-mono);
\t\tfont-size: 12px;
\t\tfont-variant-numeric: tabular-nums;
\t}
}

@media print {
\t.docnav-controls { display: none !important; }
\tbody[data-vpk-docnav] main > section {
\t\topacity: 1 !important;
\t\tfilter: none !important;
\t\ttransform: none !important;
\t}
}\`;
\t\tdocument.head.appendChild(style);
\t}

\tconst controls = document.createElement('nav');
\tcontrols.className = 'docnav-controls';
\tcontrols.setAttribute('aria-label', 'Document section navigation');
\tcontrols.innerHTML = \`
\t\t<button type="button" data-docnav-prev aria-label="Previous section">&uarr;</button>
\t\t<span class="docnav-counter" aria-live="polite"></span>
\t\t<button type="button" data-docnav-next aria-label="Next section">&darr;</button>
\t\`;
\tdocument.body.appendChild(controls);

\tconst prevButton = controls.querySelector('[data-docnav-prev]');
\tconst nextButton = controls.querySelector('[data-docnav-next]');
\tconst counter = controls.querySelector('.docnav-counter');

\tfunction setActive(index) {
\t\tactiveIndex = Math.max(0, Math.min(targets.length - 1, index));
\t\ttargets.forEach((target, targetIndex) => {
\t\t\ttarget.classList.toggle('is-docnav-active', targetIndex === activeIndex);
\t\t});
\t\tprevButton.disabled = activeIndex === 0;
\t\tnextButton.disabled = activeIndex === targets.length - 1;
\t\tcounter.textContent = \`\${String(activeIndex + 1).padStart(2, '0')} / \${String(targets.length).padStart(2, '0')}\`;
\t\tdocument.body.dataset.docnavReady = 'true';
\t}

\tfunction setFocusMode() {
\t\tdocument.body.dataset.docnavFocus = 'true';
\t\tclearTimeout(focusTimer);
\t\tfocusTimer = window.setTimeout(() => {
\t\t\tdelete document.body.dataset.docnavFocus;
\t\t}, 1800);
\t}

\tfunction releaseFocusModeSoon() {
\t\tclearTimeout(manualTimer);
\t\tmanualTimer = window.setTimeout(() => {
\t\t\tdelete document.body.dataset.docnavFocus;
\t\t}, 120);
\t}

\tfunction currentIndex() {
\t\tconst y = window.scrollY + 80;
\t\tlet selected = 0;
\t\ttargets.forEach((target, index) => {
\t\t\tif (target.getBoundingClientRect().top + window.scrollY <= y) selected = index;
\t\t});
\t\treturn selected;
\t}

\tfunction go(delta) {
\t\tconst next = Math.max(0, Math.min(targets.length - 1, currentIndex() + delta));
\t\tsetActive(next);
\t\tsetFocusMode();
\t\ttargets[next].scrollIntoView({ block: 'start', behavior: 'smooth' });
\t}

\tprevButton.addEventListener('click', () => go(-1));
\tnextButton.addEventListener('click', () => go(1));

\tdocument.addEventListener('keydown', event => {
\t\tif (event.defaultPrevented || event.metaKey || event.ctrlKey || event.altKey) return;
\t\tconst editable = event.target?.closest?.('input, textarea, select, [contenteditable="true"]');
\t\tif (editable) return;
\t\tif (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') return;
\t\tevent.preventDefault();
\t\tconst delta = event.key === 'ArrowDown' ? 1 : -1;
\t\tgo(delta);
\t});

\tdocument.addEventListener('scroll', () => setActive(currentIndex()), { passive: true });
\tdocument.addEventListener('wheel', releaseFocusModeSoon, { passive: true });
\tdocument.addEventListener('touchstart', releaseFocusModeSoon, { passive: true });
\tsetActive(currentIndex());
})();`;
}

export function ensureSpeakerNotes(html, { placeholders = false } = {}) {
	let slideIndex = 0;
	return html.replace(/(<section\b[^>]*\bclass=["'][^"']*\bslide\b[^"']*["'][^>]*>)([\s\S]*?)(<\/section>)/gi, (match, open, body, close) => {
		slideIndex += 1;
		const cleanBody = body.replace(/[ \t]+$/gm, "");
		if (/\bclass=["'][^"']*\bspeaker-notes\b/i.test(cleanBody)) return `${open}${cleanBody}${close}`;
		const notes = placeholders ? `{{Speaker notes ${slideIndex}}}` : "";
		return `${open}${cleanBody.trimEnd()}\n<aside class="speaker-notes" aria-hidden="true">${escapeHtml(notes)}</aside>\n${close}`;
	});
}

export function retrofitDeck(html, { speakerNotePlaceholders = false } = {}) {
	if (!isDeck(html)) return html;
	let out = removeLegacyDeckRuntime(html);
	out = ensureBodyAttribute(out, "data-vpk-motion", "deck");
	out = ensureSpeakerNotes(out, { placeholders: speakerNotePlaceholders });
	out = injectStyle(out, buildPresentationCss(), "vpk presentation mode");
	out = injectBodyScript(out, buildPresentationJs(), "data-vpk-presentation-runtime");
	return out;
}

export function retrofitDocumentNav(html) {
	if (isDeck(html)) return html;
	let out = ensureBodyAttribute(html, "data-vpk-motion", "document");
	out = ensureBodyAttribute(out, "data-vpk-docnav", "true");
	out = injectBodyScript(out, buildDocNavJs(), "data-vpk-docnav-runtime");
	return out;
}
