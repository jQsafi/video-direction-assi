export type VideoType = 'tutorial' | 'presentation' | 'vlog' | 'interview' | 'product-demo' | 'testimonial'
export type ToneType = 'professional' | 'casual' | 'energetic' | 'educational' | 'conversational'
export type ProjectStatus = 'draft' | 'scripted' | 'recording' | 'complete'

export interface VideoRequirements {
  videoType: VideoType
  purpose: string
  duration: number
  tone: ToneType
  keyPoints: string[]
  targetAudience: string
}

export interface ScriptScene {
  id: string
  sceneNumber: number
  content: string
  duration: number
}

export interface Direction {
  id: string
  sceneId: string
  cameraAngle: string
  shotType: string
  positioning: string
  distance: string
  notes: string
}

export interface VideoProject {
  id: string
  name: string
  createdAt: number
  updatedAt: number
  status: ProjectStatus
  requirements?: VideoRequirements
  script?: ScriptScene[]
  directions?: Direction[]
}

export interface FacePosition {
  x: number
  y: number
  width: number
  height: number
  distance: 'too-close' | 'too-far' | 'perfect'
  horizontalAlign: 'left' | 'center' | 'right'
  verticalAlign: 'top' | 'center' | 'bottom'
}

export interface CameraGuide {
  targetX: number
  targetY: number
  targetSize: number
  tolerance: number
}
