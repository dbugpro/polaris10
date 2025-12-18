export interface GroundingSource {
  title: string;
  url: string;
}

export interface Message {
  id: string;
  role: 'user' | 'model';
  text: string;
  image?: string; // Base64 string for user uploaded images
  isError?: boolean;
  isDeepThink?: boolean;
  groundingSources?: GroundingSource[];
  timestamp: number;
}

export enum LoadingState {
  IDLE = 'IDLE',
  THINKING = 'THINKING',
  STREAMING = 'STREAMING',
}