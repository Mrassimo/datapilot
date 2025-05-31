import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card"
import { Button } from "./ui/button"
import { useState, useEffect } from "react"
import { FileUpload } from "./FileUpload"
import { AnalysisControls } from "./AnalysisControls"
import { ResultsDisplay } from "./ResultsDisplay"
import { DataPilotAPI } from "../services/api"

const Layout = ({ children }) => {
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
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container flex h-16 items-center px-4">
          <h1 className="text-2xl font-bold text-primary">DataPilot</h1>
          <p className="ml-4 text-muted-foreground">Web Interface</p>
          <div className="ml-auto flex items-center space-x-2">
            <div className="flex items-center space-x-2 text-sm text-muted-foreground">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              Connected
            </div>
          </div>
        </div>
      </header>
      
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="text-center space-y-2">
            <h2 className="text-3xl font-bold tracking-tight">CSV Data Analysis</h2>
            <p className="text-muted-foreground">
              Upload your CSV file and choose an analysis type to get AI-ready insights
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
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

          {(analysisResults || error) && (
            <ResultsDisplay
              results={analysisResults}
              analysisType={analysisType}
              error={error}
              onClear={handleClearResults}
            />
          )}
        </div>
      </div>
    </div>
  )
}

const LoadingScreen = ({ message }) => (
  <div className="min-h-screen bg-background flex items-center justify-center">
    <Card className="w-96">
      <CardContent className="flex flex-col items-center space-y-4 pt-6">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent"></div>
        <p className="text-sm text-muted-foreground">{message}</p>
      </CardContent>
    </Card>
  </div>
)

const ErrorScreen = () => (
  <div className="min-h-screen bg-background flex items-center justify-center">
    <Card className="w-96 border-destructive">
      <CardHeader>
        <CardTitle className="text-destructive">Connection Failed</CardTitle>
        <CardDescription>
          Unable to connect to DataPilot server
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Please ensure the DataPilot server is running and try refreshing the page.
        </p>
        <div className="text-xs text-muted-foreground space-y-1">
          <p><strong>Troubleshooting:</strong></p>
          <p>• Check that you started the server with: <code>datapilot webui</code></p>
          <p>• Verify the server is running on the correct port</p>
          <p>• Check your network connection</p>
        </div>
        <Button onClick={() => window.location.reload()} className="w-full">
          Retry Connection
        </Button>
      </CardContent>
    </Card>
  </div>
)

export { Layout }