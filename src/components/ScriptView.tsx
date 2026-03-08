import { useState } from 'react'
import { VideoProject, ScriptScene } from '@/types'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { ScrollArea } from '@/components/ui/scroll-area'
import { ArrowLeft, Camera, Pencil, FilmStrip, Target } from '@phosphor-icons/react'
import { toast } from 'sonner'

interface ScriptViewProps {
  project: VideoProject
  projects: VideoProject[]
  setProjects: (updater: VideoProject[] | ((prev: VideoProject[]) => VideoProject[])) => void
  onBack: () => void
  onStartRecording: () => void
}

export function ScriptView({ project, projects, setProjects, onBack, onStartRecording }: ScriptViewProps) {
  const [editingSceneId, setEditingSceneId] = useState<string | null>(null)
  const [editedContent, setEditedContent] = useState('')

  const handleEditScene = (scene: ScriptScene) => {
    setEditingSceneId(scene.id)
    setEditedContent(scene.content)
  }

  const handleSaveScene = (sceneId: string) => {
    setProjects(current =>
      current.map(p =>
        p.id === project.id
          ? {
              ...p,
              script: p.script?.map(s =>
                s.id === sceneId ? { ...s, content: editedContent } : s
              )
            }
          : p
      )
    )
    setEditingSceneId(null)
    toast.success('Scene updated')
  }

  const handleCancelEdit = () => {
    setEditingSceneId(null)
    setEditedContent('')
  }

  const getDirectionForScene = (sceneNumber: number) => {
    return project.directions?.find(d => d.sceneId === `scene-${sceneNumber - 1}`)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted">
      <div className="container mx-auto px-6 py-8 max-w-7xl">
        <div className="mb-8">
          <Button variant="ghost" onClick={onBack} className="mb-4">
            <ArrowLeft className="mr-2" />
            Back to Projects
          </Button>
          
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">{project.name}</h1>
              <p className="text-muted-foreground">
                {project.requirements?.videoType.replace('-', ' ')} • {project.requirements?.duration}s • {project.requirements?.tone} tone
              </p>
            </div>
            <Button size="lg" onClick={onStartRecording}>
              <Camera className="mr-2" weight="bold" />
              Start Recording
            </Button>
          </div>
        </div>

        <Tabs defaultValue="script" className="w-full">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="script">
              <FilmStrip className="mr-2" size={18} />
              Script
            </TabsTrigger>
            <TabsTrigger value="directions">
              <Target className="mr-2" size={18} />
              Directions
            </TabsTrigger>
          </TabsList>

          <TabsContent value="script" className="mt-6">
            <ScrollArea className="h-[calc(100vh-300px)]">
              <div className="space-y-4 pr-4">
                {project.script?.map((scene) => (
                  <Card key={scene.id}>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Badge variant="outline" className="font-mono">
                            Scene {scene.sceneNumber}
                          </Badge>
                          <span className="text-sm text-muted-foreground font-mono">
                            {scene.duration}s
                          </span>
                        </div>
                        {editingSceneId !== scene.id && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditScene(scene)}
                          >
                            <Pencil size={16} className="mr-2" />
                            Edit
                          </Button>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent>
                      {editingSceneId === scene.id ? (
                        <div className="space-y-3">
                          <Textarea
                            value={editedContent}
                            onChange={(e) => setEditedContent(e.target.value)}
                            rows={6}
                            className="font-sans"
                          />
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              onClick={() => handleSaveScene(scene.id)}
                            >
                              Save
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={handleCancelEdit}
                            >
                              Cancel
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <p className="text-base leading-relaxed whitespace-pre-wrap">
                          {scene.content}
                        </p>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="directions" className="mt-6">
            <ScrollArea className="h-[calc(100vh-300px)]">
              <div className="space-y-4 pr-4">
                {project.script?.map((scene) => {
                  const direction = getDirectionForScene(scene.sceneNumber)
                  return (
                    <Card key={scene.id} className="border-l-4 border-l-accent">
                      <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-3">
                          <Badge variant="outline" className="font-mono">
                            Scene {scene.sceneNumber}
                          </Badge>
                          <span className="text-sm font-normal text-muted-foreground">
                            {scene.duration}s
                          </span>
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="text-sm text-muted-foreground italic border-l-2 border-muted pl-4">
                          {scene.content.substring(0, 120)}
                          {scene.content.length > 120 && '...'}
                        </div>
                        
                        {direction && (
                          <div className="grid gap-3 md:grid-cols-2">
                            <div className="space-y-1">
                              <div className="text-xs font-mono text-muted-foreground uppercase tracking-wide">
                                Camera Angle
                              </div>
                              <div className="font-medium">{direction.cameraAngle}</div>
                            </div>
                            <div className="space-y-1">
                              <div className="text-xs font-mono text-muted-foreground uppercase tracking-wide">
                                Shot Type
                              </div>
                              <div className="font-medium">{direction.shotType}</div>
                            </div>
                            <div className="space-y-1">
                              <div className="text-xs font-mono text-muted-foreground uppercase tracking-wide">
                                Positioning
                              </div>
                              <div className="font-medium">{direction.positioning}</div>
                            </div>
                            <div className="space-y-1">
                              <div className="text-xs font-mono text-muted-foreground uppercase tracking-wide">
                                Distance
                              </div>
                              <div className="font-medium">{direction.distance}</div>
                            </div>
                            <div className="space-y-1 md:col-span-2">
                              <div className="text-xs font-mono text-muted-foreground uppercase tracking-wide">
                                Notes
                              </div>
                              <div className="text-sm">{direction.notes}</div>
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
