package models

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// Frequency represents the frequency type for a habit
type Frequency string

const (
	FrequencyDaily  Frequency = "daily"
	FrequencyWeekly Frequency = "weekly"
	FrequencyCustom Frequency = "custom"
)

// Habit represents a habit in the system
type Habit struct {
	ID          uuid.UUID         `json:"id" gorm:"type:text;primaryKey"`
	Name        string            `json:"name" gorm:"not null"`
	Description string            `json:"description"`
	Frequency   Frequency         `json:"frequency" gorm:"type:varchar(20);not null;default:daily"`
	Color       string            `json:"color" gorm:"type:varchar(7);not null;default:#3B82F6"`
	Category    string            `json:"category"`
	CreatedAt   time.Time         `json:"created_at"`
	UpdatedAt   time.Time         `json:"updated_at"`
	Completions []HabitCompletion `json:"completions,omitempty" gorm:"foreignKey:HabitID;constraint:OnDelete:CASCADE"`
}

// BeforeCreate hook to generate UUID
func (h *Habit) BeforeCreate(tx *gorm.DB) error {
	if h.ID == uuid.Nil {
		h.ID = uuid.New()
	}
	return nil
}

// HabitCompletion represents a completion record for a habit
type HabitCompletion struct {
	ID          uuid.UUID `json:"id" gorm:"type:text;primaryKey"`
	HabitID     uuid.UUID `json:"habit_id" gorm:"type:text;not null;index"`
	CompletedAt time.Time `json:"completed_at" gorm:"not null;index"`
	Notes       string    `json:"notes"`
	CreatedAt   time.Time `json:"created_at"`
}

// BeforeCreate hook to generate UUID
func (hc *HabitCompletion) BeforeCreate(tx *gorm.DB) error {
	if hc.ID == uuid.Nil {
		hc.ID = uuid.New()
	}
	return nil
}
