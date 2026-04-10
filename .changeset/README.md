# Changesets

Use [Changesets](https://github.com/changesets/changesets) to record what should go into the next release.

## Add a changeset

After your change is ready (in a branch / PR):

```bash
npx changeset
# or
npm run changeset
```

Pick semver bump (patch / minor / major) and write a short summary for the changelog.

Commit the generated file under `.changeset/*.md` with your PR.

## Release flow (CI)

1. **`changesets-version.yml`** (push to `main` that touches the **`.changeset`** folder): runs `changesets/action` **without** publish — it only opens or updates the **Version packages** PR (`package.json` + `CHANGELOG.md`) when there is at least one pending `.changeset/*.md` (other than `README.md`). Use **Actions → Run workflow** to force a run. Merges that only remove consumed changesets skip the action.
2. **Merge that PR** into `main`.
3. **`auto-tag-version.yml`** (push to `main` that changes **`package.json`**): creates a **draft GitHub Release** named `v<version>` pointing at the merge commit (the git tag is created when you publish the release).
4. On GitHub: open **Releases**, review the draft, then click **Publish release**.
5. **`publish-on-release.yml`** runs on **`release: published`** (only **non-prerelease** releases) → `npm run release` with **npm trusted publishing (OIDC)**. Prereleases on GitHub do not publish to npm with this workflow.

### npm trusted publishing (OIDC, no `NPM_TOKEN`)

On [npmjs.com](https://www.npmjs.com/) → package **Settings → Trusted publishing**, set the workflow that runs **`npm publish`**:

- **`publish-on-release.yml`**

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

See [npm/cli#9088](https://github.com/npm/cli/issues/9088): upgrade npm in the publish workflow (already pinned to **11.6.2** in `publish-on-release.yml`).

## Local versioning (optional)

```bash
npm run version-packages
```

Usually you rely on the Version packages PR from CI instead.
