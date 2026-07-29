# Personal T3 Code Fork

This checkout has two Git remotes:

- `origin`: `https://github.com/chledowski/t3code.git`
- `upstream`: `https://github.com/pingdotgg/t3code.git`

Keep `main` as a clean mirror of upstream. Put personal changes on `personal`
or on short-lived feature branches created from it.

## Run the development version

Install or refresh dependencies:

```bash
vp i
```

Run the local web app and server:

```bash
vp run dev
```

Open the pairing URL printed by the development runner. It includes the token
needed to connect to the isolated development server.

Run the Electron desktop app in development:

```bash
vp run dev:desktop
```

Build an Apple Silicon DMG:

```bash
vp run dist:desktop:dmg:arm64
```

## Add a personal feature

Start each substantial change on its own branch:

```bash
git switch personal
git pull --ff-only origin personal
git switch -c feature/my-change
```

After testing and committing the feature, merge it back into `personal`:

```bash
git switch personal
git merge --no-ff feature/my-change
git push origin personal
```

Do not open personal feature pull requests against `pingdotgg/t3code`. If a
small change should be contributed upstream, create a fresh branch from the
clean `main` branch instead.

## Bring in upstream updates

First fast-forward the clean `main` branch:

```bash
git fetch upstream --prune
git switch main
git merge --ff-only upstream/main
git push origin main
```

Then merge the updated baseline into the personal branch:

```bash
git switch personal
git merge main
vp i
git push origin personal
```

If Git reports conflicts, resolve them on `personal`, preserving upstream
runtime and contract changes unless the personal fork intentionally overrides
that behavior. Keep upstream sync commits separate from new feature work.

## Useful checks

Follow the repository's `AGENTS.md` guidance and run checks focused on the code
you changed. Common commands include:

```bash
vp fmt
vp lint
vp test run path/to/relevant.test.ts
```

Avoid repo-wide tests and typechecks unless they are specifically needed; the
upstream repository delegates those broad checks to CI.

## Installed companion apps

- Official T3 Code: `/Applications/T3 Code (Alpha).app`
- CodexBar: `/Applications/CodexBar.app`

The official T3 Code app updates independently of this source checkout. Changes
on `personal` appear only when running or building this checkout.

## Local Claude profiles

T3 Code has two enabled Claude provider instances:

- `Claude Work` uses the default Claude configuration; it is intended for
  `jakub.chledowski@focal.systems`.
- `Claude Personal` uses `/Users/jakub/.claude_personal_home` as its
  `CLAUDE_CONFIG_DIR`; it is intended for `jakub.chledowski@gmail.com`.

To repair or repeat the personal login without disturbing the work account:

```bash
CLAUDE_CONFIG_DIR=/Users/jakub/.claude_personal_home claude auth login
```

Then use **Settings → Providers → Refresh provider status** in T3 Code.
Do not put Claude OAuth codes, cookies, or tokens in this repository.

CodexBar tracks Codex successfully from the active Codex login. Multiple Claude
accounts require CodexBar token-account or `claude-swap` setup; T3 Code provider
instances are not imported into CodexBar automatically.
