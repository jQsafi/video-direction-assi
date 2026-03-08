import { VideoProject } from '@/types'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Plus, Camera, Trash, Clock, Sparkle } from '@phosphor-icons/react'
import { toast } from 'sonner'

interface HomeProps {
  projects: VideoProject[]
  onNewProject: () => void
  onSelectProject: (projectId: string) => void
  onDeleteProject: (projectId: string) => void
  setProjects: (updater: VideoProject[] | ((prev: VideoProject[]) => VideoProject[])) => void
}

export function Home({ projects, onNewProject, onSelectProject, onDeleteProject, setProjects }: HomeProps) {
  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return 'bg-white/5 text-white/40 border-white/5'
      case 'scripted': return 'bg-blue-500/10 text-blue-400 border-blue-500/30'
      case 'recording': return 'bg-red-500/10 text-red-400 border-red-500/30'
      case 'complete': return 'bg-green-500/10 text-green-400 border-green-500/30'
      default: return 'bg-white/5 text-white/40 border-white/5'
    }
  }

  const loadDemoProject = () => {
    const demoId = `demo-${Date.now()}`;
    const demoProject: VideoProject = {
      id: demoId,
      name: "🚀 AI PRODUCT LAUNCH (DEMO)",
      createdAt: Date.now(),
      updatedAt: Date.now(),
      status: 'scripted',
      requirements: {
        videoType: 'product-demo',
        purpose: 'Launch the new AI Video Assistant',
        duration: 45,
        tone: 'energetic',
        keyPoints: ['AI Real-time guidance', 'Automated scripting', 'Professional framing'],
        targetAudience: 'Content Creators'
      },
      script: [
        { id: 'scene-0', sceneNumber: 1, content: "Welcome to the future of content creation. Today, we're launching the AI Director.", duration: 15 },
        { id: 'scene-1', sceneNumber: 2, content: "Look at how the AI tracks my face in real-time, ensuring I'm perfectly framed for every shot.", duration: 15 },
        { id: 'scene-2', sceneNumber: 3, content: "Professional videos, zero effort. Download the AI Director today!", duration: 15 }
      ],
      directions: [
        { id: 'dir-0', sceneId: 'scene-0', cameraAngle: 'Eye-level', shotType: 'Medium Shot', positioning: 'Center Frame', distance: '3 feet', notes: "Direct address to camera. Professional posture." },
        { id: 'dir-1', sceneId: 'scene-1', cameraAngle: 'Eye-level', shotType: 'Close-up', positioning: 'Center Frame', distance: '2 feet', notes: "Focus on the intensity and detail of the subject." },
        { id: 'dir-2', sceneId: 'scene-2', cameraAngle: 'Low Angle', shotType: 'Wide Shot', positioning: 'Rule of Thirds Left', distance: '5 feet', notes: "Hero shot. Energetic and commanding presence." }
      ]
    };

    setProjects(prev => [demoProject, ...(prev || [])]);
    toast.success('Demo project loaded! Opening studio...');
    onSelectProject(demoId);
  }

  return (
    <div className="min-h-screen bg-[#050506] text-white selection:bg-white/20">
      <div className="container mx-auto px-6 py-20 max-w-7xl">
        <header className="mb-16">
          <h1 className="text-7xl font-black tracking-tighter italic uppercase mb-4 leading-none">
            Director's <span className="text-white/20">Eye</span>
          </h1>
          <p className="text-xl text-white/40 font-medium tracking-tight max-w-2xl italic">
            Revolutionizing video production with real-time AI guidance and professional technical directions.
          </p>
        </header>

        <div className="flex flex-wrap gap-4 mb-16">
          <Button onClick={onNewProject} size="lg" className="bg-white text-black hover:bg-white/90 font-black text-lg px-10 h-16 rounded-2xl shadow-2xl transition-all active:scale-95">
            <Plus className="mr-3" weight="fill" size={24} />
            New Production
          </Button>
          <Button onClick={loadDemoProject} variant="outline" size="lg" className="border-white/10 hover:bg-white/5 text-white/60 hover:text-white font-black text-lg px-10 h-16 rounded-2xl shadow-xl transition-all active:scale-95">
            <Sparkle className="mr-3" weight="fill" size={24} />
            Try Demo
          </Button>
        </div>

        {projects.length === 0 ? (
          <Card className="bg-white/[0.02] border-white/5 border-dashed border-2 rounded-[3rem] overflow-hidden">
            <CardContent className="flex flex-col items-center justify-center py-32 text-center px-8">
              <div className="w-24 h-24 bg-white/5 rounded-full flex items-center justify-center mb-8 border border-white/5">
                <Camera size={48} className="text-white/20" weight="thin" />
              </div>
              <h3 className="text-3xl font-black italic uppercase tracking-tighter mb-4">No active productions</h3>
              <p className="text-white/40 text-lg max-w-md italic mb-10">
                Start a new production or load the demo to experience the AI-powered studio environment.
              </p>
              <Button onClick={loadDemoProject} className="bg-white/10 hover:bg-white/20 text-white rounded-full px-12 h-12 font-bold tracking-widest text-xs uppercase">
                 Launch First Demo
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {projects.map((project) => (
              <Card
                key={project.id}
                className="bg-white/[0.02] border-white/5 hover:bg-white/[0.04] hover:border-white/10 transition-all cursor-pointer group rounded-[2.5rem] overflow-hidden shadow-2xl"
                onClick={() => onSelectProject(project.id)}
              >
                <CardHeader className="p-8">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-4">
                         <Badge variant="outline" className={`font-black text-[10px] uppercase tracking-widest px-3 py-1 rounded-md ${getStatusColor(project.status)}`}>
                           {project.status}
                         </Badge>
                         <span className="text-white/20 text-xs font-mono">{formatDate(project.createdAt)}</span>
                      </div>
                      <CardTitle className="text-2xl font-black tracking-tighter italic uppercase group-hover:text-white transition-colors">
                        {project.name}
                      </CardTitle>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="opacity-0 group-hover:opacity-100 transition-all hover:bg-red-500/10 h-12 w-12 rounded-xl"
                      onClick={(e) => {
                        e.stopPropagation()
                        onDeleteProject(project.id)
                      }}
                    >
                      <Trash size={20} className="text-red-500/60" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="px-8 pb-8 pt-0">
                  {project.requirements && (
                    <div className="space-y-4">
                       <div className="flex flex-wrap gap-2">
                          <span className="text-[10px] font-black uppercase tracking-widest text-white/20 bg-white/5 px-2 py-1 rounded">
                             {project.requirements.videoType}
                          </span>
                          <span className="text-[10px] font-black uppercase tracking-widest text-white/20 bg-white/5 px-2 py-1 rounded">
                             {project.requirements.tone}
                          </span>
                       </div>
                       <p className="text-sm text-white/40 italic line-clamp-2 leading-relaxed">
                         {project.requirements.purpose}
                       </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
