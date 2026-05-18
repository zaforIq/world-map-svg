import { useEffect, useMemo, useRef, useState } from 'react'
import './WorldMap.css'
import defaultSvgSource from './world.svg?raw'
import countryCenters from './country-centers.json'

export type WorldMapProps = {
  backgroundColor?: string
  countryColor?: string
  svgUrl?: string
  className?: string
  showConnections?: boolean
  connectionBase?: string
  connectedCountries?: string[]
  onCountryHover?: (countryCode: string, countryName: string, x: number, y: number) => void
  onCountryClick?: (countryCode: string, countryName: string, x: number, y: number) => void
  onConnectionDotHover?: (countryCode: string, countryName: string, x: number, y: number) => void
  onConnectionDotClick?: (countryCode: string, countryName: string, x: number, y: number) => void
}

const isHexColor = (value: string) => /^#([0-9a-fA-F]{3}){1,2}$/.test(value)

const toHex = (value: number) => value.toString(16).padStart(2, '0')

const adjustHexColor = (hex: string, amount: number) => {
  if (!isHexColor(hex)) {
    return hex
  }
  const clean = hex.replace('#', '')
  const full = clean.length === 3
    ? clean.split('').map((ch) => ch + ch).join('')
    : clean
  const num = parseInt(full, 16)
  const r = Math.min(255, Math.max(0, ((num >> 16) & 0xff) + amount))
  const g = Math.min(255, Math.max(0, ((num >> 8) & 0xff) + amount))
  const b = Math.min(255, Math.max(0, (num & 0xff) + amount))
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`
}

function generateCurve(
  from: { x: number; y: number },
  to: { x: number; y: number }
) {
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

export function WorldMap({
  backgroundColor,
  countryColor = '#093C5D',
  svgUrl,
  className,
  showConnections = true,
  connectionBase = 'BD',
  connectedCountries = ['US', 'IN'],
  onCountryHover,
  onCountryClick,
  onConnectionDotHover,
  onConnectionDotClick,
}: WorldMapProps) {
  const [svgMarkup, setSvgMarkup] = useState('')
  const [hoverTooltip, setHoverTooltip] = useState({
    name: '',
    x: 0,
    y: 0,
    visible: false,
  })
  const [clickTooltip, setClickTooltip] = useState({
    name: '',
    x: 0,
    y: 0,
    visible: false,
  })
  const [zoom, setZoom] = useState(1)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [isPanning, setIsPanning] = useState(false)
  const mapRef = useRef<HTMLDivElement>(null)
  const panStateRef = useRef({
    isPanning: false,
    startX: 0,
    startY: 0,
    originX: 0,
    originY: 0,
    moved: false,
  })

  const colors = useMemo(() => {
    const hover = adjustHexColor(countryColor, 24)
    const selected = adjustHexColor(countryColor, -24)
    const stroke = adjustHexColor(countryColor, -36)
    return { hover, selected, stroke }
  }, [countryColor])

  useEffect(() => {
    let isActive = true

    const loadSvg = async () => {
      try {
        let rawSvg: string
        if (svgUrl) {
          const response = await fetch(svgUrl)
          if (!response.ok) {
            throw new Error(`Failed to fetch SVG: ${response.status}`)
          }
          rawSvg = await response.text()
        } else {
          rawSvg = defaultSvgSource
        }

        if (!isActive) {
          return
        }

        const parser = new DOMParser()
        const doc = parser.parseFromString(rawSvg, 'image/svg+xml')
        const svg = doc.querySelector('svg')

        if (!svg) {
          setSvgMarkup('')
          return
        }

        const viewBox = svg.getAttribute('viewBox')
        if (!viewBox) {
          const width = parseFloat(svg.getAttribute('width') || '')
          const height = parseFloat(svg.getAttribute('height') || '')
          if (Number.isFinite(width) && Number.isFinite(height)) {
            svg.setAttribute('viewBox', `0 0 ${width} ${height}`)
          }
        }

        svg.removeAttribute('width')
        svg.removeAttribute('height')
        svg.setAttribute('class', 'map-svg')

        const countryPaths = svg.querySelectorAll('path[title]')
        countryPaths.forEach((path) => {
          const title = path.getAttribute('title') || ''
          if (!title) {
            return
          }
          path.classList.add('country')
          path.setAttribute('data-name', title)
        })

        // Dynamic connection lines
        if (showConnections) {
          const baseCenter = countryCenters[connectionBase as keyof typeof countryCenters]
          if (baseCenter) {
            const createCurve = (d: string) => {
              const path = doc.createElementNS('http://www.w3.org/2000/svg', 'path')
              path.setAttribute('d', d)
              path.setAttribute('class', 'connection-line')
              path.setAttribute('fill', 'none')
              return path
            }

            const getCountryName = (code: string) => {
              const path = svg.querySelector(`#${code}`)
              return path?.getAttribute('title') || code
            }

            const createDot = (x: number, y: number, cls: string, code: string, name: string) => {
              const circle = doc.createElementNS('http://www.w3.org/2000/svg', 'circle')
              circle.setAttribute('cx', String(x))
              circle.setAttribute('cy', String(y))
              circle.setAttribute('r', '3')
              circle.setAttribute('class', cls)
              circle.setAttribute('data-country-code', code)
              circle.setAttribute('data-country-name', name)
              return circle
            }

            const addedDots = new Set<string>()

            for (const code of connectedCountries) {
              const center = countryCenters[code as keyof typeof countryCenters]
              if (center && code !== connectionBase) {
                const d = generateCurve(center, baseCenter)
                svg.appendChild(createCurve(d))

                if (!addedDots.has(code)) {
                  const name = getCountryName(code)
                  svg.appendChild(createDot(center.x, center.y, 'connection-dot connection-dot-start', code, name))
                  addedDots.add(code)
                }
              }
            }

            if (!addedDots.has(connectionBase)) {
              const name = getCountryName(connectionBase)
              svg.appendChild(createDot(baseCenter.x, baseCenter.y, 'connection-dot connection-dot-end', connectionBase, name))
              addedDots.add(connectionBase)
            }
          }
        }

        const serializer = new XMLSerializer()
        setSvgMarkup(serializer.serializeToString(svg))
      } catch {
        if (isActive) {
          setSvgMarkup('')
        }
      }
    }

    loadSvg()

    return () => {
      isActive = false
    }
  }, [svgUrl, showConnections, connectionBase, connectedCountries])

  const findCountryElement = (target: EventTarget | null) => {
    if (!target || !(target instanceof Element)) {
      return null
    }
    return target.closest('[data-name]') as HTMLElement | null
  }

  const findConnectionDot = (target: EventTarget | null) => {
    if (!target || !(target instanceof Element)) {
      return null
    }
    return target.closest('.connection-dot') as HTMLElement | null
  }

  const getRelativePoint = (event: React.MouseEvent<HTMLDivElement>) => {
    const rect = mapRef.current?.getBoundingClientRect()
    if (!rect) {
      return { x: 0, y: 0 }
    }
    return {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    }
  }

  const clearSelection = () => {
    const container = mapRef.current
    if (!container) {
      return
    }
    const previous = container.querySelector('.country.is-selected')
    if (previous) {
      previous.classList.remove('is-selected')
    }
  }

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (panStateRef.current.isPanning) {
      const deltaX = event.clientX - panStateRef.current.startX
      const deltaY = event.clientY - panStateRef.current.startY
      const nextX = panStateRef.current.originX + deltaX
      const nextY = panStateRef.current.originY + deltaY
      setPan({ x: nextX, y: nextY })
      panStateRef.current.moved = true
      setHoverTooltip((current) => ({ ...current, visible: false }))
      return
    }

    // Check connection dots first
    const dotElement = findConnectionDot(event.target)
    const dotCode = dotElement?.dataset.countryCode
    const dotName = dotElement?.dataset.countryName
    if (dotCode && dotName) {
      if (onConnectionDotHover) {
        const { x, y } = getRelativePoint(event)
        onConnectionDotHover(dotCode, dotName, x, y)
      }
      setHoverTooltip((current) => ({ ...current, visible: false }))
      return
    }

    // Check country paths
    const countryElement = findCountryElement(event.target)
    const name = countryElement?.dataset.name
    if (!name) {
      setHoverTooltip((current) => ({ ...current, visible: false }))
      return
    }

    const { x, y } = getRelativePoint(event)
    if (onCountryHover) {
      const code = countryElement.getAttribute('id') || ''
      onCountryHover(code, name, x, y)
      setHoverTooltip((current) => ({ ...current, visible: false }))
      return
    }

    setHoverTooltip({ name, x, y, visible: true })
  }

  const handlePointerLeave = () => {
    setHoverTooltip((current) => ({ ...current, visible: false }))
    panStateRef.current.isPanning = false
    setIsPanning(false)
  }

  const handleClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if (panStateRef.current.moved) {
      panStateRef.current.moved = false
      return
    }

    // Check connection dots first
    const dotElement = findConnectionDot(event.target)
    const dotCode = dotElement?.dataset.countryCode
    const dotName = dotElement?.dataset.countryName
    if (dotCode && dotName) {
      if (onConnectionDotClick) {
        const { x, y } = getRelativePoint(event)
        onConnectionDotClick(dotCode, dotName, x, y)
      }
      return
    }

    // Check country paths
    const countryElement = findCountryElement(event.target)
    const name = countryElement?.dataset.name
    if (!name) {
      clearSelection()
      setClickTooltip((current) => ({ ...current, visible: false }))
      return
    }

    const { x, y } = getRelativePoint(event)
    if (onCountryClick) {
      const code = countryElement.getAttribute('id') || ''
      onCountryClick(code, name, x, y)
      setClickTooltip((current) => ({ ...current, visible: false }))
      return
    }

    setClickTooltip({ name, x, y, visible: true })
    clearSelection()
    countryElement.classList.add('is-selected')
  }

  const handleWheel = (event: React.WheelEvent<HTMLDivElement>) => {
    event.preventDefault()
    const direction = event.deltaY > 0 ? -1 : 1
    setZoom((value) => {
      const next = value + direction * 0.1
      return Math.min(3, Math.max(1, Number(next.toFixed(2))))
    })
  }

  const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (event.button !== 0) {
      return
    }
    event.currentTarget.setPointerCapture(event.pointerId)
    panStateRef.current.isPanning = true
    panStateRef.current.startX = event.clientX
    panStateRef.current.startY = event.clientY
    panStateRef.current.originX = pan.x
    panStateRef.current.originY = pan.y
    panStateRef.current.moved = false
    setIsPanning(true)
  }

  const handlePointerUp = () => {
    panStateRef.current.isPanning = false
    setIsPanning(false)
  }



  const styleVars = {
    '--map-background': backgroundColor || 'transparent',
    '--country-fill': countryColor,
    '--country-hover': colors.hover,
    '--country-selected': colors.selected,
    '--country-stroke': colors.stroke,
  } as React.CSSProperties

  const containerClasses = ['map-container', className]
    .filter(Boolean)
    .join(' ')

  const finalClassName = isPanning
    ? `${containerClasses} is-panning`.trim()
    : containerClasses

  return (
    <div
      className={finalClassName}
      style={styleVars}
      ref={mapRef}
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onClick={handleClick}
      onWheel={handleWheel}
      role="img"
      aria-label="World map with clickable countries"
    >
      {svgMarkup ? (
        <div
          className="map-viewport"
          style={{ transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})` }}
        >
          <div
            className="map-svg-wrap"
            dangerouslySetInnerHTML={{ __html: svgMarkup }}
          />
        </div>
      ) : (
        <div className="map-loading">Loading map...</div>
      )}

      {hoverTooltip.visible && (
        <div
          className="map-tooltip"
          style={{ left: hoverTooltip.x, top: hoverTooltip.y }}
          role="status"
        >
          {hoverTooltip.name}
        </div>
      )}

      {clickTooltip.visible && (
        <div
          className="map-tooltip is-pinned"
          style={{ left: clickTooltip.x, top: clickTooltip.y }}
          role="status"
        >
          {clickTooltip.name}
        </div>
      )}
    </div>
  )
}

export default WorldMap
