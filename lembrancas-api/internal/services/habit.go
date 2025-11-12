package services

import (
	"errors"
	"time"

	"github.com/google/uuid"
	"github.com/rbbalestrin/lembrancas-api/internal/models"
	"gorm.io/gorm"
)

type HabitService struct {
	db *gorm.DB
}

func NewHabitService(db *gorm.DB) *HabitService {
	return &HabitService{db: db}
}

// Create creates a new habit
func (s *HabitService) Create(habit *models.Habit) error {
	if habit.Frequency == "" {
		habit.Frequency = models.FrequencyDaily
	}
	if habit.Color == "" {
		habit.Color = "#3B82F6"
	}
	return s.db.Create(habit).Error
}

// GetAll retrieves all habits
func (s *HabitService) GetAll() ([]models.Habit, error) {
	var habits []models.Habit
	err := s.db.Find(&habits).Error
	return habits, err
}

// GetByID retrieves a habit by ID
func (s *HabitService) GetByID(id uuid.UUID) (*models.Habit, error) {
	var habit models.Habit
	err := s.db.First(&habit, "id = ?", id).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errors.New("habit not found")
		}
		return nil, err
	}
	return &habit, nil
}

// Update updates an existing habit
func (s *HabitService) Update(id uuid.UUID, habit *models.Habit) error {
	result := s.db.Model(&models.Habit{}).Where("id = ?", id).Updates(habit)
	if result.Error != nil {
		return result.Error
	}
	if result.RowsAffected == 0 {
		return errors.New("habit not found")
	}
	return nil
}

// Delete deletes a habit
func (s *HabitService) Delete(id uuid.UUID) error {
	result := s.db.Delete(&models.Habit{}, "id = ?", id)
	if result.Error != nil {
		return result.Error
	}
	if result.RowsAffected == 0 {
		return errors.New("habit not found")
	}
	return nil
}

// MarkComplete marks a habit as complete for a specific date
func (s *HabitService) MarkComplete(habitID uuid.UUID, date time.Time) error {
	// Check if habit exists
	_, err := s.GetByID(habitID)
	if err != nil {
		return err
	}

	// Normalize date to start of day
	date = time.Date(date.Year(), date.Month(), date.Day(), 0, 0, 0, 0, date.Location())

	// Check if already completed for this date
	var existing models.HabitCompletion
	err = s.db.Where("habit_id = ? AND DATE(completed_at) = DATE(?)", habitID, date).First(&existing).Error
	if err == nil {
		return errors.New("habit already completed for this date")
	}
	if !errors.Is(err, gorm.ErrRecordNotFound) {
		return err
	}

	completion := models.HabitCompletion{
		HabitID:     habitID,
		CompletedAt: date,
	}
	return s.db.Create(&completion).Error
}

// UnmarkComplete removes a completion for a specific date
func (s *HabitService) UnmarkComplete(habitID uuid.UUID, date time.Time) error {
	date = time.Date(date.Year(), date.Month(), date.Day(), 0, 0, 0, 0, date.Location())
	result := s.db.Where("habit_id = ? AND DATE(completed_at) = DATE(?)", habitID, date).Delete(&models.HabitCompletion{})
	if result.Error != nil {
		return result.Error
	}
	if result.RowsAffected == 0 {
		return errors.New("completion not found for this date")
	}
	return nil
}

// GetCompletions retrieves all completions for a habit
func (s *HabitService) GetCompletions(habitID uuid.UUID) ([]models.HabitCompletion, error) {
	var completions []models.HabitCompletion
	err := s.db.Where("habit_id = ?", habitID).Order("completed_at DESC").Find(&completions).Error
	return completions, err
}

// Statistics holds statistics for a habit
type Statistics struct {
	TotalCompletions int       `json:"total_completions"`
	CurrentStreak    int       `json:"current_streak"`
	LongestStreak    int       `json:"longest_streak"`
	CompletionRate   float64   `json:"completion_rate"`
	Completions      []time.Time `json:"completions"`
}

// GetStatistics calculates statistics for a habit
func (s *HabitService) GetStatistics(habitID uuid.UUID) (*Statistics, error) {
	// Check if habit exists
	habit, err := s.GetByID(habitID)
	if err != nil {
		return nil, err
	}

	// Get all completions
	completions, err := s.GetCompletions(habitID)
	if err != nil {
		return nil, err
	}

	stats := &Statistics{
		TotalCompletions: len(completions),
		Completions:      make([]time.Time, 0, len(completions)),
	}

	if len(completions) == 0 {
		return stats, nil
	}

	// Extract dates (completions come in DESC order, we need ASC for streak calculation)
	dates := make([]time.Time, len(completions))
	for i, c := range completions {
		dates[i] = time.Date(c.CompletedAt.Year(), c.CompletedAt.Month(), c.CompletedAt.Day(), 0, 0, 0, 0, c.CompletedAt.Location())
		stats.Completions = append(stats.Completions, dates[i])
	}
	
	// Reverse dates to get chronological order (oldest first) for streak calculation
	for i, j := 0, len(dates)-1; i < j; i, j = i+1, j-1 {
		dates[i], dates[j] = dates[j], dates[i]
	}

	// Calculate streaks
	now := time.Now()
	today := time.Date(now.Year(), now.Month(), now.Day(), 0, 0, 0, 0, now.Location())

	// Current streak (from today backwards)
	currentStreak := 0
	checkDate := today
	for {
		found := false
		for _, d := range dates {
			if d.Equal(checkDate) {
				found = true
				break
			}
		}
		if found {
			currentStreak++
			checkDate = checkDate.AddDate(0, 0, -1)
		} else {
			break
		}
	}
	stats.CurrentStreak = currentStreak

	// Longest streak
	longestStreak := 0
	currentLongest := 0
	prevDate := time.Time{}
	for _, d := range dates {
		if prevDate.IsZero() {
			currentLongest = 1
			prevDate = d
			continue
		}
		daysDiff := int(prevDate.Sub(d).Hours() / 24)
		if daysDiff == 1 {
			currentLongest++
		} else {
			if currentLongest > longestStreak {
				longestStreak = currentLongest
			}
			currentLongest = 1
		}
		prevDate = d
	}
	if currentLongest > longestStreak {
		longestStreak = currentLongest
	}
	stats.LongestStreak = longestStreak

	// Calculate completion rate
	// For daily habits: days since creation
	createdAt := habit.CreatedAt
	daysSinceCreation := int(today.Sub(createdAt).Hours() / 24)
	if daysSinceCreation > 0 {
		stats.CompletionRate = float64(stats.TotalCompletions) / float64(daysSinceCreation) * 100
		if stats.CompletionRate > 100 {
			stats.CompletionRate = 100
		}
	}

	return stats, nil
}

