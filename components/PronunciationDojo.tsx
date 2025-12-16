import React, { useEffect, useState } from 'react';
import { Mic, RefreshCw, Check, X, AlertCircle } from 'lucide-react';
import { AppState } from '../types';
import { useSpeechRecognition } from '../hooks/useSpeechRecognition';

interface PronunciationDojoProps {
  targetWord: string;
  onSuccess: () => void;
  onFail: () => void;
  onRetry: () => void;
  appState: AppState;
}

export const PronunciationDojo: React.FC<PronunciationDojoProps> = ({
  targetWord,
  onSuccess,
  onFail,
  onRetry,
  appState
}) => {
  const { isListening, transcript, startListening, stopListening, error, supported } = useSpeechRecognition();
  const [feedbackMessage, setFeedbackMessage] = useState<string>("");

  // Logic to compare transcript with target word
  useEffect(() => {
    if (!isListening && transcript) {
      // Normalize comparison
      const cleanTranscript = transcript.trim().toLowerCase().replace(/[.,/#!$%^&*;:{}=\-_`~()]/g, "");
      const cleanTarget = targetWord.trim().toLowerCase();

      // Check for exact match or includes (for phrases/noise)
      if (cleanTranscript === cleanTarget || cleanTranscript.includes(cleanTarget)) {
        onSuccess();
        setFeedbackMessage(`Perfect! You said "${transcript}".`);
      } else {
        onFail();
        setFeedbackMessage(`I heard "${transcript}", but expected "${targetWord}".`);
      }
    }
  }, [isListening, transcript, targetWord, onSuccess, onFail]);

  // Handle errors from hook
  useEffect(() => {
    if (error) {
      setFeedbackMessage(`Microphone error: ${error}`);
    }
  }, [error]);

  const handleMicClick = () => {
    if (appState === AppState.IDLE || appState === AppState.FAIL) {
      if (appState === AppState.FAIL) {
        onRetry(); // Reset state
      }
      setFeedbackMessage("");
      startListening();
    } else if (appState === AppState.LISTENING) {
      stopListening();
    }
  };

  if (!supported) {
    return (
      <div className="bg-amber-50 text-amber-800 p-4 rounded-lg flex items-center gap-2 text-sm mt-4 max-w-md w-full">
        <AlertCircle size={18} />
        <span>Your browser does not support Speech Recognition. Please use Chrome, Edge, or Safari.</span>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md flex flex-col items-center">
      <div className="relative mb-8">
        {/* Main Action Button */}
        <button
          onClick={handleMicClick}
          disabled={appState === AppState.PROCESSING || appState === AppState.SUCCESS}
          className={`
            relative z-10 w-24 h-24 rounded-full flex items-center justify-center transition-all duration-300 shadow-2xl
            ${appState === AppState.LISTENING ? 'bg-rose-500 scale-110 shadow-rose-500/50' : ''}
            ${appState === AppState.IDLE ? 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-500/50' : ''}
            ${appState === AppState.SUCCESS ? 'bg-emerald-500 scale-100 shadow-emerald-500/50 cursor-default' : ''}
            ${appState === AppState.FAIL ? 'bg-slate-700 hover:bg-slate-800' : ''}
          `}
        >
          {appState === AppState.LISTENING && <Mic className="text-white animate-pulse" size={40} />}
          {appState === AppState.IDLE && <Mic className="text-white" size={40} />}
          {appState === AppState.SUCCESS && <Check className="text-white" size={48} />}
          {appState === AppState.FAIL && <RefreshCw className="text-white" size={36} />}
          {appState === AppState.PROCESSING && <div className="w-8 h-8 border-4 border-white border-t-transparent rounded-full animate-spin"></div>}
        </button>

        {/* Pulse rings for listening state */}
        {appState === AppState.LISTENING && (
          <>
            <div className="absolute top-0 left-0 w-full h-full rounded-full bg-rose-400 opacity-30 animate-ping"></div>
            <div className="absolute -inset-4 rounded-full border-2 border-rose-100 opacity-50 animate-pulse"></div>
          </>
        )}
      </div>

      {/* Instructional / Feedback Text */}
      <div className="text-center h-20 transition-all duration-300">
        {appState === AppState.IDLE && (
          <p className="text-slate-500 font-medium animate-fade-in">Tap the mic and say the word.</p>
        )}
        {appState === AppState.LISTENING && (
          <p className="text-rose-500 font-bold animate-pulse">Listening...</p>
        )}
        {appState === AppState.SUCCESS && (
          <p className="text-emerald-600 font-bold text-lg animate-bounce">Excellent!</p>
        )}
        {appState === AppState.FAIL && (
          <div className="space-y-1 animate-shake">
             <p className="text-rose-500 font-bold">Incorrect.</p>
             <p className="text-slate-400 text-sm">Listen to the correction, then tap to retry.</p>
          </div>
        )}
        {appState === AppState.PROCESSING && (
           <p className="text-slate-400">Thinking...</p>
        )}
      </div>
      
      {/* Transcript Feedback */}
      {feedbackMessage && appState !== AppState.LISTENING && (
        <div className={`mt-2 p-3 rounded-lg text-sm text-center max-w-xs ${
            appState === AppState.SUCCESS ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' :
            appState === AppState.FAIL ? 'bg-rose-50 text-rose-700 border border-rose-100' :
            'bg-slate-100 text-slate-600'
        }`}>
          {feedbackMessage}
        </div>
      )}
    </div>
  );
};
