import { useState } from 'react'
import { Button } from './ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'

const AnalysisControls = ({ 
  selectedFile, 
  onAnalyze, 
  loading = false,
  activeAnalysis = null 
}) => {
  const [selectedType, setSelectedType] = useState('eda')

  const analysisTypes = [
    { 
      id: 'eda', 
      name: 'Exploratory Data Analysis', 
      description: 'Statistical insights, correlations, and data profiling',
      icon: '📊'
    },
    { 
      id: 'int', 
      name: 'Data Integrity Check', 
      description: 'Quality validation, missing values, and consistency checks',
      icon: '🔍'
    },
    { 
      id: 'vis', 
      name: 'Visualization Recommendations', 
      description: 'Chart suggestions and visual analysis guidance',
      icon: '📈'
    },
    { 
      id: 'eng', 
      name: 'Data Engineering Archaeology', 
      description: 'Schema analysis and relationship mapping',
      icon: '🏗️'
    },
    { 
      id: 'llm', 
      name: 'LLM Context Generation', 
      description: 'AI-optimized summaries for ChatGPT/Claude',
      icon: '🤖'
    }
  ]

  const handleAnalyze = () => {
    if (selectedFile && selectedType) {
      onAnalyze(selectedType, selectedFile)
    }
  }

  const canAnalyze = selectedFile && !loading

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Choose Analysis Type</CardTitle>
        <CardDescription>
          Select the type of analysis to perform on your CSV data
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-2">
          {analysisTypes.map((type) => (
            <div
              key={type.id}
              className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                selectedType === type.id
                  ? 'border-primary bg-primary/5'
                  : 'border-border hover:border-primary/50'
              } ${loading && activeAnalysis === type.id ? 'bg-muted' : ''}`}
              onClick={() => !loading && setSelectedType(type.id)}
            >
              <div className="flex items-start space-x-3">
                <span className="text-lg">{type.icon}</span>
                <div className="flex-1 space-y-1">
                  <div className="flex items-center space-x-2">
                    <h4 className="text-sm font-medium">{type.name}</h4>
                    {loading && activeAnalysis === type.id && (
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-primary border-t-transparent"></div>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {type.description}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="flex space-x-2">
          <Button 
            onClick={handleAnalyze}
            disabled={!canAnalyze || (loading && activeAnalysis === selectedType)}
            className="flex-1"
          >
            {loading && activeAnalysis === selectedType ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                Analyzing...
              </>
            ) : (
              `Run ${analysisTypes.find(t => t.id === selectedType)?.name || 'Analysis'}`
            )}
          </Button>
        </div>

        {!selectedFile && (
          <p className="text-sm text-muted-foreground text-center">
            Please select a CSV file first
          </p>
        )}
      </CardContent>
    </Card>
  )
}

export { AnalysisControls }