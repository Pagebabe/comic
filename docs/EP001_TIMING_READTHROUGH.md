# EP001 Neutraler Timing-Readthrough

Status: `TIMING_READY · VOICES_UNAPPROVED · IMAGES_UNAVAILABLE`

Episode: **Ricco im Haus · Episode 001: Das Zimmer**

Dieses Paket prüft ausschließlich Rhythmus, Pausen und Untertitel innerhalb des gesperrten 45,5-Sekunden-Blueprints. Es erzeugt keine Stimme, kein Bild und kein Animatic. Eine neutrale Vorlesestimme darf später als temporäres Messwerkzeug dienen, wird dadurch aber niemals Canon.

Maschinenquelle: [`project/ep001-animatic-blueprint.json`](../project/ep001-animatic-blueprint.json)

Exportskript:

```bash
node scripts/export_ep001_timing.mjs
```

Erzeugte Dateien:

```text
output/ep001-readthrough/ep001-timing-draft.srt
output/ep001-readthrough/ep001-timing-report.json
```

## Readthrough-Regeln

- normal und ruhig lesen, nicht schauspielerisch überproduzieren
- keine Stimme imitieren oder klonen
- keine temporäre Stimme als freigegebenes Stimmenbeispiel markieren
- Dialogtext nicht umschreiben
- Pausen nicht automatisch entfernen
- Don Miau bleibt vollständig stumm
- Untertitel werden separat geprüft
- Gesamtziel bleibt 45,5 Sekunden

## Ablauf mit absoluten Zeitfenstern

### 00:00,000 bis 00:04,500 · Panel 001

**Keine Dialogzeile.**

Zeit für Haus-Establishing, Riccos Ankunft und Don Miaus ersten wortlosen Blick.

### 00:04,950 bis 00:07,200 · Basti

> Vermieter ist ein schwieriges Wort.

### 00:07,450 bis 00:10,150 · Basti

> Das ist kein Mietverhältnis, das ist ein Prozess.

### 00:10,150 bis 00:11,050

Reaktionspause. Ricco beginnt zu rechnen und zu zweifeln.

### 00:11,050 bis 00:14,250 · Basti

> Die 780 sind eigentlich noch solidarisch gedacht.

### 00:14,250 bis 00:17,950

Zimmer-Reveal und stille Reaktion.

### 00:17,950 bis 00:19,750 · Ricco

> Das war so nicht abgemacht.

### 00:19,750 bis 00:21,550

Übergang zum Telefonat.

### 00:21,550 bis 00:23,850 · Ricco

> Mama, das ist hier sehr kreativ.

### 00:23,850 bis 00:27,150

Blick in den Raum, Hausgeräusche und Rückkehr in den Flur.

### 00:27,150 bis 00:28,650 · Basti

> Ich halte nur den Raum.

### 00:28,650 bis 00:29,650

Kurze verständnislose Reaktion.

### 00:29,650 bis 00:31,050 · Ricco

> Ist das hier normal?

### 00:31,050 bis 00:32,650

Übergang in die Gemeinschaftsküche.

### 00:32,650 bis 00:35,300 · Jule

> Bitte reflektier mal deinen Kühlschrankanspruch.

### 00:35,700 bis 00:38,150 · Jule

> Eigentum an Hummus ist auch Eigentum.

### 00:38,150 bis 00:39,850

Abendlicher Übergang zurück ins Zimmer.

### 00:39,850 bis 00:42,050 · Ricco

> Ich brauch nur WLAN und Ruhe.

### 00:42,050 bis 00:45,500

Don Miaus wortloses Urteil und stiller Endhold. Keine zusätzliche Pointe, keine menschliche Katzenstimme und kein erklärender Text.

## Untertitelstandard

- maximal 34 Zeichen pro Zeile
- maximal zwei Zeilen
- keine Sprecherlabels
- mobile Safe Area
- keine Untertitel im generierten Bild
- SRT bleibt `temporary_timing_only`, bis Stimmen und finaler Schnitt geprüft sind

Beispiele für kontrollierte Umbrüche:

```text
Die 780 sind eigentlich noch
solidarisch gedacht.
```

```text
Bitte reflektier mal deinen
Kühlschrankanspruch.
```

```text
Eigentum an Hummus ist auch
Eigentum.
```

## Prüfentscheidung

Der Timing-Readthrough darf nur zu einem dieser Ergebnisse führen:

- `TIMING_PASS`
- `PAUSE_REVISION_REQUIRED`
- `SUBTITLE_REVISION_REQUIRED`
- `BLUEPRINT_REVIEW_REQUIRED`

Er darf niemals automatisch erzeugen:

- `VOICE_APPROVED`
- `MASTER_APPROVED`
- `ANIMATIC_COMPLETE`
- `EPISODE_FINAL`

## Nächster visueller Schritt

Sobald der Bildgenerator wieder verfügbar ist, bleibt Ricco das einzige erste Bildziel. Der Readthrough ist kein Vorwand, parallel den gesamten Cast oder die Episode zu generieren. Die Menschheit hat bereits genug halbfertige Batch-Produktionen mit zwölf leicht verschiedenen Gesichtern hervorgebracht.
