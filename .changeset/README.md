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

Two workflows:

1. **`changesets-version.yml`** (push to `main`): runs `changesets/action` **without** publish — it only opens or updates the **Version packages** PR (`package.json` + `CHANGELOG.md`).
2. **Merge that PR** into `main`.
3. **`auto-tag-version.yml`** (push to `main`): reads **`version`** from `package.json`. If the tag **`v<version>`** (e.g. `0.2.0` → `v0.2.0`) **does not** exist on `origin`, it **creates and pushes** that tag. If the tag already exists, it does nothing (idempotent on every merge to `main`).
4. **`publish-on-tag.yml`** runs on **`push` of tags `v*`** → `npm run release` (build + `changeset publish`) with **npm trusted publishing (OIDC)**.

To tag **manually** instead (or to fix a missed release), you can still run `git tag vX.Y.Z && git push origin vX.Y.Z` as long as the tag does not already exist.

### npm trusted publishing (OIDC, no `NPM_TOKEN`)

On [npmjs.com](https://www.npmjs.com/) → package **Settings → Trusted publishing**, set the workflow filename to the one that runs **`npm publish`**:

- **`publish-on-tag.yml`** (filename only, as npm shows the field)

Also required:

- `package.json` **`repository.url`** must match this GitHub repo.
- Root **`.npmrc`** only sets `registry=` so nothing injects `//registry.npmjs.org/:_authToken=…` before OIDC publish.
- The publish job uses Node **24** and **`npm install -g npm@11.6.2`** so OIDC works (see [npm/cli#9088](https://github.com/npm/cli/issues/9088)).

If you install **private** npm packages in CI, use a **read-only** token only for install — publishing still uses OIDC.

### GitHub: “not permitted to create or approve pull requests”

Applies to **`changesets-version.yml`** only (it opens the Version PR). In **Settings → Actions → General → Workflow permissions**:

- **Read and write permissions**
- **Allow GitHub Actions to create and approve pull requests**

### npm: E404 on publish in CI

See [npm/cli#9088](https://github.com/npm/cli/issues/9088): upgrade npm in the publish workflow (already pinned to **11.6.2** in `publish-on-tag.yml`).

## Local versioning (optional)

```bash
bun run version-packages
```

Usually you rely on the Version packages PR from CI instead.
