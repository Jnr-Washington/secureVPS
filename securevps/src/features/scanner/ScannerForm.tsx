import { useState } from "react"
import { Button } from "@/components/ui/button"
import { AlertTriangle } from "lucide-react"

export function ScannerForm() {
  const [target, setTarget] = useState("")
  const [usePorts, setUsePorts] = useState(true)
  const [useSubs, setUseSubs] = useState(false)
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<any>(null)
  const [error, setError] = useState("")
  const [reportUrl, setReportUrl] = useState<string | null>(null)

async function startScan() {

  setLoading(true)
  setResults(null)
  setReportUrl(null)
  setError("")
  try {
    
    const res = await fetch("http://localhost:5000/scan", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ target, use_ports: usePorts, use_subdomains: useSubs })
    })

    const data = await res.json()
    console.log("API response:", data)
    console.log("report_file:", data.report_file)
    setResults(data)

    if (data.report_file) {
      setReportUrl(`http://localhost:5000/reports/${data.report_file}`)
    }
  } catch {
    setError("Could not reach scanner. Make sure server.js is running.")
  }
  setLoading(false)
}

  return (
    <section className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-16">
      <h2 className="text-4xl font-bold mb-8">Try the Scanner</h2>
      <div className="bg-white/75 dark:bg-gray-900/75 backdrop-blur-xl rounded-[28px] border border-white/60 dark:border-gray-800/60 p-8 shadow-lg">
        
        <div className="flex flex-col sm:flex-row gap-4 mb-4">
          <input
            className="flex-1 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 bg-transparent text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            placeholder="https://example.com"
            value={target}
            onChange={e => setTarget(e.target.value)}
          />
          <Button
            onClick={startScan}
            disabled={loading || !target}
            className="bg-emerald-800 text-white hover:bg-emerald-900 px-8"
          >
            {loading ? "Scanning..." : "Run Scan"}
          </Button>
        </div>

        <div className="flex gap-6 mb-6">
          <label className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300 cursor-pointer">
            <input type="checkbox" checked={usePorts} onChange={e => setUsePorts(e.target.checked)} />
            Port Scan
          </label>
          <label className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300 cursor-pointer">
            <input type="checkbox" checked={useSubs} onChange={e => setUseSubs(e.target.checked)} />
            Subdomain Scan
          </label>
        </div>

        {error && (
          <div className="flex items-center gap-2 text-amber-600 text-sm mb-4">
            <AlertTriangle className="w-4 h-4" /> {error}
          </div>
        )}

        {loading && (
          <div className="text-sm text-gray-400 animate-pulse">Scan in progress — this may take a minute...</div>
        )}

        {results && (
          <div className="mt-4 flex flex-col gap-4">
            <pre className="bg-gray-950 text-emerald-400 p-6 rounded-2xl text-xs overflow-auto max-h-96">
              {JSON.stringify(results, null, 2)}
            </pre>

            {reportUrl && (
              <div className="flex gap-4">
                <a
                  href={reportUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 bg-emerald-800 text-white px-5 py-2.5 rounded-xl hover:bg-emerald-900 text-sm font-medium"
                >
                  View Report
                </a>
                
                <a
                  href={reportUrl}
                  download
                  className="inline-flex items-center gap-2 border border-emerald-800 text-emerald-800 px-5 py-2.5 rounded-xl hover:bg-emerald-50 text-sm font-medium"
                >
                  Download Report
                </a>
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  )
}