// API service for DataPilot backend communication

const API_BASE_URL = '/api'

export class DataPilotAPI {
  static async healthCheck() {
    try {
      const response = await fetch(`${API_BASE_URL}/health`)
      if (!response.ok) {
        throw new Error(`Health check failed: ${response.status}`)
      }
      return await response.json()
    } catch (error) {
      throw new Error(`API connection failed: ${error.message}`)
    }
  }

  static async analyzeFile(analysisType, file, options = {}) {
    try {
      const formData = new FormData()
      formData.append('file', file)
      
      if (options) {
        formData.append('options', JSON.stringify(options))
      }

      const response = await fetch(`${API_BASE_URL}/analyze/${analysisType}`, {
        method: 'POST',
        body: formData
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
        throw new Error(errorData.error || `Analysis failed: ${response.status}`)
      }

      const result = await response.json()
      
      if (!result.success) {
        throw new Error(result.error || 'Analysis failed')
      }

      return result.result
    } catch (error) {
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        throw new Error('Unable to connect to DataPilot server. Please ensure the server is running.')
      }
      throw error
    }
  }

  static async analyzeEDA(file, options = {}) {
    return this.analyzeFile('eda', file, options)
  }

  static async analyzeIntegrity(file, options = {}) {
    return this.analyzeFile('int', file, options)
  }

  static async analyzeVisualization(file, options = {}) {
    return this.analyzeFile('vis', file, options)
  }

  static async analyzeEngineering(file, options = {}) {
    return this.analyzeFile('eng', file, options)
  }

  static async analyzeLLM(file, options = {}) {
    return this.analyzeFile('llm', file, options)
  }
}

export default DataPilotAPI