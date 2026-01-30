# Promptit

## TL;DR

- Työkalu: Cursor (Opus 4.5)
- Tavoite: kokoushuonevaraus-API Express + TypeScript -pohjalle
- Pyysin AI:ta luomaan endpointit (POST /reservations, DELETE /reservations/:id, GET /rooms/:roomId/reservations),
  in-memory-tallennuksen, validoinnit (tapaaminen ei voi päättyä ennen alkamistaan, tapaamista ei voi varata menneisyyteen, kaksi tapaamista ei voi mennä päällekkäin)
- AI tuotti toimivan toteutuksen kertaheitolla
- Oma tarkistus: ajoin lokaalisti ja testasin, että määritetyt toiminnot ja validoinnit toimivat

## Promptini 

### Ensimmäinen prompti

You are my coding assistant. Generate a minimal Express + TypeScript REST API for a meeting room reservation system.

GOALS (must-have)
1) Implement these endpoints:
   - POST /reservations  (create a reservation)
   - DELETE /reservations/:id  (cancel a reservation)
   - GET /rooms/:roomId/reservations  (list reservations for a room)

2) Use in-memory storage only (no database). Keep it simple and deterministic.

3) Enforce these business rules:
   - No overlapping reservations for the same room.
     Overlap rule: a new reservation overlaps an existing one if
     newStart < existingEnd AND newEnd > existingStart.
     NOTE: end == start should be allowed (no overlap).
   - Reservations cannot be created in the past (compare start time to now).
   - Start time must be strictly before end time.

4) Input/Output:
   - Accept JSON.
   - Use ISO 8601 time strings for start and end (e.g. "2026-02-01T12:00:00Z").
   - Define a Reservation type with: id, roomId, start, end, createdAt.
   - Generate id as a UUID.

5) HTTP behavior:
   - On success: POST returns 201 + created reservation JSON.
   - DELETE success returns 204.
   - GET returns 200 + array of reservations (sorted by start ascending).
   - Errors:
     - 400 for invalid input (missing fields, invalid dates, start>=end, past start).
     - 404 for deleting a non-existing reservation id.
     - 409 for overlap conflict.
   - Error response shape must be consistent:
     { "error": { "code": "<STRING_CODE>", "message": "<HUMAN_MESSAGE>" } }

6) Project setup:
   - Node 18+.
   - TypeScript.
   - Provide a package.json with scripts:
     - npm run dev (uses tsx or ts-node to run src/index.ts)
     - npm run build
     - npm start
   - Provide the full file tree and the complete contents of each file.
   - Keep dependencies minimal.

7) Do NOT include any git instructions.

NICE-TO-HAVE (but still keep it minimal)
- Basic request validation (you can do manual checks; no heavy libraries required).
- A simple GET /health endpoint returning { ok: true }.

OUTPUT FORMAT
- First: file tree.
- Then: each file in its own code block with filename as header.
- Then: short run instructions and 3 example curl commands (create, list, delete).

Remember: keep the code readable and small. No database. No authentication. No UI.

Tähän Opus 4.5 Cursorissa vastasi: 

ll create a minimal Express + TypeScript REST API for the meeting room reservation system.
File Tree
meeting-room-api/├── package.json├── tsconfig.json└── src/    ├── index.ts    ├── types.ts    └── store.ts
Let me create all the files.
mkdir -p meeting-room-api/src
package.json
+24
{  "name": "meeting-room-api",  "version": "1.0.0",  "description": "Minimal meeting room reservation API",
tsconfig.json
+18
{  "compilerOptions": {    "target": "ES2022",    "module": "NodeNext",
types.ts
+31
export interface Reservation {  id: string;  roomId: string;  start: string; // ISO 8601
store.ts
+48
import { Reservation } from './types.js';// In-memory storageconst reservations: Map<string, Reservation> = new Map();
index.ts
+142
import express, { Request, Response } from 'express';import crypto from 'crypto';import {  Reservation,
Now let me install dependencies and verify the build works.
cd meeting-room-api && npm install
17 packages are looking for funding
  run `npm fund` for details

found 0 vulnerabilities
cd meeting-room-api && npm run build
(eval):cd:1: no such file or directory: meeting-room-api
npm run build

> meeting-room-api@1.0.0 build
> tsc

The project is set up and compiles successfully. Here's the complete solution:
File Tree
meeting-room-api/├── package.json├── tsconfig.json└── src/    ├── index.ts      # Express app with routes    ├── types.ts      # TypeScript interfaces & error codes    └── store.ts      # In-memory storage & overlap logic
File Contents
package.json
{  "name": "meeting-room-api",  "version": "1.0.0",  "description": "Minimal meeting room reservation API",  "main": "dist/index.js",  "scripts": {    "dev": "tsx src/index.ts",    "build": "tsc",    "start": "node dist/index.js"  },  "engines": {    "node": ">=18.0.0"  },  "dependencies": {    "express": "^4.18.2"  },  "devDependencies": {    "@types/express": "^4.17.21",    "@types/node": "^20.10.0",    "tsx": "^4.7.0",    "typescript": "^5.3.0"  }}
tsconfig.json
{  "compilerOptions": {    "target": "ES2022",    "module": "NodeNext",    "moduleResolution": "NodeNext",    "outDir": "dist",    "rootDir": "src",    "strict": true,    "esModuleInterop": true,    "skipLibCheck": true,    "forceConsistentCasingInFileNames": true,    "resolveJsonModule": true,    "declaration": true  },  "include": ["src/**/*"],  "exclude": ["node_modules", "dist"]}
src/types.ts
export interface Reservation {  id: string;  roomId: string;  start: string; // ISO 8601  end: string;   // ISO 8601  createdAt: string; // ISO 8601}export interface CreateReservationBody {  roomId?: string;  start?: string;  end?: string;}export interface ApiError {  error: {    code: string;    message: string;  };}// Error codesexport const ErrorCodes = {  INVALID_INPUT: 'INVALID_INPUT',  INVALID_DATE: 'INVALID_DATE',  START_NOT_BEFORE_END: 'START_NOT_BEFORE_END',  START_IN_PAST: 'START_IN_PAST',  OVERLAP_CONFLICT: 'OVERLAP_CONFLICT',  NOT_FOUND: 'NOT_FOUND',} as const;
src/store.ts
import { Reservation } from './types.js';// In-memory storageconst reservations: Map<string, Reservation> = new Map();export function getAllReservations(): Reservation[] {  return Array.from(reservations.values());}export function getReservationById(id: string): Reservation | undefined {  return reservations.get(id);}export function getReservationsByRoomId(roomId: string): Reservation[] {  return getAllReservations()    .filter((r) => r.roomId === roomId)    .sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());}export function addReservation(reservation: Reservation): void {  reservations.set(reservation.id, reservation);}export function deleteReservation(id: string): boolean {  return reservations.delete(id);}export function hasOverlap(  roomId: string,  newStart: Date,  newEnd: Date): boolean {  const roomReservations = getReservationsByRoomId(roomId);    for (const existing of roomReservations) {    const existingStart = new Date(existing.start);    const existingEnd = new Date(existing.end);        // Overlap: newStart < existingEnd AND newEnd > existingStart    // Note: end == start is allowed (touching but not overlapping)    if (newStart < existingEnd && newEnd > existingStart) {      return true;    }  }    return false;}
src/index.ts
import express, { Request, Response } from 'express';import crypto from 'crypto';import {  Reservation,  CreateReservationBody,  ApiError,  ErrorCodes,} from './types.js';import {  addReservation,  deleteReservation,  getReservationById,  getReservationsByRoomId,  hasOverlap,} from './store.js';const app = express();const PORT = process.env.PORT || 3000;app.use(express.json());// Helper to create error responsefunction errorResponse(code: string, message: string): ApiError {  return { error: { code, message } };}// Helper to validate ISO 8601 date stringfunction isValidISODate(dateStr: string): boolean {  const date = new Date(dateStr);  return !isNaN(date.getTime()) && dateStr === date.toISOString();}// Health checkapp.get('/health', (_req: Request, res: Response) => {  res.json({ ok: true });});// POST /reservations - Create a reservationapp.post('/reservations', (req: Request, res: Response) => {  const body = req.body as CreateReservationBody;  // Validate required fields  if (!body.roomId || !body.start || !body.end) {    res.status(400).json(      errorResponse(        ErrorCodes.INVALID_INPUT,        'Missing required fields: roomId, start, and end are required'      )    );    return;  }  const { roomId, start, end } = body;  // Validate date formats  if (!isValidISODate(start) || !isValidISODate(end)) {    res.status(400).json(      errorResponse(        ErrorCodes.INVALID_DATE,        'Invalid date format. Use ISO 8601 (e.g., "2026-02-01T12:00:00.000Z")'      )    );    return;  }  const startDate = new Date(start);  const endDate = new Date(end);  const now = new Date();  // Validate start < end  if (startDate >= endDate) {    res.status(400).json(      errorResponse(        ErrorCodes.START_NOT_BEFORE_END,        'Start time must be strictly before end time'      )    );    return;  }  // Validate not in the past  if (startDate < now) {    res.status(400).json(      errorResponse(        ErrorCodes.START_IN_PAST,        'Reservations cannot be created in the past'      )    );    return;  }  // Check for overlapping reservations  if (hasOverlap(roomId, startDate, endDate)) {    res.status(409).json(      errorResponse(        ErrorCodes.OVERLAP_CONFLICT,        'Reservation overlaps with an existing reservation for this room'      )    );    return;  }  // Create reservation  const reservation: Reservation = {    id: crypto.randomUUID(),    roomId,    start,    end,    createdAt: new Date().toISOString(),  };  addReservation(reservation);  res.status(201).json(reservation);});// DELETE /reservations/:id - Cancel a reservationapp.delete('/reservations/:id', (req: Request, res: Response) => {  const { id } = req.params;  const reservation = getReservationById(id);  if (!reservation) {    res.status(404).json(      errorResponse(ErrorCodes.NOT_FOUND, `Reservation with id '${id}' not found`)    );    return;  }  deleteReservation(id);  res.status(204).send();});// GET /rooms/:roomId/reservations - List reservations for a roomapp.get('/rooms/:roomId/reservations', (req: Request, res: Response) => {  const { roomId } = req.params;  const reservations = getReservationsByRoomId(roomId);  res.status(200).json(reservations);});app.listen(PORT, () => {  console.log(`Server running on http://localhost:${PORT}`);});
Run Instructions
cd meeting-room-api# Install dependencies (already done)npm install# Development mode (hot reload with tsx)npm run dev# Or build and run productionnpm run buildnpm start
The server runs on http://localhost:3000 by default (override with PORT env var).
Example curl Commands
1. Create a reservation:
curl -X POST http://localhost:3000/reservations \  -H "Content-Type: application/json" \  -d '{    "roomId": "room-101",    "start": "2026-02-01T10:00:00.000Z",    "end": "2026-02-01T11:00:00.000Z"  }'
2. List reservations for a room:
curl http://localhost:3000/rooms/room-101/reservations
3. Delete a reservation (replace <id> with actual UUID from step 1):
curl -X DELETE http://localhost:3000/reservations/<id>
Key Design Notes
Aspect	Choice	Trade-off
UUID generation	Node's built-in crypto.randomUUID()	No external dependency; requires Node 18+
Date validation	Strict ISO 8601 check (must match toISOString() output)	Rejects valid but non-canonical formats like 2026-02-01T12:00:00Z (missing .000) — keeps validation deterministic
Storage	Map<string, Reservation>	O(1) lookup by ID, O(n) for room filtering — fine for in-memory demo
Overlap check	Linear scan per room	Simple and correct; optimize if scaling needed




