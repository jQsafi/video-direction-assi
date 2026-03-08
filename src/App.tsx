import { useState } from 'react'
import { useKV } from '@github/spark/hooks'
import { VideoProject } from './types'
import { Home } from './components/Home'
import { RequirementWizard } from './components/RequirementWizard'
import { ScriptView } from './components/ScriptView'
import { CameraStudio } from './components/CameraStudio'
import { Toaster } from './components/ui/sonner'

type AppView = 'home' | 'wizard' | 'script' | 'camera'

function App() {
  const [currentView, setCurrentView] = useState<AppView>('home')
  const [projects, setProjects] = useKV<VideoProject[]>('video-projects', [])
  const [currentProjectId, setCurrentProjectId] = useState<string | null>(null)

  const currentProject = projects && projects.find(p => p.id === currentProjectId)

  const handleNewProject = () => {
    setCurrentView('wizard')
  }

  const handleSelectProject = (projectId: string) => {
    setCurrentProjectId(projectId)
    const project = projects && projects.find(p => p.id === projectId)
    if (project) {
      if (project.status === 'draft') {
        setCurrentView('wizard')
      } else {
        setCurrentView('script')
      }
    }
  }

  const handleDeleteProject = (projectId: string) => {
    setProjects(current => (current || []).filter(p => p.id !== projectId))
    if (currentProjectId === projectId) {
      setCurrentProjectId(null)
      setCurrentView('home')
    }
  }

  const handleWizardComplete = (projectId: string) => {
    setCurrentProjectId(projectId)
    setCurrentView('script')
  }

  const handleBackToProjects = () => {
    setCurrentProjectId(null)
    setCurrentView('home')
  }

  const handleStartRecording = () => {
    setCurrentView('camera')
  }

  const handleBackToScript = () => {
    setCurrentView('script')
  }

  return (
    <>
      {currentView === 'home' && (
        <Home
          projects={projects || []}
          onNewProject={handleNewProject}
          onSelectProject={handleSelectProject}
          onDeleteProject={handleDeleteProject}
        />
      )}
      
      {currentView === 'wizard' && (
        <RequirementWizard
          projects={projects || []}
          setProjects={setProjects}
          currentProjectId={currentProjectId}
          onComplete={handleWizardComplete}
          onBack={handleBackToProjects}
        />
      )}
      
      {currentView === 'script' && currentProject && (
        <ScriptView
          project={currentProject}
          projects={projects || []}
          setProjects={setProjects}
          onBack={handleBackToProjects}
          onStartRecording={handleStartRecording}
        />
      )}
      
      {currentView === 'camera' && currentProject && (
        <CameraStudio
          project={currentProject}
          onBack={handleBackToScript}
        />
      )}
      
      <Toaster />
    </>
  )
}

export default App
