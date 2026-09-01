# AI Companion

【[English](../README.md) | [繁體中文](README.zh-TW.md) | [简体中文](README.zh-CN.md) | [Français](README.fr.md) | [Deutsch](README.de.md) | [Español](README.es.md) | Italiano | [Português (BR)](README.pt-BR.md) | [日本語](README.ja.md) | [한국어](README.ko.md) | [हिन्दी](README.hi.md) | [Indonesia](README.id.md)】

Un plugin per Obsidian che trasforma il tuo diario quotidiano in una collaborazione con un'IA —
pratica e a misura d'uomo, non un life coach per il benessere.

Continui a scrivere il tuo diario come fai già e a condividere link dal telefono
come fai già. Il plugin legge entrambi, risponde con consigli concreti, elabora i
link in un briefing quotidiano e lentamente costruisce un'immagine di chi sei, in modo che il suo aiuto diventi
più mirato nel tempo.

## Funzionalità

**Feedback sul diario** — Legge ciò che hai scritto e risponde con il tono richiesto dall'argomento:
🫂 un confidente per un litigio, 🎒 un insegnante per qualcosa su tuo figlio, 🔧 un ingegnere
per un bug. Ogni risposta si apre con l'emoji e il nome di quel tono, così che una giornata che li contiene tutti e tre
viene letta come tre risposte invece che come un muro di testo. Quale tono si applica a cosa è una
tabella modificabile nelle impostazioni, così come l'emoji, il nome e l'istruzione di ogni tono.

**Sintesi delle notizie** — Condividi un post da Threads, X o Facebook nel tuo vault dal telefono,
e il plugin farà il resto: elenca il link sotto l'intestazione delle condivisioni, quindi lo redige
in tre punti fissi — fonte, punto chiave, perché è importante. Con la ricerca abilitata, recupera ogni pagina
e ne riassume il contenuto reale, anziché indovinare dal titolo. Le persone salvano le cose
per usarle al lavoro, per provarle nelle proprie creazioni, per qualcuno in famiglia, o semplicemente perché
erano belle — per questo la terza riga dice cosa puoi farne, e non dà mai un voto.

**Report completi** — Quando un elemento merita più di un paio di righe, l'IA lo contrassegna e
ne scrive una nota dedicata nella cartella di quel giorno — cos'è, come farlo, a cosa prestare
attenzione — citando il metodo alla lettera in modo che sia utilizzabile senza riaprire la fonte. La voce della sintesi
vi rimanda con un link. Con un limite per esecuzione e disattivabile.

**Tabella dei fatti** — L'IA accumula fatti duraturi su di te (persone, progetti, obiettivi,
problemi ricorrenti) in una nota ordinaria e modificabile. Ogni altra funzionalità la legge prima
di rispondere. I fatti vengono indicati per come sono *ora* e riscritti al mutare delle cose, così che il file
resti leggibile dopo mesi invece di crescere come un changelog.

## Come funziona una giornata

1. Durante la giornata, condividi i link dal tuo telefono nella cartella di arrivo.
2. Scrivi il tuo diario — solo la sezione Diario; il resto viene compilato per te.
3. Esegui **Genera sintesi**. Le tue condivisioni appaiono sotto l'intestazione delle condivisioni, i riassunti
   sotto l'intestazione della sintesi e le note condivise si spostano nell'archivio.
4. Esegui **Genera feedback del diario** quando desideri una risposta a ciò che hai scritto.

Oppure imposta una pianificazione e lascia che i passaggi 3 e 4 avvengano da soli.

## Struttura della nota giornaliera

Le prime e terze sezioni sono tue; l'IA scrive la seconda e la quarta.

```markdown
## Diario
- cosa hai fatto oggi

## Riscontro IA
- (L'IA scrive qui, con timestamp)

## Condivisi oggi
- (L'IA elenca qui i tuoi link condivisi)

## Sintesi IA
- (L'IA scrive qui, con timestamp)
```

Le intestazioni seguono l'impostazione della lingua di Obsidian, quindi un'interfaccia cinese scriverà
`## 日誌`, `## AI回饋` e così via. Le note scritte in una lingua continuano a funzionare
in un'altra: l'abbinamento riconosce le intestazioni di ogni lingua, e una sezione
esistente mantiene qualsiasi intestazione abbia già senza essere riscritta.

Le sezioni vengono trovate tramite l'intestazione, quindi il loro ordine nel tuo file non ha importanza. Eseguire nuovamente un
comando aggiunge un nuovo blocco con timestamp anziché sostituire quanto fatto prima, così che diverse
esecuzioni al giorno si accumulano. Tutto ciò che si trova al di fuori di queste quattro intestazioni non viene mai toccato.

## Struttura delle cartelle

```
ai-companion/
  journal/              note giornaliere; ogni giorno può avere una cartella a sé per i report
  news/
    landing/            ← condividi in questa cartella dal tuo telefono
    archived/           le condivisioni elaborate vengono spostate qui
  memory/
    facts.md            ciò che l'IA sa di te — modificalo liberamente
    _log.md             registro di sola aggiunta di quando è stato aggiornato
```

Ogni cartella è configurabile nelle impostazioni. Vengono create quando il plugin si carica, quindi la
cartella di arrivo esiste prima che tu vada a cercarla in un menu di condivisione mobile.

## Installazione

Richiede Obsidian 1.5.0+ su desktop.

1. Scarica `main.js`, `manifest.json` e `styles.css` dall'ultima release.
2. Inseriscili in `<vault>/.obsidian/plugins/ai-companion/`.
3. Abilita **AI Companion** in Impostazioni → Plugin della community.
4. Imposta il percorso della tua AI CLI in Impostazioni → AI Companion.

### Configurazione della CLI

Il plugin invia il tuo prompt a una AI CLI locale tramite stdin e legge il suo stdout, quindi il comando
deve essere eseguito in modo non interattivo. Per Claude Code:

Scegli la tua CLI dal menu a tendina e i suoi flag non interattivi verranno applicati per te. Imposta
un percorso solo se l'eseguibile non è nel tuo `PATH`.

| CLI | Stato |
| --- | --- |
| Claude Code | Verificato; prompt inviato su stdin |
| Antigravity (`agy`) | Verificato; prompt passato come argomento |
| Codex (ChatGPT) | Offerto ma non testato — ti preghiamo di segnalare i tuoi risultati |

Se un comando non riporta alcun output, molto probabilmente la CLI richiedeva una sessione interattiva; controlla i
flag sotto Argomenti aggiuntivi.

### Compilazione dal codice sorgente

```bash
npm install
npm run build
```

## Comandi

Tutti questi si trovano nel riquadro dei comandi, e nel menu dietro l'icona della barra laterale.

| Comando | Cosa fa |
| --- | --- |
| Nuova nota del diario | Crea la nota di oggi dal modello e la apre |
| Genera feedback del diario | Risponde alla voce del giorno, con il tono richiesto da ciascuna parte |
| Genera sintesi | Elenca le tue condivisioni e redige ciascuna di esse |
| Accumula fatti | Aggiorna la tabella dei fatti dalla voce del giorno |
| Apri tabella dei fatti | Apre `facts.md` per la lettura o la correzione |
| Archivia condivisioni elaborate | Ripulisce eventuali condivisioni elaborate rimaste |

I comandi che scrivono su una nota del diario sono disabilitati quando è aperta una nota che non è del diario, quindi
non agiscono mai su un file che non intendevi modificare.

## Impostazioni

- **AI** — scegli la tua CLI (Claude Code, Antigravity, Codex) e i flag di cui ha bisogno vengono compilati; oppure scegli Personalizzato. In più percorso, argomenti aggiuntivi, modello, timeout.
- **Toni** — la tabella situazione → tono e l'istruzione di ciascun tono. Ogni voce predefinita
  può essere ripristinata singolarmente; aggiungi le tue situazioni e i tuoi toni.
- **Diario** — cartella, formato della data, percorso del modello (supporta `{{date}}` e `{{time}}`).
  Un modello personalizzato deve mantenere le quattro intestazioni; è così che l'IA capisce dove scrivere.
- **Notizie** — cartelle di arrivo e di archivio, interruttore per la ricerca, conservazione dell'archivio in giorni
  (0 conserva tutto).
- **Pianificazione** — manuale (predefinito), all'apertura, o ogni N ore, con interruttori separati per
  decidere se un passaggio programmato esegue la sintesi, il feedback o entrambi.
- **Fatti** — cartella e un interruttore di abilitazione (disabilitato per impostazione predefinita).
- **Aspetto** — uno stile opzionale per le sezioni del plugin (schede, sobrio, rivista),
  disattivato per impostazione predefinita e limitato alle note del diario. Gli stili si applicano nella vista Lettura; ogni valore
  deriva dalle variabili CSS di Obsidian, così il tuo tema ha sempre la priorità.

### Pianificazione

Le esecuzioni programmate avvengono solo mentre Obsidian è aperto — un plugin supportato da CLI non ha alcun processo in
background e una finestra mancata viene recuperata al tick successivo anziché essere recuperata forzatamente.

La sintesi si adatta a una pianificazione, poiché ogni esecuzione gestisce le nuove condivisioni arrivate. Il feedback del diario
è disattivato per impostazione predefinita nelle esecuzioni programmate: ogni passaggio aggiunge un nuovo blocco, quindi eseguirlo
sei volte al giorno riempie la sezione con consigli quasi identici.

## Privacy e sicurezza

Leggi questo prima di abilitare qualsiasi cosa.

- **Il tuo diario viene inviato a un provider IA.** Il plugin avvia una AI CLI locale e le invia
  il testo del tuo diario. Ciò che quella CLI invia a sua volta — e a chi — è governato da quello strumento,
  non da questo plugin. I diari contengono dettagli sulla salute e questioni familiari; decidi in modo consapevole.
- **L'IA scrive direttamente nel tuo vault.** Non c'è alcun passaggio di conferma. Scrive solo
  le sezioni elencate sopra, ma lo fa senza chiedere.
- **La provenienza viene mantenuta.** `memory/_log.md` è un registro di sola aggiunta e annota da quale giorno del diario
  proviene ogni aggiornamento dei fatti, così puoi separare ciò che hai scritto da ciò che l'IA ha dedotto.
- **La tabella dei fatti può essere modificata da te.** Se l'IA registra qualcosa di sbagliato, aprila e correggila;
  l'esecuzione successiva leggerà la tua versione corretta. Nota che l'IA riscrive l'intero file ogni
  volta, quindi una riga senza riscontro nel tuo diario potrebbe non sopravvivere.
- **La pianificazione è manuale per impostazione predefinita.** Le esecuzioni non presidiate che scrivono nel tuo vault dovrebbero essere una
  scelta consapevole, non un'impostazione predefinita.
- **L'eliminazione dell'archivio è opzionale** e utilizza il cestino di sistema, quindi è recuperabile.
- **Solo per desktop.** L'avvio di una CLI richiede Node, quindi non può essere eseguito su mobile. Condividere *nel*
  vault da un telefono funziona perfettamente — si tratta semplicemente di Obsidian Sync.

## Internazionalizzazione

L'interfaccia è disponibile in 21 lingue, seguendo l'impostazione della lingua di Obsidian: arabo,
tedesco, inglese, spagnolo, persiano, francese, indonesiano, italiano, giapponese, coreano, olandese,
polacco, portoghese, portoghese (Brasile), russo, thailandese, turco, ucraino, vietnamita,
cinese (semplificato) e cinese (tradizionale).

Le traduzioni si trovano in `src/i18n/locales/`. Ogni lingua locale è tipizzata rispetto all'inglese, quindi una chiave
mancante genera un errore di compilazione invece di un fallback silenzioso.

## Licenza

MIT
