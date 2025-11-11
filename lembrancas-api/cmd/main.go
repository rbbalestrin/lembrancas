package main

import (
	"log/slog"
	"os"

	"github.com/rbbalestrin/lembrancas-api/internal/database"
)

func main() {
	//logger
	logger := slog.New(slog.NewTextHandler(os.Stdout, nil))
	slog.SetDefault(logger)

	// Database DSN - SQLite
	dsn := "habits.db"
	if envDsn := os.Getenv("DB_DSN"); envDsn != "" {
		dsn = envDsn
	}

	// Connect to database
	db, err := database.Connect(dsn)
	if err != nil {
		slog.Error("failed to connect to database", "error", err)
		os.Exit(1)
	}

	cfg := config{
		addr: ":8080",
		db: dbConfig{
			dsn: dsn,
		},
	}

	api := &application{
		config: cfg,
		db:     db,
	}

	if err := api.run(api.mount()); err != nil {
		slog.Error("servidor falhou em inicia", "error", err)
		os.Exit(1)
	}
}
