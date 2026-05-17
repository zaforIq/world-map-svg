import { WorldMap } from '../../src'
import '../../src/WorldMap.css'

function App() {
  return (
    <div style={{ width: '100vw', height: '100vh' }}>
      <WorldMap
        countryColor="#2563eb"
        defaultRegionName="India"
        defaultCountryCode="BD"
      />
    </div>
  )
}

export default App
