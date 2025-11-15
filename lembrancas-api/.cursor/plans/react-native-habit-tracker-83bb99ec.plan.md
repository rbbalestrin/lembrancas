<!-- 83bb99ec-b4fe-4056-ae6d-4a9dec68adca d12dec28-0fe9-419a-aa87-7c84d6117c59 -->
# React Native Habit Tracker Frontend

## Project Structure

```
habit-tracker-app/
├── src/
│   ├── api/
│   │   ├── client.ts           # Axios/fetch configuration
│   │   └── habits.ts           # API calls for habits
│   ├── components/
│   │   ├── HabitCard.tsx       # Individual habit display
│   │   ├── HabitForm.tsx       # Create/Edit form
│   │   └── EmptyState.tsx      # Empty list placeholder
│   ├── context/
│   │   └── AppContext.tsx      # Global app state (if needed)
│   ├── hooks/
│   │   └── useHabits.ts        # React Query hooks
│   ├── navigation/
│   │   └── AppNavigator.tsx    # Navigation configuration
│   ├── screens/
│   │   ├── HomeScreen.tsx      # List all habits
│   │   ├── AddHabitScreen.tsx  # Create new habit
│   │   ├── EditHabitScreen.tsx # Edit existing habit
│   │   └── HabitDetailScreen.tsx # View + mark complete
│   ├── types/
│   │   └── habit.ts            # TypeScript interfaces
│   └── utils/
│       └── constants.ts        # API URL, colors, etc.
└── App.tsx                      # Entry point
```

## Tech Stack

- **TypeScript** for type safety
- **Expo** for React Native development
- **React Query** for server state management
- **Context API** for minimal global state
- **React Native Paper** for UI components
- **React Navigation** (Bottom Tabs + Stack)
- **Axios** for API calls

## Implementation Steps

### 1. Initialize Expo Project

```bash
npx create-expo-app habit-tracker-app --template blank-typescript
cd habit-tracker-app
```

Install dependencies:

```bash
npx expo install react-native-paper react-native-safe-area-context
npm install @tanstack/react-query axios
npm install @react-navigation/native @react-navigation/bottom-tabs @react-navigation/native-stack
npx expo install react-native-screens react-native-safe-area-context
```

### 2. Define TypeScript Types

Create `src/types/habit.ts`:

```typescript
export interface Habit {
  id: string;
  name: string;
  description: string;
  frequency: 'daily' | 'weekly' | 'custom';
  color: string;
  category: string;
  created_at: string;
  updated_at: string;
}

export interface CreateHabitRequest {
  name: string;
  description: string;
  frequency: 'daily' | 'weekly' | 'custom';
  color: string;
  category: string;
}

export interface CompleteHabitRequest {
  date?: string; // YYYY-MM-DD format
}
```

### 3. Setup API Client

Create `src/utils/constants.ts`:

```typescript
export const API_BASE_URL = 'http://localhost:8080/api';
```

Create `src/api/client.ts`:

```typescript
import axios from 'axios';
import { API_BASE_URL } from '../utils/constants';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});
```

Create `src/api/habits.ts` with functions for:

- `fetchHabits()` - GET /habits
- `fetchHabitById(id)` - GET /habits/:id
- `createHabit(data)` - POST /habits
- `updateHabit(id, data)` - PUT /habits/:id
- `deleteHabit(id)` - DELETE /habits/:id
- `completeHabit(id, date?)` - POST /habits/:id/complete

### 4. Setup React Query Hooks

Create `src/hooks/useHabits.ts`:

- `useHabits()` - Query for list of habits
- `useHabit(id)` - Query for single habit
- `useCreateHabit()` - Mutation to create
- `useUpdateHabit()` - Mutation to update
- `useDeleteHabit()` - Mutation to delete
- `useCompleteHabit()` - Mutation to mark complete

All mutations should invalidate relevant queries on success.

### 5. Navigation Setup

Create `src/navigation/AppNavigator.tsx`:

- Bottom Tabs with 2 tabs:
  - **Home Tab**: Stack navigator with HomeScreen → HabitDetailScreen → EditHabitScreen
  - **Add Tab**: AddHabitScreen
- Use React Native Paper icons for tabs

### 6. Build Core Screens

**HomeScreen.tsx**:

- Display list of habits using FlatList
- Each item uses HabitCard component
- Pull-to-refresh functionality
- Loading and error states
- Navigate to HabitDetailScreen on tap

**AddHabitScreen.tsx**:

- HabitForm component with fields: name, description, frequency, color, category
- Color picker (use preset colors)
- Category dropdown/input
- Submit button triggers `useCreateHabit`
- Navigate back on success

**EditHabitScreen.tsx**:

- Similar to AddHabitScreen but pre-filled
- Uses `useHabit` to fetch current data
- Submit triggers `useUpdateHabit`

**HabitDetailScreen.tsx**:

- Show habit details
- Large button to mark as complete for today
- Uses `useCompleteHabit` mutation
- Edit button (navigates to EditHabitScreen)
- Delete button with confirmation dialog

### 7. Build Components

**HabitCard.tsx**:

- Display habit name, category, frequency
- Show colored left border or icon with habit color
- Use React Native Paper's Card component

**HabitForm.tsx**:

- Reusable form for create/edit
- TextInput for name, description, category
- Segmented buttons for frequency
- Color picker (6-8 preset colors as buttons)
- Validation before submit

**EmptyState.tsx**:

- Friendly message when no habits exist
- Icon and text encouraging user to add first habit

### 8. Setup App.tsx

- Wrap app with:
  - PaperProvider (React Native Paper theme)
  - QueryClientProvider (React Query)
  - SafeAreaProvider
  - NavigationContainer
- Configure React Query client with default options

### 9. Styling & UX

- Use React Native Paper's theming system
- Consistent spacing and colors
- Show loading indicators during API calls
- Toast/Snackbar for success/error messages
- Haptic feedback on button presses
- Pull-to-refresh on home screen

## API Integration Notes

- Base URL points to `http://localhost:8080/api`
- For iOS simulator: use `http://localhost:8080`
- For Android emulator: use `http://10.0.2.2:8080`
- For physical device: use computer's local IP address
- All dates in `YYYY-MM-DD` format
- Handle 404, 409, 400 errors with user-friendly messages

## Testing Strategy

- Test on iOS simulator
- Test on Android emulator  
- Verify all CRUD operations work
- Check error handling for network failures
- Verify navigation flows

## Future Enhancements (Not in Core)

- Statistics screen (endpoint #8)
- Completion history (endpoint #9)
- Calendar view for habit tracking
- Offline support with local storage
- Push notifications/reminders

### To-dos

- [ ] Initialize Expo project with TypeScript and install all dependencies
- [ ] Create TypeScript types, API client, and API functions
- [ ] Setup React Query hooks for habits CRUD operations
- [ ] Configure React Navigation with bottom tabs and stack navigators
- [ ] Build reusable components (HabitCard, HabitForm, EmptyState)
- [ ] Implement all core screens (Home, Add, Edit, Detail)
- [ ] Configure App.tsx with providers and theme
- [ ] Test all features, add loading states, error handling, and polish UX