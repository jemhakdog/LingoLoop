import React from 'react';
import { DailyWord } from '../types';
import { Volume2 } from 'lucide-react';
import { Card, CardContent, CardHeader } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';

interface WordCardProps {
  wordData: DailyWord;
  onPlayAudio: () => void;
  isPlaying: boolean;
}

export const WordCard: React.FC<WordCardProps> = ({ wordData, onPlayAudio, isPlaying }) => {
  return (
    <Card className="mb-6 w-full max-w-md shadow-xl border-slate-100">
      <CardHeader className="flex flex-col items-center text-center pb-2">
        <Badge variant="secondary" className="mb-4 uppercase tracking-wider">
          Word of the Day
        </Badge>
        <h1 className="text-5xl font-black text-slate-800 mb-2">{wordData.word}</h1>
        <div className="flex items-center gap-3">
          <span className="text-xl text-slate-500 font-serif italic">{wordData.phonetic}</span>
          <Button
            variant="ghost"
            size="icon"
            onClick={onPlayAudio}
            disabled={isPlaying}
            className={`rounded-full ${isPlaying ? 'text-indigo-400 bg-indigo-50' : 'text-indigo-600'}`}
            aria-label="Play pronunciation"
          >
            <Volume2 size={20} className={isPlaying ? 'animate-pulse' : ''} />
          </Button>
        </div>
      </CardHeader>

      <div className="w-full px-8">
        <div className="w-full h-px bg-slate-100 my-4"></div>
      </div>

      <CardContent className="space-y-6 pt-2">
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
      </CardContent>
    </Card>
  );
};