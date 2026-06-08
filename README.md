# puku-changelogs

Source of truth for product changelogs published on [puku.sh](https://puku.sh). Content is stored as Markdown in Git, reviewed via pull request, and served at runtime through the changelog API — no docs site redeploy required for each release.

## Products

| Product ID    | Folder                    | Status   |
|---------------|---------------------------|----------|
| `puku-editor` | `changelogs/puku-editor/` | Active   |
| `puku-cli`    | `changelogs/puku-cli/`    | Active   |
| `puku-cowork` | `changelogs/puku-cowork/` | Planned  |
| `puku-design` | `changelogs/puku-design/` | Planned  |

## Adding a new changelog entry

1. Pull the latest `main` branch.
2. Create a branch, e.g. `changelog/puku-editor-v1.1.0`.
3. Add a new file: `changelogs/<product>/<slug>.md`
4. Optionally add media under `changelogs/<product>/assets/<slug>/`.
5. Open a pull request and wait for CI validation and review.
6. After merge, `index.json` is updated automatically (see below). Allow up to ~7 minutes for the website to reflect the change.

## Changelog file format

Each entry is one Markdown file with YAML frontmatter.

### Filename and folder rules

- **Filename:** `<slug>.md` — must match the `slug` field in frontmatter (e.g. `v1.0.0.md` → `slug: v1.0.0`).
- **Folder:** file must live in `changelogs/<product>/` where `<product>` matches the `product` field in frontmatter.

### Required frontmatter

```yaml
---
slug: v1.0.0
title: "Puku Editor v1.0.0 — Initial Release"
version: "1.0.0"
product: puku-editor
publishedAt: "2026-06-06"
draft: false
summary: "Optional one-line summary for list cards."
---
```

| Field         | Required | Description |
|---------------|----------|-------------|
| `slug`        | Yes      | URL identifier; must match filename without `.md` |
| `title`       | Yes      | Display title on the changelog page |
| `version`     | Yes      | Semver or product version string |
| `product`     | Yes      | Must match parent folder name |
| `publishedAt` | Yes      | ISO date `YYYY-MM-DD`; used for sorting (newest first) |
| `draft`       | No       | If `true`, excluded from `index.json` (default: `false`) |
| `summary`     | No       | Short one-line blurb |

### Body content

Write standard Markdown after the closing `---`:

```markdown
## Highlights

Short intro paragraph.

### New Features

- Feature one
- Feature two

### Bug Fixes

- Fixed issue with X
```

## Images, GIFs, and videos

Store assets under:

```
changelogs/<product>/assets/<slug>/
```

Reference them in Markdown using the GitHub raw URL:

```markdown
![Demo](https://raw.githubusercontent.com/puku-sh/puku-changelogs/main/changelogs/puku-editor/assets/v1.0.0/demo.gif)
```

Guidelines:

- Prefer `.webp` for screenshots.
- Keep GIFs short; use `.mp4`/`.webm` for longer demos.
- Keep individual files under 5 MB when possible.
- You may also use external CDN URLs (e.g. S3) with no code changes.

## `index.json` — do not edit manually

`index.json` at the repository root is **auto-generated** by CI when changes merge to `main`. It lists all published entries (excluding `draft: true`) grouped by product, sorted newest first.

Raw URL:

```
https://raw.githubusercontent.com/puku-sh/puku-changelogs/main/index.json
```

To validate entries locally before opening a PR (after Part B scripts are installed):

```bash
cd scripts && npm ci && cd ..
node scripts/generate-index.mjs --check-only
```

## Edit or unpublish an entry

| Action        | Steps |
|---------------|-------|
| **Edit**      | Edit the same `.md` file in a PR → merge |
| **Unpublish** | Set `draft: true` or delete the file → merge |

## Related repositories

| Repository          | Role |
|---------------------|------|
| `puku-changelogs`   | Changelog content (this repo) |
| `puku-subscription` | Public changelog API (Cloudflare Worker) |
| `puku-editor-docs`  | Changelog UI on puku.sh |
