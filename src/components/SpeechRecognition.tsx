"use client";

import React, { useState, useRef, useEffect } from "react";
import { useLocation } from "react-router-dom";
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

interface InterviewState {
  questions: string[];
}

export default function SpeechRecognitionComponent() {
  const location = useLocation();
  const { questions } = (location.state || { questions: [] }) as InterviewState;
  const [isRecording, setIsRecording] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [conversation, setConversation] = useState<{ role: 'user' | 'assistant', content: string }[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [isInterviewStarted, setIsInterviewStarted] = useState(false);
  const [isInterviewComplete, setIsInterviewComplete] = useState(false);
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

  const startInterview = async () => {
    if (questions.length === 0) {
      toast({
        title: "No Questions",
        description: "No interview questions were provided.",
        variant: "destructive",
      });
      return;
    }
    
    setIsInterviewStarted(true);
    const firstQuestion = questions[0];
    const greeting = `Hi, Let's get started with your interview. Here's the first question: ${firstQuestion}`;
    setConversation([{ role: 'assistant', content: greeting }]);
    speakText(greeting);
  };

  const processUserInput = async (transcript: string) => {
    console.log('Processing with Gemini:', transcript);
    setIsProcessing(true);
  
    try {
      const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
      
      let prompt = '';
      let assistantText = '';
      
      // Add user's message to conversation
      setConversation(prev => [...prev, { role: 'user', content: transcript }]);
      
      if (isInterviewComplete) {
        // General conversation after interview
        prompt = `The user said: "${transcript}"`;
      } else if (questions && questions.length > 0) {
        // Interview mode - analyze response and provide feedback
        const currentQuestion = questions[currentQuestionIndex];
        
        // First, analyze the candidate's response
        const feedbackPrompt = `You are conducting a job interview. The candidate was asked: "${currentQuestion}"
        
        The candidate responded: "${transcript}"
        
        Please provide a brief (1-2 sentence) acknowledgment or feedback on their response. Be professional and empathetic, especially if they seem unsure. For example, if they say "I don't know," you might say "That's okay, let's move on to the next question."`;
        
        const feedbackResult = await model.generateContent(feedbackPrompt);
        const feedbackResponse = await feedbackResult.response;
        const feedbackText = feedbackResponse.text();
        
        // Add feedback to conversation
        setConversation(prev => [
          ...prev,
          { role: 'assistant', content: feedbackText }
        ]);
        await speakText(feedbackText);
        
        // Then prepare next question if there are more
        if (currentQuestionIndex < questions.length - 1) {
          // Small delay before next question
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          const nextQuestion = questions[Math.min(currentQuestionIndex + 1, questions.length - 1)];
          prompt = `Ask this interview question in a natural, conversational way: "${nextQuestion}"`;
          
          const questionResult = await model.generateContent(prompt);
          const questionResponse = await questionResult.response;
          assistantText = questionResponse.text();
          
          // Update to next question index after getting the response
          setCurrentQuestionIndex(prev => prev + 1);
        } else {
          // No more questions
          assistantText = "Thank you for your responses. This concludes our interview. Do you have any questions for us?";
          setIsInterviewComplete(true);
        }
      } else {
        // Fallback if no questions are available
        prompt = `The user said: "${transcript}"`;
        const result = await model.generateContent(prompt);
        const response = await result.response;
        assistantText = response.text();
      }
      
      if (assistantText) {
        // Add assistant's response to conversation
        setConversation(prev => [
          ...prev,
          { role: 'assistant', content: assistantText }
        ]);
        
        speakText(assistantText);
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
    <div className="flex flex-col h-screen bg-gradient-to-b from-[#31275e] to-[#9168f0]">

    {/* // <div className="flex flex-col min-h-screen bg-gradient-to-b from-[#31275e] to-[#9168f0]"> */}
      {/* Top Bar */}
      <div className="bg-gradient-to-r from-purple-800 to-indigo-900 text-white text-lg font-semibold px-8 py-4 shadow-lg flex justify-between items-center">
        <div className="flex items-center">
          <img src="/logo.svg" alt="logo" className="w-8 h-8 mr-3" />
          <span className="text-xl font-bold">PrepWise Interview</span>
        </div>
        {isInterviewStarted && !isInterviewComplete && (
          <span className="text-sm font-light bg-white/20 backdrop-blur-sm px-4 py-1 rounded-full">
            Question {currentQuestionIndex + 1} of {questions.length}
          </span>
        )}
        {isInterviewComplete && (
          <span className="text-sm font-light bg-green-500/20 backdrop-blur-sm text-white px-4 py-1 rounded-full border border-green-400/50">
            Interview Complete
          </span>
        )}
      </div>

    {/* Main Layout */}
    <div className="flex flex-col md:flex-row flex-1 min-h-0 bg-white/10 backdrop-blur-sm">
      {/* 🤖 Bot Section */}
      <div className="w-full md:w-1/2 p-8 flex flex-col items-center justify-center relative overflow-auto">
        {/* Bot Icon */}
        <div className="w-64 h-64 bg-white/5 backdrop-blur-md rounded-full shadow-2xl flex items-center justify-center relative border-2 border-white/20">
          <img src="/aiavatar.png" alt="AI Avatar" className="w-full h-full object-contain mt-8" />
        </div>

        {!isInterviewStarted ? (
          <div className="text-center p-8">
            <h2 className="text-2xl font-bold mb-4 text-white">Ready for your interview?</h2>
            <p className="mb-6 text-white/80">
              {questions.length} questions prepared. Click below to begin.
            </p>
            <button 
              onClick={startInterview} 
              className="text-lg px-10 py-6 bg-gradient-to-r from-purple-600 to-indigo-700 hover:from-purple-700 hover:to-indigo-800 text-white text-xl font-semibold rounded-full shadow-xl transform transition-all hover:scale-105 hover:shadow-2xl focus:outline-none focus:ring-2 focus:ring-purple-400 focus:ring-offset-2 focus:ring-offset-purple-900"
            >
              🎤 Start Interview
            </button>
          </div>
        ) : (
          <div className="mt-8">
            <button 
              onClick={startRecording} 
              disabled={isProcessing}
              className={`text-lg px-8 py-3 rounded-full shadow-lg transform transition-all ${
                isProcessing 
                  ? 'bg-gray-400 cursor-not-allowed' 
                  : 'bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 hover:shadow-xl hover:scale-105 text-white'
              }`}
            >
              {isProcessing ? 'Processing...' : '🎙️ Speak Now'}
            </button>
          </div>
        )}

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
      <div className="w-full md:w-1/2 flex flex-col h-full overflow-hidden bg-white/5 backdrop-blur-sm border-l border-white/10">

        <div className="flex-1 overflow-y-auto px-6 py-8 space-y-4">
        {conversation.map((msg, index) => (
          <div key={index} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
            <div
              className={`max-w-[80%] rounded-2xl px-5 py-3 text-sm whitespace-pre-wrap backdrop-blur-sm ${
                msg.role === "user"
                  ? "bg-white/90 text-gray-800 shadow-md"
                  : "bg-white/10 text-white border border-white/20 shadow-lg"
              }`}
            >
              <p className="leading-relaxed">{msg.content}</p>
            </div>
          </div>
        ))}

        </div>
        {/* End Message Note */}
        <div className="text-center text-xs text-white/70 p-4 border-t border-white/20">
          Click this button only if you have completed the interview.<br />
          Once clicked, the interview will end and cannot be resumed.
        </div>
      </div>
    </div>
  </div>
  );
};



