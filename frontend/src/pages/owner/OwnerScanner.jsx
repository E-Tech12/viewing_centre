import { useState, useEffect, useRef } from 'react'
import { Html5Qrcode } from 'html5-qrcode'
import { ownerApi } from '../../services/api'
import { CheckCircle, XCircle, QrCode, Camera, CameraOff } from 'lucide-react'
import toast from 'react-hot-toast'

export default function OwnerScanner() {
  const [scanning, setScanning] = useState(false)
  const [result,   setResult]   = useState(null)
  const [loading,  setLoading]  = useState(false)
  const scannerRef = useRef(null)
  const cooldown   = useRef(false)

  const startScan = async () => {
    try {
      const scanner = new Html5Qrcode('qr-reader')
      scannerRef.current = scanner
      await scanner.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        onScan, () => {}
      )
      setScanning(true)
    } catch { toast.error('Camera access denied') }
  }

  const stopScan = async () => {
    if (scannerRef.current) { await scannerRef.current.stop().catch(() => {}); scannerRef.current = null }
    setScanning(false)
  }

  const onScan = async (text) => {
    if (cooldown.current || loading) return
    cooldown.current = true
    setLoading(true)
    try {
      const { data } = await ownerApi.scanTicket(text)
      setResult(data)
      if (data.valid) toast.success(`✓ ${data.holder_name} — ${data.category}`)
      else toast.error(`✗ ${data.reason}`)
    } catch { setResult({ valid: false, reason: 'Server error' }) }
    finally {
      setLoading(false)
      setTimeout(() => { cooldown.current = false }, 3000)
    }
  }

  useEffect(() => () => { stopScan() }, [])

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-md mx-auto">
      <div className="text-center mb-8">
        <div className="w-16 h-16 mx-auto rounded-sm bg-volt-400/10 border border-volt-400/20 flex items-center justify-center mb-4">
          <QrCode size={28} className="text-volt-400" />
        </div>
        <h1 className="font-display font-extrabold text-white text-2xl sm:text-3xl uppercase tracking-wide">Ticket Scanner</h1>
        <p className="font-mono text-slate-500 text-xs uppercase tracking-widest mt-1">Scan QR codes at the entrance</p>
      </div>

      <div className="bg-pitch-800 border border-white/10 rounded-sm overflow-hidden mb-4">
        <div id="qr-reader" className="w-full" style={{ minHeight: scanning ? 300 : 0 }} />
        {!scanning && (
          <div className="flex flex-col items-center justify-center py-16 gap-4">
            <Camera size={40} className="text-slate-700" />
            <p className="font-mono text-slate-500 text-xs uppercase tracking-widest">Camera inactive</p>
          </div>
        )}
      </div>

      <div className="flex gap-3 mb-6">
        {!scanning ? (
          <button onClick={startScan} className="btn-volt flex-1 justify-center"><Camera size={14} /> Start Scanning</button>
        ) : (
          <button onClick={stopScan} className="flex-1 justify-center inline-flex items-center gap-2 px-6 py-3 rounded-sm font-mono text-xs uppercase tracking-widest text-ember-400 border border-ember-400/40 hover:bg-ember-400/10 transition-all">
            <CameraOff size={14} /> Stop
          </button>
        )}
      </div>

      {loading && (
        <div className="flex items-center justify-center gap-2 mb-4">
          <div className="w-4 h-4 border-2 border-volt-400 border-t-transparent rounded-full animate-spin" />
          <span className="font-mono text-slate-500 text-xs uppercase tracking-widest">Validating...</span>
        </div>
      )}

      {result && (
        <div className={`rounded-sm border p-5 animate-fade-in ${result.valid ? 'bg-green-500/10 border-green-400/30' : 'bg-red-500/10 border-red-400/30'}`}>
          <div className="flex items-center gap-3 mb-3">
            {result.valid ? <CheckCircle size={24} className="text-green-400" /> : <XCircle size={24} className="text-red-400" />}
            <span className={`font-display font-bold text-lg uppercase tracking-wide ${result.valid ? 'text-green-400' : 'text-red-400'}`}>
              {result.valid ? 'Valid Ticket' : 'Invalid'}
            </span>
          </div>
          {result.valid ? (
            <div className="space-y-1">
              {[['Holder', result.holder_name], ['Category', result.category], ['Event', result.event_title]].map(([k, v]) => v && (
                <div key={k} className="flex gap-2">
                  <span className="font-mono text-slate-500 text-xs w-16">{k}</span>
                  <span className="font-body text-white text-sm">{v}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="font-body text-red-300 text-sm">{result.reason}</p>
          )}
        </div>
      )}
    </div>
  )
}
