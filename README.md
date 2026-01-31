# Kokoushuonevaraus-API

Yksinkertainen REST API kokoushuoneiden varaamiseen. Toteutettu Express + TypeScript -pohjalle.

### Teknologiat

![Tehty Cursor AI -kehitysympäristöllä](./made-with-cursor-small.svg)
![Express.js web-sovelluskehys](https://img.shields.io/badge/Express-000000?style=for-the-badge&logo=express&logoColor=white)
![Node.js ajoympäristö](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)
![TypeScript ohjelmointikieli](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)

## Asennus

```bash
npm install
```

## Käynnistys

```bash
# Kehitysympäristö (hot reload)
npm run dev

# Tai tuotantoversio
npm run build
npm start
```

Palvelin käynnistyy osoitteeseen `http://localhost:3000`

## API-endpointit

| Metodi | Polku | Kuvaus |
|--------|-------|--------|
| GET | `/health` | Terveystarkistus |
| POST | `/reservations` | Luo varaus |
| DELETE | `/reservations/:id` | Peruuta varaus |
| GET | `/rooms/:roomId/reservations` | Listaa huoneen varaukset |
| GET | `/users/:userId/reservations` | Listaa käyttäjän varaukset |

## Esimerkkikutsut

### Luo varaus

```bash
curl -X POST http://localhost:3000/reservations \
  -H "Content-Type: application/json" \
  -d '{
    "roomId": "huone-101",
    "userId": "matti",
    "start": "2026-02-01T09:00:00.000Z",
    "end": "2026-02-01T10:00:00.000Z"
  }'
```

### Listaa huoneen varaukset

```bash
curl http://localhost:3000/rooms/huone-101/reservations
```

### Listaa käyttäjän varaukset

```bash
curl http://localhost:3000/users/matti/reservations
```

### Peruuta varaus

```bash
curl -X DELETE http://localhost:3000/reservations/<varauksen-id>
```

## Validoinnit

- `start` täytyy olla ennen `end`-aikaa
- Varauksia ei voi tehdä menneisyyteen
- Päällekkäiset varaukset samaan huoneeseen estetään
- Kaikki kentät (`roomId`, `userId`, `start`, `end`) ovat pakollisia

## Virheviestit

API palauttaa virheet muodossa:

```json
{
  "error": {
    "code": "OVERLAP_CONFLICT",
    "message": "Reservation overlaps with an existing reservation for this room"
  }
}
```

| Koodi | HTTP | Selitys |
|-------|------|---------|
| `INVALID_INPUT` | 400 | Puuttuva tai virheellinen kenttä |
| `INVALID_DATE` | 400 | Virheellinen päivämäärämuoto |
| `START_NOT_BEFORE_END` | 400 | Alkuaika ei ole ennen loppuaikaa |
| `START_IN_PAST` | 400 | Varaus menneisyyteen |
| `OVERLAP_CONFLICT` | 409 | Päällekkäinen varaus |
| `NOT_FOUND` | 404 | Varausta ei löydy |
| `INTERNAL_ERROR` | 500 | Sisäinen virhe |
