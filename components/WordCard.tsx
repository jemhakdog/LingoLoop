import React from 'react';
import { DailyWord } from '../types';
import { Volume2 } from 'lucide-react';

interface WordCardProps {
  wordData: DailyWord;
  onPlayAudio: () => void;
  isPlaying: boolean;
}

export const WordCard: React.FC<WordCardProps> = ({ wordData, onPlayAudio, isPlaying }) => {
  return (
    <div className="bg-white rounded-2xl shadow-xl p-8 mb-6 w-full max-w-md border border-slate-100">
      <div className="flex flex-col items-center text-center">
        <span className="text-xs font-bold tracking-wider text-indigo-500 uppercase mb-2">Word of the Day</span>
        <h1 className="text-5xl font-black text-slate-800 mb-2">{wordData.word}</h1>
        <div className="flex items-center gap-3 mb-6">
          <span className="text-xl text-slate-500 font-serif italic">{wordData.phonetic}</span>
          <button
            onClick={onPlayAudio}
            disabled={isPlaying}
            className={`p-2 rounded-full transition-all ${
              isPlaying ? 'bg-indigo-100 text-indigo-400' : 'bg-indigo-50 text-indigo-600 hover:bg-indigo-100'
            }`}
            aria-label="Play pronunciation"
          >
            <Volume2 size={20} className={isPlaying ? 'animate-pulse' : ''} />
          </button>
        </div>

        <div className="w-full h-px bg-slate-100 mb-6"></div>

        <div className="text-left w-full space-y-4">
          <div>
            <h3 className="text-sm font-semibold text-slate-400 mb-1 uppercase tracking-wide">Definition</h3>
            <p className="text-lg text-slate-700 leading-relaxed font-medium">
              {wordData.definition}
            </p>
          </div>
          
          <div className="bg-slate-50 p-4 rounded-lg border border-slate-100">
            <h3 className="text-xs font-semibold text-slate-400 mb-2 uppercase tracking-wide">Example</h3>
            <p className="text-md text-slate-600 italic">
              "{wordData.example}"
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
