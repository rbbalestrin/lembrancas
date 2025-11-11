package main

import (
	"log"
	"net/http"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
	"github.com/rbbalestrin/lembrancas-api/internal/handlers"
	corsMiddleware "github.com/rbbalestrin/lembrancas-api/internal/middleware"
	"github.com/rbbalestrin/lembrancas-api/internal/services"
	"gorm.io/gorm"
)

type application struct {
	config config
	db     *gorm.DB
}

// mount
func (app *application) mount() http.Handler {
	r := chi.NewRouter()

	//middleware
	r.Use(corsMiddleware.CORS)   // CORS support
	r.Use(middleware.RequestID)  // rate limiting
	r.Use(middleware.RealIP)     // rate limiting e analytics e tracing
	r.Use(middleware.Logger)     // logger bonito
	r.Use(middleware.Recoverer)

	r.Use(middleware.Timeout(60 * time.Second))

	// Health check
	r.Get("/", func(w http.ResponseWriter, r *http.Request) {
		w.Write([]byte("não tao no teto... ta suave."))
	})

	// Initialize services and handlers
	habitService := services.NewHabitService(app.db)
	habitHandler := handlers.NewHabitHandler(habitService)

	// API routes
	r.Route("/api", func(r chi.Router) {
		r.Route("/habits", func(r chi.Router) {
			r.Post("/", habitHandler.CreateHabit)
			r.Get("/", habitHandler.GetAllHabits)
			r.Get("/{id}", habitHandler.GetHabit)
			r.Put("/{id}", habitHandler.UpdateHabit)
			r.Delete("/{id}", habitHandler.DeleteHabit)
			r.Post("/{id}/complete", habitHandler.MarkComplete)
			r.Delete("/{id}/complete/{date}", habitHandler.UnmarkComplete)
			r.Get("/{id}/statistics", habitHandler.GetStatistics)
			r.Get("/{id}/completions", habitHandler.GetCompletions)
		})
	})

	return r
}

func (app *application) run(h http.Handler) error {
	srv := &http.Server{
		Addr:         app.config.addr,
		Handler:      h,
		WriteTimeout: time.Second * 30,
		ReadTimeout:  time.Second * 30,
		IdleTimeout:  time.Minute,
	}
	log.Printf("server iniciado em addr %s", app.config.addr)

	return srv.ListenAndServe()
}

type config struct {
	addr string //endereço da api ex 8000
	db   dbConfig
}

type dbConfig struct {
	dsn string //domain string para conectar na database
}
