import { Habit, CreateHabitRequest, CompleteHabitRequest, ApiError, HabitCompletion } from '@/types/habit';

const API_BASE_URL = 'http://localhost:8080/api';

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

