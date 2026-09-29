# Documentazione del backend Segrepass

## Scopo del progetto

Questo backend espone API HTTP per autenticare un utente dell'applicazione, mantenere una sessione interna nel server e recuperare dati da Segrepass, in particolare libretto e piano di studi.

L'idea centrale è questa:

- l'applicazione gestisce una propria autenticazione locale per il client che usa il backend;
- una seconda sessione, separata, viene usata per dialogare con Segrepass;
- i dati recuperati da Segrepass vengono scaricati come HTML e poi parsati lato server con Cheerio.

## Architettura generale

Il progetto segue una struttura a livelli piuttosto semplice:

- entrypoint e bootstrap Express;
- route layer;
- controller layer;
- service layer;
- middleware layer;
- parser HTML;
- gestione sessioni in memoria.

### Flusso base di una richiesta

1. Il client chiama una route HTTP esposta da Express.
2. Il middleware di autenticazione verifica l'intestazione `x-session-id`.
3. Il controller legge `req.userId` e coordina il lavoro.
4. Il service Segrepass esegue login, navigazione e fetch HTML.
5. Il parser trasforma l'HTML in oggetti JSON.
6. Il controller restituisce il JSON al client.

## Struttura delle cartelle

- `src/server.js`: avvio del server HTTP.
- `src/app.js`: configurazione Express e registrazione delle route.
- `src/config/env.js`: configurazione ambiente base.
- `src/routes/`: definizione degli endpoint.
- `src/controllers/`: logica HTTP.
- `src/middleware/`: autenticazione e gestione sessione applicativa.
- `src/services/`: logica di dominio e integrazione esterna.
- `src/services/segrepass/SegrepassClient.js`: client verso Segrepass.
- `src/services/parser/SegrepassParser.js`: parsing dell'HTML restituito da Segrepass.
- `src/services/session/SessionManager.js`: sessioni in memoria per utente.

## Bootstrap dell'applicazione

### `src/server.js`

Il server legge la porta da `process.env.PORT` con fallback a `3000` e avvia `app.listen(...)`.

### `src/app.js`

Qui viene creato l'oggetto Express, abilitato `express.json()` e registrate le route principali:

- `GET /health`
- `/segrepass`
- `/auth`

Nota: nel file esiste anche `cookie-parser`, ma nel codice attuale il middleware non viene usato direttamente in `app.js`.

## Autenticazione dell'applicazione

### Middleware `requireAuth`

Il middleware in `src/middleware/auth.middleware.js` controlla la presenza di `x-session-id` nelle request.

Se il session id esiste e corrisponde a una sessione valida, il middleware aggiunge `req.userId` e chiama `next()`.

Questa autenticazione è separata da Segrepass:

- serve a riconoscere l'utente del backend;
- non coincide con le credenziali Segrepass;
- permette di collegare una sessione applicativa a una sessione browser verso Segrepass.

### Sessioni applicative

Sempre in `auth.middleware.js` sono presenti tre funzioni:

- `createAuthSession(userId)`: crea un `sessionId` random e lo associa a `userId` in una `Map` in memoria.
- `destroyAuthSession(sessionId)`: rimuove la sessione.
- `getSessionIdByUserId(userId)`: recupera il session id associato a un utente già loggato.

## Controller di autenticazione

### `POST /auth/login`

Implementato in `src/controllers/auth.controllers.js`.

Il controller:

- valida `username` e `password`;
- controlla se l'utente esiste già tramite `AuthService`;
- se l'utente è già loggato, restituisce il session id già presente;
- altrimenti crea una nuova sessione applicativa.

### `POST /auth/logout`

Il logout rimuove:

- la sessione Segrepass lato backend, se presente in `SessionManager`;
- la sessione applicativa associata all'header `x-session-id`.

## Session manager

`src/services/session/SessionManager.js` mantiene una `Map` in memoria indicizzata per `userId`.

Ogni entry contiene la sessione Segrepass associata all'utente.

Questo è il punto chiave del flusso:

- la sessione applicativa identifica l'utente del backend;
- `SessionManager` collega quell'utente alla sessione browser usata per navigare Segrepass;
- quando l'utente fa logout o riconnessione, la sessione precedente può essere rimossa.

## Integrazione Segrepass

Il codice di integrazione reale è in `src/services/segrepass/SegrepassClient.js`.

### Obiettivo del client

Il client non usa una API JSON ufficiale. Invece:

- apre pagine web di Segrepass;
- invia richieste HTTP reali al sito;
- conserva cookie e stato di sessione;
- recupera HTML delle pagine;
- lascia al parser il compito di estrarre i dati.

## Metodi usati per fetchare da Segrepass

### `createSession()`

Nel client Segrepass viene creato un oggetto sessione con `tough-cookie`:

- contiene un `CookieJar`;
- serve a conservare i cookie tra login e richieste successive;
- evita di dover ricostruire manualmente i cookie a ogni chiamata.

### `get(session, url, options = {})`

È il metodo centrale per tutte le richieste verso Segrepass.

Fa queste cose:

- legge i cookie dalla `CookieJar`;
- esegue `fetch(url, ...)` con header `Cookie`;
- usa un `Agent` di `undici` con `rejectUnauthorized: false`;
- applica un timeout tramite `AbortSignal.timeout(TIMEOUT_MS)`;
- salva nella `CookieJar` eventuali cookie ricevuti con `Set-Cookie`.

Questo metodo è importante perché centralizza il comportamento HTTP e mantiene persistente la sessione.

### `login(session, username, password)`

È il flusso di autenticazione verso Segrepass.

Passaggi principali:

1. Scarica la pagina login con `GET /identificazione.do`.
2. Controlla che la risposta sia valida.
3. Parsa l'HTML con Cheerio.
4. Cerca il form `#formCredenzialiIstituzionali`.
5. Legge campi nascosti come `fname` e `answer`.
6. Costruisce un `URLSearchParams` con:
   - `fname`
   - `answer`
   - `codice_fiscale`
   - `password`
7. Invia il `POST` al form action con `application/x-www-form-urlencoded`.
8. Verifica il successo controllando il titolo della pagina, che deve includere `Menu Utente`.
9. Salva i cookie di login nella `CookieJar`.
10. Segue il redirect verso ESIS con `GET /dispatch.do?dove=LinkEsis`.

Questa parte è fatta per imitare il comportamento del browser e superare un login che non è pensato come API pubblica moderna.

### `getTranscript(session)`

Recupera il libretto usando una GET diretta a:

- `/esis/caricaMenu.do?azione=esamiSostenuti&currentParent=link_1`

Il metodo:

- usa `this.get(...)`;
- verifica `response.ok`;
- restituisce il body HTML come stringa.

### `getStudyPlan(session)`

Recupera il piano di studi usando una GET diretta a:

- `/esis/caricaMenu.do?azione=pianiStudio&currentParent=link_1`

Anche qui il metodo non legge dati strutturati, ma scarica HTML da parsare lato server.

## Parsing HTML

Il parser è in `src/services/parser/SegrepassParser.js` e usa Cheerio.

### `parseTranscript(html)`

Estrae le righe della tabella del libretto e costruisce oggetti con:

- `codice`
- `insegnamento`
- `voto`
- `cfu`
- `data`

### `parseStudyPlan(html)`

Estrae le righe della tabella del piano di studi e costruisce oggetti con:

- `codice`
- `insegnamento`
- `annoCorso`
- `cfu`
- `settore`

Il parser filtra le righe con esito `Superato`, quindi restituisce solo gli insegnamenti ancora rilevanti nel piano di studi corrente.

## Endpoint esposti

### Health

- `GET /health`

Ritorna:

- `{ status: "ok" }`

### Auth

- `POST /auth/login`
- `POST /auth/logout`

### Segrepass

- `POST /segrepass/connect`
- `GET /segrepass/transcript`
- `GET /segrepass/study-plan`

## Flussi completi

### Connessione a Segrepass

1. Il client si autentica nel backend.
2. Chiama `POST /segrepass/connect`.
3. Il controller verifica la sessione locale dell'utente.
4. `SegrepassClient.createSession()` crea una sessione browser logica con cookie jar.
5. `SegrepassClient.login(...)` effettua il login su Segrepass.
6. La sessione viene salvata in `SessionManager` sotto `userId`.

### Recupero libretto

1. Il client chiama `GET /segrepass/transcript`.
2. `requireAuth` legge `x-session-id` e valorizza `req.userId`.
3. Il controller prende la sessione Segrepass da `SessionManager`.
4. `SegrepassClient.getTranscript(...)` scarica l'HTML.
5. `SegrepassParser.parseTranscript(...)` produce il JSON finale.

### Recupero piano di studi

1. Il client chiama `GET /segrepass/study-plan`.
2. Il middleware di auth valida la sessione del backend.
3. Il controller recupera la sessione Segrepass dell'utente.
4. `SegrepassClient.getStudyPlan(...)` scarica la pagina del piano di studi.
5. `SegrepassParser.parseStudyPlan(...)` restituisce l'array dei corsi.

## Aspetti tecnici importanti

### Scelta di usare HTML scraping

Il backend non dipende da un'API pubblica di Segrepass. Questo comporta che:

- il formato HTML può cambiare nel tempo;
- i selettori CSS devono restare allineati al markup reale;
- il parsing va considerato fragile rispetto a un'API JSON.

### Cookie e sessione

L'uso della `CookieJar` è essenziale perché Segrepass si basa su cookie di sessione dopo il login.

### TLS e compatibilità

Il client usa un `Agent` con `rejectUnauthorized: false`.

Questo rende la connessione più permissiva verso il certificato TLS del sito, utile quando il portale presenta problemi di validazione o un ambiente non perfettamente allineato al client HTTP.

### Timeout

Le richieste hanno un timeout fisso di `60000 ms`.

Questo evita che il backend resti bloccato troppo a lungo su una chiamata esterna lenta o non rispondente.

## Limiti attuali

- Le sessioni sono in memoria: un riavvio del server le perde tutte.
- Il parsing dipende dalla struttura HTML di Segrepass.
- Il codice presume che il flusso ESIS resti compatibile con i selettori attuali.
- `auth.middleware.js` e `SessionManager` gestiscono due livelli distinti di sessione, quindi bisogna mantenere coerenti logout e cleanup.

## Conclusione

In sintesi, questo backend è un piccolo orchestratore tra il client dell'app e il portale Segrepass:

- autentica localmente l'utente del backend;
- apre e conserva una sessione Segrepass separata;
- scarica HTML delle pagine richieste;
- usa Cheerio per trasformare l'HTML in dati JSON consumabili dal frontend.

Il punto più importante dell'implementazione è il client Segrepass: lì si concentra tutta la logica di login, conservazione cookie e fetch delle pagine protette.