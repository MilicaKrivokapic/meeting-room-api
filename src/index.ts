import express, { Request, Response } from 'express';
import crypto from 'crypto';
import {
  Reservation,
  CreateReservationBody,
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
  const body = req.body as CreateReservationBody;

  // Validate required fields
  if (!body.roomId || !body.start || !body.end) {
    res.status(400).json(
      errorResponse(
        ErrorCodes.INVALID_INPUT,
        'Missing required fields: roomId, start, and end are required'
      )
    );
    return;
  }

  const { roomId, start, end } = body;

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

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
