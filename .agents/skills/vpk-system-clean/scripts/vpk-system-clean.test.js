const assert = require("node:assert/strict");
const {
	chmodSync,
	existsSync,
	mkdirSync,
	mkdtempSync,
	readFileSync,
	rmSync,
	writeFileSync,
} = require("node:fs");
const { tmpdir } = require("node:os");
const { join } = require("node:path");
const { spawnSync } = require("node:child_process");
const test = require("node:test");

const SCRIPT_PATH = join(__dirname, "vpk-system-clean.sh");
const ZSH_PATH = ["/bin/zsh", "/usr/bin/zsh"].find(existsSync);
const ZSH_TEST_OPTIONS = {
	skip: ZSH_PATH ? false : "requires zsh for the macOS maintenance script",
};

function writeExecutable(path, source) {
	writeFileSync(path, source);
	chmodSync(path, 0o755);
}

function runSweep({
	cpu = "75.0",
	elapsed = "01:00:00",
	executable = "/usr/local/bin/almd",
} = {}) {
	const root = mkdtempSync(join(tmpdir(), "vpk-system-clean-test-"));
	const home = join(root, "home");
	const fakeBin = join(root, "bin");
	const zDotDir = join(root, "zdot");
	const killLog = join(root, "kill.log");
	const cleanupLog = join(home, "Library/Logs/vpk-system-clean.log");
	mkdirSync(join(home, "Library/Logs"), { recursive: true });
	mkdirSync(fakeBin, { recursive: true });
	mkdirSync(zDotDir, { recursive: true });
	writeFileSync(join(zDotDir, ".zshenv"), "disable kill\n");

	writeExecutable(join(fakeBin, "pgrep"), `#!/bin/sh
if [ "$*" = "-x almd" ]; then
	echo 4242
	exit 0
fi
exit 1
`);
	writeExecutable(join(fakeBin, "ps"), `#!/bin/sh
case "$*" in
	*%cpu=*) echo "${cpu}" ;;
	*etime=*) echo "${elapsed}" ;;
	*) exit 1 ;;
esac
`);
	writeExecutable(join(fakeBin, "lsof"), `#!/bin/sh
printf 'p4242\\nftxt\\nn${executable}\\n'
`);
	writeExecutable(join(fakeBin, "sleep"), "#!/bin/sh\nexit 0\n");
	writeExecutable(join(fakeBin, "tmux"), "#!/bin/sh\nexit 1\n");
	writeExecutable(join(fakeBin, "kill"), `#!/bin/sh
if [ "\${1:-}" = "-0" ]; then
	exit 1
fi
printf '%s\\n' "$*" >> "$FAKE_KILL_LOG"
`);

	const result = spawnSync(ZSH_PATH, [SCRIPT_PATH], {
		encoding: "utf8",
		env: {
			...process.env,
			FAKE_KILL_LOG: killLog,
			HOME: home,
			PATH: `${fakeBin}:/usr/bin:/bin:/usr/sbin:/sbin`,
			ZDOTDIR: zDotDir,
		},
	});
	const output = {
		cleanupLog: readFileSync(cleanupLog, "utf8"),
		killLog: existsSync(killLog) ? readFileSync(killLog, "utf8") : "",
		result,
	};
	rmSync(root, { recursive: true, force: true });
	return output;
}

test("resets an exact-path almd only after sustained high CPU", ZSH_TEST_OPTIONS, () => {
	const { cleanupLog, killLog, result } = runSweep();

	assert.equal(result.status, 0, result.stderr);
	assert.equal(killLog.trim(), "4242");
	assert.match(cleanupLog, /stopped runaway almd pid 4242 with TERM \(~75\.0% CPU, 3600s old/);
	assert.match(cleanupLog, /summary: .*; almd reset 1; fseventsd/);
});

test("keeps almd during its protected startup window", ZSH_TEST_OPTIONS, () => {
	const { cleanupLog, killLog, result } = runSweep({ elapsed: "00:05:00" });

	assert.equal(result.status, 0, result.stderr);
	assert.equal(killLog, "");
	assert.match(cleanupLog, /kept almd pid 4242 \(300s old < 900s minimum\)/);
});

test("keeps a same-named process from an unexpected executable path", ZSH_TEST_OPTIONS, () => {
	const { cleanupLog, killLog, result } = runSweep({ executable: "/tmp/almd" });

	assert.equal(result.status, 0, result.stderr);
	assert.equal(killLog, "");
	assert.match(cleanupLog, /unexpected executable '\/tmp\/almd', expected \/usr\/local\/bin\/almd/);
});
