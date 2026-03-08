import { useState } from 'react'
import { VideoProject, ScriptScene, Direction } from '@/types'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { ArrowLeft, Camera, Pencil, FilmStrip, Target, Check, X } from '@phosphor-icons/react'
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
  
  const [editingDirectionId, setEditingDirectionId] = useState<string | null>(null)
  const [editedDirection, setEditedDirection] = useState<Partial<Direction>>({})

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
    toast.success('Script scene updated')
  }

  const handleEditDirection = (direction: Direction) => {
    setEditingDirectionId(direction.id)
    setEditedDirection(direction)
  }

  const handleSaveDirection = (directionId: string) => {
    setProjects(current =>
      current.map(p =>
        p.id === project.id
          ? {
              ...p,
              directions: p.directions?.map(d =>
                d.id === directionId ? { ...d, ...editedDirection } as Direction : d
              )
            }
          : p
      )
    )
    setEditingDirectionId(null)
    toast.success('Camera directions updated')
  }

  const getDirectionForScene = (sceneIndex: number) => {
    return project.directions?.find(d => d.sceneId === `scene-${sceneIndex}`)
  }

  return (
    <div className="min-h-screen bg-[#050506] text-white">
      <div className="container mx-auto px-6 py-12 max-w-7xl">
        <header className="mb-12">
          <Button variant="ghost" onClick={onBack} className="mb-8 text-white/40 hover:text-white hover:bg-white/5">
            <ArrowLeft className="mr-3" />
            Back to Dashboard
          </Button>
          
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <h1 className="text-5xl font-black tracking-tighter italic uppercase mb-4">{project.name}</h1>
              <div className="flex flex-wrap gap-4 items-center">
                 <Badge className="bg-white/10 text-white/80 border-white/10 uppercase tracking-widest px-4 py-1">
                   {project.requirements?.videoType}
                 </Badge>
                 <span className="text-white/40 font-mono text-sm">•</span>
                 <span className="text-white/60 font-mono text-sm uppercase tracking-widest">
                   {project.requirements?.duration}s Runtime
                 </span>
                 <span className="text-white/40 font-mono text-sm">•</span>
                 <span className="text-white/60 font-mono text-sm uppercase tracking-widest">
                   {project.requirements?.tone} Tone
                 </span>
              </div>
            </div>
            <Button size="lg" onClick={onStartRecording} className="bg-white text-black hover:bg-white/90 font-black text-xl px-12 h-16 rounded-2xl shadow-2xl">
              <Camera className="mr-3" weight="fill" size={24} />
              ENTER STUDIO
            </Button>
          </div>
        </header>

        <Tabs defaultValue="script" className="w-full">
          <TabsList className="bg-white/5 border border-white/10 p-1.5 h-16 rounded-2xl mb-10 inline-flex">
            <TabsTrigger value="script" className="px-10 rounded-xl font-black uppercase tracking-widest text-sm data-[state=active]:bg-white data-[state=active]:text-black">
              <FilmStrip className="mr-3" size={20} />
              The Script
            </TabsTrigger>
            <TabsTrigger value="directions" className="px-10 rounded-xl font-black uppercase tracking-widest text-sm data-[state=active]:bg-white data-[state=active]:text-black">
              <Target className="mr-3" size={20} />
              Camera Angles
            </TabsTrigger>
          </TabsList>

          <TabsContent value="script">
            <div className="space-y-6">
              {project.script?.map((scene, index) => (
                <Card key={scene.id} className="bg-white/[0.02] border-white/5 backdrop-blur-3xl text-white rounded-[2rem] overflow-hidden group">
                  <CardHeader className="p-8 pb-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-6">
                        <Badge variant="outline" className="font-black text-xs border-white/20 text-white/60 px-4 py-1 rounded-lg">
                          SCENE {scene.sceneNumber}
                        </Badge>
                        <span className="text-sm text-white/30 font-mono uppercase tracking-widest">
                          Duration: {scene.duration}s
                        </span>
                      </div>
                      {editingSceneId !== scene.id && (
                        <Button variant="ghost" size="sm" onClick={() => handleEditScene(scene)} className="opacity-0 group-hover:opacity-100 transition-opacity">
                          <Pencil size={18} className="mr-2" />
                          Edit Script
                        </Button>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="p-8 pt-2">
                    {editingSceneId === scene.id ? (
                      <div className="space-y-6">
                        <Textarea
                          value={editedContent}
                          onChange={(e) => setEditedContent(e.target.value)}
                          rows={6}
                          className="bg-white/5 border-white/10 rounded-2xl p-6 text-xl font-medium leading-relaxed"
                        />
                        <div className="flex gap-3">
                          <Button onClick={() => handleSaveScene(scene.id)} className="bg-white text-black font-bold px-8 rounded-xl">
                            Save Changes
                          </Button>
                          <Button variant="outline" onClick={() => setEditingSceneId(null)} className="border-white/10 hover:bg-white/5 rounded-xl px-8">
                            Cancel
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <p className="text-2xl leading-[1.6] font-medium opacity-90 italic">
                        "{scene.content}"
                      </p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="directions">
            <div className="space-y-6">
              {project.script?.map((scene, index) => {
                const direction = getDirectionForScene(index)
                const isEditing = editingDirectionId === direction?.id
                
                return (
                  <Card key={scene.id} className="bg-white/[0.02] border-white/5 backdrop-blur-3xl text-white rounded-[2rem] border-l-8 border-l-white/10 group">
                    <CardHeader className="p-8">
                      <div className="flex items-center justify-between">
                         <div className="flex items-center gap-4">
                            <Badge className="bg-white/10 text-white/60">SCENE {scene.sceneNumber}</Badge>
                            <span className="text-white/40 text-xs font-mono">"{scene.content.substring(0, 60)}..."</span>
                         </div>
                         {!isEditing && direction && (
                           <Button variant="ghost" size="sm" onClick={() => handleEditDirection(direction)} className="opacity-0 group-hover:opacity-100 transition-opacity">
                             <Pencil size={18} className="mr-2" />
                             Edit Setup
                           </Button>
                         )}
                      </div>
                    </CardHeader>
                    <CardContent className="p-8 pt-0">
                      {isEditing ? (
                        <div className="grid gap-8 md:grid-cols-2">
                          <div className="space-y-4">
                            <div className="space-y-2">
                              <label className="text-[10px] font-black uppercase text-white/30 tracking-widest">Angle</label>
                              <Input 
                                value={editedDirection.cameraAngle} 
                                onChange={e => setEditedDirection({...editedDirection, cameraAngle: e.target.value})}
                                className="bg-white/5 border-white/10 rounded-xl"
                              />
                            </div>
                            <div className="space-y-2">
                              <label className="text-[10px] font-black uppercase text-white/30 tracking-widest">Shot Type</label>
                              <Input 
                                value={editedDirection.shotType} 
                                onChange={e => setEditedDirection({...editedDirection, shotType: e.target.value})}
                                className="bg-white/5 border-white/10 rounded-xl"
                              />
                            </div>
                          </div>
                          <div className="space-y-4">
                            <div className="space-y-2">
                              <label className="text-[10px] font-black uppercase text-white/30 tracking-widest">Positioning</label>
                              <Input 
                                value={editedDirection.positioning} 
                                onChange={e => setEditedDirection({...editedDirection, positioning: e.target.value})}
                                className="bg-white/5 border-white/10 rounded-xl"
                              />
                            </div>
                            <div className="space-y-2">
                              <label className="text-[10px] font-black uppercase text-white/30 tracking-widest">Distance</label>
                              <Input 
                                value={editedDirection.distance} 
                                onChange={e => setEditedDirection({...editedDirection, distance: e.target.value})}
                                className="bg-white/5 border-white/10 rounded-xl"
                              />
                            </div>
                          </div>
                          <div className="md:col-span-2 space-y-2">
                            <label className="text-[10px] font-black uppercase text-white/30 tracking-widest">Director Notes</label>
                            <Textarea 
                              value={editedDirection.notes} 
                              onChange={e => setEditedDirection({...editedDirection, notes: e.target.value})}
                              className="bg-white/5 border-white/10 rounded-xl"
                            />
                          </div>
                          <div className="flex gap-3">
                            <Button onClick={() => handleSaveDirection(direction!.id)} className="bg-white text-black font-bold rounded-xl px-10">
                              Apply Setup
                            </Button>
                            <Button variant="outline" onClick={() => setEditingDirectionId(null)} className="border-white/10 rounded-xl px-10">
                              Cancel
                            </Button>
                          </div>
                        </div>
                      ) : direction ? (
                        <div className="grid gap-10 md:grid-cols-4">
                          <div className="space-y-1">
                            <div className="text-[10px] font-black text-white/30 uppercase tracking-widest">Angle</div>
                            <div className="text-xl font-bold">{direction.cameraAngle}</div>
                          </div>
                          <div className="space-y-1">
                            <div className="text-[10px] font-black text-white/30 uppercase tracking-widest">Framing</div>
                            <div className="text-xl font-bold">{direction.shotType}</div>
                          </div>
                          <div className="space-y-1">
                            <div className="text-[10px] font-black text-white/30 uppercase tracking-widest">Position</div>
                            <div className="text-xl font-bold">{direction.positioning}</div>
                          </div>
                          <div className="space-y-1">
                            <div className="text-[10px] font-black text-white/30 uppercase tracking-widest">Distance</div>
                            <div className="text-xl font-bold">{direction.distance}</div>
                          </div>
                          <div className="md:col-span-4 pt-6 border-t border-white/5">
                            <div className="text-[10px] font-black text-white/30 uppercase tracking-widest mb-3">Notes</div>
                            <p className="text-white/60 italic leading-relaxed">{direction.notes}</p>
                          </div>
                        </div>
                      ) : (
                        <div className="text-white/40 italic">No technical directions generated for this scene.</div>
                      )}
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
