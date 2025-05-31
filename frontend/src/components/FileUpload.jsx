import { useState, useRef } from 'react'
import { Button } from './ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Input } from './ui/input'

const FileUpload = ({ onFileSelect, disabled = false }) => {
  const [selectedFile, setSelectedFile] = useState(null)
  const [dragActive, setDragActive] = useState(false)
  const fileInputRef = useRef(null)

  const handleFileSelect = (file) => {
    if (file && file.type === 'text/csv') {
      setSelectedFile(file)
      onFileSelect(file)
    } else {
      alert('Please select a CSV file')
    }
  }

  const handleDrag = (e) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  const handleDrop = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0])
    }
  }

  const handleInputChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelect(e.target.files[0])
    }
  }

  const openFileDialog = () => {
    fileInputRef.current?.click()
  }

  return (
    <Card className="w-full bg-white/80 backdrop-blur-sm border-0 shadow-card hover:shadow-glow transition-all duration-300">
      <CardHeader className="pb-4">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
            <span className="text-white text-lg">📁</span>
          </div>
          <div>
            <CardTitle className="text-lg font-semibold text-slate-800">Upload CSV File</CardTitle>
            <CardDescription className="text-slate-600">
              Select a CSV file to analyze with DataPilot
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div
          className={`relative rounded-xl p-8 text-center transition-all duration-300 group cursor-pointer ${
            dragActive 
              ? 'border-2 border-dashed border-blue-400 bg-gradient-to-br from-blue-50 to-indigo-50 scale-105 shadow-glow' 
              : disabled 
                ? 'border-2 border-dashed border-slate-200 bg-slate-50/50' 
                : 'border-2 border-dashed border-slate-300 hover:border-blue-400 hover:bg-gradient-to-br hover:from-blue-50/50 hover:to-indigo-50/50 hover:scale-105'
          }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={() => !selectedFile && openFileDialog()}
        >
          <Input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            onChange={handleInputChange}
            className="hidden"
            disabled={disabled}
          />
          
          {selectedFile ? (
            <div className="space-y-4 animate-fade-in">
              <div className="w-16 h-16 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-2xl flex items-center justify-center mx-auto shadow-lg">
                <span className="text-white text-2xl">✓</span>
              </div>
              <div className="space-y-2">
                <div className="text-lg font-semibold text-slate-800">
                  {selectedFile.name}
                </div>
                <div className="flex items-center justify-center space-x-4 text-sm text-slate-600">
                  <div className="flex items-center space-x-1">
                    <span>📊</span>
                    <span>CSV File</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <span>💾</span>
                    <span>{(selectedFile.size / 1024).toFixed(1)} KB</span>
                  </div>
                </div>
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={(e) => {
                  e.stopPropagation()
                  openFileDialog()
                }}
                disabled={disabled}
                className="border-blue-200 text-blue-600 hover:bg-blue-50 hover:border-blue-300"
              >
                Change File
              </Button>
            </div>
          ) : (
            <div className="space-y-6 animate-fade-in">
              <div className={`w-20 h-20 mx-auto rounded-2xl flex items-center justify-center transition-all duration-300 ${
                dragActive 
                  ? 'bg-gradient-to-br from-blue-500 to-indigo-600 shadow-glow animate-bounce-subtle' 
                  : 'bg-gradient-to-br from-slate-100 to-slate-200 group-hover:from-blue-100 group-hover:to-indigo-100'
              }`}>
                <span className={`text-3xl transition-all duration-300 ${
                  dragActive ? 'text-white' : 'text-slate-400 group-hover:text-blue-500'
                }`}>
                  {dragActive ? '⬇️' : '📂'}
                </span>
              </div>
              
              <div className="space-y-2">
                <h3 className="text-lg font-semibold text-slate-800">
                  {dragActive 
                    ? 'Drop your CSV file here' 
                    : 'Drop your CSV file here'
                  }
                </h3>
                <p className="text-slate-600">
                  or click to browse your files
                </p>
              </div>
              
              <Button 
                onClick={(e) => {
                  e.stopPropagation()
                  openFileDialog()
                }} 
                disabled={disabled}
                className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white shadow-lg hover:shadow-glow transition-all duration-300"
              >
                <span className="mr-2">📁</span>
                Select CSV File
              </Button>
            </div>
          )}
        </div>
        
        {selectedFile && (
          <div className="mt-6 p-4 bg-blue-50/50 rounded-lg border border-blue-100 animate-fade-in">
            <p className="text-sm text-blue-700 flex items-start space-x-2">
              <span className="text-blue-500 mt-0.5">💡</span>
              <span>
                <strong>Tip:</strong> DataPilot supports various CSV formats and will automatically detect encoding and delimiters.
              </span>
            </p>
          </div>
        )}
        
        {/* Format support indicators */}
        <div className="mt-6 flex flex-wrap gap-2 justify-center">
          {['UTF-8', 'Comma Separated', 'Auto-Detection', 'Large Files'].map((feature, idx) => (
            <div key={idx} className="px-3 py-1 bg-slate-100 text-slate-600 text-xs rounded-full font-medium">
              {feature}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

export { FileUpload }