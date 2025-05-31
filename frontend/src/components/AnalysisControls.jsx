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
      icon: '📊',
      gradient: 'from-blue-500 to-blue-600',
      color: 'blue'
    },
    { 
      id: 'int', 
      name: 'Data Integrity Check', 
      description: 'Quality validation, missing values, and consistency checks',
      icon: '🔍',
      gradient: 'from-emerald-500 to-emerald-600',
      color: 'emerald'
    },
    { 
      id: 'vis', 
      name: 'Visualization Recommendations', 
      description: 'Chart suggestions and visual analysis guidance',
      icon: '📈',
      gradient: 'from-purple-500 to-purple-600',
      color: 'purple'
    },
    { 
      id: 'eng', 
      name: 'Data Engineering Archaeology', 
      description: 'Schema analysis and relationship mapping',
      icon: '🏗️',
      gradient: 'from-orange-500 to-orange-600',
      color: 'orange'
    },
    { 
      id: 'llm', 
      name: 'LLM Context Generation', 
      description: 'AI-optimized summaries for ChatGPT/Claude',
      icon: '🤖',
      gradient: 'from-indigo-500 to-indigo-600',
      color: 'indigo'
    }
  ]

  const handleAnalyze = () => {
    if (selectedFile && selectedType) {
      onAnalyze(selectedType, selectedFile)
    }
  }

  const canAnalyze = selectedFile && !loading

  return (
    <Card className="w-full bg-white/80 backdrop-blur-sm border-0 shadow-card hover:shadow-glow transition-all duration-300">
      <CardHeader className="pb-4">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg flex items-center justify-center">
            <span className="text-white text-lg">⚡</span>
          </div>
          <div>
            <CardTitle className="text-lg font-semibold text-slate-800">Choose Analysis Type</CardTitle>
            <CardDescription className="text-slate-600">
              Select the type of analysis to perform on your CSV data
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-3">
          {analysisTypes.map((type, index) => (
            <div
              key={type.id}
              className={`relative group p-4 rounded-xl border-2 cursor-pointer transition-all duration-300 hover:scale-105 ${
                selectedType === type.id
                  ? `border-${type.color}-300 bg-gradient-to-br from-${type.color}-50 to-${type.color}-100 shadow-lg`
                  : 'border-slate-200 hover:border-slate-300 bg-white/50 hover:bg-white/80'
              } ${loading && activeAnalysis === type.id ? 'animate-pulse' : ''}`}
              onClick={() => !loading && setSelectedType(type.id)}
              style={{
                animationDelay: `${index * 0.1}s`
              }}
            >
              {selectedType === type.id && (
                <div className={`absolute inset-0 bg-gradient-to-br ${type.gradient} opacity-5 rounded-xl`}></div>
              )}
              
              <div className="relative flex items-start space-x-4">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-300 ${
                  selectedType === type.id 
                    ? `bg-gradient-to-br ${type.gradient} shadow-lg`
                    : 'bg-slate-100 group-hover:bg-slate-200'
                }`}>
                  <span className={`text-xl transition-all duration-300 ${
                    selectedType === type.id ? 'text-white' : 'text-slate-600'
                  }`}>
                    {type.icon}
                  </span>
                </div>
                
                <div className="flex-1 space-y-2">
                  <div className="flex items-center space-x-3">
                    <h4 className={`font-semibold transition-colors ${
                      selectedType === type.id 
                        ? `text-${type.color}-700` 
                        : 'text-slate-800 group-hover:text-slate-900'
                    }`}>
                      {type.name}
                    </h4>
                    {loading && activeAnalysis === type.id && (
                      <div className={`animate-spin rounded-full h-5 w-5 border-2 border-${type.color}-500 border-t-transparent`}></div>
                    )}
                    {selectedType === type.id && !loading && (
                      <div className={`w-2 h-2 bg-${type.color}-500 rounded-full animate-pulse-glow`}></div>
                    )}
                  </div>
                  <p className={`text-sm transition-colors ${
                    selectedType === type.id 
                      ? `text-${type.color}-600` 
                      : 'text-slate-600'
                  }`}>
                    {type.description}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="space-y-4">
          <Button 
            onClick={handleAnalyze}
            disabled={!canAnalyze || (loading && activeAnalysis === selectedType)}
            className={`w-full h-12 text-base font-semibold bg-gradient-to-r ${
              selectedType ? analysisTypes.find(t => t.id === selectedType)?.gradient : 'from-slate-500 to-slate-600'
            } hover:shadow-glow transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {loading && activeAnalysis === selectedType ? (
              <div className="flex items-center space-x-3">
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                <span>Analyzing your data...</span>
              </div>
            ) : (
              <div className="flex items-center space-x-3">
                <span className="text-lg">
                  {analysisTypes.find(t => t.id === selectedType)?.icon || '⚡'}
                </span>
                <span>
                  Run {analysisTypes.find(t => t.id === selectedType)?.name || 'Analysis'}
                </span>
              </div>
            )}
          </Button>

          {!selectedFile ? (
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg animate-fade-in">
              <p className="text-sm text-amber-700 flex items-center space-x-2">
                <span className="text-amber-600">⚠️</span>
                <span>Please select a CSV file first to run analysis</span>
              </p>
            </div>
          ) : (
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg animate-fade-in">
              <p className="text-sm text-green-700 flex items-center space-x-2">
                <span className="text-green-600">✅</span>
                <span>Ready to analyze <strong>{selectedFile.name}</strong></span>
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

export { AnalysisControls }