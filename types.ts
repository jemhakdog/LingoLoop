export interface DailyWord {
  word: string;
  definition: string;
  phonetic: string;
  example: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
}

export enum AppState {
  LOADING = 'LOADING',
  IDLE = 'IDLE',
  LISTENING = 'LISTENING',
  PROCESSING = 'PROCESSING',
  SUCCESS = 'SUCCESS',
  FAIL = 'FAIL',
  ERROR = 'ERROR'
}

export interface AudioConfig {
  sampleRate: number;
}
