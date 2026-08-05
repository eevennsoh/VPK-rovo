---
name: vpk-tunnel
description: "Share a live VPK localhost prototype with external participants through a public Atlas Tunnel URL. Use when the user says \"vpk-tunnel\", \"share my prototype\", \"make this localhost link public\", \"send a customer a prototype link\", or asks to start, inspect, or stop an Atlas Tunnel for a VPK Portless URL."
purpose: Expose one live VPK Portless frontend through a scoped, short-lived public Atlas Tunnel.
owner: VPK
category: workflow
inputs: Optional Portless URL and action (start, status, or stop).
outputs: Public prototype URL, local source URL, tunnel status, or a targeted shutdown result.
required_tools: shell, node, pnpm, atlas, cloudflared, tmux
validation_command: node --test .agents/skills/vpk-tunnel/scripts/vpk-tunnel.test.js
generated_artifacts: None. Runtime state is limited to a target-scoped tmux session.
common_failure_modes: Local prototype is unresponsive, Portless URL is stale, Atlas Tunnel or cloudflared is missing, or public-sharing confirmation was not given.
---

# VPK Tunnel

Share a live VPK prototype with an external participant through Atlas Tunnel.
This workflow is for short research sessions, feedback rounds, and live reviews;
it is not production or long-term hosting.

## Interface

```text
vpk-tunnel
vpk-tunnel https://feature.vpk-rovo.localhost/path
vpk-tunnel status [Portless URL]
vpk-tunnel stop [Portless URL]
```

With no URL, target `https://vpk-rovo.localhost`. This is the persistent main
worktree's stable Portless hostname, regardless of which Git branch that
checkout currently has checked out. A supplied Portless URL selects another
live frontend. Preserve its path, query, and fragment in the public link.

## Public-sharing boundary

Atlas Tunnel makes the selected local application reachable from the public
internet. Before every `start`, show the exact local URL and ask the user to
confirm that the prototype contains only synthetic or fake data and is safe for
external sharing. Do not infer this confirmation from earlier sessions.

After confirmation, pass `--confirm-public` to the helper. The helper also
refuses to start without that flag, which prevents accidental exposure when it
is called directly. Status and stop operations do not need confirmation.

## One-time setup

The helper checks dependencies but does not install or upgrade them. If its
preflight reports missing Atlas Tunnel or `cloudflared`, ask before making any
machine-level change, then use the relevant commands:

```bash
atlas upgrade
atlas plugin install --name tunnel
brew install cloudflared
```

## Start

1. Run `pnpm ports once` so the user can see the live worktrees and Portless
   URLs. If a custom URL was supplied, require an exact hostname match in that
   inventory.
2. Resolve the target without exposing it:

   ```bash
   node .agents/skills/vpk-tunnel/scripts/vpk-tunnel.js resolve [Portless URL]
   ```

3. If resolution or the HTTP health probe fails, do not start a tunnel. Explain
   whether the prototype must be started, its route fixed, or its Portless URL
   corrected. Use `pnpm run dev:tmux:start` in the owning worktree only when the
   user asks to start it.
4. Show the resolved local URL and obtain the public-sharing confirmation.
5. Start the scoped tunnel:

   ```bash
   node .agents/skills/vpk-tunnel/scripts/vpk-tunnel.js start [Portless URL] --confirm-public
   ```

   Atlas commands may need permission to write their machine-local cache or use
   the network. Request that permission through the active tool rather than
   weakening the preflight.
6. Report the returned `publicUrl` as the shareable link and include the
   `localUrl`. State that the link works only while the local server, scoped
   tunnel session, laptop, and network connection remain active.

The helper runs the canonical command in a hostname-scoped tmux session:

```bash
atlas tunnel start --port <resolved-frontend-port> --public
```

Starting the same hostname again reuses its existing tunnel. Different paths
on that hostname share one tunnel but receive path-specific public links.

## Status and stop

Inspect only the selected hostname's tunnel:

```bash
node .agents/skills/vpk-tunnel/scripts/vpk-tunnel.js status [Portless URL]
```

Stop only that hostname's tunnel:

```bash
node .agents/skills/vpk-tunnel/scripts/vpk-tunnel.js stop [Portless URL]
```

Never use `atlas tunnel clean`: it deletes every Atlas Tunnel created by the
CLI and can disrupt unrelated prototype sessions. Do not stop the VPK dev
server unless the user separately asks for it.

## Troubleshooting

- **Unknown Portless URL:** run `pnpm ports once` and use an exact listed URL.
- **Recorded route but dead port:** start or repair that worktree's frontend.
- **HTTP probe times out or returns an error:** open the local route and fix it
  before exposing it; port liveness alone is not enough.
- **Missing Atlas Tunnel plugin:** run the one-time Atlas commands after user
  approval, then retry.
- **Missing `cloudflared`:** install it with Homebrew after user approval.
- **Tunnel session exists but has no public URL:** inspect `status`; if Atlas
  exited or authentication failed, stop the scoped session and retry after
  fixing the reported error.

## Report format

For a successful start, keep the handoff compact:

```text
Public link: <public URL>
Local source: <Portless URL>
Status: Live while the local server, tunnel, laptop, and network stay running.
Stop: vpk-tunnel stop <Portless URL>
```
