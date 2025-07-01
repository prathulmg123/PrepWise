import { useState, useCallback, useRef } from 'react';

export function useTTS() {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const stopTTS = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current = null;
    }
    setIsSpeaking(false);
  }, []);

  const playTTS = useCallback((audioUrl: string) => {
    try {
      setIsSpeaking(true);
      const audio = new Audio(audioUrl);
      audioRef.current = audio;
      
      audio.addEventListener('ended', () => {
        audioRef.current = null;
        setIsSpeaking(false);
      });

      audio.addEventListener('error', (error) => {
        console.error('Error playing TTS:', error);
        setIsSpeaking(false);
      });

      audio.play().catch(error => {
        console.error('Error playing audio:', error);
        setIsSpeaking(false);
      });
    } catch (error) {
      console.error('Error initializing TTS:', error);
      setIsSpeaking(false);
    }
  }, []);

  return {
    isSpeaking,
    stopTTS,
    playTTS,
  };
}
