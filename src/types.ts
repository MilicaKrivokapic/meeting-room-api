export interface Reservation {
  id: string;
  roomId: string;
  start: string; // ISO 8601
  end: string;   // ISO 8601
  createdAt: string; // ISO 8601
}

export interface CreateReservationBody {
  roomId?: string;
  start?: string;
  end?: string;
}

export interface ApiError {
  error: {
    code: string;
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
} as const;
