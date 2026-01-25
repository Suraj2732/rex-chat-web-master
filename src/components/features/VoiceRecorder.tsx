'use client';

import { useState, useRef, useEffect } from 'react';
import { Mic, X, Send, Pause, Play } from 'lucide-react';

interface VoiceRecorderProps {
  onSend: (audioBlob: Blob, duration: number) => void;
  onCancel: () => void;
}

export default function VoiceRecorder({ onSend, onCancel }: VoiceRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(0);
  const pausedTimeRef = useRef<number>(0);


  useEffect(() => {
    startRecording();
    return () => {
      stopRecording();
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm',
      });

      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        setAudioBlob(audioBlob);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      startTimeRef.current = Date.now();
      startTimer();
    } catch (error) {
      console.error('Error accessing microphone:', error);
      onCancel();
    }
  };

  const startTimer = () => {
    timerRef.current = setInterval(() => {
      const elapsed = Date.now() - startTimeRef.current - pausedTimeRef.current;
      setRecordingTime(Math.floor(elapsed / 1000));
    }, 100);
  };

  const pauseRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.pause();
      setIsPaused(true);
      if (timerRef.current) clearInterval(timerRef.current);
      pausedTimeRef.current = Date.now() - startTimeRef.current;
    }
  };

  const resumeRecording = () => {
    if (mediaRecorderRef.current && isPaused) {
      mediaRecorderRef.current.resume();
      setIsPaused(false);
      startTimeRef.current = Date.now() - pausedTimeRef.current;
      startTimer();
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) clearInterval(timerRef.current);
    }
  };

  const handleSend = () => {
    if (audioBlob) {
      onSend(audioBlob, recordingTime);
    } else {
      stopRecording();
      setTimeout(() => {
        if (audioChunksRef.current.length > 0) {
          const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
          onSend(blob, recordingTime);
        }
      }, 100);
    }
  };

  const handleCancel = () => {
    stopRecording();
    onCancel();
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex items-center space-x-3 bg-[#202c33] px-4 py-3 rounded-lg">
      <button
        onClick={handleCancel}
        className="p-2 hover:bg-gray-700 rounded-full transition-colors"
      >
        <X className="w-6 h-6 text-red-500" />
      </button>

      <div className="flex items-center space-x-3 flex-1">
        <div className="relative">
          <Mic className={`w-6 h-6 ${isRecording && !isPaused ? 'text-red-500 animate-pulse' : 'text-gray-400'}`} />
        </div>

        <div className="flex-1">
          <div className="flex items-center space-x-2">
            <div className="flex-1 h-1 bg-gray-600 rounded-full overflow-hidden">
              <div
                className="h-full bg-green-500 transition-all duration-300"
                style={{ width: `${Math.min((recordingTime / 60) * 100, 100)}%` }}
              />
            </div>
          </div>
          <p className="text-sm text-gray-400 mt-1">{formatTime(recordingTime)}</p>
        </div>

        {isRecording && (
          <button
            onClick={isPaused ? resumeRecording : pauseRecording}
            className="p-2 hover:bg-gray-700 rounded-full transition-colors"
          >
            {isPaused ? (
              <Play className="w-5 h-5 text-white" />
            ) : (
              <Pause className="w-5 h-5 text-white" />
            )}
          </button>
        )}
      </div>

      <button
        onClick={handleSend}
        className="p-2 bg-[#0f3d2e] text-white rounded-full hover:bg-green-700 transition-colors"
      >
        <Send className="w-6 h-6" />
      </button>
    </div>
  );
}