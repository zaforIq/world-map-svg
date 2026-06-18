import { WorldMap } from '../../src'
import '../../src/WorldMap.css'

function App() {
  return (
    <div style={{ width: '100vw', height: '100vh' }}>
      <WorldMap
        countryColor="#093C5D"
        showConnections
        connectionBase="Bangladesh"
        connectedCountries={['United States', 'India', 'GB']}
      />
    </div>
  )
}

export default App
