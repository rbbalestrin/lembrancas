import AddHabitDialog from '@/components/AddHabitDialog';
import { completeHabit, createHabit, getHabitCompletions, getHabits, removeCompletion } from '@/services/api';
import { Habit, HabitFrequency } from '@/types/habit';
import React, { useCallback, useEffect, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { ActivityIndicator, Button, Checkbox, Divider, FAB, List, Snackbar, Text } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';

// Helper function to get today's date in YYYY-MM-DD format
const getTodayDate = (): string => {
  const today = new Date();
  return today.toISOString().split('T')[0];
};

// Helper function to check if a date string matches today
const isDateToday = (dateString: string): boolean => {
  const date = new Date(dateString);
  const today = new Date();
  return (
    date.getFullYear() === today.getFullYear() &&
    date.getMonth() === today.getMonth() &&
    date.getDate() === today.getDate()
  );
};

// Format date for display (e.g., "17 Nov 2025")
const formatDateForDisplay = (dateString: string): string => {
  const date = new Date(dateString + 'T00:00:00');
  const months = [
    'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun',
    'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'
  ];
  return `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
};

// Add or subtract days from a date string
const addDays = (dateString: string, days: number): string => {
  const date = new Date(dateString + 'T00:00:00');
  date.setDate(date.getDate() + days);
  return date.toISOString().split('T')[0];
};

// Check if a completion date matches the selected date
const isCompletionForDate = (completionDate: string, selectedDate: string): boolean => {
  // Extract YYYY-MM-DD from completionDate (which may be in ISO format like "2025-11-17T00:00:00Z")
  const completionDateStr = completionDate.split('T')[0];
  // selectedDate is already in YYYY-MM-DD format
  const matches = completionDateStr === selectedDate;
  console.log('[isCompletionForDate]', {
    completionDate,
    completionDateStr,
    selectedDate,
    matches,
  });
  return matches;
};

export default function HabitsScreen() {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>(getTodayDate());
  const [completedHabits, setCompletedHabits] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [dialogVisible, setDialogVisible] = useState(false);
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [togglingIds, setTogglingIds] = useState<Set<string>>(new Set());

  const loadHabits = useCallback(async (date: string) => {
    console.log('[loadHabits] Starting with date:', date);
    try {
      const data = await getHabits();
      setHabits(data);
      console.log('[loadHabits] Loaded habits:', data.length);
      
      // Load completions for each habit to check which are completed for the selected date
      const completedSet = new Set<string>();
      for (const habit of data) {
        try {
          const completions = await getHabitCompletions(habit.id);
          console.log(`[loadHabits] Habit ${habit.name} (${habit.id}) completions:`, completions);
          const isCompleted = completions.some((completion) => 
            isCompletionForDate(completion.completed_at, date)
          );
          console.log(`[loadHabits] Habit ${habit.name} isCompleted for ${date}:`, isCompleted);
          if (isCompleted) {
            completedSet.add(habit.id);
          }
        } catch (error) {
          // Silently fail if we can't get completions for a habit
          console.warn(`Failed to load completions for habit ${habit.id}:`, error);
        }
      }
      console.log('[loadHabits] Completed habits set:', Array.from(completedSet));
      console.log('[loadHabits] Setting completedHabits state with', completedSet.size, 'habits');
      setCompletedHabits(completedSet);
    } catch (error) {
      setSnackbarMessage(error instanceof Error ? error.message : 'Erro ao carregar hábitos');
      setSnackbarVisible(true);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    console.log('[useEffect] selectedDate changed to:', selectedDate);
    console.log('[useEffect] Clearing completedHabits before loading');
    setCompletedHabits(new Set()); // Clear previous state immediately
    loadHabits(selectedDate);
  }, [loadHabits, selectedDate]);

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    loadHabits(selectedDate);
  }, [loadHabits, selectedDate]);

  const handleCreateHabit = async (data: {
    name: string;
    description?: string;
    frequency: HabitFrequency;
    color: string;
    category?: string;
  }) => {
    try {
      const newHabit = await createHabit(data);
      setHabits([...habits, newHabit]);
      
      // Check if the new habit is already completed for the selected date
      try {
        const completions = await getHabitCompletions(newHabit.id);
        const isCompleted = completions.some((completion) => 
          isCompletionForDate(completion.completed_at, selectedDate)
        );
        if (isCompleted) {
          setCompletedHabits((prev) => new Set(prev).add(newHabit.id));
        }
      } catch (error) {
        // Silently fail if we can't get completions
        console.warn(`Failed to load completions for new habit ${newHabit.id}:`, error);
      }
      
      setSnackbarMessage('Hábito criado com sucesso!');
      setSnackbarVisible(true);
      setDialogVisible(false); // Close dialog only after successful creation
    } catch (error) {
      setSnackbarMessage(error instanceof Error ? error.message : 'Erro ao criar hábito');
      setSnackbarVisible(true);
    }
  };

  const handleToggleComplete = async (habitId: string) => {
    if (togglingIds.has(habitId)) return;

    const isCompleted = completedHabits.has(habitId);

    setTogglingIds((prev) => new Set(prev).add(habitId));
    
    try {
      if (isCompleted) {
        // Remove completion
        await removeCompletion(habitId, selectedDate);
        setCompletedHabits((prev) => {
          const next = new Set(prev);
          next.delete(habitId);
          return next;
        });
        setSnackbarMessage('Conclusão removida');
      } else {
        // Add completion
        try {
          await completeHabit(habitId, { date: selectedDate });
          setCompletedHabits((prev) => new Set(prev).add(habitId));
          setSnackbarMessage('Hábito marcado como completo!');
        } catch (error) {
          // Handle 409 Conflict (already completed) gracefully
          if (error instanceof Error && 'status' in error && (error as any).status === 409) {
            setCompletedHabits((prev) => new Set(prev).add(habitId));
            setSnackbarMessage('Hábito já estava completo');
          } else {
            throw error;
          }
        }
      }
      setSnackbarVisible(true);
    } catch (error) {
      setSnackbarMessage(error instanceof Error ? error.message : 'Erro ao atualizar hábito');
      setSnackbarVisible(true);
    } finally {
      setTogglingIds((prev) => {
        const next = new Set(prev);
        next.delete(habitId);
        return next;
      });
    }
  };

  const handlePreviousDay = () => {
    setSelectedDate((prev) => {
      const newDate = addDays(prev, -1);
      console.log('[handlePreviousDay] Changing date from', prev, 'to', newDate);
      return newDate;
    });
  };

  const handleNextDay = () => {
    const today = getTodayDate();
    const nextDate = addDays(selectedDate, 1);
    console.log('[handleNextDay] Changing date from', selectedDate, 'to', nextDate);
    // Allow navigation to future dates (no limit for now)
    setSelectedDate(nextDate);
  };

  const handleGoToToday = () => {
    const today = getTodayDate();
    console.log('[handleGoToToday] Changing date from', selectedDate, 'to', today);
    setSelectedDate(today);
  };

  const isTodaySelected = isDateToday(selectedDate);

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Date Navigation Header */}
      <View style={styles.dateHeader}>
        <Button
          icon="chevron-left"
          mode="text"
          onPress={handlePreviousDay}
          style={styles.dateNavButton}
        />
        <View style={styles.dateDisplayContainer}>
          <Text variant="titleMedium" style={styles.dateText}>
            {formatDateForDisplay(selectedDate)}
          </Text>
          {!isTodaySelected && (
            <Button
              mode="text"
              compact
              onPress={handleGoToToday}
              style={styles.todayButton}
              labelStyle={styles.todayButtonLabel}>
              Hoje
            </Button>
          )}
        </View>
        <Button
          icon="chevron-right"
          mode="text"
          onPress={handleNextDay}
          style={styles.dateNavButton}
        />
      </View>
      <Divider />

      <ScrollView
        style={styles.scrollView}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}>
        {habits.length === 0 ? (
          <View style={styles.emptyContainer}>
            <List.Icon icon="clipboard-list-outline" />
            <List.Subheader style={styles.emptyText}>
              Nenhum hábito cadastrado ainda
            </List.Subheader>
            <List.Subheader style={styles.emptySubtext}>
              Toque no botão + para criar seu primeiro hábito
            </List.Subheader>
          </View>
        ) : (
          habits.map((habit) => (
            <List.Item
              key={habit.id}
              title={habit.name}
              description={habit.description || habit.category || undefined}
              left={(props) => (
                <View style={[styles.colorIndicator, { backgroundColor: habit.color }]} />
              )}
              right={(props) => {
                const isCompleted = completedHabits.has(habit.id);
                console.log(`[Render] Habit ${habit.name} (${habit.id}) - isCompleted: ${isCompleted}, selectedDate: ${selectedDate}`);
                return (
                  <Checkbox
                    status={isCompleted ? 'checked' : 'unchecked'}
                    onPress={() => handleToggleComplete(habit.id)}
                    disabled={togglingIds.has(habit.id)}
                  />
                );
              }}
              style={styles.listItem}
            />
          ))
        )}
      </ScrollView>
      <FAB icon="plus" style={styles.fab} onPress={() => setDialogVisible(true)} />
      <AddHabitDialog
        visible={dialogVisible}
        onDismiss={() => setDialogVisible(false)}
        onSubmit={handleCreateHabit}
      />
      <Snackbar
        visible={snackbarVisible}
        onDismiss={() => setSnackbarVisible(false)}
        duration={3000}>
        {snackbarMessage}
      </Snackbar>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  dateHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    paddingVertical: 12,
  },
  dateNavButton: {
    minWidth: 48,
  },
  dateDisplayContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dateText: {
    fontWeight: '600',
  },
  todayButton: {
    marginTop: 4,
  },
  todayButtonLabel: {
    fontSize: 12,
  },
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 16,
  },
  emptySubtext: {
    textAlign: 'center',
    marginTop: 8,
    opacity: 0.6,
  },
  listItem: {
    paddingVertical: 8,
  },
  colorIndicator: {
    width: 4,
    height: '100%',
    marginRight: 16,
    borderRadius: 2,
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
  },
});
