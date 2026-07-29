# 🎨 Design Concept — Finance Tracker

**Status:** Koncept (implementacija od Dana 17). Vizuelni pravac dogovoren, kod dolazi kasnije.

**Pravac:** Topao/friendly (Monzo/Revolut škola), dark + light toggle.

---

## Subjekt i jedini posao

Aplikacija ima jedan glavni zadatak: za 3 sekunde znati da li je mesec plus ili minus, i gde para curi. Dizajn je organizovan oko jednog broja — mesečni saldo — ne oko tabele transakcija.

## Boje

Izbegavamo generički AI default (warm cream #F4F1EA + terracotta #D97757). Coral pomeramo ka toplijem/roze tonu da ne izgleda kao default.

Brand (coral) 
#FF5A5F ← akcije, aktivni state, logo
Income (teal) 
#0FA47F ← prihod (teal umesto zelene — mirniji)
Expense (coral-dim) 
#E8524E ← rashod (deli DNK sa brand bojom)
Ink (tekst) 
#1A1625 ← skoro crn, blago ljubičast
Cloud (light bg) 
#FBF9F7 ← topla bela, ne sterilna #FFF
Slate (dark bg) 
#1A1522 ← topla tamna, ljubičasti undertone


Ključna odluka: i light i dark bg imaju ljubičasti undertone (ne plavi). Plavo-siva je default svakog dashboarda; topla ljubičasta baza čini UI "friendly" bez da bude dečji.

Semantika: prihod/rashod moraju biti trenutno razlučivi. Teal/coral umesto klasične zelena/crvena (bolje za colorblind, manje naporno).

## Tipografija

Display/brojevi: Bricolage Grotesque ← veliki iznosi, naslovi (nosi ličnost)
Body/UI: Inter ← labele, dugmići, tabele (nevidljivi posao)
Brojevi: Inter + "tnum" ← tabular numbers, cifre se poravnaju u koloni


Namerno NE Inter za sve (default svakog dashboarda). Bricolage nosi karakter, Inter radi sitan UI. `tnum` je senior detalj — cifre u listi se vertikalno poravnaju.

## Signature element — "Balance Hero"

Umesto klasičnog dashboarda (4 kartice u redu + tabela), signature je ogroman saldo koji menja boju:

┌─────────────────────────────────────────┐
│ Jul 2026 [◐ toggle] │
│ │
│ +42.350 RSD │ ← OGROMAN saldo, Bricolage
│ ▔▔▔▔▔▔▔▔▔ │ boja = +/− (teal/coral)
│ ↑ prihod 89k ↓ rashod 47k │
│ │
│ ┌────────────────────────────────────┐ │
│ │ ▓▓▓▓▓▓▓░░░░░░░░ 53% potrošeno │ │ ← "burn bar"
│ └────────────────────────────────────┘ │
└─────────────────────────────────────────┘


Signature = saldo koji menja boju (teal kad si plus, coral kad si minus) + burn bar ispod. Emocionalni trenutak app-a. Sve ostalo namerno tiho ("spend your boldness in one place").

## Implementacija (Dan 17)

- `tailwind.config` — custom boje kao named tokeni (ne inline hex)
- Fontovi preko `next/font` (Bricolage + Inter), self-hosted
- Dark mode: Tailwind `class` strategija + toggle koji pamti izbor
- Balance Hero = prva komponenta (nosi vizuelni identitet)
- `shadcn/ui` za Dialog/Toast/Input — restilizovani našim tokenima, ne default crni

---

## Otvorene odluke (pre Dana 17)

- [ ] Potvrditi Balance Hero kao signature (vs klasičniji dashboard)
- [ ] Opciono: statična HTML mockup pre React-a (da se boje/fontovi vide uživo)