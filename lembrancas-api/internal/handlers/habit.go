package handlers

import (
	"encoding/json"
	"net/http"
	"time"

	"log/slog"

	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"
	"github.com/rbbalestrin/lembrancas-api/internal/models"
	"github.com/rbbalestrin/lembrancas-api/internal/services"
)

type HabitHandler struct {
	service *services.HabitService
}

func NewHabitHandler(service *services.HabitService) *HabitHandler {
	return &HabitHandler{service: service}
}

// CreateHabitRequest represents the request body for creating a habit
type CreateHabitRequest struct {
	Name        string           `json:"name" validate:"required"`
	Description string           `json:"description"`
	Frequency   models.Frequency `json:"frequency"`
	Color       string           `json:"color"`
	Category    string           `json:"category"`
}

// UpdateHabitRequest represents the request body for updating a habit
type UpdateHabitRequest struct {
	Name        string           `json:"name"`
	Description string           `json:"description"`
	Frequency   models.Frequency `json:"frequency"`
	Color       string           `json:"color"`
	Category    string           `json:"category"`
}

// CompleteHabitRequest represents the request body for marking a habit complete
type CompleteHabitRequest struct {
	Date string `json:"date"` // Optional, defaults to today in YYYY-MM-DD format
}

// CreateHabit handles POST /api/habits
func (h *HabitHandler) CreateHabit(w http.ResponseWriter, r *http.Request) {
	var req CreateHabitRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondError(w, http.StatusBadRequest, "invalid request body")
		return
	}

	if req.Name == "" {
		respondError(w, http.StatusBadRequest, "name is required")
		return
	}

	habit := &models.Habit{
		Name:        req.Name,
		Description: req.Description,
		Frequency:   req.Frequency,
		Color:       req.Color,
		Category:    req.Category,
	}

	if err := h.service.Create(habit); err != nil {
		slog.Error("failed to create habit", "error", err)
		respondError(w, http.StatusInternalServerError, "failed to create habit")
		return
	}

	respondJSON(w, http.StatusCreated, habit)
}

// GetAllHabits handles GET /api/habits
func (h *HabitHandler) GetAllHabits(w http.ResponseWriter, r *http.Request) {
	habits, err := h.service.GetAll()
	if err != nil {
		slog.Error("failed to get habits", "error", err)
		respondError(w, http.StatusInternalServerError, "failed to retrieve habits")
		return
	}

	respondJSON(w, http.StatusOK, habits)
}

// GetHabit handles GET /api/habits/:id
func (h *HabitHandler) GetHabit(w http.ResponseWriter, r *http.Request) {
	id, err := uuid.Parse(chi.URLParam(r, "id"))
	if err != nil {
		respondError(w, http.StatusBadRequest, "invalid habit ID")
		return
	}

	habit, err := h.service.GetByID(id)
	if err != nil {
		if err.Error() == "habit not found" {
			respondError(w, http.StatusNotFound, "habit not found")
			return
		}
		slog.Error("failed to get habit", "error", err)
		respondError(w, http.StatusInternalServerError, "failed to retrieve habit")
		return
	}

	respondJSON(w, http.StatusOK, habit)
}

// UpdateHabit handles PUT /api/habits/:id
func (h *HabitHandler) UpdateHabit(w http.ResponseWriter, r *http.Request) {
	id, err := uuid.Parse(chi.URLParam(r, "id"))
	if err != nil {
		respondError(w, http.StatusBadRequest, "invalid habit ID")
		return
	}

	var req UpdateHabitRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondError(w, http.StatusBadRequest, "invalid request body")
		return
	}

	habit := &models.Habit{
		Name:        req.Name,
		Description: req.Description,
		Frequency:   req.Frequency,
		Color:       req.Color,
		Category:    req.Category,
	}

	if err := h.service.Update(id, habit); err != nil {
		if err.Error() == "habit not found" {
			respondError(w, http.StatusNotFound, "habit not found")
			return
		}
		slog.Error("failed to update habit", "error", err)
		respondError(w, http.StatusInternalServerError, "failed to update habit")
		return
	}

	// Fetch updated habit
	updatedHabit, err := h.service.GetByID(id)
	if err != nil {
		slog.Error("failed to get updated habit", "error", err)
		respondError(w, http.StatusInternalServerError, "failed to retrieve updated habit")
		return
	}

	respondJSON(w, http.StatusOK, updatedHabit)
}

// DeleteHabit handles DELETE /api/habits/:id
func (h *HabitHandler) DeleteHabit(w http.ResponseWriter, r *http.Request) {
	id, err := uuid.Parse(chi.URLParam(r, "id"))
	if err != nil {
		respondError(w, http.StatusBadRequest, "invalid habit ID")
		return
	}

	if err := h.service.Delete(id); err != nil {
		if err.Error() == "habit not found" {
			respondError(w, http.StatusNotFound, "habit not found")
			return
		}
		slog.Error("failed to delete habit", "error", err)
		respondError(w, http.StatusInternalServerError, "failed to delete habit")
		return
	}

	respondJSON(w, http.StatusOK, map[string]string{"message": "habit deleted successfully"})
}

// MarkComplete handles POST /api/habits/:id/complete
func (h *HabitHandler) MarkComplete(w http.ResponseWriter, r *http.Request) {
	id, err := uuid.Parse(chi.URLParam(r, "id"))
	if err != nil {
		respondError(w, http.StatusBadRequest, "invalid habit ID")
		return
	}

	var req CompleteHabitRequest
	date := time.Now()

	// Try to decode request body, but if empty, use today's date
	json.NewDecoder(r.Body).Decode(&req)
	if req.Date != "" {
		parsedDate, err := time.Parse("2006-01-02", req.Date)
		if err != nil {
			respondError(w, http.StatusBadRequest, "invalid date format, use YYYY-MM-DD")
			return
		}
		date = parsedDate
	}

	if err := h.service.MarkComplete(id, date); err != nil {
		if err.Error() == "habit not found" {
			respondError(w, http.StatusNotFound, "habit not found")
			return
		}
		if err.Error() == "habit already completed for this date" {
			respondError(w, http.StatusConflict, "habit already completed for this date")
			return
		}
		slog.Error("failed to mark habit complete", "error", err)
		respondError(w, http.StatusInternalServerError, "failed to mark habit complete")
		return
	}

	respondJSON(w, http.StatusOK, map[string]string{"message": "habit marked as complete"})
}

// UnmarkComplete handles DELETE /api/habits/:id/complete/:date
func (h *HabitHandler) UnmarkComplete(w http.ResponseWriter, r *http.Request) {
	id, err := uuid.Parse(chi.URLParam(r, "id"))
	if err != nil {
		respondError(w, http.StatusBadRequest, "invalid habit ID")
		return
	}

	dateStr := chi.URLParam(r, "date")
	date, err := time.Parse("2006-01-02", dateStr)
	if err != nil {
		respondError(w, http.StatusBadRequest, "invalid date format, use YYYY-MM-DD")
		return
	}

	if err := h.service.UnmarkComplete(id, date); err != nil {
		if err.Error() == "completion not found for this date" {
			respondError(w, http.StatusNotFound, "completion not found for this date")
			return
		}
		slog.Error("failed to unmark habit complete", "error", err)
		respondError(w, http.StatusInternalServerError, "failed to unmark habit complete")
		return
	}

	respondJSON(w, http.StatusOK, map[string]string{"message": "completion removed"})
}

// GetStatistics handles GET /api/habits/:id/statistics
func (h *HabitHandler) GetStatistics(w http.ResponseWriter, r *http.Request) {
	id, err := uuid.Parse(chi.URLParam(r, "id"))
	if err != nil {
		respondError(w, http.StatusBadRequest, "invalid habit ID")
		return
	}

	stats, err := h.service.GetStatistics(id)
	if err != nil {
		if err.Error() == "habit not found" {
			respondError(w, http.StatusNotFound, "habit not found")
			return
		}
		slog.Error("failed to get statistics", "error", err)
		respondError(w, http.StatusInternalServerError, "failed to retrieve statistics")
		return
	}

	respondJSON(w, http.StatusOK, stats)
}

// GetCompletions handles GET /api/habits/:id/completions
func (h *HabitHandler) GetCompletions(w http.ResponseWriter, r *http.Request) {
	id, err := uuid.Parse(chi.URLParam(r, "id"))
	if err != nil {
		respondError(w, http.StatusBadRequest, "invalid habit ID")
		return
	}

	completions, err := h.service.GetCompletions(id)
	if err != nil {
		slog.Error("failed to get completions", "error", err)
		respondError(w, http.StatusInternalServerError, "failed to retrieve completions")
		return
	}

	respondJSON(w, http.StatusOK, completions)
}

// Helper functions

func respondJSON(w http.ResponseWriter, status int, data interface{}) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	if err := json.NewEncoder(w).Encode(data); err != nil {
		slog.Error("failed to encode response", "error", err)
	}
}

func respondError(w http.ResponseWriter, status int, message string) {
	respondJSON(w, status, map[string]string{"error": message})
}
