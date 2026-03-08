import { useRef, useEffect, useState, useMemo } from 'react'
import { VideoProject } from '@/types'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { ArrowLeft, Circle, Warning, CheckCircle, ArrowUp, ArrowDown, ArrowsOut, ArrowsIn, Download, Play, Trash } from '@phosphor-icons/react'
import { toast } from 'sonner'
import { FaceDetector, FilesetResolver, Detection } from '@mediapipe/tasks-vision'

interface CameraStudioProps {
  project: VideoProject
  onBack: () => void
}

type PositionStatus = 'perfect' | 'adjusting' | 'no-face'

const SHOT_TYPE_CONFIGS: Record<string, { min: number; max: number; ideal: number }> = {
  'extreme-close-up': { min: 0.65, max: 0.95, ideal: 0.8 },
  'close-up': { min: 0.4, max: 0.6, ideal: 0.5 },
  'medium-shot': { min: 0.2, max: 0.35, ideal: 0.25 },
  'wide-shot': { min: 0.08, max: 0.18, ideal: 0.12 },
  'default': { min: 0.2, max: 0.4, ideal: 0.25 }
}

export function CameraStudio({ project, onBack }: CameraStudioProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])

  const [stream, setStream] = useState<MediaStream | null>(null)
  const [currentSceneIndex, setCurrentSceneIndex] = useState(0)
  const [isRecording, setIsRecording] = useState(false)
  const [positionStatus, setPositionStatus] = useState<PositionStatus>('adjusting')
  const [feedback, setFeedback] = useState<string>('Initializing AI Director...')
  const [faceDetected, setFaceDetected] = useState(false)
  const [cameraError, setCameraError] = useState<string | null>(null)
  const [faceDetector, setFaceDetector] = useState<FaceDetector | null>(null)
  
  // Recording State
  const [recordedClips, setRecordedClips] = useState<Record<string, string>>({}) // sceneId -> blobUrl
  const [showPreview, setShowPreview] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)

  const currentScene = project.script?.[currentSceneIndex]
  const currentDirection = project.directions?.find(
    d => d.sceneId === `scene-${currentSceneIndex}`
  )

  const targetFraming = useMemo(() => {
    if (!currentDirection) return SHOT_TYPE_CONFIGS['default']
    const type = currentDirection.shotType.toLowerCase().replace(/ /g, '-')
    return SHOT_TYPE_CONFIGS[type] || SHOT_TYPE_CONFIGS['default']
  }, [currentDirection])

  useEffect(() => {
    const initDetector = async () => {
      try {
        const vision = await FilesetResolver.forVisionTasks(
          "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
        );
        const detector = await FaceDetector.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: `https://storage.googleapis.com/mediapipe-models/face_detector/blaze_face_short_range/float16/1/blaze_face_short_range.tflite`,
            delegate: "GPU"
          },
          runningMode: "VIDEO"
        });
        setFaceDetector(detector);
      } catch (error) {
        console.error("Failed to initialize Face Detector:", error);
        toast.error("Failed to load face detection model");
      }
    };

    initDetector();
    startCamera();

    return () => {
      stopCamera();
      // Cleanup URLs
      Object.values(recordedClips).forEach(url => URL.revokeObjectURL(url));
    }
  }, [])

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1920 },
          height: { ideal: 1080 },
          facingMode: 'user'
        },
        audio: true
      })
      
      setStream(mediaStream)
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream
      }
      toast.success('Production camera online')
    } catch (error) {
      console.error('Camera error:', error)
      setCameraError('Camera or microphone access denied.')
      toast.error('Production audio/video offline')
    }
  }

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop())
      setStream(null)
    }
  }

  useEffect(() => {
    let animationFrameId: number;
    const detect = async () => {
      if (!faceDetector || !videoRef.current || !canvasRef.current || videoRef.current.readyState !== 4) {
        animationFrameId = requestAnimationFrame(detect);
        return;
      }
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const startTimeMs = performance.now();
      const detections = faceDetector.detectForVideo(video, startTimeMs).detections;

      drawGuides(ctx, canvas.width, canvas.height);
      processDetections(detections, ctx, canvas.width, canvas.height);
      animationFrameId = requestAnimationFrame(detect);
    };

    if (faceDetector && stream) detect();
    return () => cancelAnimationFrame(animationFrameId);
  }, [faceDetector, stream, targetFraming]);

  const drawGuides = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    const centerX = width / 2;
    const centerY = height / 2;
    const idealSize = width * targetFraming.ideal;

    ctx.beginPath();
    ctx.moveTo(0, centerY); ctx.lineTo(width, centerY);
    ctx.moveTo(centerX, 0); ctx.lineTo(centerX, height);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.lineWidth = 1; ctx.stroke();

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.lineWidth = 2; ctx.setLineDash([15, 8]);
    ctx.strokeRect(centerX - idealSize / 2, centerY - idealSize / 2, idealSize, idealSize);
    ctx.setLineDash([]);
    
    ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.font = 'bold 14px JetBrains Mono';
    ctx.fillText(`TARGET: ${currentDirection?.shotType.toUpperCase() || 'DEFAULT'}`, centerX - idealSize/2, centerY - idealSize/2 - 15);
  };

  const processDetections = (detections: Detection[], ctx: CanvasRenderingContext2D, width: number, height: number) => {
    if (detections.length === 0) {
      setFaceDetected(false); setPositionStatus('no-face');
      setFeedback('Searching for subject...');
      return;
    }

    setFaceDetected(true);
    const detection = detections[0];
    const { originX, originY, width: faceWidth, height: faceHeight } = detection.boundingBox!;
    const faceCenterX = originX + faceWidth / 2;
    const faceCenterY = originY + faceHeight / 2;
    const centerX = width / 2;
    const centerY = height / 2;
    const currentSizeRatio = faceWidth / width;

    let currentFeedback = '';
    let status: PositionStatus = 'adjusting';

    const isCentered = Math.abs(faceCenterX - centerX) < 80 && Math.abs(faceCenterY - centerY) < 60;
    const isRightSize = currentSizeRatio >= targetFraming.min && currentSizeRatio <= targetFraming.max;

    if (isCentered && isRightSize) {
      status = 'perfect';
      currentFeedback = `LOCKED: ${currentDirection?.shotType || 'Standard'}`;
    } else {
      if (faceCenterX - centerX < -120) currentFeedback = 'Move right';
      else if (faceCenterX - centerX > 120) currentFeedback = 'Move left';
      else if (faceCenterY - centerY < -100) currentFeedback = 'Move down';
      else if (faceCenterY - centerY > 100) currentFeedback = 'Move up';
      else if (currentSizeRatio < targetFraming.min) currentFeedback = 'Move closer';
      else if (currentSizeRatio > targetFraming.max) currentFeedback = 'Move back';
      else currentFeedback = 'Frame subject';
    }

    setPositionStatus(status);
    setFeedback(currentFeedback);

    ctx.strokeStyle = status === 'perfect' ? '#22c55e' : '#f59e0b';
    ctx.lineWidth = 4;
    ctx.strokeRect(originX, originY, faceWidth, faceHeight);
  };

  const handleStartRecording = () => {
    if (!stream) return;
    
    chunksRef.current = [];
    const recorder = new MediaRecorder(stream, { mimeType: 'video/webm;codecs=vp9,opus' });
    
    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunksRef.current.push(e.data);
    };

    recorder.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: 'video/webm' });
      const url = URL.createObjectURL(blob);
      setRecordedClips(prev => ({ ...prev, [currentScene?.id || 'default']: url }));
      setPreviewUrl(url);
      setShowPreview(true);
    };

    mediaRecorderRef.current = recorder;
    recorder.start();
    setIsRecording(true);
    toast.success('Action!');
  };

  const handleStopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      toast.info('Cut!');
    }
  };

  const downloadClip = (sceneId: string) => {
    const url = recordedClips[sceneId];
    if (!url) return;
    const a = document.createElement('a');
    a.href = url;
    a.download = `take-scene-${currentSceneIndex + 1}.webm`;
    a.click();
    toast.success('Take exported successfully');
  };

  const clearClip = (sceneId: string) => {
    if (recordedClips[sceneId]) {
      URL.revokeObjectURL(recordedClips[sceneId]);
      setRecordedClips(prev => {
        const next = { ...prev };
        delete next[sceneId];
        return next;
      });
      toast.info('Take deleted');
    }
  };

  const getPositionIcon = () => {
    if (feedback.includes('right')) return <ArrowDown className="rotate-90" size={28} />
    if (feedback.includes('left')) return <ArrowUp className="rotate-90" size={28} />
    if (feedback.includes('down')) return <ArrowDown size={28} />
    if (feedback.includes('up')) return <ArrowUp size={28} />
    if (feedback.includes('closer')) return <ArrowsIn size={28} />
    if (feedback.includes('back')) return <ArrowsOut size={28} />
    if (positionStatus === 'perfect') return <CheckCircle size={32} className="text-green-500" />
    return <Circle size={28} />
  }

  return (
    <div className="min-h-screen bg-[#050506] text-white selection:bg-white/20">
      <div className="container mx-auto px-6 py-8 max-w-7xl">
        <header className="mb-8 flex items-center justify-between">
          <Button variant="ghost" onClick={onBack} className="text-white/60 hover:text-white hover:bg-white/5 h-12 px-6 rounded-xl">
            <ArrowLeft className="mr-3" size={20} />
            Exit Studio
          </Button>
          <div className="flex items-center gap-6">
             <div className="flex flex-col items-end">
                <span className="text-[10px] font-bold text-white/30 uppercase tracking-[0.2em] mb-1">Director.AI System</span>
                <Badge variant={faceDetector ? 'default' : 'destructive'} className="font-mono bg-white/5 border-white/10 text-white/80">
                  {faceDetector ? 'READY_FOR_PRODUCTION' : 'INITIALIZING_NEURAL_LINK...'}
                </Badge>
             </div>
          </div>
        </header>

        <div className="grid gap-10 lg:grid-cols-3">
          <main className="lg:col-span-2 space-y-8">
            <div className="relative rounded-3xl overflow-hidden bg-black aspect-video border border-white/5 shadow-[0_0_80px_rgba(0,0,0,0.8)]">
              {cameraError ? (
                <div className="absolute inset-0 flex items-center justify-center bg-zinc-900">
                  <div className="text-center space-y-6 p-8">
                    <Warning size={64} className="mx-auto text-red-500 opacity-50" />
                    <p className="text-2xl font-bold tracking-tight">{cameraError}</p>
                    <Button size="lg" onClick={() => window.location.reload()} className="bg-white text-black hover:bg-white/90 px-10">Retry Connection</Button>
                  </div>
                </div>
              ) : (
                <>
                  <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" style={{ transform: 'scaleX(-1)' }} />
                  <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none" style={{ transform: 'scaleX(-1)' }} />
                  
                  {isRecording && (
                    <div className="absolute top-8 right-8 flex items-center gap-4 bg-red-600 text-white px-6 py-3 rounded-2xl font-black text-sm animate-pulse shadow-2xl tracking-widest">
                      <div className="w-3 h-3 bg-white rounded-full animate-ping" />
                      RECORDING_TAKE
                    </div>
                  )}

                  <div className={`absolute bottom-10 left-1/2 -translate-x-1/2 transition-all duration-700 backdrop-blur-3xl px-12 py-6 rounded-[2.5rem] flex items-center gap-8 shadow-2xl border ${
                    positionStatus === 'perfect' ? 'bg-green-500/10 border-green-500/40' : 'bg-black/80 border-white/10'
                  }`}>
                    <div className={positionStatus === 'perfect' ? 'text-green-500 scale-110' : 'text-white/40'}>
                      {getPositionIcon()}
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[11px] font-black opacity-30 uppercase tracking-[0.3em] mb-1">Positioning</span>
                      <span className="text-2xl font-black tracking-tighter uppercase italic">{feedback}</span>
                    </div>
                  </div>
                </>
              )}
            </div>

            <Card className="bg-white/[0.02] border-white/5 backdrop-blur-3xl text-white rounded-[2rem] overflow-hidden">
              <CardHeader className="px-8 pt-8 pb-4">
                <div className="flex items-center justify-between">
                  <div className="flex flex-col">
                    <span className="text-[11px] font-black text-white/30 uppercase tracking-[0.3em] mb-1">Production Controls</span>
                    <CardTitle className="text-2xl font-black italic uppercase tracking-tighter">Command Unit</CardTitle>
                  </div>
                  {recordedClips[currentScene?.id || ''] && (
                    <div className="flex gap-2">
                       <Button variant="outline" size="sm" onClick={() => setShowPreview(true)} className="bg-green-500/10 border-green-500/30 text-green-400 hover:bg-green-500/20">
                          <Play className="mr-2" weight="fill" /> Review Take
                       </Button>
                       <Button variant="outline" size="sm" onClick={() => downloadClip(currentScene?.id || '')} className="bg-white/5 border-white/10 hover:bg-white/10">
                          <Download className="mr-2" weight="bold" /> Export
                       </Button>
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent className="px-8 pb-8 flex gap-6 pt-4">
                <Button variant="outline" onClick={() => setCurrentSceneIndex(Math.max(0, currentSceneIndex - 1))} disabled={currentSceneIndex === 0 || isRecording} className="bg-white/5 border-white/10 hover:bg-white/10 h-16 px-8 rounded-2xl">
                   Prev
                </Button>
                
                {!isRecording ? (
                  <Button onClick={handleStartRecording} disabled={positionStatus !== 'perfect' || !faceDetected} className="flex-1 bg-white text-black hover:bg-white/90 font-black text-xl h-16 rounded-2xl shadow-xl transition-all active:scale-[0.98]">
                    <Circle size={24} className="mr-4" weight="fill" />
                    ACTION
                  </Button>
                ) : (
                  <Button onClick={handleStopRecording} variant="destructive" className="flex-1 font-black text-xl h-16 rounded-2xl animate-pulse">
                    STOP_RECORDING
                  </Button>
                )}

                <Button variant="outline" onClick={() => setCurrentSceneIndex(Math.min((project.script?.length || 1) - 1, currentSceneIndex + 1))} disabled={currentSceneIndex === (project.script?.length || 1) - 1 || isRecording} className="bg-white/5 border-white/10 hover:bg-white/10 h-16 px-8 rounded-2xl">
                   Next
                </Button>
              </CardContent>
            </Card>
          </main>

          <aside className="space-y-8">
            <Card className="bg-white/[0.02] border-white/5 backdrop-blur-3xl text-white rounded-[2rem] border-t border-t-white/10">
              <CardHeader className="px-8 pt-8 pb-4">
                <div className="flex items-center justify-between mb-4">
                  <div className="bg-white/10 px-4 py-1.5 rounded-xl font-black text-[11px] text-white/80 border border-white/10 uppercase tracking-widest">
                    Scene_{currentSceneIndex + 1}
                  </div>
                  <span className="text-[12px] text-white/30 font-bold uppercase tracking-widest">
                    {currentScene?.duration}s Est.
                  </span>
                </div>
                <div className="text-[11px] font-black text-white/30 uppercase tracking-[0.3em] mb-4">Live Script</div>
              </CardHeader>
              <CardContent className="px-8 pb-8 pt-0">
                <p className="text-2xl leading-[1.4] font-bold italic opacity-95 tracking-tight">
                  "{currentScene?.content}"
                </p>
              </CardContent>
            </Card>

            {currentDirection && (
              <Card className="bg-white/[0.02] border-white/10 backdrop-blur-3xl text-white rounded-[2rem] border-l-8 border-l-white/20">
                <CardHeader className="px-8 pt-8">
                  <CardTitle className="text-lg font-black uppercase tracking-[0.3em] text-white/40">Direction.Sheet</CardTitle>
                </CardHeader>
                <CardContent className="px-8 pb-8 space-y-8">
                  <div className="grid grid-cols-2 gap-8">
                    <div className="space-y-1">
                      <div className="text-[11px] font-black text-white/30 uppercase tracking-widest">Angle</div>
                      <div className="font-bold text-lg">{currentDirection.cameraAngle}</div>
                    </div>
                    <div className="space-y-1">
                      <div className="text-[11px] font-black text-white/30 uppercase tracking-widest">Framing</div>
                      <div className="font-bold text-lg text-white/90">{currentDirection.shotType}</div>
                    </div>
                  </div>
                  <div className="pt-6 border-t border-white/5">
                    <div className="text-[11px] font-black text-white/30 uppercase tracking-widest mb-4">Director Notes</div>
                    <div className="text-sm leading-relaxed opacity-60 bg-white/[0.03] p-6 rounded-2xl border border-white/5 italic">
                      {currentDirection.notes}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </aside>
        </div>
      </div>

      {/* Preview Dialog */}
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="bg-zinc-950 border-white/10 text-white max-w-4xl rounded-[2rem]">
          <DialogHeader>
            <DialogTitle className="text-xl font-black uppercase tracking-tighter italic">Review Take - Scene {currentSceneIndex + 1}</DialogTitle>
          </DialogHeader>
          <div className="aspect-video rounded-2xl overflow-hidden bg-black border border-white/5 my-4">
            {previewUrl && <video src={previewUrl} controls autoPlay className="w-full h-full" />}
          </div>
          <DialogFooter className="flex gap-4 justify-between sm:justify-between">
            <Button variant="destructive" onClick={() => { clearClip(currentScene?.id || ''); setShowPreview(false); }} className="rounded-xl px-8 font-bold">
               <Trash className="mr-2" weight="bold" /> Delete Take
            </Button>
            <div className="flex gap-4">
               <Button variant="outline" onClick={() => setShowPreview(false)} className="rounded-xl px-8 border-white/10 hover:bg-white/5">
                  Keep
               </Button>
               <Button onClick={() => downloadClip(currentScene?.id || '')} className="bg-white text-black hover:bg-white/90 rounded-xl px-8 font-black">
                  <Download className="mr-2" weight="bold" /> Export Take
               </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
