import { Reservation } from './types.js';

// In-memory storage
const reservations: Map<string, Reservation> = new Map();

export function getAllReservations(): Reservation[] {
  return Array.from(reservations.values());
}

export function getReservationById(id: string): Reservation | undefined {
  return reservations.get(id);
}

export function getReservationsByRoomId(roomId: string): Reservation[] {
  return getAllReservations()
    .filter((r) => r.roomId === roomId)
    .sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());
}

export function getReservationsByUserId(userId: string): Reservation[] {
  return getAllReservations()
    .filter((r) => r.userId === userId)
    .sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());
}

export function addReservation(reservation: Reservation): void {
  reservations.set(reservation.id, reservation);
}

export function deleteReservation(id: string): boolean {
  return reservations.delete(id);
}

export function hasOverlap(
  roomId: string,
  newStart: Date,
  newEnd: Date
): boolean {
  const roomReservations = getReservationsByRoomId(roomId);
  
  for (const existing of roomReservations) {
    const existingStart = new Date(existing.start);
    const existingEnd = new Date(existing.end);
    
    // Overlap: newStart < existingEnd AND newEnd > existingStart
    // Note: end == start is allowed (touching but not overlapping)
    if (newStart < existingEnd && newEnd > existingStart) {
      return true;
    }
  }
  
  return false;
}
