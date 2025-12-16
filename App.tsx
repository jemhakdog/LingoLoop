import React, { useState, useEffect, useCallback } from 'react';
import { generateDailyWord, getPronunciationAudio } from './services/geminiService';
import { playPCMAudio } from './services/audioUtils';
import { WordCard } from './components/WordCard';
import { PronunciationDojo } from './components/PronunciationDojo';
import { DailyWord, AppState } from './types';
import { Loader2, Zap } from 'lucide-react';
import { Card, CardContent, CardHeader } from './components/ui/card';
import { Button } from './components/ui/button';

const App: React.FC = () => {
  const [wordData, setWordData] = useState<DailyWord | null>(null);
  const [appState, setAppState] = useState<AppState>(AppState.LOADING);
  const [audioCache, setAudioCache] = useState<string | null>(null);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initial Fetch
  useEffect(() => {
    const init = async () => {
      try {
        setAppState(AppState.LOADING);
        const data = await generateDailyWord();
        setWordData(data);
        
        // Pre-fetch audio for lower latency
        const audio = await getPronunciationAudio(data.word);
        setAudioCache(audio);
        
        setAppState(AppState.IDLE);
      } catch (e) {
        console.error("Initialization failed:", e);
        setError("Failed to load today's word. Please check your API Key and try again.");
        setAppState(AppState.ERROR);
      }
    };

    init();
  }, []);

  const handlePlayAudio = useCallback(async () => {
    if (!audioCache) return;
    setIsPlayingAudio(true);
    await playPCMAudio(audioCache);
    setIsPlayingAudio(false);
  }, [audioCache]);

  const handleSuccess = () => {
    setAppState(AppState.SUCCESS);
    // Optional: Play a success sound
  };

  const handleFail = async () => {
    setAppState(AppState.FAIL);
    
    // Core Logic Constraint: Play audio automatically on fail before retry
    // Small delay to let the user see "Incorrect" first
    setTimeout(async () => {
        await handlePlayAudio();
    }, 500);
  };

  const handleRetry = () => {
      setAppState(AppState.IDLE);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
      {/* Header */}
      <header className="absolute top-0 w-full p-6 flex justify-between items-center max-w-2xl mx-auto">
        <div className="flex items-center gap-2">
            <div className="bg-indigo-600 p-2 rounded-lg">
                <Zap size={20} className="text-white" />
            </div>
            <span className="font-bold text-xl text-slate-800 tracking-tight">LingoLoop</span>
        </div>
        <div className="text-xs font-semibold bg-white border border-slate-200 px-3 py-1 rounded-full text-slate-500 shadow-sm">
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
        </div>
      </header>

      {/* Main Content Area */}
      <main className="w-full max-w-md flex flex-col items-center pt-16 pb-12">
        
        {appState === AppState.LOADING && (
          <div className="flex flex-col items-center justify-center h-64 animate-pulse">
             <Loader2 className="animate-spin text-indigo-500 mb-4" size={48} />
             <p className="text-slate-400 font-medium">Curating today's word...</p>
          </div>
        )}

        {appState === AppState.ERROR && (
            <Card className="border-rose-100 bg-rose-50 shadow-sm">
                <CardContent className="flex flex-col items-center p-6 text-center">
                    <p className="text-rose-600 font-medium mb-2">Oops!</p>
                    <p className="text-slate-600 text-sm mb-4">{error}</p>
                    <Button 
                        variant="destructive"
                        onClick={() => window.location.reload()}
                    >
                        Retry
                    </Button>
                </CardContent>
            </Card>
        )}

        {wordData && appState !== AppState.LOADING && appState !== AppState.ERROR && (
          <>
            <WordCard 
                wordData={wordData} 
                onPlayAudio={handlePlayAudio}
                isPlaying={isPlayingAudio}
            />
            
            <Card className="w-full max-w-md border-slate-100 shadow-lg">
                <CardContent className="flex flex-col items-center p-6">
                    <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-6">Pronunciation Dojo</h2>
                    <PronunciationDojo 
                        targetWord={wordData.word}
                        onSuccess={handleSuccess}
                        onFail={handleFail}
                        onRetry={handleRetry}
                        appState={appState}
                    />
                </CardContent>
            </Card>
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="mt-auto text-center text-slate-300 text-xs py-4">
         <p>Powered by Gemini 2.5 Flash</p>
      </footer>
    </div>
  );
};

export default App;