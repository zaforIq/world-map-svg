# Agent Notes

## Project

React component library that renders an interactive SVG world map. Built with React 19 + TypeScript + Vite library mode.

## Build & Dev

- `npm run dev` — start playground dev server (Vite app in `playground/`)
- `npm run build` — type-check (`tsc -b`), build library (`vite build`), then emit declarations (`tsc -p tsconfig.build.json`)
- `npm run lint` — ESLint; covers `**/*.{ts,tsx}`
- `npm run prepublishOnly` — runs `build` + `lint` before publishing

## TypeScript Constraints

Project references are used (`tsconfig.json` → `tsconfig.app.json` + `tsconfig.node.json`).

Key strict flags in `tsconfig.app.json` that will fail builds:
- `verbatimModuleSyntax: true` — use `import type` for type-only imports
- `noUnusedLocals: true`
- `noUnusedParameters: true`
- `erasableSyntaxOnly: true`

## Testing

No test runner is configured. Do not run `npm test`.

## Library Output

Vite library mode emits:
- `dist/world-map-svg.es.js` (ESM)
- `dist/world-map-svg.cjs.js` (CJS)
- `dist/index.d.ts` (types, emitted by `tsconfig.build.json`)
- `dist/style.css` (extracted component styles)

`package.json` `exports` field points to these. `files` is `["dist"]`.

React and ReactDOM are peer dependencies and externalized in the Rollup build.

## Entrypoint

Library exports are defined in `src/index.ts`.

## Runtime Asset

`src/world.svg` is imported as a raw string (`?raw`) and bundled into the library output. Consumers do not need to host the SVG themselves. The `svgUrl` prop allows overriding the bundled map.

## Playground

`playground/` is a separate Vite app for local development. It imports the component directly from `../src` via relative paths. No separate `npm install` is needed — it uses the root `node_modules`. `playground/tsconfig.json` is independent of the root project references.
