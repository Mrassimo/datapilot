import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card"
import { Button } from "./ui/button"
import { useState } from "react"

const Layout = ({ children }) => {
  const [activeSection, setActiveSection] = useState('eda')

  const sections = [
    { id: 'eda', name: 'Exploratory Data Analysis', description: 'Statistical insights and data profiling' },
    { id: 'int', name: 'Data Integrity', description: 'Quality checks and validation' },
    { id: 'vis', name: 'Visualization', description: 'Chart recommendations and visual analysis' },
    { id: 'eng', name: 'Data Engineering', description: 'Archaeology and relationship mapping' },
    { id: 'llm', name: 'LLM Context', description: 'AI-optimized summaries and insights' }
  ]

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container flex h-16 items-center px-4">
          <h1 className="text-2xl font-bold text-primary">DataPilot</h1>
          <p className="ml-4 text-muted-foreground">Web Interface</p>
        </div>
      </header>
      
      <div className="container flex-1 items-start md:grid md:grid-cols-[220px_minmax(0,1fr)] md:gap-6 lg:grid-cols-[240px_minmax(0,1fr)] lg:gap-10">
        <aside className="fixed top-14 z-30 -ml-2 hidden h-[calc(100vh-3.5rem)] w-full shrink-0 md:sticky md:block">
          <div className="relative overflow-hidden h-full py-6 pr-6 lg:py-8">
            <nav className="space-y-2">
              {sections.map((section) => (
                <Button
                  key={section.id}
                  variant={activeSection === section.id ? "default" : "ghost"}
                  className="w-full justify-start"
                  onClick={() => setActiveSection(section.id)}
                >
                  {section.name}
                </Button>
              ))}
            </nav>
          </div>
        </aside>
        
        <main className="flex w-full flex-col overflow-hidden">
          {children || <DefaultContent activeSection={activeSection} sections={sections} />}
        </main>
      </div>
    </div>
  )
}

const DefaultContent = ({ activeSection, sections }) => {
  const currentSection = sections.find(s => s.id === activeSection)
  
  return (
    <div className="flex-1 space-y-4 p-4 md:p-8">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">{currentSection?.name}</h2>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Welcome to DataPilot Web Interface</CardTitle>
          <CardDescription>
            Upload a CSV file and select an analysis type to get started with your data exploration.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            <div className="space-y-2">
              <h4 className="text-sm font-medium">{currentSection?.name}</h4>
              <p className="text-sm text-muted-foreground">
                {currentSection?.description}
              </p>
            </div>
            
            <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center">
              <p className="text-sm text-muted-foreground mb-4">
                Drag and drop your CSV file here, or click to browse
              </p>
              <Button>Select File</Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export { Layout }