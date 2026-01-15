import { useEffect, useState } from 'react'
import './App.css'

const API_BASE = ''

function App() {
  const [symbol, setSymbol] = useState('ACB')
  const [days, setDays] = useState(365)
  const [data, setData] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    const controller = new AbortController()

    const load = async () => {
      setError('')
      try {
        const params = new URLSearchParams({
          symbol,
          days: String(days),
        })
        const res = await fetch(`${API_BASE}/api/quote?${params}`, {
          signal: controller.signal,
        })
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`)
        }
        const payload = await res.json()
        setData(payload)
      } catch (err) {
        if (err.name !== 'AbortError') {
          setError('Failed to load data')
        }
      }
    }

    load()
    return () => controller.abort()
  }, [symbol, days])

  return (
    <div className="app">
      <header className="app-header">
        <h1>VNStock Analysis (Base)</h1>
        <p>FastAPI + Vite 연결 확인용 기본 화면</p>
      </header>

      <section className="controls">
        <label>
          Symbol
          <input
            value={symbol}
            onChange={(e) => setSymbol(e.target.value.toUpperCase())}
            placeholder="ACB"
          />
        </label>
        <label>
          Days
          <input
            type="number"
            min="30"
            max="1095"
            value={days}
            onChange={(e) => setDays(Number(e.target.value))}
          />
        </label>
      </section>

      {error && <p className="error">{error}</p>}

      {data && (
        <section className="result">
          <h2>{data.symbol}</h2>
          <p>Points: {data.closes.length}</p>
          <div className="sample">
            <h3>Latest</h3>
            <p>Date: {data.dates[data.dates.length - 1]}</p>
            <p>Close: {data.closes[data.closes.length - 1]}</p>
          </div>
        </section>
      )}
    </div>
  )
}

export default App
