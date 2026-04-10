# titlefx Contributing Guide

Hi! We're really excited that you are interested in contributing to titlefx. Before submitting your contribution, please take a moment and read through the following guidelines:

- [Contributor Covenant Code of Conduct](https://www.contributor-covenant.org/version/2/1/code_of_conduct/)
- [Pull Request Guidelines](#pull-request-guidelines)

## Pull Request Guidelines

- Check out a topic branch from the relevant branch, e.g. `main`, and merge back against that branch.

- If adding a new feature:

  - Provide a convincing reason to add this feature. Ideally, open a suggestion issue first and have it approved before working on it.

- If fixing a bug:

  - Provide a detailed description of the bug in the PR. A live demo or minimal reproduction is preferred.

- It's OK to have multiple small commits as you work on the PR — GitHub can squash them before merging.

- Prefer clear commit messages (e.g. [Conventional Commits](https://www.conventionalcommits.org/)) so history and release notes stay easy to follow.

- Include a **Changeset** for user-facing changes: run `npm run changeset` (or `npx changeset`), pick patch/minor/major, and commit the generated `.changeset/*.md` with your PR. See `.changeset/README.md`.

## Development Setup

You will need a current **Node.js** (see `.github/workflows` for the version used in CI).

After cloning the repo, run:

```sh
# install dependencies
$ npm install
```

### Documentation site (VitePress)

To work on the docs and playground with live reload:

```sh
$ npm run docs:dev
```

Then open the URL shown in the terminal (often `http://localhost:5173`) and edit files under `docs/`.

To build static output:

```sh
$ npm run docs:build
```

Preview the production build:

```sh
$ npm run docs:preview
```

### Library package

Typecheck and emit `dist/`:

```sh
$ npm run build
```

Watch mode while changing `src/`:

```sh
$ npm run dev
```
