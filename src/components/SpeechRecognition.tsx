"use client";

import React, { useState, useRef, useEffect } from "react";
import { useTTS } from "@/hooks/useTTS";
import axios from 'axios';
import { GoogleGenerativeAI } from "@google/generative-ai";
const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY);

// Utility function to get AudioContext constructor
function getAudioContext(): AudioContext {
  try {
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    return new AudioContext();
  } catch (e) {
    throw new Error('Web Audio API is not supported in this browser');
  }
}

// Function to play audio from buffer
async function playAudioBuffer(audioContext: AudioContext, audioBuffer: AudioBuffer) {
  const source = audioContext.createBufferSource();
  source.buffer = audioBuffer;
  source.connect(audioContext.destination);
  source.start();
}
import { Mic, MicOff, Volume2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";

declare global {
  interface Window {
    SpeechRecognition: new () => SpeechRecognitionInstance;
    webkitSpeechRecognition: new () => SpeechRecognitionInstance;
  }
}

interface SpeechRecognitionResultList {
  length: number;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionResult {
  [index: number]: SpeechRecognitionAlternative;
  length: number;
  isFinal: boolean;
}

interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}

interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
  resultIndex: number;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
}

type SpeechRecognitionInstance = {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: (event: SpeechRecognitionEvent) => void;
  onend: () => void;
  onerror: (event: SpeechRecognitionErrorEvent) => void;
  start: () => void;
  stop: () => void;
};

export default function SpeechRecognitionComponent() {
  const { stopTTS } = useTTS();
  const [isRecording, setIsRecording] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [conversation, setConversation] = useState<{ role: 'user' | 'assistant', content: string }[]>([]);
  const [videoStream, setVideoStream] = useState<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Request camera access and start video stream
  const startVideo = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      setVideoStream(stream);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error('Error accessing camera:', err);
      toast({
        title: "Camera Error",
        description: "Unable to access camera. Please check permissions.",
        variant: "destructive",
      });
    }
  };

  // Clean up video stream on component unmount
  useEffect(() => {
    return () => {
      if (videoStream) {
        videoStream.getTracks().forEach(track => track.stop());
      }
    };
  }, [videoStream]);
  const [isProcessing, setIsProcessing] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);
  const speechRecognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const recognitionTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    let recognition: SpeechRecognitionInstance | null = null;

    if (typeof window !== 'undefined') {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (!SpeechRecognition) {
        toast({
          title: "Error",
          description: "Speech recognition is not supported in your browser",
          variant: "destructive",
        });
        return;
      }

      try {
        recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'en-US';
        speechRecognitionRef.current = recognition;

        if (speechRecognitionRef.current) {
          speechRecognitionRef.current.onresult = handleResult;
          speechRecognitionRef.current.onend = handleEnd;
          speechRecognitionRef.current.onerror = handleError;
        }
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to initialize speech recognition",
          variant: "destructive",
        });
        console.error('Speech recognition initialization error:', error);
      }
    }

    return () => {
      if (recognition) {
        try {
          recognition.stop();
        } catch (error) {
          console.error('Error stopping recognition:', error);
        }
      }
    };
  }, []);

  const handleResult = (event: SpeechRecognitionEvent) => {
    let interimTranscript = '';
    let finalTranscript = '';
  
    for (let i = event.resultIndex; i < event.results.length; ++i) {
      const transcript = event.results[i][0].transcript;
  
      if (event.results[i].isFinal) {
        finalTranscript += transcript;
      } else {
        interimTranscript += transcript;
      }
    }
  
    if (interimTranscript) {
      setConversation(prev => {
        const updated = [...prev];
        if (updated.length > 0 && updated[updated.length - 1].role === 'user') {
          updated[updated.length - 1].content = interimTranscript;
        } else {
          updated.push({ role: 'user', content: interimTranscript });
        }
        return updated;
      });
    }
  console.log(finalTranscript,"finalTranscript")
    if (finalTranscript) {
      setConversation(prev => {
        const updated = [...prev];
        // Replace interim with final if it exists
        if (updated.length > 0 && updated[updated.length - 1].role === 'user') {
          updated[updated.length - 1].content = finalTranscript;
        } else {
          updated.push({ role: 'user', content: finalTranscript });
        }
        
        // Process the final transcript
        processUserInput(finalTranscript);
        return updated;
      });
    }
  };
  
  const handleEnd = () => {
    if (isRecording) {
      startRecording();
    }
  };

  const processUserInput = async (transcript: string) => {
    console.log('Processing with Gemini:', transcript);
    setIsProcessing(true);
  
    try {
      const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
  
      const result = await model.generateContent(transcript);
      const response = await result.response;
      const assistantText = response.text();
  
      console.log("Gemini Response:", assistantText);
  
      // Update the UI
      setConversation(prev => [...prev, { role: 'assistant', content: assistantText }]);
      speakText(assistantText);

    } catch (error) {
      console.error("Gemini Error:", error);
      toast({
        title: "Error",
        description: "Gemini failed to generate a response.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const speakText = (text: string) => {
    const synth = window.speechSynthesis;
    const voiceReady = () =>
      new Promise<void>((resolve) => {
        if (synth.getVoices().length > 0) return resolve();
        synth.onvoiceschanged = () => resolve();
      });

    const chunkText = (text: string): string[] => {
      return text.match(/[^.!?]+[.!?]*/g) || [text]; // split into sentences
    };

    const speakChunk = (chunk: string): Promise<void> =>
      new Promise((resolve) => {
        // Pause speech recognition while speaking
        if (speechRecognitionRef.current) {
          speechRecognitionRef.current.stop();
        }

        const utterance = new SpeechSynthesisUtterance(chunk.trim());
        const voices = synth.getVoices();
        utterance.voice = voices.find((v) => v.lang === "en-US" && v.name.includes("Google")) || voices[0];
        utterance.rate = 1;
        utterance.pitch = 1;
        utterance.volume = 1;

        // Restart speech recognition when speech ends
        utterance.onend = () => {
          if (speechRecognitionRef.current) {
            speechRecognitionRef.current.start();
          }
          resolve();
        };

        utterance.onerror = (e) => {
          console.error("Speech error:", e.error);
          if (speechRecognitionRef.current) {
            speechRecognitionRef.current.start();
          }
          resolve(); // continue on error
        };

        synth.speak(utterance);
      });

  (async () => {
    await voiceReady();
    synth.cancel(); // clear any pending speech
    const chunks = chunkText(text);
    for (let chunk of chunks) {
      await speakChunk(chunk);
    }
  })();
  };
  
  

  const handleError = (event: SpeechRecognitionErrorEvent) => {
    console.error('Speech recognition error:', event.error);
    const errorMessages = {
      'no-speech': 'No speech was detected. Try speaking into the microphone.',
      'audio-capture': 'No microphone was found. Make sure a microphone is connected.',
      'not-allowed': 'Permission to use microphone is denied.',
      'aborted': 'Speech recognition was aborted.',
      'network': 'Network error occurred.',
      'bad-grammar': 'Recognition grammar was not acceptable.',
      'language-not-supported': 'Selected language is not supported.',
      'service-not-allowed': 'Speech recognition service is not allowed.',
      'not-supported': 'Speech recognition is not supported in your browser.',
      'generic': 'An error occurred with speech recognition.'
    };
    
    const message = errorMessages[event.error as keyof typeof errorMessages] || errorMessages.generic;
    toast({
      title: "Error",
      description: message,
      variant: "destructive",
    });
  };

  const startRecording = () => {
    if (!speechRecognitionRef.current) {
      toast({
        title: "Error",
        description: "Speech recognition is not initialized",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsRecording(true);
      
      // Clear any existing timeouts
      if (recognitionTimeoutRef.current) {
        clearTimeout(recognitionTimeoutRef.current);
      }

      // Start video if not already started
      if (!videoStream) {
        startVideo();
      }

      // Set up continuous listening with error handling
      const continuousListening = () => {
        if (speechRecognitionRef.current) {
          speechRecognitionRef.current.onend = () => {
            // Restart recognition immediately when it ends
            if (isRecording) {
              speechRecognitionRef.current.start();
            }
          };

          // Handle errors by restarting
          speechRecognitionRef.current.onerror = (event) => {
            console.error('Speech recognition error:', event.error);
            if (event.error === 'no-speech' && isRecording) {
              // Try to restart after a short delay
              setTimeout(() => {
                if (speechRecognitionRef.current) {
                  speechRecognitionRef.current.start();
                }
              }, 1000);
            }
          };

          // Stop any ongoing TTS before starting recognition
          stopTTS();
          
          // Start recognition
          speechRecognitionRef.current.start();
        }
      };

      continuousListening();

      // Set up a safety timeout for 59 minutes (just under 1 hour)
      recognitionTimeoutRef.current = setTimeout(() => {
        if (speechRecognitionRef.current && isRecording) {
          // Stop and restart to prevent potential memory leaks
          speechRecognitionRef.current.stop();
          setTimeout(() => {
            startRecording(); // Restart the process
          }, 1000);
        }
      }, 59 * 60 * 1000); // 59 minutes

      toast({
        title: "Recording Started",
        description: "Continuous listening and video enabled...",
      });

    } catch (err) {
      console.error("Recording error:", err);
      toast({
        title: "Microphone Error",
        description: "Check microphone access permissions.",
        variant: "destructive",
      });
    }
  };

  const stopRecording = () => {
    setIsRecording(false);
    if (speechRecognitionRef.current) {
      speechRecognitionRef.current.stop();
    }
    if (recognitionTimeoutRef.current) {
      clearTimeout(recognitionTimeoutRef.current);
    }
  };

  const addMessage = (text: string, role: 'user' | 'assistant') => {
    setConversation(prev => [...prev, { role, content: text }as any]);
  };

  const handleRecognizedText = (text: string) => {
    addMessage(text, 'user');
  };

  return (
    <div className="flex flex-col min-h-screen">
    {/* 🔵 Top Bar */}
    <div className="bg-purple-700 text-white text-lg font-semibold px-6 py-4 shadow-md">
      PrepWise
    </div>

    {/* Main Layout */}
    <div className="flex flex-col md:flex-row flex-1 bg-white">
      {/* 🤖 Bot Section */}
      <div className="w-full md:w-1/2 flex flex-col items-center justify-center bg-purple-100 p-8 relative">
        {/* Bot Icon */}
        <div className="w-64 h-64 bg-white rounded-full shadow-xl flex items-center justify-center relative">
        <img src="/aiavatar.png" alt="AI Avatar" className="w-full h-full object-contain mt-8" />
        </div>

        {/* Speak Button */}
        <div className="mt-6">
          <Button  onClick={startRecording} className="text-lg px-6 py-2">🎙️ Speak</Button>
        </div>

        {/* Recording Video Box */}
        {/* <div className="absolute top-4 right-4">
          <div className="w-32 h-40 bg-black rounded-xl overflow-hidden shadow-lg relative">
            <video
              ref={videoRef}
              autoPlay
              muted
              className="w-full h-full object-cover"
              playsInline
            />
            <div className="absolute bottom-0 w-full text-xs text-white text-center bg-red-600 py-1">● Recording Video</div>
          </div>
        </div> */}
      </div>

      {/* 💬 Chat Section */}
      <div className="w-full md:w-1/2 h-full overflow-y-auto px-6 py-8 space-y-4 relative">
        {conversation.map((msg, index) => (
          <div key={index} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
            <div
              className={`max-w-[80%] rounded-xl px-4 py-3 shadow-md text-sm whitespace-pre-wrap ${
                msg.role === "user"
                  ? "bg-gray-100 text-gray-800"
                  : "bg-purple-100 text-purple-800"
              }`}
            >
              <p>{msg.content}</p>
            </div>
          </div>
        ))}

        {/* End Message Note */}
        <div className="text-center text-xs text-gray-500 pt-4 border-t border-gray-200 mt-6">
          Click this button only if you have completed the interview.<br />
          Once clicked, the interview will end and cannot be resumed.
        </div>
      </div>
    </div>
  </div>
  );
};


