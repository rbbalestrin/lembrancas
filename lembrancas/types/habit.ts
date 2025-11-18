export type HabitFrequency = 'daily' | 'weekly' | 'custom';

export interface Habit {
  id: string;
  name: string;
  description?: string;
  frequency: HabitFrequency;
  color: string;
  category?: string;
  created_at: string;
  updated_at: string;
}

export interface HabitCompletion {
  id: string;
  habit_id: string;
  completed_at: string;
  notes?: string;
  created_at: string;
}

export interface CreateHabitRequest {
  name: string;
  description?: string;
  frequency: HabitFrequency;
  color: string;
  category?: string;
}

export interface CompleteHabitRequest {
  date?: string;
}

export interface ApiError {
  error: string;
}

export interface HabitStatistics {
  total_completions: number;
  current_streak: number;
  longest_streak: number;
  completions: string[];
}

