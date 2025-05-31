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
      <Card className="w-full border-destructive">
        <CardHeader>
          <CardTitle className="text-destructive">Analysis Failed</CardTitle>
          <CardDescription>
            An error occurred while analyzing your data
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="p-3 bg-destructive/5 border border-destructive/20 rounded-lg">
              <p className="text-sm text-destructive">{error}</p>
            </div>
            <div className="flex space-x-2">
              <Button variant="outline" onClick={onClear}>
                Try Again
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>
              {analysisNames[analysisType] || 'Analysis Results'}
            </CardTitle>
            <CardDescription>
              Analysis completed successfully • Ready for AI consumption
            </CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={onClear}>
            Clear
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex space-x-2">
            <Button onClick={copyToClipboard} variant="outline" size="sm">
              {copied ? '✅ Copied!' : '📋 Copy to Clipboard'}
            </Button>
            <Button onClick={downloadResults} variant="outline" size="sm">
              💾 Download
            </Button>
          </div>
          
          <div className="border rounded-lg p-4 bg-muted/20 max-h-96 overflow-y-auto">
            <pre className="text-sm whitespace-pre-wrap font-mono leading-relaxed">
              {results}
            </pre>
          </div>
          
          <div className="text-xs text-muted-foreground space-y-1">
            <p><strong>💡 Tip:</strong> This output is optimized for copying into ChatGPT, Claude, or other AI assistants.</p>
            <p><strong>🚀 Next Steps:</strong> Copy the results and ask your AI assistant to analyze, visualize, or provide insights.</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export { ResultsDisplay }