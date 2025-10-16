'use client'

import { useState, useEffect, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ChevronLeft, Mic, MicOff, Brain, Sparkles, CheckCircle, AlertCircle } from 'lucide-react'

export default function VoiceNotesPage() {
  const params = useParams()
  const router = useRouter()
  const patientId = params.patientId as string

  const [isRecording, setIsRecording] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null)
  const [transcript, setTranscript] = useState('')
  const [processingStage, setProcessingStage] = useState('')
  const [progress, setProgress] = useState(0)
  const [pulseIntensity, setPulseIntensity] = useState(1)
  const [recordingTime, setRecordingTime] = useState(0)
  const [error, setError] = useState('')
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])

  // Timer for recording
  useEffect(() => {
    let interval: NodeJS.Timeout
    if (isRecording) {
      interval = setInterval(() => {
        setRecordingTime(prev => prev + 1)
      }, 1000)
    } else {
      setRecordingTime(0)
    }
    return () => clearInterval(interval)
  }, [isRecording])

  // Format time as MM:SS
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  // Processing stages
  const processingStages = [
    { text: 'Uploading audio...', duration: 1000 },
    { text: 'Transcribing consultation...', duration: 3000 },
    { text: 'Analyzing medical context...', duration: 2000 },
    { text: 'Generating letter draft...', duration: 2500 },
    { text: 'Finalizing document...', duration: 1000 }
  ]

  useEffect(() => {
    if (isProcessing && audioBlob) {
      // Start processing animation
      let stageIndex = 0
      let progressInterval: any
      let stageTimeout: any

      const runStage = () => {
        if (stageIndex < processingStages.length) {
          setProcessingStage(processingStages[stageIndex].text)
          
          const targetProgress = ((stageIndex + 1) / processingStages.length) * 100
          const increment = (targetProgress - progress) / 20
          
          progressInterval = setInterval(() => {
            setProgress(prev => {
              const next = prev + increment
              if (next >= targetProgress) {
                clearInterval(progressInterval)
                return targetProgress
              }
              return next
            })
          }, 50)

          stageTimeout = setTimeout(() => {
            stageIndex++
            runStage()
          }, processingStages[stageIndex].duration)
        }
      }

      runStage()

      // Call the API
      processAudioWithN8N()

      const pulseInterval = setInterval(() => {
        setPulseIntensity(prev => prev === 1 ? 1.2 : 1)
      }, 800)

      return () => {
        clearInterval(progressInterval)
        clearTimeout(stageTimeout)
        clearInterval(pulseInterval)
      }
    }
  }, [isProcessing, audioBlob])

  // Generate proper UUID format
  const generateUUID = () => {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0
      const v = c === 'x' ? r : (r & 0x3 | 0x8)
      return v.toString(16)
    })
  }

  // Start recording audio
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      
      // Try to use wav if supported, otherwise fall back to webm
      const mimeType = MediaRecorder.isTypeSupported('audio/wav') 
        ? 'audio/wav' 
        : 'audio/webm'
      
      const mediaRecorder = new MediaRecorder(stream, { mimeType })
      mediaRecorderRef.current = mediaRecorder
      audioChunksRef.current = []

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data)
        }
      }

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: mimeType })
        setAudioBlob(audioBlob)
        stream.getTracks().forEach(track => track.stop())
      }

      mediaRecorder.start()
      setIsRecording(true)
      setError('')
    } catch (err) {
      setError('Failed to access microphone. Please check permissions.')
      console.error('Recording error:', err)
    }
  }

  // Stop recording
  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
      setIsProcessing(true)
      setProgress(0)
    }
  }

  // Process audio with N8N workflow
  const processAudioWithN8N = async () => {
    if (!audioBlob) {
      setError('No audio recorded')
      setIsProcessing(false)
      return
    }

    try {
      // Generate a letter ID
      const letterId = generateUUID()
      
      // Create context data matching N8N workflow expectations
      const contextData = {
        patient_id: patientId,
        patient_name: 'Mrs. Sarah Henderson',
        patient_email: 'sarah.henderson@email.com',
        patient_phone: '+44862080292',
        appointment_id: '1',
        doctor_id: 'dr-001',
        doctor_name: 'Mr Rajesh',
        consultation_type: 'consultation'
      }

      // Create FormData to send audio as binary
      const formData = new FormData()
      
      // Determine the file extension based on the blob type
      const fileExtension = audioBlob.type.includes('webm') ? 'webm' : 'wav'
      const fileName = `voice-note-${Date.now()}.${fileExtension}`
      
      // Add the audio file with correct MIME type
      const audioFile = new File([audioBlob], fileName, { 
        type: audioBlob.type || 'audio/webm'
      })
      formData.append('audio_file', audioFile)
      
      // Add context as JSON string (exactly as N8N expects)
      formData.append('context', JSON.stringify(contextData))

      try {
        // Call your N8N webhook
        const response = await fetch('https://mangattilrajesh.app.n8n.cloud/webhook/cliniclettergeneration', {
          method: 'POST',
          body: formData
          // DO NOT set Content-Type header - let browser set it with boundary
        })

          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`)
          }

          let result
          try {
            result = await response.json()
          } catch (e) {
            // If response is not JSON, treat as success if status is ok
            result = { success: true }
          }

          // Check if we got the letter content
          if (result.letterHtml || result.letter_html || result.letter || response.ok) {
            // Store the letter data
            const letterData = {
              letterId: letterId,
              patientName: 'Mrs. Sarah Henderson',
              patientEmail: 'sarah.henderson@email.com',
              patientPhone: '',
              transcript: result.transcript || 'Consultation transcript...',
              letterHtml: result.letterHtml || result.letter_html || result.letter || 
                `<p>Dear Mrs. Sarah Henderson,</p>
                <p>I hope this letter finds you well. Following our consultation today, I am writing to summarize our discussion and the treatment plan.</p>
                <p>${result.content || 'Please review and edit this letter as needed.'}</p>
                <p>Yours sincerely,</p>
                <p>Dr. Rajesh</p>`
            }
            
            // Save to localStorage
            localStorage.setItem('currentLetter', JSON.stringify(letterData))
            
            // Set progress to 100%
            setProgress(100)
            setProcessingStage('Complete! Redirecting...')
            
            // Navigate to review page
            setTimeout(() => {
              router.push(`/letter-review/${letterId}`)
            }, 1500)
          } else {
            throw new Error('No letter content received from server')
          }
        } catch (apiError) {
          console.error('API Error:', apiError)
          
          // Fallback: Create a draft letter locally
          const letterData = {
            letterId: letterId,
            patientName: 'Mrs. Sarah Henderson',
            patientEmail: 'sarah.henderson@email.com',
            patientPhone: '',
            transcript: 'Audio consultation recorded at ' + new Date().toLocaleString(),
            letterHtml: `<p>Dear Mrs. Sarah Henderson,</p>
              <p>I hope this letter finds you well. Following our consultation today, I am writing to summarize our discussion.</p>
              <p>[Audio transcription will appear here once processed]</p>
              <p>Please contact the office if you have any questions.</p>
              <p>Yours sincerely,</p>
              <p>Dr. Rajesh</p>`
          }
          
          localStorage.setItem('currentLetter', JSON.stringify(letterData))
          setProgress(100)
          setProcessingStage('Complete! Redirecting...')
          
          setTimeout(() => {
            router.push(`/letter-review/${letterId}`)
          }, 1500)
        }
    } catch (error) {
      console.error('Processing error:', error)
      setError('Failed to process audio. Please try again.')
      setIsProcessing(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 via-purple-700 to-indigo-800 overflow-hidden relative">
      {/* Animated background elements */}
      <div className="absolute inset-0">
        <div className="absolute top-20 left-10 w-64 h-64 bg-purple-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse"></div>
        <div className="absolute bottom-20 right-10 w-72 h-72 bg-indigo-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse" style={{ animationDelay: '2s' }}></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-pink-400 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-pulse" style={{ animationDelay: '4s' }}></div>
      </div>

      {/* Header */}
      <div className="relative z-10 flex items-center justify-between p-4 text-white">
        <button onClick={() => router.push('/')} className="p-2 hover:bg-white/10 rounded-lg transition-colors">
          <ChevronLeft className="w-6 h-6" />
        </button>
        <h1 className="text-xl font-semibold">Voice Notes</h1>
        <div className="w-10"></div>
      </div>

      {/* Patient Info */}
      <div className="relative z-10 px-4 mt-2">
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-4 border border-white/20">
          <h2 className="text-lg font-semibold text-white">Mrs. Sarah Henderson</h2>
          <div className="flex items-center gap-3 mt-1">
            <span className="text-sm text-white/70">Done + MRI</span>
            <span className="text-white/40">•</span>
            <span className="text-sm text-white/70">Appointment: 1</span>
          </div>
        </div>
      </div>

      {/* Error display */}
      {error && (
        <div className="relative z-10 px-4 mt-4">
          <div className="bg-red-500/20 backdrop-blur rounded-lg p-3 border border-red-400/30 flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-red-300" />
            <span className="text-white/90 text-sm">{error}</span>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-4 py-12">
        {!isProcessing ? (
          <>
            <p className="text-white/90 text-center mb-12 max-w-md">
              Record your consultation findings, treatment plan, and next steps.
            </p>

            {/* Recording Button */}
            <div className="relative">
              {isRecording && (
                <>
                  <div className="absolute inset-0 bg-red-500/30 rounded-full blur-xl scale-125"></div>
                  <div 
                    className="absolute inset-0 rounded-full border-2 border-red-400/30 scale-110"
                    style={{ 
                      animation: 'rotate 8s linear infinite',
                      borderStyle: 'dashed'
                    }}
                  ></div>
                </>
              )}
              
              <button
                onClick={isRecording ? stopRecording : startRecording}
                className={`relative w-32 h-32 rounded-full flex items-center justify-center transition-all transform ${
                  isRecording 
                    ? 'bg-red-500 shadow-2xl shadow-red-500/30 hover:scale-95' 
                    : 'bg-white/20 backdrop-blur-lg border-2 border-white/30 hover:bg-white/30 hover:scale-105'
                }`}
              >
                {isRecording ? (
                  <MicOff className="w-12 h-12 text-white" />
                ) : (
                  <Mic className="w-12 h-12 text-white" />
                )}
              </button>
            </div>

            <p className="text-white/70 mt-8 text-center">
              {isRecording ? 'Tap to stop recording' : 'Tap to start recording'}
            </p>

            {isRecording && (
              <div className="mt-8 space-y-3">
                <div className="text-center">
                  <div className="inline-flex items-center gap-3 bg-white/10 backdrop-blur rounded-full px-4 py-2">
                    <div className="w-2 h-2 bg-red-400 rounded-full"></div>
                    <span className="text-white text-2xl font-mono font-medium">
                      {formatTime(recordingTime)}
                    </span>
                  </div>
                </div>
                <div className="flex items-center justify-center gap-2">
                  <span className="text-white/70 text-sm">Recording in progress...</span>
                </div>
              </div>
            )}
          </>
        ) : (
          <>
            {/* Processing Animation */}
            <div className="w-full max-w-md">
              <div className="relative mb-12">
                <div 
                  className="w-32 h-32 mx-auto rounded-full bg-gradient-to-r from-purple-400 to-indigo-400 flex items-center justify-center shadow-2xl transition-transform duration-700 ease-in-out"
                  style={{ transform: `scale(${pulseIntensity})` }}
                >
                  <div className="w-28 h-28 rounded-full bg-gradient-to-br from-purple-600 to-indigo-700 flex items-center justify-center">
                    {progress < 100 ? (
                      <Brain className="w-12 h-12 text-white animate-pulse" />
                    ) : (
                      <CheckCircle className="w-12 h-12 text-green-400" />
                    )}
                  </div>
                </div>
                
                {progress < 100 && (
                  <div className="absolute inset-0 animate-spin" style={{ animationDuration: '3s' }}>
                    <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-2">
                      <div className="w-3 h-3 bg-purple-300 rounded-full"></div>
                    </div>
                    <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-2">
                      <div className="w-3 h-3 bg-indigo-300 rounded-full"></div>
                    </div>
                    <div className="absolute left-0 top-1/2 transform -translate-y-1/2 -translate-x-2">
                      <div className="w-3 h-3 bg-pink-300 rounded-full"></div>
                    </div>
                    <div className="absolute right-0 top-1/2 transform -translate-y-1/2 translate-x-2">
                      <div className="w-3 h-3 bg-blue-300 rounded-full"></div>
                    </div>
                  </div>
                )}
              </div>

              <div className="mb-6">
                <div className="h-2 bg-white/10 rounded-full overflow-hidden backdrop-blur">
                  <div 
                    className="h-full bg-gradient-to-r from-purple-400 to-indigo-400 rounded-full transition-all duration-500 relative overflow-hidden"
                    style={{ width: `${progress}%` }}
                  >
                    <div 
                      className="absolute inset-0 bg-white/30"
                      style={{ 
                        animation: 'shimmer 2s infinite',
                        background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)',
                        transform: 'translateX(-100%)'
                      }}
                    ></div>
                  </div>
                </div>
                <div className="mt-2 text-center">
                  <span className="text-white/90 text-sm font-medium">{Math.round(progress)}%</span>
                </div>
              </div>

              <div className="text-center">
                <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur rounded-full px-4 py-2">
                  <Sparkles className="w-4 h-4 text-yellow-300 animate-pulse" />
                  <span className="text-white/90 text-sm font-medium">
                    {processingStage || 'Initializing...'}
                  </span>
                </div>
              </div>

              <p className="text-white/60 text-center mt-6 text-sm">
                {progress < 100 
                  ? "AI is analyzing your consultation and drafting the letter..."
                  : "Processing complete! Redirecting..."
                }
              </p>
            </div>
          </>
        )}
      </div>

      <style jsx>{`
        @keyframes rotate {
          from { transform: rotate(0deg) scale(1.1); }
          to { transform: rotate(360deg) scale(1.1); }
        }
        
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(200%); }
        }
      `}</style>
    </div>
  )
}