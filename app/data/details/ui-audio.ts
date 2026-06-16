import type { ComponentDetail } from "@/app/data/component-detail-types";

function example(title: string, demoSlug: string, description: string) {
	return { title, demoSlug, description };
}

const classNameProp = {
	name: "className",
	type: "string",
	description: "Additional classes applied to the root element.",
} as const;

export const UI_AUDIO_DETAILS: Record<string, ComponentDetail> = {
	"audio-player": {
		description:
			"Client-side audio playback primitives for playlist selection, track preview, playback-speed control, and scrubbing across long-form voice content.",
		importStatement: `import {
  AudioPlayerButton,
  AudioPlayerDuration,
  AudioPlayerProgress,
  AudioPlayerProvider,
  AudioPlayerSpeed,
  AudioPlayerSpeedButtonGroup,
  AudioPlayerTime,
  exampleTracks,
  useAudioPlayer,
} from "@/components/ui-audio/audio-player";`,
		usage: `import {
  AudioPlayerButton,
  AudioPlayerDuration,
  AudioPlayerProgress,
  AudioPlayerProvider,
  AudioPlayerSpeed,
  AudioPlayerTime,
  exampleTracks,
  useAudioPlayer,
} from "@/components/ui-audio/audio-player";

<AudioPlayerProvider>
  <AudioPlayerButton item={{ id: "preview", src: "/audio/sample.mp3" }} />
  <AudioPlayerProgress />
  <AudioPlayerTime />
  <AudioPlayerDuration />
  <AudioPlayerSpeed />
</AudioPlayerProvider>`,
		props: [
			{ name: "item", type: "{ id: string | number; src: string; data?: TData }", description: "Track metadata passed to AudioPlayerButton." },
			{ name: "speeds", type: "readonly number[]", default: "[0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2]", description: "Playback speeds rendered by AudioPlayerSpeed or AudioPlayerSpeedButtonGroup." },
			classNameProp,
		],
		subComponents: [
			{ name: "AudioPlayerProvider", description: "Context provider that manages the active audio element, playback state, and timing." },
			{ name: "AudioPlayerButton", description: "Play or pause a shared track, optionally scoped to a specific item." },
			{ name: "AudioPlayerProgress", description: "Interactive scrubber tied to the current playback position." },
			{ name: "AudioPlayerTime", description: "Current playback timestamp." },
			{ name: "AudioPlayerDuration", description: "Resolved duration for the active track." },
			{ name: "AudioPlayerSpeed", description: "Dropdown speed selector built on the shared player state." },
			{ name: "useAudioPlayer", description: "Hook for reading the active track, selection state, and playback controls inside a shared provider." },
			{ name: "exampleTracks", description: "Deterministic preview data mirrored from the ElevenLabs reference demo for docs and local prototyping." },
		],
		examples: [
			example("Compact preview", "audio-player-demo-compact", "Uses the same primitives in a single-line voice preview bar."),
			example("Speed controls", "audio-player-demo-default", "Keeps the compact bar but exposes grouped playback-speed actions beneath it."),
		],
	},
	"bar-visualizer": {
		description:
			"Real-time audio frequency visualizer with state-based animations for voice agents and audio interfaces.",
		importStatement: `import {
  BarVisualizer,
  useAudioVolume,
  useBarAnimator,
  useMultibandVolume,
  type AgentState,
  type AudioAnalyserOptions,
  type BarVisualizerProps,
  type MultiBandVolumeOptions,
} from "@/components/ui-audio/bar-visualizer";`,
		usage: `import { BarVisualizer } from "@/components/ui-audio/bar-visualizer";

<BarVisualizer
  state="listening"
  barCount={15}
  mediaStream={stream}
/>`,
		props: [
			{ name: "state", type: '"connecting" | "initializing" | "listening" | "speaking" | "thinking"', description: "Voice-assistant state that controls the bar animation." },
			{ name: "barCount", type: "number", default: "15", description: "Number of bars rendered in the visualizer." },
			{ name: "mediaStream", type: "MediaStream | null", description: "Audio source used for real-time volume analysis." },
			{ name: "minHeight", type: "number", default: "20", description: "Minimum bar height as a percentage of the container." },
			{ name: "maxHeight", type: "number", default: "100", description: "Maximum bar height as a percentage of the container." },
			{ name: "demo", type: "boolean", default: "false", description: "Uses deterministic fake audio data instead of a live MediaStream." },
			{ name: "centerAlign", type: "boolean", default: "false", description: "Aligns bars from the center instead of the bottom edge." },
			classNameProp,
		],
		subComponents: [
			{ name: "useAudioVolume", description: "Hook for reading the overall volume level from a MediaStream via the Web Audio API." },
			{ name: "useMultibandVolume", description: "Hook for splitting incoming audio into multiple frequency bands for bar-by-bar visualization." },
			{ name: "useBarAnimator", description: "Hook that generates highlighted bar sequences for connecting, listening, thinking, and related idle states." },
			{ name: "AgentState", description: "Union type for the supported voice-agent states used by BarVisualizer." },
		],
		examples: [
			example("Speaking state", "bar-visualizer-demo-speaking", "Shows the centered demo-mode animation used for higher-energy playback or agent speech."),
		],
	},
	conversation: {
		description:
			"A scrolling conversation container with auto-scroll, empty-state scaffolding, and optional markdown export for transcript-style interfaces.",
		importStatement: `import {
  Conversation,
  ConversationContent,
  ConversationDownload,
  ConversationEmptyState,
  ConversationScrollButton,
  messagesToMarkdown,
} from "@/components/ui-audio/conversation";`,
		usage: `import {
  Conversation,
  ConversationContent,
  ConversationDownload,
  ConversationEmptyState,
  ConversationScrollButton,
} from "@/components/ui-audio/conversation";

<Conversation className="h-80">
  <ConversationContent>{/* messages */}</ConversationContent>
  <ConversationScrollButton />
  <ConversationDownload messages={messages} />
</Conversation>`,
		props: [
			{ name: "messages", type: "ConversationMessage[]", description: "Transcript entries used by ConversationDownload to create a markdown export." },
			{ name: "filename", type: "string", default: '"conversation.md"', description: "Download filename for exported markdown." },
			{ name: "formatMessage", type: "(message: ConversationMessage, index: number) => string", description: "Custom markdown serializer used by ConversationDownload and messagesToMarkdown." },
			classNameProp,
		],
		subComponents: [
			{ name: "ConversationContent", description: "Scrollable message stack inside the log container." },
			{ name: "ConversationEmptyState", description: "Centered placeholder for empty transcript views." },
			{ name: "ConversationScrollButton", description: "Floating action that appears when the log is no longer pinned to the bottom." },
			{ name: "ConversationDownload", description: "Floating export action that serializes transcript content to markdown." },
			{ name: "messagesToMarkdown", description: "Helper for serializing conversation messages outside the built-in download button." },
		],
		examples: [
			example("Empty state", "conversation-demo-empty", "Matches the ElevenLabs starter state with centered placeholder copy before messages exist."),
			example("Transcript log", "conversation-demo-transcript", "Shows the populated transcript layout with export and scroll-to-bottom affordances."),
		],
	},
	"conversation-bar": {
		description:
			"A docked voice-chat composer with live waveform feedback, mute control, text fallback, and connect/disconnect handling.",
		importStatement: `import { ConversationBar } from "@/components/ui-audio/conversation-bar";`,
		usage: `import { ConversationBar } from "@/components/ui-audio/conversation-bar";

<ConversationBar
  agentId="agent_123"
  onConnect={() => setConnected(true)}
  onSendMessage={(message) => console.log(message)}
/>`,
		props: [
			{ name: "agentId", type: "string", required: true, description: "ElevenLabs agent identifier used when a live session starts." },
			{ name: "onConnect", type: "() => void", description: "Called when the realtime conversation session connects." },
			{ name: "onDisconnect", type: "() => void", description: "Called when the realtime conversation session disconnects." },
			{ name: "onError", type: "(error: Error) => void", description: "Receives normalized microphone or conversation startup errors." },
			{ name: "onMessage", type: '(message: { source: "user" | "ai"; message: string }) => void', description: "Receives messages emitted by the conversation session." },
			{ name: "onSendMessage", type: "(message: string) => void", description: "Called when the keyboard panel sends a text message into the active session." },
			{ name: "waveformClassName", type: "string", description: "Extra styling for the embedded LiveWaveform surface." },
			classNameProp,
		],
		examples: [
			example("Standalone bar", "conversation-bar-demo-default", "Shows the centered standalone bar treatment used in the ElevenLabs docs preview."),
		],
	},
	"live-waveform": {
		description:
			"Canvas-based microphone waveform that can animate from a live stream or show a processing state without requesting permissions.",
		importStatement: `import { LiveWaveform } from "@/components/ui-audio/live-waveform";`,
		usage: `import { LiveWaveform } from "@/components/ui-audio/live-waveform";

<LiveWaveform active height={80} mode="static" />
<LiveWaveform processing height={80} mode="scrolling" />`,
		props: [
			{ name: "active", type: "boolean", default: "false", description: "Starts microphone capture when true." },
			{ name: "processing", type: "boolean", default: "false", description: "Renders a synthetic waveform animation without opening the microphone." },
			{ name: "height", type: "string | number", default: "64", description: "Rendered waveform height." },
			{ name: "barCount", type: "number", description: "Optional fixed number of bars; otherwise the waveform derives the count from its rendered width." },
			{ name: "mode", type: '"scrolling" | "static"', default: '"static"', description: "Selects between centered or left-to-right animated rendering." },
			classNameProp,
		],
		examples: [
			example("Scrolling mode", "live-waveform-demo-scrolling", "Switches the interactive preview card into the left-to-right scrolling mode used by composer chrome."),
		],
	},
	matrix: {
		description:
			"LED-style pixel matrix for compact status animations, digits, loaders, and low-fi VU displays.",
		importStatement: `import {
  Matrix,
  digits,
  loader,
} from "@/components/ui-audio/matrix";`,
		usage: `import { Matrix, digits } from "@/components/ui-audio/matrix";

<Matrix cols={5} pattern={digits[4]} rows={5} />`,
		props: [
			{ name: "rows", type: "number", required: true, description: "Number of matrix rows." },
			{ name: "cols", type: "number", required: true, description: "Number of matrix columns." },
			{ name: "autoplay", type: "boolean", default: "true", description: "Automatically plays animated frame sequences when frames are provided." },
			{ name: "frames", type: "Frame[]", description: "Animated frame sequence." },
			{ name: "pattern", type: "Frame", description: "Single static matrix pattern." },
			classNameProp,
		],
		examples: [
			example("Static digit", "matrix-demo-digits", "Renders a single LED digit instead of an animated frame sequence."),
		],
	},
	message: {
		description:
			"Compact message bubbles with user/assistant alignment and optional avatar rendering for transcripts or multimodal voice logs.",
		importStatement: `import {
  Message,
  MessageAvatar,
  MessageContent,
} from "@/components/ui-audio/message";
import { Response } from "@/components/ui-audio/response";`,
		usage: `import {
  Message,
  MessageAvatar,
  MessageContent,
} from "@/components/ui-audio/message";
import { Response } from "@/components/ui-audio/response";

<Message from="assistant">
  <MessageAvatar name="EL" />
  <MessageContent>
    <Response>{markdown}</Response>
  </MessageContent>
</Message>`,
		props: [
			{ name: "from", type: '"user" | "assistant"', required: true, description: "Selects bubble alignment and tone." },
			{ name: "variant", type: '"contained" | "flat"', default: '"contained"', description: "Bubble style for MessageContent." },
			classNameProp,
		],
		subComponents: [
			{ name: "MessageContent", description: "Contained or flat bubble wrapper for message text." },
			{ name: "MessageAvatar", description: "Optional avatar shell for assistant-style messages. Supports either src/name or custom children for richer identity content." },
		],
		examples: [
			example("Flat layout", "message-demo-flat", "Removes the assistant bubble chrome for transcript-heavy layouts."),
		],
	},
	"mic-selector": {
		description:
			"Microphone device picker with mute toggling and optional waveform feedback when the menu is open.",
		importStatement: `import {
  MicSelector,
  useAudioDevices,
} from "@/components/ui-audio/mic-selector";`,
		usage: `import { MicSelector } from "@/components/ui-audio/mic-selector";

<MicSelector
  muted={muted}
  onMutedChange={setMuted}
  onValueChange={setDeviceId}
  value={deviceId}
/>`,
		props: [
			{ name: "value", type: "string", description: "Controlled audio device ID." },
			{ name: "muted", type: "boolean", description: "Controlled mute state for the trigger and menu footer." },
			{ name: "onMutedChange", type: "(muted: boolean) => void", description: "Called when the mute button toggles." },
			{ name: "disabled", type: "boolean", description: "Disables the trigger while microphone access or surrounding recording controls are unavailable." },
			classNameProp,
		],
		subComponents: [
			{ name: "useAudioDevices", description: "Hook for requesting microphone permission, enumerating audio inputs, and reacting to device changes." },
		],
		examples: [
			example("Muted state", "mic-selector-demo-muted", "Shows the recording-card composition with the microphone muted."),
		],
	},
	orb: {
		description:
			"Three.js orb used to represent voice-agent thinking, listening, and speaking states with smooth organic motion.",
		importStatement: `import { Orb } from "@/components/ui-audio/orb";`,
		usage: `import { Orb } from "@/components/ui-audio/orb";

<div className="size-20">
  <Orb agentState="thinking" className="size-full" />
</div>`,
		props: [
			{ name: "agentState", type: 'null | "thinking" | "listening" | "talking"', description: "State that drives the orb motion profile." },
			{ name: "colors", type: "[string, string]", description: "Gradient colors used by the shader." },
			classNameProp,
		],
		examples: [
			example("State gallery", "orb-demo-states", "Displays the three primary orb states side-by-side for faster comparison."),
		],
	},
	response: {
		description:
			"A lightweight Streamdown wrapper for rendering markdown-heavy voice responses, summaries, and checklist-style assistant output.",
		importStatement: `import { Response } from "@/components/ui-audio/response";`,
		usage: `import { Response } from "@/components/ui-audio/response";

<Response>{markdown}</Response>`,
		props: [
			{ name: "children", type: "ReactNode", required: true, description: "Markdown or rich response content rendered by Streamdown." },
			classNameProp,
		],
		examples: [
			example("Checklist output", "response-demo-checklist", "Renders a compact numbered checklist inside the larger markdown response surface."),
		],
	},
	"scrub-bar": {
		description:
			"Composable scrubber primitives for time-based UI such as transcript playback, previews, and inline audio review.",
		importStatement: `import {
  ScrubBarContainer,
  ScrubBarProgress,
  ScrubBarThumb,
  ScrubBarTimeLabel,
  ScrubBarTrack,
} from "@/components/ui-audio/scrub-bar";`,
		usage: `import {
  ScrubBarContainer,
  ScrubBarProgress,
  ScrubBarThumb,
  ScrubBarTimeLabel,
  ScrubBarTrack,
} from "@/components/ui-audio/scrub-bar";

<ScrubBarContainer duration={120} value={42} onScrub={setTime}>
  <ScrubBarTrack>
    <ScrubBarProgress />
    <ScrubBarThumb />
  </ScrubBarTrack>
</ScrubBarContainer>`,
		props: [
			{ name: "duration", type: "number", required: true, description: "Total length of the timeline in seconds." },
			{ name: "value", type: "number", required: true, description: "Current time in seconds." },
			{ name: "onScrub", type: "(time: number) => void", description: "Called as the pointer drags across the track." },
			classNameProp,
		],
		subComponents: [
			{ name: "ScrubBarTrack", description: "Interactive track that converts pointer position into time." },
			{ name: "ScrubBarProgress", description: "Filled progress region driven by the current context value." },
			{ name: "ScrubBarThumb", description: "Position indicator for the active time." },
			{ name: "ScrubBarTimeLabel", description: "Tabular time label with a built-in formatter." },
		],
		examples: [
			example("Standalone scrubber", "scrub-bar-demo-default", "Combines the primitive pieces into a compact playback bar."),
		],
	},
	"shimmering-text": {
		description:
			"Viewport-aware shimmer animation for headings, status text, and highlighted voice-call moments.",
		importStatement: `import { ShimmeringText } from "@/components/ui-audio/shimmering-text";`,
		usage: `import { ShimmeringText } from "@/components/ui-audio/shimmering-text";

<ShimmeringText text="Agent is thinking..." />`,
		props: [
			{ name: "text", type: "string", required: true, description: "Text rendered with the shimmer effect." },
			{ name: "duration", type: "number", default: "2", description: "Seconds per shimmer pass." },
			{ name: "repeat", type: "boolean", default: "true", description: "Repeats the shimmer animation when true." },
			classNameProp,
		],
		examples: [
			example("Accent shimmer", "shimmering-text-demo-accent", "Swaps the shimmer color to a discovery accent for status callouts."),
		],
	},
	"speech-input": {
		description:
			"Compound realtime speech composer built on ElevenLabs Scribe, including record, preview, and cancel primitives.",
		importStatement: `import {
  SpeechInput,
  SpeechInputCancelButton,
  SpeechInputPreview,
  SpeechInputRecordButton,
  useSpeechInput,
} from "@/components/ui-audio/speech-input";`,
		usage: `import {
  SpeechInput,
  SpeechInputCancelButton,
  SpeechInputPreview,
  SpeechInputRecordButton,
} from "@/components/ui-audio/speech-input";
import { Textarea } from "@/components/ui/textarea";

<div className="relative">
  <Textarea className="pb-14" />
  <div className="absolute right-3 bottom-3">
    <SpeechInput getToken={fetchToken}>
      <SpeechInputCancelButton />
      <SpeechInputPreview />
      <SpeechInputRecordButton />
    </SpeechInput>
  </div>
</div>`,
		props: [
			{ name: "getToken", type: "() => Promise<string>", required: true, description: "Async callback that returns an ElevenLabs Scribe token." },
			{ name: "size", type: '"default" | "sm" | "lg"', default: '"default"', description: "Shared control sizing for the compound children." },
			{ name: "onChange", type: "(event: SpeechInputEvent) => void", description: "Receives combined partial and committed transcript updates." },
			{ name: "onStart", type: "(event: SpeechInputEvent) => void", description: "Called when recording successfully starts." },
			{ name: "onStop", type: "(event: SpeechInputEvent) => void", description: "Called when the current recording session stops." },
			{ name: "onCancel", type: "(event: SpeechInputEvent) => void", description: "Called when the current recording session is cancelled and cleared." },
			classNameProp,
		],
		subComponents: [
			{ name: "SpeechInputRecordButton", description: "Starts or stops the Scribe session." },
			{ name: "SpeechInputPreview", description: "Animated preview region for the current transcript text." },
			{ name: "SpeechInputCancelButton", description: "Clears and cancels the current recording session." },
			{ name: "useSpeechInput", description: "Hook for reading the active transcript state inside custom SpeechInput compound compositions." },
		],
		examples: [
			example("Compact control", "speech-input-demo-compact", "Keeps the embedded textarea/input compositions while shrinking the control sizing for denser layouts."),
		],
	},
	"transcript-viewer": {
		description:
			"Audio-aligned transcript reader with current-word highlighting, playback controls, and a shared scrub bar, including first-run loading states.",
		importStatement: `import {
  TranscriptViewerAudio,
  TranscriptViewerContainer,
  TranscriptViewerPlayPauseButton,
  TranscriptViewerScrubBar,
  TranscriptViewerWords,
} from "@/components/ui-audio/transcript-viewer";`,
		usage: `import {
  TranscriptViewerAudio,
  TranscriptViewerContainer,
  TranscriptViewerPlayPauseButton,
  TranscriptViewerScrubBar,
  TranscriptViewerWords,
} from "@/components/ui-audio/transcript-viewer";

<TranscriptViewerContainer alignment={alignment} audioSrc="/audio/sample.mp3">
  <TranscriptViewerPlayPauseButton />
  <TranscriptViewerScrubBar />
  <TranscriptViewerWords />
  <TranscriptViewerAudio />
</TranscriptViewerContainer>`,
		props: [
			{ name: "audioSrc", type: "string", required: true, description: "Audio file used for playback synchronization." },
			{ name: "alignment", type: "CharacterAlignmentResponseModel", required: true, description: "Per-character timing data returned by ElevenLabs." },
			{ name: "hideAudioTags", type: "boolean", default: "true", description: "Omits bracketed audio tags from the rendered transcript." },
			classNameProp,
		],
		subComponents: [
			{ name: "TranscriptViewerWords", description: "Renders the current transcript segments with state-aware word styling." },
			{ name: "TranscriptViewerPlayPauseButton", description: "Shared playback toggle for the transcript audio." },
			{ name: "TranscriptViewerScrubBar", description: "Context-aware scrub bar connected to transcript playback." },
			{ name: "TranscriptViewerAudio", description: "Hidden audio element that drives the playback timeline." },
		],
		examples: [
			example("Default player", "transcript-viewer-demo-default", "Shows the ElevenLabs-style first-run transcript card with loading skeletons and a disabled full-width CTA."),
		],
	},
	"voice-button": {
		description:
			"Single action button for voice capture flows, including recording, processing, success, and error feedback states.",
		importStatement: `import { VoiceButton } from "@/components/ui-audio/voice-button";`,
		usage: `import { VoiceButton } from "@/components/ui-audio/voice-button";

<VoiceButton label="Voice" trailing="⌥Space" />`,
		props: [
			{ name: "state", type: '"idle" | "recording" | "processing" | "success" | "error"', default: '"idle"', description: "Visual state applied to the central waveform and feedback icon." },
			{ name: "label", type: "ReactNode", description: "Leading button label." },
			{ name: "trailing", type: "ReactNode", description: "Trailing hint such as a keyboard shortcut." },
			classNameProp,
		],
		examples: [
			example("Recording state", "voice-button-demo-recording", "Shows the live waveform treatment used while a recording is active."),
		],
	},
	"voice-picker": {
		description:
			"Popover-based voice selector with searchable options, preview playback, and a compact orb identity treatment.",
		importStatement: `import { VoicePicker } from "@/components/ui-audio/voice-picker";`,
		usage: `import { VoicePicker } from "@/components/ui-audio/voice-picker";

<VoicePicker
  onOpenChange={setOpen}
  onValueChange={setVoiceId}
  open={open}
  value={voiceId}
  voices={voices}
/>`,
		props: [
			{ name: "voices", type: "ElevenLabs.Voice[]", required: true, description: "Available voices to search and preview." },
			{ name: "value", type: "string", description: "Controlled voice ID." },
			{ name: "onValueChange", type: "(value: string) => void", description: "Called when a voice is selected." },
			{ name: "open", type: "boolean", description: "Controlled open state for the popover." },
			{ name: "onOpenChange", type: "(open: boolean) => void", description: "Called when the popover open state changes." },
			classNameProp,
		],
		examples: [
			example("Preset selection", "voice-picker-demo-default", "Shows the controlled picker alongside a selected-voice summary card."),
		],
	},
	waveform: {
		description:
			"Waveform primitives for scrolling playback previews, static patterns, and scrubber-based review surfaces.",
		importStatement: `import {
  AudioScrubber,
  ScrollingWaveform,
  StaticWaveform,
} from "@/components/ui-audio/waveform";`,
		usage: `import {
  AudioScrubber,
  ScrollingWaveform,
} from "@/components/ui-audio/waveform";

<ScrollingWaveform data={waveformData} height={80} />
<AudioScrubber currentTime={18} duration={48} onSeek={setTime} />`,
		props: [
			{ name: "data", type: "number[]", description: "Waveform amplitude values from 0 to 1." },
			{ name: "height", type: "string | number", default: "128", description: "Rendered waveform height." },
			{ name: "barWidth", type: "number", default: "4", description: "Width of each waveform bar in pixels." },
			classNameProp,
		],
		subComponents: [
			{ name: "StaticWaveform", description: "Deterministic bar pattern for previews or placeholders." },
			{ name: "ScrollingWaveform", description: "Animated waveform that continuously scrolls across the canvas." },
			{ name: "AudioScrubber", description: "Interactive scrubber overlay built on the waveform renderer." },
		],
		examples: [
			example("Audio scrubber", "waveform-demo-scrubber", "Pairs the richer waveform card with a draggable review surface and playback handle."),
		],
	},
};
