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
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Upload CSV File</CardTitle>
        <CardDescription>
          Select a CSV file to analyze with DataPilot
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div
          className={`relative border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
            dragActive 
              ? 'border-primary bg-primary/5' 
              : disabled 
                ? 'border-muted bg-muted/50' 
                : 'border-muted-foreground/25 hover:border-muted-foreground/50'
          }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
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
            <div className="space-y-2">
              <div className="text-sm font-medium text-primary">
                Selected File: {selectedFile.name}
              </div>
              <div className="text-xs text-muted-foreground">
                Size: {(selectedFile.size / 1024).toFixed(1)} KB
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={openFileDialog}
                disabled={disabled}
              >
                Change File
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="text-sm text-muted-foreground">
                {dragActive 
                  ? 'Drop your CSV file here' 
                  : 'Drag and drop your CSV file here, or click to browse'
                }
              </div>
              <Button 
                onClick={openFileDialog} 
                disabled={disabled}
                className="mx-auto"
              >
                Select CSV File
              </Button>
            </div>
          )}
        </div>
        
        {selectedFile && (
          <div className="mt-4 text-xs text-muted-foreground">
            <strong>Tip:</strong> DataPilot supports various CSV formats and will automatically detect encoding and delimiters.
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export { FileUpload }