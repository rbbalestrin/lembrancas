import { Habit, CreateHabitRequest, CompleteHabitRequest, ApiError, HabitCompletion, HabitStatistics } from '@/types/habit';
import { Platform } from 'react-native';
import Constants from 'expo-constants';

// Get API URL from environment variable or use default based on platform
const getApiBaseUrl = (): string => {
  // First, try to get from environment variable
  const envUrl = process.env.EXPO_PUBLIC_API_URL;
  if (envUrl) {
    return envUrl;
  }

  // Fallback: use localhost for web, host machine IP for mobile
  if (Platform.OS === 'web') {
    return 'http://localhost:8080/api';
  }
  
  // For mobile (iOS/Android), use the host machine's IP
  // You can get this from Constants.expoConfig?.hostUri or set it manually
  const hostUri = Constants.expoConfig?.hostUri;
  if (hostUri) {
    const host = hostUri.split(':')[0];
    return `http://${host}:8080/api`;
  }
  
  // Final fallback (shouldn't reach here normally)
  return 'http://localhost:8080/api';
};

const API_BASE_URL = getApiBaseUrl();

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const error: ApiError = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(error.error || `HTTP error! status: ${response.status}`);
  }
  return response.json();
}

export async function getHabits(): Promise<Habit[]> {
  const response = await fetch(`${API_BASE_URL}/habits`);
  return handleResponse<Habit[]>(response);
}

export async function getHabit(id: string): Promise<Habit> {
  const response = await fetch(`${API_BASE_URL}/habits/${id}`);
  return handleResponse<Habit>(response);
}

export async function createHabit(data: CreateHabitRequest): Promise<Habit> {
  const response = await fetch(`${API_BASE_URL}/habits`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
  return handleResponse<Habit>(response);
}

export async function updateHabit(id: string, data: Partial<CreateHabitRequest>): Promise<Habit> {
  const response = await fetch(`${API_BASE_URL}/habits/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
  return handleResponse<Habit>(response);
}

export async function deleteHabit(id: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/habits/${id}`, {
    method: 'DELETE',
  });
  if (!response.ok) {
    const error: ApiError = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(error.error || `HTTP error! status: ${response.status}`);
  }
}

export async function completeHabit(id: string, data?: CompleteHabitRequest): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/habits/${id}/complete`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data || {}),
  });
  if (!response.ok) {
    const error: ApiError = await response.json().catch(() => ({ error: 'Unknown error' }));
    const errorMessage = error.error || `HTTP error! status: ${response.status}`;
    const errorWithStatus = new Error(errorMessage) as Error & { status?: number };
    errorWithStatus.status = response.status;
    throw errorWithStatus;
  }
}

export async function getHabitCompletions(id: string): Promise<HabitCompletion[]> {
  const response = await fetch(`${API_BASE_URL}/habits/${id}/completions`);
  return handleResponse<HabitCompletion[]>(response);
}

export async function removeCompletion(id: string, date: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/habits/${id}/complete/${date}`, {
    method: 'DELETE',
  });
  if (!response.ok) {
    const error: ApiError = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(error.error || `HTTP error! status: ${response.status}`);
  }
}

export async function getHabitStatistics(id: string): Promise<HabitStatistics> {
  const response = await fetch(`${API_BASE_URL}/habits/${id}/statistics`);
  return handleResponse<HabitStatistics>(response);
}

