# System Playground Monorepo

Yarn v4 + Lerna + Changesets monorepo for simulation engine-first development.

## Workspace Layout

- `packages/engine`: framework-agnostic simulation runtime.
- `packages/simulations`: simulation plugins built on engine.
- `packages/ui`: reusable UI/animation components.
- `packages/shared`: shared types and utilities.
- `apps/web`: web playground app (private).

## Getting Started

1. Enable Corepack: `corepack enable`
2. Install dependencies: `yarn install`
3. Build all: `yarn build`
4. Run web app: `yarn dev:web`

## Tooling Baseline

- Node.js: `20.x` (`.nvmrc` included)
- Package manager: Yarn v4 (`packageManager` enforced in root `package.json`)
- Monorepo orchestration: Lerna
- Versioning/publishing: Changesets

## Validation

- Run full quality gate: `yarn validate`

## Release flow

1. Add changeset: `yarn changeset`
2. Version packages: `yarn version:packages`
3. Publish packages: `yarn release`
