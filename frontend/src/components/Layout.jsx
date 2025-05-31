import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card"
import { Button } from "./ui/button"
import { useState, useEffect } from "react"
import { FileUpload } from "./FileUpload"
import { AnalysisControls } from "./AnalysisControls"
import { ResultsDisplay } from "./ResultsDisplay"
import { DataPilotAPI } from "../services/api"

const Layout = () => {
  const [selectedFile, setSelectedFile] = useState(null)
  const [analysisResults, setAnalysisResults] = useState(null)
  const [analysisType, setAnalysisType] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [serverStatus, setServerStatus] = useState('checking')

  // Check server health on mount
  useEffect(() => {
    const checkHealth = async () => {
      try {
        await DataPilotAPI.healthCheck()
        setServerStatus('connected')
      } catch (error) {
        setServerStatus('error')
        console.error('Server health check failed:', error)
      }
    }
    
    checkHealth()
  }, [])

  const handleFileSelect = (file) => {
    setSelectedFile(file)
    // Clear previous results when new file is selected
    setAnalysisResults(null)
    setError(null)
    setAnalysisType(null)
  }

  const handleAnalyze = async (type, file) => {
    setLoading(true)
    setError(null)
    setAnalysisType(type)
    setAnalysisResults(null)

    try {
      const results = await DataPilotAPI.analyzeFile(type, file)
      setAnalysisResults(results)
    } catch (err) {
      setError(err.message)
      console.error('Analysis error:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleClearResults = () => {
    setAnalysisResults(null)
    setError(null)
    setAnalysisType(null)
  }

  if (serverStatus === 'checking') {
    return <LoadingScreen message="Connecting to DataPilot server..." />
  }

  if (serverStatus === 'error') {
    return <ErrorScreen />
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* Animated background elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-32 w-96 h-96 bg-gradient-to-br from-blue-400/20 to-purple-600/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-32 w-96 h-96 bg-gradient-to-tr from-cyan-400/20 to-blue-600/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>

      <header className="relative border-b border-white/20 bg-white/70 backdrop-blur-lg">
        <div className="container flex h-20 items-center px-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
              <span className="text-white text-xl font-bold">📊</span>
            </div>
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                DataPilot
              </h1>
              <p className="text-xs text-slate-500 font-medium">Web Interface</p>
            </div>
          </div>
          <div className="ml-auto flex items-center space-x-4">
            <div className="flex items-center space-x-2 px-3 py-1.5 bg-emerald-50 border border-emerald-200 rounded-full">
              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse-glow"></div>
              <span className="text-sm font-medium text-emerald-700">Connected</span>
            </div>
          </div>
        </div>
      </header>
      
      <div className="relative container mx-auto px-4 py-12">
        <div className="max-w-6xl mx-auto space-y-12">
          {/* Hero Section */}
          <div className="text-center space-y-6 animate-fade-in">
            <div className="space-y-4">
              <h2 className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-slate-800 via-blue-600 to-purple-600 bg-clip-text text-transparent leading-tight">
                CSV Data Analysis
              </h2>
              <div className="w-24 h-1 bg-gradient-to-r from-blue-500 to-purple-500 mx-auto rounded-full"></div>
              <p className="text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed">
                Upload your CSV file and choose an analysis type to get AI-ready insights powered by advanced data science
              </p>
            </div>
            
            {/* Feature badges */}
            <div className="flex flex-wrap justify-center gap-3 mt-8">
              {['🚀 AI-Powered', '📈 Real-time Analysis', '🔒 Secure Processing', '⚡ Lightning Fast'].map((feature, idx) => (
                <div key={idx} className="px-4 py-2 bg-white/60 backdrop-blur-sm border border-white/40 rounded-full text-sm font-medium text-slate-700 shadow-soft animate-fade-in" style={{animationDelay: `${idx * 0.1}s`}}>
                  {feature}
                </div>
              ))}
            </div>
          </div>

          {/* Main Content Cards */}
          <div className="grid gap-8 lg:grid-cols-2 animate-slide-up">
            <FileUpload 
              onFileSelect={handleFileSelect}
              disabled={loading}
            />
            
            <AnalysisControls
              selectedFile={selectedFile}
              onAnalyze={handleAnalyze}
              loading={loading}
              activeAnalysis={analysisType}
            />
          </div>

          {/* Results Section */}
          {(analysisResults || error) && (
            <div className="animate-fade-in">
              <ResultsDisplay
                results={analysisResults}
                analysisType={analysisType}
                error={error}
                onClear={handleClearResults}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

const LoadingScreen = ({ message }) => (
  <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center">
    {/* Animated background elements */}
    <div className="fixed inset-0 overflow-hidden pointer-events-none">
      <div className="absolute -top-40 -right-32 w-96 h-96 bg-gradient-to-br from-blue-400/20 to-purple-600/20 rounded-full blur-3xl animate-pulse"></div>
      <div className="absolute -bottom-40 -left-32 w-96 h-96 bg-gradient-to-tr from-cyan-400/20 to-blue-600/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
    </div>
    
    <Card className="w-96 bg-white/80 backdrop-blur-sm border-0 shadow-glow animate-fade-in">
      <CardContent className="flex flex-col items-center space-y-6 pt-8 pb-6">
        <div className="relative">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center animate-bounce-subtle">
            <span className="text-white text-2xl">📊</span>
          </div>
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl animate-ping opacity-75"></div>
        </div>
        <div className="text-center space-y-2">
          <h3 className="font-semibold text-slate-800">Connecting to DataPilot</h3>
          <p className="text-sm text-slate-600">{message}</p>
        </div>
        <div className="flex space-x-1">
          {[0, 1, 2].map((i) => (
            <div 
              key={i}
              className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"
              style={{ animationDelay: `${i * 0.2}s` }}
            ></div>
          ))}
        </div>
      </CardContent>
    </Card>
  </div>
)

const ErrorScreen = () => (
  <div className="min-h-screen bg-gradient-to-br from-slate-50 via-red-50 to-orange-100 flex items-center justify-center">
    {/* Animated background elements */}
    <div className="fixed inset-0 overflow-hidden pointer-events-none">
      <div className="absolute -top-40 -right-32 w-96 h-96 bg-gradient-to-br from-red-400/20 to-orange-600/20 rounded-full blur-3xl animate-pulse"></div>
      <div className="absolute -bottom-40 -left-32 w-96 h-96 bg-gradient-to-tr from-orange-400/20 to-red-600/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
    </div>
    
    <Card className="w-96 bg-white/80 backdrop-blur-sm border-0 shadow-glow animate-fade-in">
      <CardHeader className="text-center pb-4">
        <div className="w-16 h-16 bg-gradient-to-br from-red-500 to-orange-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <span className="text-white text-2xl">⚠️</span>
        </div>
        <CardTitle className="text-red-600">Connection Failed</CardTitle>
        <CardDescription className="text-slate-600">
          Unable to connect to DataPilot server
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-700">
            Please ensure the DataPilot server is running and try refreshing the page.
          </p>
        </div>
        
        <div className="space-y-3">
          <p className="text-sm font-medium text-slate-800">Troubleshooting Steps:</p>
          <div className="space-y-2 text-xs text-slate-600">
            <div className="flex items-start space-x-2">
              <span className="text-blue-500 mt-0.5">1.</span>
              <span>Check that you started the server with: <code className="bg-slate-100 px-1 rounded">datapilot webui</code></span>
            </div>
            <div className="flex items-start space-x-2">
              <span className="text-blue-500 mt-0.5">2.</span>
              <span>Verify the server is running on the correct port</span>
            </div>
            <div className="flex items-start space-x-2">
              <span className="text-blue-500 mt-0.5">3.</span>
              <span>Check your network connection</span>
            </div>
          </div>
        </div>
        
        <Button 
          onClick={() => window.location.reload()} 
          className="w-full bg-gradient-to-r from-red-500 to-orange-600 hover:from-red-600 hover:to-orange-700 hover:shadow-glow transition-all duration-300"
        >
          <span className="mr-2">🔄</span>
          Retry Connection
        </Button>
      </CardContent>
    </Card>
  </div>
)

export { Layout }