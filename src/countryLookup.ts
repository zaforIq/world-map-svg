import countryAliasData from './country-aliases.json'

const COUNTRY_ALIASES = countryAliasData.aliases as Record<string, string>
const COUNTRY_DISAMBIGUATED_NAMES = countryAliasData.disambiguated as Record<string, string[]>

export type MapCountry = {
  code: string
  name: string
}

export function normalizeCountryName(value: string): string {
  return value
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[''`]/g, '')
    .replace(/[.,()]/g, ' ')
    .replace(/[^a-z0-9\s-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

export function listMapCountries(svg: Element): MapCountry[] {
  const countries: MapCountry[] = []

  svg.querySelectorAll('path[id][title]').forEach((path) => {
    const code = path.getAttribute('id')?.trim().toUpperCase()
    const name = path.getAttribute('title')?.trim()
    if (code && name) {
      countries.push({ code, name })
    }
  })

  return countries.sort((a, b) => a.name.localeCompare(b.name))
}

export function buildCountryLookup(svg: Element): Map<string, string> {
  const paths = listMapCountries(svg)

  const titleGroups = new Map<string, string[]>()
  for (const { code, name } of paths) {
    const key = normalizeCountryName(name)
    const group = titleGroups.get(key) ?? []
    if (!group.includes(code)) {
      group.push(code)
    }
    titleGroups.set(key, group)
  }

  const lookup = new Map<string, string>()

  for (const [alias, code] of Object.entries(COUNTRY_ALIASES)) {
    lookup.set(normalizeCountryName(alias), code.toUpperCase())
  }

  for (const [code, names] of Object.entries(COUNTRY_DISAMBIGUATED_NAMES)) {
    for (const name of names) {
      lookup.set(normalizeCountryName(name), code.toUpperCase())
    }
  }

  for (const { code, name } of paths) {
    lookup.set(normalizeCountryName(code), code)

    const key = normalizeCountryName(name)
    if ((titleGroups.get(key)?.length ?? 0) === 1) {
      lookup.set(key, code)
    }
  }

  return lookup
}

export function resolveCountryCode(
  identifier: string,
  lookup: Map<string, string>,
): string | null {
  const trimmed = identifier.trim()
  if (!trimmed) {
    return null
  }

  return lookup.get(normalizeCountryName(trimmed)) ?? null
}
