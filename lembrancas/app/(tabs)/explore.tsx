import { getHabits, getHabitStatistics } from '@/services/api';
import { Habit, HabitStatistics } from '@/types/habit';
import React, { useCallback, useEffect, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { ActivityIndicator, Card, Text, Surface, List } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';

interface HabitWithStats {
  habit: Habit;
  statistics: HabitStatistics;
}

export default function StatisticsScreen() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [habitsWithStats, setHabitsWithStats] = useState<HabitWithStats[]>([]);
  const [error, setError] = useState<string | null>(null);

  const loadStatistics = useCallback(async () => {
    try {
      setError(null);
      const habits = await getHabits();
      
      // Load statistics for each habit
      const statsPromises = habits.map(async (habit) => {
        try {
          const statistics = await getHabitStatistics(habit.id);
          return { habit, statistics };
        } catch (err) {
          console.error(`Error loading stats for habit ${habit.id}:`, err);
          return null;
        }
      });

      const results = await Promise.all(statsPromises);
      const validResults = results.filter((r): r is HabitWithStats => r !== null);
      setHabitsWithStats(validResults);
    } catch (err) {
      console.error('Error loading statistics:', err);
      setError(err instanceof Error ? err.message : 'Erro ao carregar estatísticas');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadStatistics();
  }, [loadStatistics]);

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    loadStatistics();
  }, [loadStatistics]);

  // Calculate total statistics
  const totalStats = habitsWithStats.reduce(
    (acc, { statistics }) => ({
      totalCompletions: acc.totalCompletions + statistics.total_completions,
      maxStreak: Math.max(acc.maxStreak, statistics.longest_streak),
      activeHabits: statistics.current_streak > 0 ? acc.activeHabits + 1 : acc.activeHabits,
    }),
    { totalCompletions: 0, maxStreak: 0, activeHabits: 0 }
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator animating={true} size="large" />
          <Text style={styles.loadingText}>Carregando estatísticas...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text variant="headlineMedium" style={styles.title}>
          Estatísticas
        </Text>
      </View>

      <ScrollView
        style={styles.scrollView}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}>
        {error && (
          <Card style={styles.errorCard}>
            <Card.Content>
              <Text variant="bodyMedium" style={styles.errorText}>
                {error}
              </Text>
            </Card.Content>
          </Card>
        )}

        {habitsWithStats.length === 0 ? (
          <View style={styles.emptyContainer}>
            <List.Icon icon="chart-bar" />
            <Text variant="bodyLarge" style={styles.emptyText}>
              Nenhuma estatística disponível
            </Text>
            <Text variant="bodyMedium" style={styles.emptySubtext}>
              Complete alguns hábitos para ver suas estatísticas
            </Text>
          </View>
        ) : (
          <>
            {/* Overall Statistics */}
            <Card style={styles.card}>
              <Card.Content>
                <Text variant="titleLarge" style={styles.cardTitle}>
                  Resumo Geral
                </Text>
                <View style={styles.statsGrid}>
                  <Surface style={styles.statBox} elevation={1}>
                    <Text variant="displaySmall" style={styles.statNumber}>
                      {totalStats.activeHabits}
                    </Text>
                    <Text variant="bodyMedium" style={styles.statLabel}>
                      Hábitos Ativos
                    </Text>
                  </Surface>
                  <Surface style={styles.statBox} elevation={1}>
                    <Text variant="displaySmall" style={styles.statNumber}>
                      {habitsWithStats.length}
                    </Text>
                    <Text variant="bodyMedium" style={styles.statLabel}>
                      Total de Hábitos
                    </Text>
                  </Surface>
                  <Surface style={styles.statBox} elevation={1}>
                    <Text variant="displaySmall" style={styles.statNumber}>
                      {totalStats.totalCompletions}
                    </Text>
                    <Text variant="bodyMedium" style={styles.statLabel}>
                      Total de Conclusões
                    </Text>
                  </Surface>
                  <Surface style={styles.statBox} elevation={1}>
                    <Text variant="displaySmall" style={styles.statNumber}>
                      {totalStats.maxStreak}
                    </Text>
                    <Text variant="bodyMedium" style={styles.statLabel}>
                      Maior Sequência
                    </Text>
                  </Surface>
                </View>
              </Card.Content>
            </Card>

            {/* Per-Habit Statistics */}
            <Text variant="titleMedium" style={styles.sectionTitle}>
              Por Hábito
            </Text>
            {habitsWithStats.map(({ habit, statistics }) => (
              <Card key={habit.id} style={styles.habitCard}>
                <Card.Content>
                  <View style={styles.habitHeader}>
                    <View style={[styles.colorIndicator, { backgroundColor: habit.color }]} />
                    <View style={styles.habitInfo}>
                      <Text variant="titleMedium">{habit.name}</Text>
                      {habit.category && (
                        <Text variant="bodySmall" style={styles.category}>
                          {habit.category}
                        </Text>
                      )}
                    </View>
                  </View>

                  <View style={styles.habitStatsRow}>
                    <View style={styles.habitStat}>
                      <Text variant="headlineSmall" style={styles.habitStatNumber}>
                        {statistics.total_completions}
                      </Text>
                      <Text variant="bodySmall" style={styles.habitStatLabel}>
                        Conclusões
                      </Text>
                    </View>
                    <View style={styles.habitStat}>
                      <Text variant="headlineSmall" style={styles.habitStatNumber}>
                        {statistics.current_streak}
                      </Text>
                      <Text variant="bodySmall" style={styles.habitStatLabel}>
                        Sequência Atual
                      </Text>
                    </View>
                    <View style={styles.habitStat}>
                      <Text variant="headlineSmall" style={styles.habitStatNumber}>
                        {statistics.longest_streak}
                      </Text>
                      <Text variant="bodySmall" style={styles.habitStatLabel}>
                        Melhor Sequência
                      </Text>
                    </View>
                  </View>
                </Card.Content>
              </Card>
            ))}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontWeight: 'bold',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    marginTop: 8,
  },
  scrollView: {
    flex: 1,
  },
  errorCard: {
    margin: 16,
    backgroundColor: '#ffebee',
  },
  errorText: {
    color: '#c62828',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
    marginTop: 64,
  },
  emptyText: {
    marginTop: 16,
    textAlign: 'center',
    fontWeight: '600',
  },
  emptySubtext: {
    marginTop: 8,
    textAlign: 'center',
    color: '#666',
  },
  card: {
    margin: 16,
    marginBottom: 8,
  },
  cardTitle: {
    marginBottom: 16,
    fontWeight: 'bold',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
  },
  statBox: {
    width: '48%',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  statNumber: {
    fontWeight: 'bold',
    color: '#6200ee',
  },
  statLabel: {
    marginTop: 4,
    textAlign: 'center',
    color: '#666',
  },
  sectionTitle: {
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 8,
    fontWeight: 'bold',
  },
  habitCard: {
    marginHorizontal: 16,
    marginBottom: 12,
  },
  habitHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  colorIndicator: {
    width: 4,
    height: 40,
    borderRadius: 2,
    marginRight: 12,
  },
  habitInfo: {
    flex: 1,
  },
  category: {
    marginTop: 2,
    color: '#666',
  },
  habitStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  habitStat: {
    alignItems: 'center',
  },
  habitStatNumber: {
    fontWeight: 'bold',
    color: '#6200ee',
  },
  habitStatLabel: {
    marginTop: 4,
    color: '#666',
  },
});
