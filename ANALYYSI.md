# ANALYYSI

## 1. Mitä tekoäly teki hyvin? 


Tekoäly tuotti toimivan Express + TypeScript -pohjaisen REST API:n yhdellä promptilla. Koodi oli jaettu loogisesti kolmeen tiedostoon (routes, store, types) ilman turhaa monimutkaisuutta tai kilometrien pituista AI-sloppia. 

Erityisen hyödyllinen oli tekoälyn koodikatselmointi: se tunnisti todelliset ongelmat kuten liian tiukan päivämäärävalidoinnin ja puuttuvan ajonaikaisen tyypintarkistuksen. Korjausehdotukset sisälsivät useita vaihtoehtoja perusteluineen, se oli innostavaa ja inspiroivaa. Varmistin vielä netistä tietoa etsimällä että teen varmasti oikeita asioita ja korjauksissa on järkeä. 

Myös GitHub-workflow sujui hyvin, tekoäly loi issuet CLI:n kautta yllättävän täpäkästi.

## 2. Mitä tekoäly teki huonosti?

Tekoäly kirjoitti commit-viestit englanniksi, vaikka tehtävänannossa vaadittiin suomenkielisiä committeja. Tämä oli kuitenkin oma virheeni koska unohdin mainita kielivaatimuksen promptissa. Suomeksi committaaminen oli myös itselleni epäluontevaa, sillä en ole koskaan töissä tai omissanikaan projekteissa commitannut tai kommentoinut koodia suomeksi. 

Kaiken kaikkiaan tekoäly teki sen, mitä pyysin. Tämä on sekä vahvuus että heikkous. Tekoäly ei esimerkiksi ehdottanut oma-aloitteisesti validointia tietokantatasolle, mikä olisi tärkeää tuotantovalmiissa projektissa, jossa tietokantaa voisi käyttää muukin kuin oma rajapintamme. Olen kuitenkin varma, että se olisi huomannut mahdollisen ongelman, jos olisin kysellyt siltä laajemmin ja enemmän.

## 3. Mitkä olivat tärkeimmät parannukset, jotka teit tekoälyn tuottamaan koodiin ja miksi?

### 3.1 ISO 8601 -validoinnin löysääminen

Alkuperäinen `isValidISODate()`-funktio vaati tarkan millisekuntiformaatin (`.000Z`), mikä hylkäsi täysin validit ISO-päivämäärät kuten `2026-02-01T09:00:00Z`. Käyttäjät olisivat saaneet hämmentäviä `INVALID_DATE`-virheitä oikeilla syötteillä.

**Korjaus:** Poistettiin tiukka merkkijonovertailu ja jätettiin vain parsittavuustarkistus.

### 3.2 Ajonaikainen validointi Zodilla

Alkuperäinen koodi käytti TypeScript-tyyppiväitettä (`req.body as CreateReservationBody`), joka ei tarkista tyyppejä ajon aikana. Esimerkiksi `{ "roomId": 123 }` (numero merkkijonon sijaan) olisi mennyt läpi ilman virhettä.

**Korjaus:** Lisättiin Zod-skeema, joka validoi syötteet ajonaikaisesti ja tarjoaa selkeät virheilmoitukset.

### 3.3 Globaali virheenkäsittely

Alkuperäisestä koodista puuttui virheenkäsittely-middleware. Käsittelemättömät virheet (esim. virheellinen JSON) olisivat palauttaneet HTML-virhesivuja tai vuotaneet stack trace -tietoja.

**Korjaus:** Lisättiin Express-virheenkäsittelijä, joka palauttaa yhtenäisen `ApiError`-muotoisen vastauksen ja logittaa virheet konsoliin.

### 3.4 Tyyppiturvalliset virhekoodit

`errorResponse()`-funktio hyväksyi minkä tahansa merkkijonon virhekoodiksi. Kirjoitusvirhe kuten `'INVLAID_INPUT'` olisi jäänyt huomaamatta käännösvaiheessa.

**Korjaus:** Luotiin `ErrorCode`-tyyppi, joka rajoittaa virhekoodit vain sallittuihin arvoihin. TypeScript havaitsee nyt kirjoitusvirheet käännösaikana.

### 3.5 Käyttäjätunnisteen lisääminen

Alkuperäinen API ei tallentanut tietoa siitä, kuka varauksen teki. Tämä olisi ongelma esimerkiksi tilanteessa, jossa käyttäjä haluaa nähdä omat varauksensa.

**Korjaus:** Lisättiin pakollinen `userId`-kenttä varauksiin sekä uusi endpoint `GET /users/:userId/reservations` käyttäjän varausten hakemiseen.
