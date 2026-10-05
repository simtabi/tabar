# Release

Tabar is published to npm as [`@simtabi/tabar`](https://www.npmjs.com/package/@simtabi/tabar).
Releases are tag-driven and use npm OIDC **trusted publishing** with provenance — no
long-lived tokens.

## Versioning

Semantic Versioning. There is a single source of version truth: `package.json::version`.

## Cutting a release

1. Update `CHANGELOG.md`: move `[Unreleased]` items into a new `## [X.Y.Z] - YYYY-MM-DD`
   section.
2. Bump the version: `npm version X.Y.Z` (creates the commit and `vX.Y.Z` tag).
3. Push: `git push && git push --tags`.

Pushing the tag triggers `.github/workflows/release.yml`, which:

- runs lint, tests and the build,
- extracts the tagged version's `CHANGELOG.md` block as the GitHub release body (with
  `generate_release_notes: true` for the contributor/PR list),
- publishes to the registry the repository variable `PUBLISH_REGISTRY` names: npm (the default) with
  `npm publish --provenance --access public`, or GitHub Packages (`github`) with the run's own
  `GITHUB_TOKEN`. A version the registry already has is reported, not failed.

## npm or GitHub Packages

One command publishes every release tag that is not out yet, oldest first, to either registry, by
starting `release.yml` once per tag (a hand-started run never touches the tag's GitHub release):

```bash
.dev/tools/npm-release github        # GitHub Packages; needs no npm token
.dev/tools/npm-release npm           # npm, with a granular token (npm_…) on the clipboard
.dev/tools/npm-release               # npm if the clipboard holds a token npm accepts, GitHub Packages otherwise
```

`--dry-run` changes nothing, `--keep-token` uses the secret already set, and naming tags (`v0.6.0`)
publishes only those; `--help` lists the rest. It needs `gh` signed in as a maintainer. The same
command, byte for byte, publishes every Simtabi package; its canonical copy is in `laranail/emojis`.

GitHub Packages signs no provenance and asks for authentication even to install a public package: a
project installing from it adds `@simtabi:registry=https://npm.pkg.github.com` and
`//npm.pkg.github.com/:_authToken=${GITHUB_TOKEN}` to its `.npmrc`, with a token that has
`read:packages`.

## First-release setup (once)

1. Make the repo public on GitHub.
2. Create a `npm` GitHub Environment.
3. Configure the npm trusted publisher for `@simtabi/tabar` pointing at this repo and the
   `release.yml` workflow.
4. Push the first tag (e.g. `v0.6.0`) to trigger the workflow.

Every release **must** carry a human-readable description sourced from the CHANGELOG — never
a bare "see changelog" stub.

---

[← Docs index](../README.md#documentation)
