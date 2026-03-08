import { useRef, useEffect, useState } from 'react'
import { VideoProject } from '@/types'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { ArrowLeft, Circle, Warning, CheckCircle, ArrowUp, ArrowDown, ArrowsOut, ArrowsIn } from '@phosphor-icons/react'
import { toast } from 'sonner'

interface CameraStudioProps {
  project: VideoProject
  onBack: () => void
}

type PositionStatus = 'perfect' | 'adjusting' | 'no-face'

export function CameraStudio({ project, onBack }: CameraStudioProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [stream, setStream] = useState<MediaStream | null>(null)
  const [currentSceneIndex, setCurrentSceneIndex] = useState(0)
  const [isRecording, setIsRecording] = useState(false)
  const [positionStatus, setPositionStatus] = useState<PositionStatus>('adjusting')
  const [feedback, setFeedback] = useState<string>('Position yourself in frame')
  const [faceDetected, setFaceDetected] = useState(false)
  const [cameraError, setCameraError] = useState<string | null>(null)

  const currentScene = project.script?.[currentSceneIndex]
  const currentDirection = project.directions?.find(
    d => d.sceneId === `scene-${currentSceneIndex}`
  )

  useEffect(() => {
    startCamera()
    return () => {
      stopCamera()
    }
  }, [])

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'user'
        },
        audio: false
      })
      
      setStream(mediaStream)
      
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream
      }

      toast.success('Camera connected')
      startFaceDetection()
    } catch (error) {
      console.error('Camera error:', error)
      setCameraError('Unable to access camera. Please check permissions.')
      toast.error('Camera access denied')
    }
  }

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop())
      setStream(null)
    }
  }

  const startFaceDetection = () => {
    const detectInterval = setInterval(() => {
      if (!videoRef.current || !canvasRef.current) return

      const video = videoRef.current
      const canvas = canvasRef.current
      const ctx = canvas.getContext('2d')

      if (!ctx || video.readyState !== video.HAVE_ENOUGH_DATA) return

      canvas.width = video.videoWidth
      canvas.height = video.videoHeight

      const centerX = canvas.width / 2
      const centerY = canvas.height / 2
      const idealSize = canvas.width * 0.25

      const mockFaceDetection = Math.random() > 0.3
      
      if (mockFaceDetection) {
        setFaceDetected(true)
        
        const faceX = centerX + (Math.random() - 0.5) * canvas.width * 0.3
        const faceY = centerY + (Math.random() - 0.5) * canvas.height * 0.3
        const faceSize = idealSize + (Math.random() - 0.5) * idealSize * 0.4

        const distanceFromCenter = Math.sqrt(
          Math.pow(faceX - centerX, 2) + Math.pow(faceY - centerY, 2)
        )
        const sizeRatio = faceSize / idealSize

        if (distanceFromCenter < 50 && sizeRatio > 0.9 && sizeRatio < 1.1) {
          setPositionStatus('perfect')
          setFeedback('Perfect! Hold this position')
        } else {
          setPositionStatus('adjusting')
          
          if (faceX < centerX - 100) {
            setFeedback('Move slightly to your right')
          } else if (faceX > centerX + 100) {
            setFeedback('Move slightly to your left')
          } else if (faceY < centerY - 80) {
            setFeedback('Move down slightly')
          } else if (faceY > centerY + 80) {
            setFeedback('Move up slightly')
          } else if (sizeRatio < 0.85) {
            setFeedback('Move closer to the camera')
          } else if (sizeRatio > 1.15) {
            setFeedback('Move back from the camera')
          } else {
            setFeedback('Almost there, slight adjustment needed')
          }
        }

        ctx.strokeStyle = positionStatus === 'perfect' ? '#22c55e' : '#f59e0b'
        ctx.lineWidth = 3
        ctx.strokeRect(
          faceX - faceSize / 2,
          faceY - faceSize / 2,
          faceSize,
          faceSize
        )
      } else {
        setFaceDetected(false)
        setPositionStatus('no-face')
        setFeedback('Face not detected - adjust position or lighting')
      }

      ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)'
      ctx.lineWidth = 2
      ctx.strokeRect(
        centerX - idealSize / 2,
        centerY - idealSize / 2,
        idealSize,
        idealSize
      )

      ctx.beginPath()
      ctx.moveTo(0, centerY)
      ctx.lineTo(canvas.width, centerY)
      ctx.moveTo(centerX, 0)
      ctx.lineTo(centerX, canvas.height)
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)'
      ctx.lineWidth = 1
      ctx.stroke()

    }, 100)

    return () => clearInterval(detectInterval)
  }

  const handleNextScene = () => {
    if (currentSceneIndex < (project.script?.length || 0) - 1) {
      setCurrentSceneIndex(currentSceneIndex + 1)
      setIsRecording(false)
      toast.success('Moving to next scene')
    }
  }

  const handlePreviousScene = () => {
    if (currentSceneIndex > 0) {
      setCurrentSceneIndex(currentSceneIndex - 1)
      setIsRecording(false)
    }
  }

  const handleStartRecording = () => {
    if (positionStatus === 'perfect') {
      setIsRecording(true)
      toast.success('Recording started')
    } else {
      toast.error('Please adjust your position before recording')
    }
  }

  const handleStopRecording = () => {
    setIsRecording(false)
    toast.success('Recording stopped')
  }

  const getPositionIcon = () => {
    if (feedback.includes('right')) return <ArrowDown className="rotate-90" size={20} />
    if (feedback.includes('left')) return <ArrowUp className="rotate-90" size={20} />
    if (feedback.includes('down')) return <ArrowDown size={20} />
    if (feedback.includes('up')) return <ArrowUp size={20} />
    if (feedback.includes('closer')) return <ArrowsIn size={20} />
    if (feedback.includes('back')) return <ArrowsOut size={20} />
    return <CheckCircle size={20} />
  }

  return (
    <div className="min-h-screen bg-[var(--charcoal)]">
      <div className="container mx-auto px-6 py-8 max-w-7xl">
        <div className="mb-6">
          <Button variant="ghost" onClick={onBack} className="text-white hover:bg-white/10">
            <ArrowLeft className="mr-2" />
            Back to Script
          </Button>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-4">
            <div className="relative rounded-lg overflow-hidden bg-black aspect-video">
              {cameraError ? (
                <div className="absolute inset-0 flex items-center justify-center text-white">
                  <Alert className="max-w-md">
                    <Warning size={20} />
                    <AlertDescription>{cameraError}</AlertDescription>
                  </Alert>
                </div>
              ) : (
                <>
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover"
                  />
                  <canvas
                    ref={canvasRef}
                    className="absolute inset-0 w-full h-full pointer-events-none"
                  />
                  
                  {isRecording && (
                    <div className="absolute top-4 right-4 flex items-center gap-2 bg-destructive text-destructive-foreground px-4 py-2 rounded-full font-mono text-sm animate-pulse">
                      <Circle size={12} weight="fill" />
                      RECORDING
                    </div>
                  )}

                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/70 backdrop-blur-sm text-white px-6 py-3 rounded-full flex items-center gap-3">
                    {getPositionIcon()}
                    <span className="text-sm font-medium">{feedback}</span>
                  </div>
                </>
              )}
            </div>

            <Card className="bg-card/50 backdrop-blur">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">Recording Controls</CardTitle>
                  <Badge variant={faceDetected ? 'default' : 'secondary'}>
                    {faceDetected ? 'Face Detected' : 'No Face'}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={handlePreviousScene}
                  disabled={currentSceneIndex === 0 || isRecording}
                >
                  Previous Scene
                </Button>
                
                {!isRecording ? (
                  <Button
                    onClick={handleStartRecording}
                    disabled={positionStatus !== 'perfect' || !faceDetected}
                    className="flex-1"
                  >
                    <Circle size={16} className="mr-2" weight="fill" />
                    Start Recording
                  </Button>
                ) : (
                  <Button
                    onClick={handleStopRecording}
                    variant="destructive"
                    className="flex-1"
                  >
                    Stop Recording
                  </Button>
                )}

                <Button
                  variant="outline"
                  onClick={handleNextScene}
                  disabled={currentSceneIndex === (project.script?.length || 0) - 1 || isRecording}
                >
                  Next Scene
                </Button>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <Badge variant="outline" className="font-mono">
                    Scene {currentSceneIndex + 1} of {project.script?.length}
                  </Badge>
                  {currentScene && (
                    <span className="text-sm text-muted-foreground font-mono">
                      {currentScene.duration}s
                    </span>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="text-xs font-mono text-muted-foreground uppercase tracking-wide mb-2">
                    Script
                  </div>
                  <p className="text-sm leading-relaxed">
                    {currentScene?.content}
                  </p>
                </div>
              </CardContent>
            </Card>

            {currentDirection && (
              <Card className="border-accent/50">
                <CardHeader>
                  <CardTitle className="text-base">Camera Directions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <div>
                    <div className="text-xs font-mono text-muted-foreground uppercase tracking-wide">
                      Camera Angle
                    </div>
                    <div className="font-medium mt-1">{currentDirection.cameraAngle}</div>
                  </div>
                  <div>
                    <div className="text-xs font-mono text-muted-foreground uppercase tracking-wide">
                      Shot Type
                    </div>
                    <div className="font-medium mt-1">{currentDirection.shotType}</div>
                  </div>
                  <div>
                    <div className="text-xs font-mono text-muted-foreground uppercase tracking-wide">
                      Positioning
                    </div>
                    <div className="font-medium mt-1">{currentDirection.positioning}</div>
                  </div>
                  <div>
                    <div className="text-xs font-mono text-muted-foreground uppercase tracking-wide">
                      Distance
                    </div>
                    <div className="font-medium mt-1">{currentDirection.distance}</div>
                  </div>
                  <div>
                    <div className="text-xs font-mono text-muted-foreground uppercase tracking-wide">
                      Notes
                    </div>
                    <div className="text-sm mt-1">{currentDirection.notes}</div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
