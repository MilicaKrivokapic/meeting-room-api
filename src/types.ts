import { z } from 'zod';

export interface Reservation {
  id: string;
  roomId: string;
  start: string; // ISO 8601
  end: string;   // ISO 8601
  createdAt: string; // ISO 8601
}

// Zod schema for runtime validation
export const CreateReservationSchema = z.object({
  roomId: z.string().min(1, 'roomId is required'),
  start: z.string().min(1, 'start is required'),
  end: z.string().min(1, 'end is required'),
});

// Infer type from schema
export type CreateReservationBody = z.infer<typeof CreateReservationSchema>;

export interface ApiError {
  error: {
    code: ErrorCode;
    message: string;
  };
}

// Error codes
export const ErrorCodes = {
  INVALID_INPUT: 'INVALID_INPUT',
  INVALID_DATE: 'INVALID_DATE',
  START_NOT_BEFORE_END: 'START_NOT_BEFORE_END',
  START_IN_PAST: 'START_IN_PAST',
  OVERLAP_CONFLICT: 'OVERLAP_CONFLICT',
  NOT_FOUND: 'NOT_FOUND',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
} as const;

// Type-safe error code type (extracted from ErrorCodes values)
export type ErrorCode = typeof ErrorCodes[keyof typeof ErrorCodes];
