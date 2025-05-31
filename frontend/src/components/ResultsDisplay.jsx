import { useState } from 'react'
import { Button } from './ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'

const ResultsDisplay = ({ results, analysisType, error, onClear }) => {
  const [copied, setCopied] = useState(false)

  if (!results && !error) {
    return null
  }

  const analysisNames = {
    eda: 'Exploratory Data Analysis',
    int: 'Data Integrity Check', 
    vis: 'Visualization Recommendations',
    eng: 'Data Engineering Archaeology',
    llm: 'LLM Context Generation'
  }

  const analysisIcons = {
    eda: '📊',
    int: '🔍',
    vis: '📈',
    eng: '🏗️',
    llm: '🤖'
  }

  const analysisColors = {
    eda: 'blue',
    int: 'emerald',
    vis: 'purple',
    eng: 'orange',
    llm: 'indigo'
  }

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(results)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  const downloadResults = () => {
    const element = document.createElement('a')
    const file = new Blob([results], { type: 'text/plain' })
    element.href = URL.createObjectURL(file)
    element.download = `datapilot-${analysisType}-${Date.now()}.txt`
    document.body.appendChild(element)
    element.click()
    document.body.removeChild(element)
  }

  if (error) {
    return (
      <Card className="w-full bg-white/80 backdrop-blur-sm border-0 shadow-card animate-fade-in">
        <CardHeader className="pb-4">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-to-br from-red-500 to-red-600 rounded-lg flex items-center justify-center">
              <span className="text-white text-lg">❌</span>
            </div>
            <div>
              <CardTitle className="text-lg font-semibold text-red-600">Analysis Failed</CardTitle>
              <CardDescription className="text-slate-600">
                An error occurred while analyzing your data
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
              <div className="flex items-start space-x-3">
                <span className="text-red-500 text-lg mt-0.5">⚠️</span>
                <div>
                  <h4 className="font-medium text-red-800 mb-1">Error Details</h4>
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              </div>
            </div>
            <div className="flex space-x-3">
              <Button 
                onClick={onClear}
                className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white hover:shadow-glow transition-all duration-300"
              >
                <span className="mr-2">🔄</span>
                Try Again
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  const currentAnalysis = analysisColors[analysisType] || 'blue'
  const currentIcon = analysisIcons[analysisType] || '📊'
  
  return (
    <Card className="w-full bg-white/80 backdrop-blur-sm border-0 shadow-card hover:shadow-glow transition-all duration-300 animate-fade-in">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className={`w-8 h-8 bg-gradient-to-br from-${currentAnalysis}-500 to-${currentAnalysis}-600 rounded-lg flex items-center justify-center`}>
              <span className="text-white text-lg">{currentIcon}</span>
            </div>
            <div>
              <CardTitle className={`text-lg font-semibold text-${currentAnalysis}-700`}>
                {analysisNames[analysisType] || 'Analysis Results'}
              </CardTitle>
              <CardDescription className="text-slate-600">
                Analysis completed successfully • Ready for AI consumption
              </CardDescription>
            </div>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={onClear}
            className="border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-slate-300"
          >
            <span className="mr-1">✕</span>
            Clear
          </Button>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-6">
          {/* Action Buttons */}
          <div className="flex flex-wrap gap-3">
            <Button 
              onClick={copyToClipboard} 
              variant="outline" 
              size="sm"
              className={`transition-all duration-300 ${
                copied 
                  ? 'border-emerald-300 bg-emerald-50 text-emerald-700' 
                  : `border-${currentAnalysis}-200 text-${currentAnalysis}-600 hover:bg-${currentAnalysis}-50 hover:border-${currentAnalysis}-300`
              }`}
            >
              {copied ? (
                <><span className="mr-2">✅</span>Copied!</>
              ) : (
                <><span className="mr-2">📋</span>Copy to Clipboard</>
              )}
            </Button>
            <Button 
              onClick={downloadResults} 
              variant="outline" 
              size="sm"
              className={`border-${currentAnalysis}-200 text-${currentAnalysis}-600 hover:bg-${currentAnalysis}-50 hover:border-${currentAnalysis}-300 transition-all duration-300`}
            >
              <span className="mr-2">💾</span>
              Download
            </Button>
          </div>
          
          {/* Results Display */}
          <div className="border-2 border-slate-200 rounded-xl bg-gradient-to-br from-slate-50 to-white overflow-hidden">
            <div className={`px-4 py-3 bg-gradient-to-r from-${currentAnalysis}-500 to-${currentAnalysis}-600 text-white flex items-center space-x-2`}>
              <span className="text-lg">{currentIcon}</span>
              <span className="font-medium">Analysis Output</span>
              <div className="ml-auto text-xs opacity-75">
                {new Date().toLocaleTimeString()}
              </div>
            </div>
            <div className="p-6 max-h-96 overflow-y-auto">
              <pre className="text-sm whitespace-pre-wrap font-mono leading-relaxed text-slate-700">
                {results}
              </pre>
            </div>
          </div>
          
          {/* Tips Section */}
          <div className={`p-4 bg-${currentAnalysis}-50 border border-${currentAnalysis}-200 rounded-xl space-y-3`}>
            <h4 className={`font-medium text-${currentAnalysis}-800 flex items-center space-x-2`}>
              <span className={`text-${currentAnalysis}-600`}>💡</span>
              <span>Next Steps</span>
            </h4>
            <div className={`text-sm text-${currentAnalysis}-700 space-y-2`}>
              <p className="flex items-start space-x-2">
                <span className={`text-${currentAnalysis}-500 mt-0.5`}>•</span>
                <span>This output is optimized for copying into ChatGPT, Claude, or other AI assistants.</span>
              </p>
              <p className="flex items-start space-x-2">
                <span className={`text-${currentAnalysis}-500 mt-0.5`}>•</span>
                <span>Copy the results and ask your AI assistant to analyze, visualize, or provide insights.</span>
              </p>
              <p className="flex items-start space-x-2">
                <span className={`text-${currentAnalysis}-500 mt-0.5`}>•</span>
                <span>Use the download button to save results for later reference.</span>
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export { ResultsDisplay }