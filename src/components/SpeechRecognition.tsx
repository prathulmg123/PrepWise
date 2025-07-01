"use client";

import React, { useState, useRef, useEffect } from "react";
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
  const [isRecording, setIsRecording] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [conversation, setConversation] = useState<{ role: 'user' | 'assistant', content: string }[]>([]);
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
  
      // Play the response using TTS
      try {
        const audioContext = getAudioContext();
        const response = await fetch(`${import.meta.env.VITE_TTS_SERVER_URL}/speak`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ text: assistantText }),
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error('TTS request failed: ' + errorText);
        }

        // Handle the audio file response
        const blob = await response.blob();
        const audioBuffer = await audioContext.decodeAudioData(await blob.arrayBuffer());
        await playAudioBuffer(audioContext, audioBuffer);
      } catch (ttsError) {
        console.error('TTS Error:', ttsError);
        toast({
          title: "Error",
          description: "Failed to play audio response: " + (ttsError instanceof Error ? ttsError.message : String(ttsError)),
          variant: "destructive",
        });
      }

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
    if (!speechRecognitionRef.current) return;

    try {
      setIsRecording(true);
      
      if (recognitionTimeoutRef.current) {
        clearTimeout(recognitionTimeoutRef.current);
      }
      recognitionTimeoutRef.current = setTimeout(() => {
        if (speechRecognitionRef.current) {
          speechRecognitionRef.current.stop();
          speechRecognitionRef.current.start();
        }
      }, 60000);

      speechRecognitionRef.current.start();
      
      toast({
        title: "Recording Started",
        description: "Listening with Web Speech API...",
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
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 p-4">
      <div className="max-w-4xl w-full bg-gray-800/50 backdrop-blur-lg rounded-2xl border border-gray-700 shadow-lg p-6 space-y-6">
        <div className="flex flex-col space-y-2">
          <Button
            onClick={startRecording}
            disabled={isRecording || isLoading}
            className="w-full h-12"
          >
            <Mic className="h-5 w-5 mr-2" />
            <span className="font-semibold">Start Recording</span>
          </Button>
          <Button
            variant="outline"
            onClick={stopRecording}
            disabled={!isRecording || isLoading}
            className="w-full h-12"
          >
            <MicOff className="h-5 w-5 mr-2" />
            <span className="font-semibold">Stop Recording</span>
          </Button>
        </div>
        {/* <h1 className="text-4xl font-bold text-white tracking-tight">Voice Assistant</h1> */}
        <p className="text-gray-400 text-center text-sm">Real-time speech recognition powered by Web Speech API</p>
        <div className="space-y-3 max-h-[400px] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-700/50 pr-2">
          {conversation.map((message, index) => (
            <div key={index} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'} transition-all duration-200`}>
              <div className={`rounded-lg p-3 max-w-[80%] ${
                message.role === 'user' ? 'bg-blue-500/20 text-blue-500' : 'bg-purple-500/20 text-purple-500'
              }`}>
                <div className="flex flex-col">
                  <span className="text-xs text-gray-400 mb-1">{message.role === 'user' ? 'You' : 'Assistant'}</span>
                  <p className="text-sm break-words whitespace-pre-wrap">{message.content}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="text-xs text-gray-400 mt-8">
          <div className="flex flex-col items-center space-y-4 pt-4 pb-6 border-b border-gray-700/50">
            <p className="flex items-center space-x-2">
              <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></span>
              <span>Listening...</span>
            </p>
            <p className="flex items-center space-x-2">
              <span className="w-2 h-2 bg-green-500 rounded-full"></span>
              <span>Ready to speak</span>
            </p>
          </div>
        </div>
      </div>
      <audio ref={audioRef} style={{ display: 'none' }} /> {/* Hidden audio player */}
    </div>
  );
};


