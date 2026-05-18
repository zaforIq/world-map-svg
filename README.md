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

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `backgroundColor` | `string` | `transparent` | Map background color |
| `countryColor` | `string` | `#093C5D` | Base fill color for countries |
| `svgUrl` | `string` | bundled SVG | Custom SVG URL to override the default world map |
| `showConnections` | `boolean` | `true` | Show carved connection lines |
| `connectionBase` | `string` | `BD` | ISO country code of the hub/base country |
| `connectedCountries` | `string[]` | `['US', 'IN']` | ISO country codes to connect to the base |
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
