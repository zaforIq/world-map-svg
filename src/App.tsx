import { useEffect, useRef, useState } from 'react'
import './App.css'

const MAP_SVG_URL = '/world.svg'

function App() {
  const [svgMarkup, setSvgMarkup] = useState('')
  const [hoveredCountry, setHoveredCountry] = useState('')
  const [selectedCountry, setSelectedCountry] = useState('')
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
  const mapRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let isActive = true

    fetch(MAP_SVG_URL)
      .then((response) => response.text())
      .then((rawSvg) => {
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

        const serializer = new XMLSerializer()
        setSvgMarkup(serializer.serializeToString(svg))
      })
      .catch(() => {
        if (isActive) {
          setSvgMarkup('')
        }
      })

    return () => {
      isActive = false
    }
  }, [])

  const findCountryElement = (target: EventTarget | null) => {
    if (!target || !(target instanceof Element)) {
      return null
    }
    return target.closest('[data-name]') as HTMLElement | null
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

  const handleMouseMove = (event: React.MouseEvent<HTMLDivElement>) => {
    const countryElement = findCountryElement(event.target)
    const name = countryElement?.dataset.name
    if (!name) {
      setHoveredCountry('')
      setHoverTooltip((current) => ({ ...current, visible: false }))
      return
    }

    const { x, y } = getRelativePoint(event)
    setHoveredCountry(name)
    setHoverTooltip({ name, x, y, visible: true })
  }

  const handleMouseLeave = () => {
    setHoveredCountry('')
    setHoverTooltip((current) => ({ ...current, visible: false }))
  }

  const handleClick = (event: React.MouseEvent<HTMLDivElement>) => {
    const countryElement = findCountryElement(event.target)
    const name = countryElement?.dataset.name
    if (!name) {
      setSelectedCountry('')
      setClickTooltip((current) => ({ ...current, visible: false }))
      return
    }

    const { x, y } = getRelativePoint(event)
    setSelectedCountry(name)
    setClickTooltip({ name, x, y, visible: true })

    const container = mapRef.current
    if (!container) {
      return
    }
    const previous = container.querySelector('.country.is-selected')
    if (previous && previous !== countryElement) {
      previous.classList.remove('is-selected')
    }
    countryElement.classList.add('is-selected')
  }

  const handleZoomIn = () => {
    setZoom((value) => Math.min(3, Number((value + 0.2).toFixed(2))))
  }

  const handleZoomOut = () => {
    setZoom((value) => Math.max(1, Number((value - 0.2).toFixed(2))))
  }

  const handleZoomReset = () => {
    setZoom(1)
  }

  return (
    <div className="page">
      <section className="map-shell">
        <div className="map-toolbar">
          <div className="zoom-controls">
            <button type="button" onClick={handleZoomOut} aria-label="Zoom out">
              -
            </button>
            <button type="button" onClick={handleZoomReset}>
              {Math.round(zoom * 100)}%
            </button>
            <button type="button" onClick={handleZoomIn} aria-label="Zoom in">
              +
            </button>
          </div>
        </div>

        <div
          className="map-frame"
          ref={mapRef}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          onClick={handleClick}
          role="img"
          aria-label="World map with clickable countries"
        >
          {svgMarkup ? (
            <div className="map-viewport" style={{ transform: `scale(${zoom})` }}>
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
      </section>
    </div>
  )
}

export default App
