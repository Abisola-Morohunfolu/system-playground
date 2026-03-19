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

## Deploy To Vercel

The repo is configured so Vercel can build from the repository root.

1. Import the repository into Vercel.
2. Keep the project root as the repo root.
3. Vercel will use `vercel.json`:
   - install: `yarn install --immutable`
   - build: `yarn build:web`
   - output: `apps/web/dist`

Local verification: `yarn build:web`

## Release flow

1. Add changeset: `yarn changeset`
2. Version packages: `yarn version:packages`
3. Publish packages: `yarn release`
