import { useState } from 'react'
import { VideoProject, VideoRequirements, VideoType, ToneType } from '@/types'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Progress } from '@/components/ui/progress'
import { ArrowLeft, ArrowRight, Check, Sparkle } from '@phosphor-icons/react'
import { toast } from 'sonner'

interface RequirementWizardProps {
  projects: VideoProject[]
  setProjects: (updater: VideoProject[] | ((prev: VideoProject[]) => VideoProject[])) => void
  currentProjectId: string | null
  onComplete: (projectId: string) => void
  onBack: () => void
}

type Step = 1 | 2 | 3 | 4 | 5 | 6

export function RequirementWizard({ projects, setProjects, currentProjectId, onComplete, onBack }: RequirementWizardProps) {
  const existingProject = currentProjectId ? projects.find(p => p.id === currentProjectId) : null
  
  const [step, setStep] = useState<Step>(1)
  const [projectName, setProjectName] = useState(existingProject?.name || '')
  const [videoType, setVideoType] = useState<VideoType>(existingProject?.requirements?.videoType || 'tutorial')
  const [purpose, setPurpose] = useState(existingProject?.requirements?.purpose || '')
  const [duration, setDuration] = useState(existingProject?.requirements?.duration?.toString() || '60')
  const [tone, setTone] = useState<ToneType>(existingProject?.requirements?.tone || 'professional')
  const [keyPointsText, setKeyPointsText] = useState(existingProject?.requirements?.keyPoints?.join('\n') || '')
  const [targetAudience, setTargetAudience] = useState(existingProject?.requirements?.targetAudience || '')
  const [isGenerating, setIsGenerating] = useState(false)

  const totalSteps = 6
  const progress = (step / totalSteps) * 100

  const canProceed = () => {
    switch (step) {
      case 1: return projectName.trim() !== ''
      case 2: return purpose.trim() !== ''
      case 3: return duration !== '' && parseInt(duration) > 0
      case 4: return true
      case 5: return keyPointsText.trim() !== ''
      case 6: return targetAudience.trim() !== ''
      default: return false
    }
  }

  const handleNext = () => {
    if (step < totalSteps) {
      setStep((step + 1) as Step)
    }
  }

  const handlePrevious = () => {
    if (step > 1) {
      setStep((step - 1) as Step)
    }
  }

  const handleComplete = async () => {
    if (!canProceed()) return

    setIsGenerating(true)
    
    const requirements: VideoRequirements = {
      videoType,
      purpose,
      duration: parseInt(duration),
      tone,
      keyPoints: keyPointsText.split('\n').filter(p => p.trim() !== ''),
      targetAudience
    }

    try {
      const scriptPrompt = window.spark.llmPrompt`You are a professional video script writer. Generate a detailed shooting script for a ${videoType} video with the following details:

Purpose: ${purpose}
Duration: ${duration} seconds
Tone: ${tone}
Key Points: ${keyPointsText}
Target Audience: ${targetAudience}

Create a script broken into scenes (approximately 10-15 second segments). For each scene, provide:
1. Scene number
2. Content (dialogue, narration, or description of what happens)
3. Approximate duration in seconds

Return a JSON object with a single property "scenes" containing an array of scene objects. Each scene should have: sceneNumber, content, duration.
`

      const scriptResult = await window.spark.llm(scriptPrompt, 'gpt-4o', true)
      const scriptData = JSON.parse(scriptResult)
      
      const directionsPrompt = window.spark.llmPrompt`You are a professional cinematographer. Based on this video script, create detailed camera directions for each scene:

${JSON.stringify(scriptData.scenes)}

For each scene, provide technical direction including:
1. Camera angle (e.g., eye-level, high angle, low angle, dutch angle)
2. Shot type (e.g., close-up, medium shot, wide shot, extreme close-up)
3. Positioning instructions (e.g., center frame, rule of thirds left, rule of thirds right)
4. Distance from camera (e.g., 2 feet, 3 feet, 4 feet)
5. Additional notes (lighting suggestions, framing tips, movement cues)

Return a JSON object with a single property "directions" containing an array. Each direction should have: sceneNumber, cameraAngle, shotType, positioning, distance, notes.
`

      const directionsResult = await window.spark.llm(directionsPrompt, 'gpt-4o', true)
      const directionsData = JSON.parse(directionsResult)

      const newProject: VideoProject = {
        id: currentProjectId || Date.now().toString(),
        name: projectName,
        createdAt: existingProject?.createdAt || Date.now(),
        updatedAt: Date.now(),
        status: 'scripted',
        requirements,
        script: scriptData.scenes.map((scene: any, index: number) => ({
          id: `scene-${index}`,
          sceneNumber: scene.sceneNumber || index + 1,
          content: scene.content,
          duration: scene.duration
        })),
        directions: directionsData.directions.map((dir: any, index: number) => ({
          id: `direction-${index}`,
          sceneId: `scene-${dir.sceneNumber - 1}`,
          cameraAngle: dir.cameraAngle,
          shotType: dir.shotType,
          positioning: dir.positioning,
          distance: dir.distance,
          notes: dir.notes
        }))
      }

      if (currentProjectId) {
        setProjects(current => current.map(p => p.id === currentProjectId ? newProject : p))
      } else {
        setProjects(current => [...current, newProject])
      }

      toast.success('Script and directions generated successfully!')
      onComplete(newProject.id)
    } catch (error) {
      console.error('Generation error:', error)
      toast.error('Failed to generate script. Please try again.')
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted">
      <div className="container mx-auto px-6 py-8 max-w-3xl">
        <div className="mb-8">
          <Button variant="ghost" onClick={onBack} className="mb-4">
            <ArrowLeft className="mr-2" />
            Back to Projects
          </Button>
          
          <h1 className="text-3xl font-bold mb-2">Video Requirements</h1>
          <p className="text-muted-foreground">Step {step} of {totalSteps}</p>
          <Progress value={progress} className="mt-4" />
        </div>

        <Card>
          <CardHeader>
            <CardTitle>
              {step === 1 && 'Project & Video Type'}
              {step === 2 && 'Purpose & Goal'}
              {step === 3 && 'Duration'}
              {step === 4 && 'Tone & Style'}
              {step === 5 && 'Key Points'}
              {step === 6 && 'Target Audience'}
            </CardTitle>
            <CardDescription>
              {step === 1 && 'Give your project a name and select the type of video'}
              {step === 2 && 'What is the main purpose of this video?'}
              {step === 3 && 'How long should the final video be?'}
              {step === 4 && 'What tone should the video convey?'}
              {step === 5 && 'List the main points to cover in the video'}
              {step === 6 && 'Who is this video for?'}
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-6">
            {step === 1 && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="project-name">Project Name</Label>
                  <Input
                    id="project-name"
                    placeholder="e.g., Product Launch Video"
                    value={projectName}
                    onChange={(e) => setProjectName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="video-type">Video Type</Label>
                  <Select value={videoType} onValueChange={(v) => setVideoType(v as VideoType)}>
                    <SelectTrigger id="video-type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="tutorial">Tutorial</SelectItem>
                      <SelectItem value="presentation">Presentation</SelectItem>
                      <SelectItem value="vlog">Vlog</SelectItem>
                      <SelectItem value="interview">Interview</SelectItem>
                      <SelectItem value="product-demo">Product Demo</SelectItem>
                      <SelectItem value="testimonial">Testimonial</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}

            {step === 2 && (
              <div className="space-y-2">
                <Label htmlFor="purpose">Video Purpose</Label>
                <Textarea
                  id="purpose"
                  placeholder="e.g., Introduce our new product features to potential customers and demonstrate how it solves their pain points"
                  value={purpose}
                  onChange={(e) => setPurpose(e.target.value)}
                  rows={5}
                />
              </div>
            )}

            {step === 3 && (
              <div className="space-y-2">
                <Label htmlFor="duration">Duration (seconds)</Label>
                <Input
                  id="duration"
                  type="number"
                  placeholder="60"
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  min="10"
                  max="600"
                />
                <p className="text-sm text-muted-foreground">
                  Typical durations: 30s (short), 60s (standard), 120s (detailed), 300s+ (comprehensive)
                </p>
              </div>
            )}

            {step === 4 && (
              <div className="space-y-2">
                <Label htmlFor="tone">Tone & Style</Label>
                <Select value={tone} onValueChange={(v) => setTone(v as ToneType)}>
                  <SelectTrigger id="tone">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="professional">Professional</SelectItem>
                    <SelectItem value="casual">Casual</SelectItem>
                    <SelectItem value="energetic">Energetic</SelectItem>
                    <SelectItem value="educational">Educational</SelectItem>
                    <SelectItem value="conversational">Conversational</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            {step === 5 && (
              <div className="space-y-2">
                <Label htmlFor="key-points">Key Points (one per line)</Label>
                <Textarea
                  id="key-points"
                  placeholder="Point 1: Introduction to the problem&#10;Point 2: Our solution&#10;Point 3: Key benefits&#10;Point 4: Call to action"
                  value={keyPointsText}
                  onChange={(e) => setKeyPointsText(e.target.value)}
                  rows={8}
                />
              </div>
            )}

            {step === 6 && (
              <div className="space-y-2">
                <Label htmlFor="target-audience">Target Audience</Label>
                <Textarea
                  id="target-audience"
                  placeholder="e.g., Small business owners aged 30-50 who are looking for productivity tools"
                  value={targetAudience}
                  onChange={(e) => setTargetAudience(e.target.value)}
                  rows={4}
                />
              </div>
            )}

            <div className="flex justify-between pt-4">
              <Button
                variant="outline"
                onClick={handlePrevious}
                disabled={step === 1}
              >
                <ArrowLeft className="mr-2" />
                Previous
              </Button>

              {step < totalSteps ? (
                <Button
                  onClick={handleNext}
                  disabled={!canProceed()}
                >
                  Next
                  <ArrowRight className="ml-2" />
                </Button>
              ) : (
                <Button
                  onClick={handleComplete}
                  disabled={!canProceed() || isGenerating}
                >
                  {isGenerating ? (
                    <>
                      <Sparkle className="mr-2 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Check className="mr-2" />
                      Generate Script
                    </>
                  )}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
