# Promptit

## Ensimmäinen prompti

### TL;DR

- Työkalu: Cursor (Opus 4.5)
- Tavoite: kokoushuonevaraus-API Express + TypeScript -pohjalle
- Pyysin AI:ta luomaan endpointit (POST /reservations, DELETE /reservations/:id, GET /rooms/:roomId/reservations),
  in-memory-tallennuksen, validoinnit (tapaaminen ei voi päättyä ennen alkamistaan, tapaamista ei voi varata menneisyyteen, kaksi tapaamista ei voi mennä päällekkäin)
- AI tuotti toimivan toteutuksen kertaheitolla
- Oma tarkistus: ajoin lokaalisti ja testasin, että määritetyt toiminnot ja validoinnit toimivat

### Prompti

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

### AI:n vastaus ensimmäiseen promptiin:

I'll create a minimal Express + TypeScript REST API for the meeting room reservation system.

**File Tree**

```
meeting-room-api/
├── package.json
├── tsconfig.json
└── src/
    ├── index.ts
    ├── types.ts
    └── store.ts
```

Let me create all the files.

```bash
mkdir -p meeting-room-api/src
```
**package.json** +24

```json
{  "name": "meeting-room-api",  "version": "1.0.0",  "description": "Minimal meeting room reservation API",
```

**tsconfig.json** +18

```json
{  "compilerOptions": {    "target": "ES2022",    "module": "NodeNext",
```

**types.ts** +31

```typescript
export interface Reservation {  id: string;  roomId: string;  start: string; // ISO 8601
```

**store.ts** +48

```typescript
import { Reservation } from './types.js';// In-memory storageconst reservations: Map<string, Reservation> = new Map();
```

**index.ts** +142

```typescript
import express, { Request, Response } from 'express';import crypto from 'crypto';import {  Reservation,
```

Now let me install dependencies and verify the build works.

```bash
cd meeting-room-api && npm install
```

```
17 packages are looking for funding
  run `npm fund` for details

found 0 vulnerabilities
```

```bash
cd meeting-room-api && npm run build
```

```
(eval):cd:1: no such file or directory: meeting-room-api
```

```bash
npm run build
```

```
> meeting-room-api@1.0.0 build
> tsc
```

The project is set up and compiles successfully. Here's the complete solution:

**File Tree**

```
meeting-room-api/
├── package.json
├── tsconfig.json
└── src/
    ├── index.ts      # Express app with routes
    ├── types.ts      # TypeScript interfaces & error codes
    └── store.ts      # In-memory storage & overlap logic
```

**File Contents**

**package.json**

```json
{
  "name": "meeting-room-api",
  "version": "1.0.0",
  "description": "Minimal meeting room reservation API",
  "main": "dist/index.js",
  "scripts": {
    "dev": "tsx src/index.ts",
    "build": "tsc",
    "start": "node dist/index.js"
  },
  "engines": {
    "node": ">=18.0.0"
  },
  "dependencies": {
    "express": "^4.18.2"
  },
  "devDependencies": {
    "@types/express": "^4.17.21",
    "@types/node": "^20.10.0",
    "tsx": "^4.7.0",
    "typescript": "^5.3.0"
  }
}
```
**tsconfig.json**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "outDir": "dist",
    "rootDir": "src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "declaration": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```
**src/types.ts**

```typescript
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
```
**src/store.ts**

```typescript
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
```
**src/index.ts**

```typescript
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
  return !isNaN(date.getTime()) && dateStr === date.toISOString();
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
        'Invalid date format. Use ISO 8601 (e.g., "2026-02-01T12:00:00.000Z")'
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
```
**Run Instructions**

```bash
cd meeting-room-api

# Install dependencies (already done)
npm install

# Development mode (hot reload with tsx)
npm run dev

# Or build and run production
npm run build
npm start
```

The server runs on http://localhost:3000 by default (override with PORT env var).

**Example curl Commands**

1. Create a reservation:

```bash
curl -X POST http://localhost:3000/reservations \
  -H "Content-Type: application/json" \
  -d '{
    "roomId": "room-101",
    "start": "2026-02-01T10:00:00.000Z",
    "end": "2026-02-01T11:00:00.000Z"
  }'
```

2. List reservations for a room:

```bash
curl http://localhost:3000/rooms/room-101/reservations
```

3. Delete a reservation (replace <id> with actual UUID from step 1):

```bash
curl -X DELETE http://localhost:3000/reservations/<id>
```
**Key Design Notes**

| Aspect | Choice | Trade-off |
| ------ | ------ | --------- |
| UUID generation | Node's built-in crypto.randomUUID() | No external dependency; requires Node 18+ |
| Date validation | Strict ISO 8601 check (must match toISOString() output) | Rejects valid but non-canonical formats like 2026-02-01T12:00:00Z (missing .000) — keeps validation deterministic |
| Storage | Map<string, Reservation> | O(1) lookup by ID, O(n) for room filtering — fine for in-memory demo |
| Overlap check | Linear scan per room | Simple and correct; optimize if scaling needed |



## Toinen prompti 

How would you write a prompt to yourself, if you want  yourself to 
1. Review the code for modern best practices
2. Point out any major issues and problematic solutions
3. For each of those, explain what is problematic about them
4. And offer a couple different options on how they could be solved

### Ai:n vastaus

Review my Express + TypeScript reservation API for modern best practices (Express 4/5, TypeScript 5, Node 18+). Focus on:

- API design & HTTP semantics
- TypeScript usage (types, safety, inference)
- Error handling patterns
- Code organization & maintainability
- Security considerations

For each issue you find:
1. What: Describe the problem in 1-2 sentences
2. Why it matters: Explain the real-world consequence (bugs, security, DX, performance)
3. Options to fix: Provide 2-3 approaches with trade-offs

Prioritize issues by severity (critical > important > minor). Skip nitpicks like formatting or naming preferences. If the code is fine in some area, don't invent problems.

Files to review:
- src/index.ts
- src/store.ts  
- src/types.ts

## Kolmas prompti

### TL;DR
- Työkalu: Cursor (Opus 4.5)
- Tavoite: koodikatselmointi, jossa mukana korjausehdotukset.
- Opus löysi seuraavat parannuskohteet/bugit:
1) Ajanvarauksen ajan validointi on liian tiukka (otti huomioon millisekunnitkin)
2) Request body body tarkistetaan vain typescriptillä ilman ajonaikaista validointia
3) Puuttuu globaali virheenhallinta, jolloin virhevastaukset voivat olla epäyhtenäisiä ja vuotaa palvelintietoa
4) Virhefunktio ei käytä virhekoodien tyypitystä, typot virhekoodeissa voivat jäädä huomaamatta
5) In-memory storea ei voi nollata helposti jolloin testien tekeminen voi olla hankalaa
6) Agentti huomautti myös että päivämääriä parsitaan moneen kertaan (string → Date useissa kohdissa), ja voisi ehkä siistiä sen

Agentti kysyi, haluaisinko että se toteuttaa edellisen vastauksen koodikatselemuksen. Vaihdoin agenttimodeen ja sanoin "Yes, please" jolloin sain seuraavan vastauksen:  

### Tekoälyn vastaus

**Code Review: Express + TypeScript Reservation API**

#### Critical Issues

> **1. ISO 8601 Validation is Too Strict**

**What:** isValidISODate() requires the input string to exactly match JavaScript's toISOString() output, which always includes milliseconds (.000Z).

`index.ts` Lines 28-31

```typescript
function isValidISODate(dateStr: string): boolean {
  const date = new Date(dateStr);
  return !isNaN(date.getTime()) && dateStr === date.toISOString();
}
```

**Why it matters:** Valid ISO 8601 dates like "2026-02-01T09:00:00Z" will be rejected. Users will get confusing INVALID_DATE errors for perfectly valid input.

**Options to fix:**

| Option | Code | Trade-off |
| ------ | ---- | --------- |
| A) Relaxed check | `return !isNaN(new Date(dateStr).getTime())` | Accepts more formats (e.g., "Feb 1 2026"), less strict |
| B) Regex + parse | Check format with regex, then validate parseable | More code, but precise control |
| C) Use a library | date-fns or dayjs with strict parsing | Adds dependency, but battle-tested |

**Recommendation:** Option A for simplicity, or B if you want to enforce Z-suffix UTC times specifically.


#### Important Issues

> **2. Type Assertion Instead of Runtime Validation**

**What:** req.body as CreateReservationBody tells TypeScript to trust the type, but provides no runtime guarantee.

`index.ts` Lines 40-40

```typescript
const body = req.body as CreateReservationBody;
```

**Why it matters:** If someone sends { "roomId": 123 } (number instead of string), TypeScript won't catch it. Your code will happily store 123 as the roomId, which may cause subtle bugs downstream.

**Options to fix:**

| Option | Approach | Trade-off |
| ------ | -------- | --------- |
| A) Manual type guards | Check `typeof body.roomId === 'string'` explicitly | No deps, verbose |
| B) Zod schema | `const schema = z.object({ roomId: z.string(), ... })` | Clean, auto-generates types, adds ~50KB |
| C) class-validator | Decorators on a DTO class | More OOP-style, heavier |

**Recommendation:** Zod (option B) is the modern standard for TypeScript APIs. It's lightweight and gives you both validation + type inference.

> **3. No Global Error Handler**

**What:** There's no app.use((err, req, res, next) => ...) error middleware.

**Why it matters:**
- Malformed JSON in POST body → Express returns raw HTML error
- Uncaught exceptions → Process may crash or leak stack traces
- Inconsistent error format with your ApiError structure

**Options to fix:**

| Option | Approach | Trade-off |
| ------ | -------- | --------- |
| A) Simple middleware | Add error handler that wraps all errors in ApiError format | Minimal, covers basics |
| B) express-async-errors | Package that auto-catches async errors | One-liner, but adds dependency |
| C) Wrap routes in try-catch | Manual error handling per route | Repetitive, error-prone |

**Recommendation:** Option A—add a simple error middleware at the end of your route definitions:

```typescript
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error(err);
  res.status(500).json(errorResponse('INTERNAL_ERROR', 'Something went wrong'));
});
```

> **4. Weak Type on errorResponse Function**

**What:** The code parameter is typed as string, not constrained to your ErrorCodes.

`index.ts` Lines 23-25

```typescript
function errorResponse(code: string, message: string): ApiError {
  return { error: { code, message } };
}
```

**Why it matters:** You could accidentally pass a typo like 'INVLAID_INPUT' and TypeScript wouldn't catch it.

**Options to fix:**

| Option | Approach | Trade-off |
| ------ | -------- | --------- |
| A) Union type | `code: keyof typeof ErrorCodes` | Requires passing ErrorCodes.X not the string |
| B) Value union | `code: typeof ErrorCodes[keyof typeof ErrorCodes]` | Allows string literals that match |
| C) Extract type | `type ErrorCode = typeof ErrorCodes[keyof typeof ErrorCodes]` in types.ts | Cleaner, reusable |

**Recommendation:** Option C—define the type once in types.ts and use it everywhere.

#### Minor Issues

> **5. Module-Level Mutable State in Store**

**What:** const reservations: Map<...> is module-level state with no way to reset it.

`store.ts` Lines 4-4

```typescript
const reservations: Map<string, Reservation> = new Map();
```

**Why it matters:** Makes unit testing harder—state persists between tests unless you add a clearAll() function or use dependency injection.

**Options to fix:**

| Option | Approach | Trade-off |
| ------ | -------- | --------- |
| A) Add reset function | Export clearReservations() for tests | Simple, slightly pollutes API |
| B) Class-based store | class ReservationStore with instance state | More flexible, more code |
| C) Leave as-is | Acceptable for this scope | Fine for a minimal API |

**Recommendation:** For a minimal API, just add a clearReservations() function if/when you write tests.

> **6. Repeated Date Conversions**

**What:** Dates are stored as strings, but converted to Date objects multiple times (in validation, in hasOverlap, etc.).

**Why it matters:** Minor performance overhead and potential for inconsistency if parsing behaves differently in edge cases.

**Options to fix:**

| Option | Approach | Trade-off |
| ------ | -------- | --------- |
| A) Store as timestamps | Store start/end as numbers (ms since epoch) | Faster comparisons, less readable in JSON |
| B) Parse once, pass Date objects | Validate early, pass Date through the stack | Requires refactoring store API |
| C) Leave as-is | ISO strings are human-readable in responses | Acceptable, current approach |

**Recommendation:** Option C is fine for this scale. Revisit if performance matters.

---

#### Summary

| Severity  | Issue                     | Recommended fix           |
| --------- | ------------------------- | ------------------------- |
| Critical  | Strict ISO validation     | Relax check / regex+parse |
| Important | No runtime validation     | Add Zod                   |
| Important | No global error handler   | Add error middleware      |
| Important | Weak errorResponse typing | Extract `ErrorCode` type  |
| Minor     | Store not resettable      |                           |

The codebase is clean and well-organized for its scope. The critical ISO validation issue will cause real user friction—I'd fix that first. The others are worth addressing as the project grows.

Want me to implement any of these fixes?

## Neljäs prompti

- Ensin Latasin Github CLI:n jonka kautta pystyy tekemään githubiin terminalin avulla issueita
- käskin tekoälyä kirjoittamaan issuet edellisen bugiraportoinnin perusteella
- klikkasin Githubissa auki "project" välilehden, loin uuden projektin ja varmistin että tarvittavat automaatiot ovat päällä
- tämän jälkeen käskin tekoälyä aloittamaan ensimmäisestä issuesta jonka se oli Githubiin vienyt

### Promptini: 

 I would like you to  track our issues you found in the previous commit (issues number 1-4 which are considered as critical or important) and write those as tickets you can execute later one by one.

### Tekoälyn vastaus

Let me verify the authentication and then create all 4 issues.

```bash
gh auth status
```

```
github.com
  ✓ Logged in to github.com account MilicaKrivokapic (keyring)
  - Active account: true
  - Git operations protocol: https
  - Token: gho_************************************
  - Token scopes: 'gist', 'read:org', 'repo'
```

Authenticated. Now I'll create all 4 issues.

```bash
gh issue create --title "fix: relax ISO 8601 date validation to accept standard formats" --label "bug"
Critical
Problem
The isValidISODate() function in src/index.ts (lines 28-31) requires an exact milliseconds format, rejecting valid ISO dates like 2026-02-01T09:00:00Z.
Impact
Users get INVALID_DATE errors for valid input.
Proposed Solution
Relax validation to only check if the date parses correctly:
typescript
function isValidISODate(dateStr: string): boolean {
  const date = new Date(dateStr);
  return !isNaN(date.getTime());
}
Files to Change
- src/index.ts (lines 28-31)
Acceptance Criteria
- Valid ISO dates without milliseconds are accepted
- Invalid dates are still rejected"
```

```bash
gh issue create --title "feat: add Zod schema for runtime request validation" --label "enhancement" --body "## Problem
\`req.body as CreateReservationBody\` is a type assertion with no runtime guarantee. Invalid input types (e.g. \`roomId: 123\`) slip through.

Solution
Install Zod, create a schema, validate incoming requests with proper error messages.

Files
- \`src/index.ts\` (line 40)
- \`src/types.ts\` (add schema)"
```

```bash
gh issue create --title "feat: add global error handling middleware" --label "enhancement" --body "## Problem
No error middleware exists. Unhandled errors (e.g. malformed JSON) return inconsistent responses or leak stack traces.
Solution
Add Express error middleware that catches all errors and returns consistent \`ApiError\` format.
Files
- \`src/index.ts\` (add middleware before \`app.listen\`)"
```

```bash
gh issue create --title "refactor: enforce ErrorCode type for type-safe error responses" --body "## Problem
\`errorResponse(code: string, ...)\` accepts any string, allowing typos like \`'INVLAID_INPUT'\` without TypeScript catching it.

Solution
Extract \`ErrorCode\` type from \`ErrorCodes\` object and use it in the function signature.

Files
- \`src/types.ts\` (add type export)
- \`src/index.ts\` (update function signature)"
```





|  # | Title                                       | URL |
| -: | ------------------------------------------- | :-: |
|  1 | fix: relax ISO 8601 date validation         |  #1 |
|  2 | feat: add Zod schema for runtime validation |  #2 |
|  3 | feat: add global error handling middleware  |  #3 |
|  4 | refactor: enforce ErrorCode type            |  #4 |

View all issues: https://github.com/MilicaKrivokapic/meeting-room-api/issues

**Next steps:**
- You can create a Project board in GitHub and add these issues
- When you're ready, tell me which issue to implement first
- Each commit will reference the issue (e.g., fixes #1) so it auto-closes when merged

Which issue would you like me to tackle first?