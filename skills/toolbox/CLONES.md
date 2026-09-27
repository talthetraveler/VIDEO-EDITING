# THE CLONED SKILLS — restore these, don't commit them

Six skills in `toolbox/` are other people's GitHub repos, cloned in. They are
**deliberately excluded from this repository**: committing them would either
redistribute someone else's work through Tal's repo, or — because each carries
its own `.git` — record a broken submodule pointer whose files never actually
upload. Neither is a backup.

They are fully restorable, at the exact commit that is on the laptop:

| skill | origin | commit |
|---|---|---|
| `add-zooms` | https://github.com/louisedesadeleer/add-zooms | `34db910` |
| `clipify` | https://github.com/louisedesadeleer/clipify | `5f6b75e` |
| `cut-video` | https://github.com/louisedesadeleer/cut-video | `a5a87a6` |
| `find-broll` | https://github.com/louisedesadeleer/b-roll-finder | `36b8a56` |
| `video-use` | https://github.com/browser-use/video-use | `9575612` |
| `youtube-clipper` | https://github.com/op7418/Youtube-clipper-skill | `f31f077` |

To restore all six on a fresh machine:

```bash
cd skills/toolbox
while read -r name url sha; do
  git clone "$url" "$name" && git -C "$name" checkout "$sha"
done <<'LIST'
add-zooms         https://github.com/louisedesadeleer/add-zooms          34db910
clipify           https://github.com/louisedesadeleer/clipify            5f6b75e
cut-video         https://github.com/louisedesadeleer/cut-video          a5a87a6
find-broll        https://github.com/louisedesadeleer/b-roll-finder      36b8a56
video-use         https://github.com/browser-use/video-use               9575612
youtube-clipper   https://github.com/op7418/Youtube-clipper-skill        f31f077
LIST
```

`brag` installs differently — through its own installer, which also wires the
agent discovery paths:

```bash
npx skills add https://github.com/latent-spaces/brag --skill brag
npx skills add https://github.com/latent-spaces/brag --skill brag-slim
```

**Everything Tal wrote is in this repo.** What is excluded here is only code
that belongs to someone else and can be fetched back in one command. The
register of which of these are actually worth reaching for — and which lose to
what this repo already has — is `skills/tal-video-editor/REPOS.md`.

## Removed in the 2026-09-27 prune

No longer part of the kit (see `PRUNED.md` for why). Kept here only so
they can be fetched back:

| skill | origin | commit |
|---|---|---|
| `claude-shorts` | https://github.com/AgriciDaniel/claude-shorts | `a369fad` |
| `nl-video-editing` | https://github.com/6missedcalls/video-editing-skill | `7dc6e1d` |
| `brag` (raw clone) | https://github.com/latent-spaces/brag | `c893c5e` — use the installed `/brag` instead |
