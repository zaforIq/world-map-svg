# world-map-svg

Interactive SVG world map React component with zoom, pan, and country selection.

## Installation

```bash
npm install world-map-svg
```

## Usage

```tsx
import { WorldMap } from 'world-map-svg'
import 'world-map-svg/style.css'

function App() {
  return (
    <div style={{ width: '100%', height: '500px' }}>
      <WorldMap
        countryColor="#093C5D"
      />
    </div>
  )
}
```

## Demo Usage

```tsx
import { useState } from 'react'
import { WorldMap } from 'world-map-svg'
import 'world-map-svg/style.css'

export function MapDemo() {
  const [hover, setHover] = useState<{ name: string; x: number; y: number } | null>(null)
  const [modal, setModal] = useState<{ code: string; name: string } | null>(null)

  return (
    <div style={{ position: 'relative', width: '100%', height: 600 }}>
      <WorldMap
        onCountryHover={(code, name, x, y) => setHover({ name, x, y })}
        onCountryClick={(code, name) => setModal({ code, name })}
      />

      {hover && (
        <div style={{ position: 'absolute', left: hover.x + 12, top: hover.y + 12 }}>
          {hover.name}
        </div>
      )}

      {modal && (
        <div>
          <h3>{modal.name}</h3>
          <p>{modal.code}</p>
        </div>
      )}
    </div>
  )
}
```

Hover gets the country name and pointer position. Click gets the country name and code, so your app can open a modal and load any extra data you need.

## Full Props Setup

```tsx
import { useState } from 'react'
import { WorldMap } from 'world-map-svg'
import 'world-map-svg/style.css'

export function FullMapSetup() {
  const [hover, setHover] = useState<{ name: string; x: number; y: number } | null>(null)
  const [selected, setSelected] = useState<{ code: string; name: string } | null>(null)

  return (
    <div style={{ position: 'relative', width: '100%', height: 600 }}>
      <WorldMap
        backgroundColor="#f8fbff"
        countryColor="#093C5D"
        className="my-map"
        showConnections
        connectionBase="BD"
        connectedCountries={['US', 'IN', 'GB', 'AE']}
        onCountryHover={(code, name, x, y) => setHover({ name: `${name} (${code})`, x, y })}
        onCountryClick={(code, name) => setSelected({ code, name })}
        onConnectionDotHover={(code, name) => {
          // Optional: show dot-specific tooltip
          console.log('dot hover', code, name)
        }}
        onConnectionDotClick={(code, name) => {
          // Optional: open modal or route to a detail page
          console.log('dot click', code, name)
        }}
      />

      {hover && (
        <div style={{ position: 'absolute', left: hover.x + 12, top: hover.y + 12 }}>
          {hover.name}
        </div>
      )}

      {selected && (
        <div>
          <h3>{selected.name}</h3>
          <p>Country code: {selected.code}</p>
        </div>
      )}
    </div>
  )
}
```

If you pass `onCountryHover` or `onCountryClick`, your app controls the hover/click UI (popover/modal). If you do not pass them, the built-in tooltip behavior is used.

### Connection country names

`connectionBase` and `connectedCountries` accept **ISO 3166-1 alpha-2 codes** (e.g. `BD`, `US`) or **country names** from the bundled map (e.g. `Bangladesh`, `United States`). Matching is case-insensitive and ignores extra whitespace, accents, and most punctuation.

Common abbreviations also work: `USA`, `UK`, `UAE`, `DRC`, `Brunei`, `Laos`, `Burma`, etc.

**Coverage:** All **250** countries on the bundled map are supported by ISO code and by their SVG country name (normalization handles accents, spacing, and punctuation). Common abbreviations (`USA`, `UK`, `UAE`, `Brunei`, `Laos`, etc.) are also supported. Run `npm run verify` to validate data integrity before every build.

```tsx
<WorldMap
  connectionBase="Bangladesh"
  connectedCountries={['United States', 'India', 'United Kingdom']}
/>
```

Use `normalizeCountryName` from the package if you need the same normalization in your app:

```tsx
import { normalizeCountryName } from 'world-map-svg'

normalizeCountryName("  Côte d'Ivoire ") // "cote d ivoire"
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `backgroundColor` | `string` | `transparent` | Map background color |
| `countryColor` | `string` | `#093C5D` | Base fill color for countries |
| `svgUrl` | `string` | bundled SVG | Custom SVG URL to override the default world map |
| `showConnections` | `boolean` | `true` | Show carved connection lines |
| `connectionBase` | `string` | `BD` | Hub country — ISO code (e.g. `BD`) or name (e.g. `Bangladesh`) |
| `connectedCountries` | `string[]` | `['US', 'IN']` | Connected endpoints — ISO codes and/or names (e.g. `['United States', 'India']`) |
| `onCountryHover` | `(code, name, x, y) => void` | - | Fires when hovering a country path. Suppresses built-in tooltip. |
| `onCountryClick` | `(code, name, x, y) => void` | - | Fires when clicking a country path. Suppresses built-in click tooltip. |
| `onConnectionDotHover` | `(code, name, x, y) => void` | - | Fires when hovering a connection dot. |
| `onConnectionDotClick` | `(code, name, x, y) => void` | - | Fires when clicking a connection dot. |
| `className` | `string` | - | Additional CSS class for the container |

## Development

```bash
npm install
npm run dev       # Start playground dev server
npm run build     # Build library for publishing
npm run lint
```

The default SVG map data is bundled with the package. You can override it via the `svgUrl` prop.

## Publish Checklist

1. Confirm package name availability:

```bash
npm view world-map-svg
```

If taken, rename to a scoped package in `package.json` (for example `@yourname/world-map-svg`).

2. Update package metadata in `package.json`:
- `repository.url`
- `bugs.url`
- `homepage`

3. Run release checks:

```bash
npm run build
npm run lint
npm pack --dry-run
```

4. Login and publish:

```bash
npm login
npm publish --access public
```
