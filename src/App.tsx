import { useState } from 'react'
import { useKV } from '@github/spark/hooks'
import { VideoProject } from './types'
import { Home } from './components/Home'
import { RequirementWizard } from './components/RequirementWizard'
import { ScriptView } from './components/ScriptView'
import { CameraStudio } from './components/CameraStudio'
import { Toaster } from './components/ui/sonner'
import { motion, AnimatePresence } from 'framer-motion'

type AppView = 'home' | 'wizard' | 'script' | 'camera'

const pageVariants = {
  initial: {
    opacity: 0,
    y: 20,
    scale: 0.98,
    filter: 'blur(10px)'
  },
  enter: {
    opacity: 1,
    y: 0,
    scale: 1,
    filter: 'blur(0px)',
    transition: {
      duration: 0.6,
      ease: [0.22, 1, 0.36, 1]
    }
  },
  exit: {
    opacity: 0,
    y: -20,
    scale: 1.02,
    filter: 'blur(10px)',
    transition: {
      duration: 0.4,
      ease: [0.22, 1, 0.36, 1]
    }
  }
}

function App() {
  const [currentView, setCurrentView] = useState<AppView>('home')
  const [projects, setProjects] = useKV<VideoProject[]>('video-projects', [])
  const [currentProjectId, setCurrentProjectId] = useState<string | null>(null)

  const currentProject = projects && projects.find(p => p.id === currentProjectId)

  const handleNewProject = () => {
    setCurrentProjectId(null)
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
    <div className="bg-black min-h-screen overflow-x-hidden">
      <AnimatePresence mode="wait">
        <motion.div
          key={currentView + (currentProjectId || '')}
          initial="initial"
          animate="enter"
          exit="exit"
          variants={pageVariants}
          className="w-full min-h-screen"
        >
          {currentView === 'home' && (
            <Home
              projects={projects || []}
              onNewProject={handleNewProject}
              onSelectProject={handleSelectProject}
              onDeleteProject={handleDeleteProject}
              setProjects={setProjects}
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
        </motion.div>
      </AnimatePresence>
      
      <Toaster position="top-center" theme="dark" closeButton />
    </div>
  )
}

export default App
