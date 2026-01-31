import express, { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import {
  Reservation,
  CreateReservationSchema,
  ApiError,
  ErrorCodes,
} from './types.js';
import {
  addReservation,
  deleteReservation,
  getReservationById,
  getReservationsByRoomId,
  hasOverlap,
} from './store.js';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// Helper to create error response
function errorResponse(code: string, message: string): ApiError {
  return { error: { code, message } };
}

// Helper to validate ISO 8601 date string
function isValidISODate(dateStr: string): boolean {
  const date = new Date(dateStr);
  return !isNaN(date.getTime());
}

// Health check
app.get('/health', (_req: Request, res: Response) => {
  res.json({ ok: true });
});

// POST /reservations - Create a reservation
app.post('/reservations', (req: Request, res: Response) => {
  // Validate request body with Zod
  const result = CreateReservationSchema.safeParse(req.body);
  if (!result.success) {
    const firstError = result.error.issues[0];
    res.status(400).json(
      errorResponse(
        ErrorCodes.INVALID_INPUT,
        firstError.message
      )
    );
    return;
  }

  const { roomId, start, end } = result.data;

  // Validate date formats
  if (!isValidISODate(start) || !isValidISODate(end)) {
    res.status(400).json(
      errorResponse(
        ErrorCodes.INVALID_DATE,
        'Invalid date format. Use ISO 8601 (e.g., "2026-02-01T12:00:00Z")'
      )
    );
    return;
  }

  const startDate = new Date(start);
  const endDate = new Date(end);
  const now = new Date();

  // Validate start < end
  if (startDate >= endDate) {
    res.status(400).json(
      errorResponse(
        ErrorCodes.START_NOT_BEFORE_END,
        'Start time must be strictly before end time'
      )
    );
    return;
  }

  // Validate not in the past
  if (startDate < now) {
    res.status(400).json(
      errorResponse(
        ErrorCodes.START_IN_PAST,
        'Reservations cannot be created in the past'
      )
    );
    return;
  }

  // Check for overlapping reservations
  if (hasOverlap(roomId, startDate, endDate)) {
    res.status(409).json(
      errorResponse(
        ErrorCodes.OVERLAP_CONFLICT,
        'Reservation overlaps with an existing reservation for this room'
      )
    );
    return;
  }

  // Create reservation
  const reservation: Reservation = {
    id: crypto.randomUUID(),
    roomId,
    start,
    end,
    createdAt: new Date().toISOString(),
  };

  addReservation(reservation);
  res.status(201).json(reservation);
});

// DELETE /reservations/:id - Cancel a reservation
app.delete('/reservations/:id', (req: Request, res: Response) => {
  const { id } = req.params;

  const reservation = getReservationById(id);
  if (!reservation) {
    res.status(404).json(
      errorResponse(ErrorCodes.NOT_FOUND, `Reservation with id '${id}' not found`)
    );
    return;
  }

  deleteReservation(id);
  res.status(204).send();
});

// GET /rooms/:roomId/reservations - List reservations for a room
app.get('/rooms/:roomId/reservations', (req: Request, res: Response) => {
  const { roomId } = req.params;
  const reservations = getReservationsByRoomId(roomId);
  res.status(200).json(reservations);
});

// Global error handler - catches unhandled errors and returns consistent ApiError format
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error('Unhandled error:', err.message);
  res.status(500).json(
    errorResponse(ErrorCodes.INTERNAL_ERROR, 'An unexpected error occurred')
  );
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
