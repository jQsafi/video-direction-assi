import { VideoProject } from '@/types'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Plus, Camera, Trash, Clock } from '@phosphor-icons/react'

interface HomeProps {
  projects: VideoProject[]
  onNewProject: () => void
  onSelectProject: (projectId: string) => void
  onDeleteProject: (projectId: string) => void
}

export function Home({ projects, onNewProject, onSelectProject, onDeleteProject }: HomeProps) {
  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft':
        return 'bg-muted text-muted-foreground'
      case 'scripted':
        return 'bg-secondary text-secondary-foreground'
      case 'recording':
        return 'bg-accent text-accent-foreground'
      case 'complete':
        return 'bg-primary text-primary-foreground'
      default:
        return 'bg-muted text-muted-foreground'
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted">
      <div className="container mx-auto px-6 py-12 max-w-7xl">
        <div className="mb-12">
          <h1 className="text-4xl font-bold tracking-tight mb-3">Director's Eye</h1>
          <p className="text-lg text-muted-foreground">
            AI-powered video production assistant with real-time camera direction
          </p>
        </div>

        <Button
          onClick={onNewProject}
          size="lg"
          className="mb-8 tracking-wide"
        >
          <Plus className="mr-2" weight="bold" />
          Start New Video Project
        </Button>

        {projects.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <Camera size={64} className="text-muted-foreground mb-4" weight="thin" />
              <h3 className="text-xl font-semibold mb-2">No projects yet</h3>
              <p className="text-muted-foreground text-center max-w-md">
                Create your first video project to get started with AI-powered script generation and camera direction
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {projects.map((project) => (
              <Card
                key={project.id}
                className="hover:shadow-lg transition-shadow cursor-pointer group"
                onClick={() => onSelectProject(project.id)}
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-xl mb-2 group-hover:text-accent transition-colors">
                        {project.name}
                      </CardTitle>
                      <CardDescription className="flex items-center gap-2 text-sm font-mono">
                        <Clock size={14} />
                        {formatDate(project.createdAt)}
                      </CardDescription>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={(e) => {
                        e.stopPropagation()
                        onDeleteProject(project.id)
                      }}
                    >
                      <Trash size={18} className="text-destructive" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <Badge className={getStatusColor(project.status)}>
                      {project.status.charAt(0).toUpperCase() + project.status.slice(1)}
                    </Badge>
                    {project.requirements && (
                      <div className="text-sm text-muted-foreground">
                        <p className="capitalize">{project.requirements.videoType.replace('-', ' ')}</p>
                        <p className="capitalize">{project.requirements.tone} tone</p>
                        <p>{project.requirements.duration}s duration</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
