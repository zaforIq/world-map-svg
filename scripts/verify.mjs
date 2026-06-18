/**
 * Build-time verification for map data and country lookup coverage.
 * Exits 1 on any failure.
 */
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.join(__dirname, '..')

const { aliases: COUNTRY_ALIASES, disambiguated: COUNTRY_DISAMBIGUATED_NAMES } = JSON.parse(
  fs.readFileSync(path.join(root, 'src/country-aliases.json'), 'utf8'),
)

function normalizeCountryName(value) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
}

function parseSvgCountries(svgText) {
  const paths = []
  const blockRe = /<path\b[\s\S]*?\/>/g
  let block
  while ((block = blockRe.exec(svgText)) !== null) {
    const id = block[0].match(/\bid="([A-Z]{2})"/)?.[1]
    const title = block[0].match(/\btitle="([^"]+)"/)?.[1]
    if (id && title) {
      paths.push({ code: id.trim().toUpperCase(), title: title.trim() })
    }
  }
  return paths
}

function buildCountryLookup(paths) {
  const titleGroups = new Map()
  for (const { code, title } of paths) {
    const key = normalizeCountryName(title)
    const group = titleGroups.get(key) ?? []
    if (!group.includes(code)) group.push(code)
    titleGroups.set(key, group)
  }

  const lookup = new Map()
  for (const [alias, code] of Object.entries(COUNTRY_ALIASES)) {
    lookup.set(normalizeCountryName(alias), code.toUpperCase())
  }
  for (const [code, names] of Object.entries(COUNTRY_DISAMBIGUATED_NAMES)) {
    for (const name of names) {
      lookup.set(normalizeCountryName(name), code.toUpperCase())
    }
  }
  for (const { code, title } of paths) {
    lookup.set(normalizeCountryName(code), code)
    const key = normalizeCountryName(title)
    if ((titleGroups.get(key)?.length ?? 0) === 1) {
      lookup.set(key, code)
    }
  }
  return { lookup, titleGroups }
}

function resolve(identifier, lookup) {
  const trimmed = identifier.trim()
  if (!trimmed) return null
  return lookup.get(normalizeCountryName(trimmed)) ?? null
}

function generateCurve(from, to) {
  const dx = to.x - from.x
  const dy = to.y - from.y
  const dist = Math.sqrt(dx * dx + dy * dy)
  const midY = (from.y + to.y) / 2
  const offset = Math.max(Math.min(dist * 0.35, 220), 15)
  const cp1x = from.x + dx * 0.25
  const cp1y = midY - offset
  const cp2x = from.x + dx * 0.75
  const cp2y = midY - offset
  return `M ${from.x} ${from.y} C ${cp1x},${cp1y} ${cp2x},${cp2y} ${to.x} ${to.y}`
}

const failures = []

function fail(message) {
  failures.push(message)
}

const svgText = fs.readFileSync(path.join(root, 'src/world.svg'), 'utf8')
const centers = JSON.parse(fs.readFileSync(path.join(root, 'src/country-centers.json'), 'utf8'))
const paths = parseSvgCountries(svgText)
const { lookup, titleGroups } = buildCountryLookup(paths)

console.log(`Verifying ${paths.length} map countries...`)

if (paths.length === 0) {
  fail('No countries found in world.svg')
}

const codes = new Set(paths.map((p) => p.code))
if (codes.size !== paths.length) {
  fail(`Duplicate country codes in SVG: ${paths.length - codes.size} duplicates`)
}

const dupes = [...titleGroups.entries()].filter(([, g]) => g.length > 1)
if (dupes.length > 0) {
  for (const [key, group] of dupes) {
    fail(`Ambiguous SVG title "${key}" maps to: ${group.join(', ')}`)
  }
}

for (const { code, title } of paths) {
  if (resolve(code, lookup) !== code) {
    fail(`Code "${code}" (${title}) does not resolve to itself`)
  }
  if (resolve(title, lookup) !== code) {
    fail(`Title "${title}" (${code}) does not resolve to its code`)
  }
  if (!centers[code]) {
    fail(`Missing centroid for ${code} (${title})`)
  }
}

for (const code of Object.keys(centers)) {
  if (!codes.has(code) && !code.startsWith('UM-')) {
    fail(`country-centers.json has "${code}" but it is not on the map`)
  }
}

for (const { code } of paths) {
  const base = centers[code]
  if (!base || !Number.isFinite(base.x) || !Number.isFinite(base.y)) {
    fail(`Invalid centroid for ${code}`)
    continue
  }
  for (const other of paths) {
    if (other.code === code) continue
    const target = centers[other.code]
    const curve = generateCurve(target, base)
    if (curve.includes('NaN') || curve.includes('Infinity')) {
      fail(`Invalid connection curve ${other.code} -> ${code}`)
    }
  }
}

const aliasChecks = [
  ['Bangladesh', 'BD'], ['United States', 'US'], ['USA', 'US'], ['UK', 'GB'],
  ['Brunei', 'BN'], ['Laos', 'LA'], ['Sint Maarten', 'SX'], ['Saint Martin', 'MF'],
  ['Saint-Martin', 'MF'], ['Côte d\'Ivoire', 'CI'], ['Czechia', 'CZ'],
  ['Burma', 'MM'], ['Myanmar', 'MM'], ['Taiwan', 'TW'], ['Hong Kong', 'HK'],
]

for (const [input, expected] of aliasChecks) {
  const got = resolve(input, lookup)
  if (got !== expected) {
    fail(`Alias "${input}" -> ${got}, expected ${expected}`)
  }
}

const connectionBaseNames = ['Bangladesh', 'United States', 'Germany', 'Japan']
for (const name of connectionBaseNames) {
  const code = resolve(name, lookup)
  if (!code || !centers[code]) {
    fail(`Connection base "${name}" not drawable`)
  }
}

if (failures.length > 0) {
  console.error(`\n${failures.length} verification failure(s):\n`)
  failures.forEach((f, i) => console.error(`  ${i + 1}. ${f}`))
  process.exit(1)
}

console.log('All checks passed:')
console.log(`  - ${paths.length} countries on map`)
console.log(`  - ${paths.length} ISO codes resolve`)
console.log(`  - ${paths.length} country names resolve`)
console.log(`  - ${paths.length} connection centroids`)
console.log(`  - ${lookup.size} lookup keys`)
console.log(`  - connection curves valid for all pairs`)
