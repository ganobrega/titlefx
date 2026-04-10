# Changesets

Use [Changesets](https://github.com/changesets/changesets) to record what should go into the next release.

## Add a changeset

After your change is ready (in a branch / PR):

```bash
bunx changeset
# or
bun run changeset
```

Pick semver bump (patch / minor / major) and write a short summary for the changelog.

Commit the generated file under `.changeset/*.md` with your PR.

## Release flow (CI)

On `main`, `.github/workflows/release.yml`:

1. Opens a **Version packages** PR when there are pending changesets (bumps `package.json`, updates `CHANGELOG.md`).
2. After that PR is merged, publishes to npm with `bun run release` (build + `changeset publish`).

### npm trusted publishing (OIDC, no `NPM_TOKEN`)

This repo is set up for [npm trusted publishers](https://docs.npmjs.com/trusted-publishers): GitHub Actions uses OIDC (`id-token: write` in the workflow). **Do not** set `NPM_TOKEN` on the Changesets step.

Requirements:

- On npmjs.com → package **Settings → Trusted publishing**, the workflow file must match exactly: **`release.yml`** (only the filename, as npm expects).
- `package.json` **`repository.url`** must match this GitHub repo (required by npm for GitHub OIDC).
- Root **`.npmrc`** only sets `registry=` so `changesets/action` does **not** overwrite it with `//registry.npmjs.org/:_authToken=…` (which would block OIDC).
- Use a **Node/npm** version that supports trusted publishing (workflow uses Node **24** + npm from that release; npm needs **11.5.1+** per npm docs).

If you install **private** npm packages in CI, use a **read-only** token only for `npm ci` / `bun install` — publishing still uses OIDC.

### GitHub: “not permitted to create or approve pull requests”

The release workflow uses `changesets/action`, which opens a **Version packages** PR using `GITHUB_TOKEN`. If the job fails with:

`GitHub Actions is not permitted to create or approve pull requests`

then in the repo **Settings → Actions → General → Workflow permissions**:

- Choose **Read and write permissions**
- Enable **Allow GitHub Actions to create and approve pull requests**

Org-owned repos may inherit stricter defaults; an org admin may need to change org-level Actions policy. As a fallback, use a PAT with `repo` (or equivalent) stored as a secret and set `GITHUB_TOKEN: ${{ secrets.YOUR_PAT_SECRET }}` on the Changesets step.

### npm: E404 on `PUT …/titlefx` in CI (trusted publishing)

If the log shows OIDC is in use but publish still returns **404**, the setup on npm/GitHub may be correct and the **npm CLI** on the runner may be too old — npm has reported misleading404/ENEEDAUTH for OIDC until a recent release (see [npm/cli#9088](https://github.com/npm/cli/issues/9088)). This workflow runs **`npm install -g npm@11.6.2`** (or newer) after `setup-node` so `changeset publish` uses a compatible npm.

## Local versioning (optional)

```bash
bun run version-packages
```

Then commit the version bump and changelog updates (usually done via the bot PR instead).
