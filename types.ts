
import React from 'react';

export interface HabitTask {
  id: string;
  title: string;
  description: string;
  points: number;
  completed: boolean;
  category: 'water' | 'exercise' | 'mindfulness' | 'nutrition' | 'sleep';
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'bot' | 'other';
  senderName?: string;
  avatarColor?: string;
  text: string;
  timestamp: number;
}

export interface Reminder {
  id: string;
  task: string;
  time: number; // Date.getTime()
  triggered: boolean;
}

export interface HealthArticle {
  title: string;
  url: string;
  source: string;
  type: 'article' | 'video';
}

export type FurnitureItem = 'pine-tree' | 'bench' | 'bench-back' | 'chair' | 'flower-pot';

export type ZoneType = 'home' | 'camping' | 'yoga' | 'gym' | 'pool' | 'salon' | 'hospital' | 'sevahub';

export interface GameState {
  score: number;
  level: number;
  maxScoreForLevel: number;
  inventory: FurnitureItem[];
  placedItems: { id: string, item: FurnitureItem, x: number, y: number }[];
  unlockedZones: ZoneType[];
  removedTrees: number[];
  reminders: Reminder[];
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: React.ElementType;
  condition: (state: GameState) => boolean;
}

export interface LeaderboardEntry {
  rank: number;
  name: string;
  score: number;
  isUser: boolean;
  avatarColor: string;
}

export interface Doctor {
  id: string;
  name: string;
  specialty: string;
  rating: number;
  available: boolean;
  avatarColor: string;
}

export interface UserProfile {
  id: string;
  full_name: string;
  level: number;
  score: number;
  max_score_for_level: number;
  unlocked_zones: string[];
  inventory: FurnitureItem[];
  placed_items: { id: string, item: FurnitureItem, x: number, y: number }[];
  removed_trees: number[];
  updated_at?: string;
}

export type ViewState = 'garden' | 'missions' | 'chat' | 'leaderboard' | 'medbay' | 'gym-interior' | 'restaurant-interior' | 'hospital-interior' | 'trainer-chat' | 'global-chat' | 'nutrition-chat' | 'doctor-chat';
