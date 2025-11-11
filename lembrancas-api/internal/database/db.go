package database

import (
	"log/slog"

	"github.com/glebarez/sqlite"
	"github.com/rbbalestrin/lembrancas-api/internal/models"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

// Connect initializes and returns a database connection
func Connect(dsn string) (*gorm.DB, error) {
	db, err := gorm.Open(sqlite.Open(dsn), &gorm.Config{
		Logger: logger.Default.LogMode(logger.Info),
	})
	if err != nil {
		return nil, err
	}

	// Auto-migrate models
	if err := db.AutoMigrate(&models.Habit{}, &models.HabitCompletion{}); err != nil {
		return nil, err
	}

	slog.Info("database connected and migrated successfully")
	return db, nil
}

