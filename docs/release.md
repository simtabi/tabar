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
- publishes to npm with `npm publish --provenance --access public`.

## First-release setup (once)

1. Make the repo public on GitHub.
2. Create a `npm` GitHub Environment.
3. Configure the npm trusted publisher for `@simtabi/tabar` pointing at this repo and the
   `release.yml` workflow.
4. Cut `v0.5.0`.

Every release **must** carry a human-readable description sourced from the CHANGELOG — never
a bare "see changelog" stub.

---

[← Docs index](../README.md#documentation)
