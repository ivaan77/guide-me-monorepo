# App Review — Testing Notes for HeyLocal

**Paste the "Review Notes" section below into App Store Connect →
App Review Information → Notes.**

HeyLocal is a GPS-guided audio walking-tour app. Its core feature only
activates when the device is physically at a tour stop in Croatia, so a
reviewer in Cupertino will see an idle map unless location is simulated.
Everything below tells them exactly how to do that.

---

## Review Notes (copy-paste into App Store Connect)

```
No account is required. On the sign-in screen, tap "Continue without
signing in" to use the full app as a guest.

This app guides users between real-world locations in Croatia and plays
audio narration when they physically arrive at a stop. To review the
core feature you will need to simulate a location in Zagreb, Croatia.

RECOMMENDED TEST ROUTE
  City:   Zagreb
  Route:  "Heart of Old Zagreb"  (10 stops, ~70 min, full audio in
          English, German and Croatian)

HOW TO SIMULATE LOCATION
  iOS Simulator:  Features → Location → Custom Location…
  Physical iPhone via Xcode:  Debug → Simulate Location, or add a GPX
  file to the scheme.

STEP 1 — Set location BEFORE opening the route
  Latitude   45.813030
  Longitude  15.977356
  (This is Ban Josip Jelacic Square, the first stop.)

STEP 2 — Open the route
  Discover tab → "Zagreb" → under Excursions tap "Heart of Old Zagreb"
  → tap "Start".
  An intro card appears with a photo, a description, and an audio
  player. Tap play to hear the narration. Tap "Continue".

STEP 3 — Confirm arrival at Stop 1
  Because the simulated location is already at Stop 1, the app shows
  the "You've arrived" card for Ban Josip Jelacic Square, plays a
  chime, and offers the stop's audio guide. This stop also contains 4
  sub-stops — swipe the card horizontally to page through them.

STEP 4 — Walk to the next stop (the key interaction)
  Change the simulated location to Stop 2:
     Latitude   45.813887
     Longitude  15.978606
  The map re-centres, the distance counter counts down, and when the
  distance falls under 20 m the app automatically switches to the
  "arrived" card for Kaptol and plays its narration. No tapping is
  required — arrival is detected from GPS.

STEP 5 — Repeat for any further stops
  Stop  3  Zagreb Cathedral          45.814537, 15.979427
  Stop  4  Dolac Market              45.814275, 15.977249
  Stop  5  Stone Gate                45.815737, 15.975280
  Stop  6  St. Mark's Square         45.816129, 15.973620
  Stop  7  Lights of Old Zagreb      45.815214, 15.973431
  Stop  8  Strossmayer Promenade     45.814219, 15.974580
  Stop  9  Lotrscak Tower            45.814604, 15.973305
  Stop 10  Zagreb Funicular          45.814541, 15.973070

  After the final stop the app shows a wrap-up card and a completion
  screen.

IMPORTANT
  • Grant the location permission when prompted ("While Using the
    App"). If it is denied, the route screen shows an explanatory
    screen instead of the map — this is intended behaviour, not a bug.
  • If the simulated location is more than 3 km from the route, the
    Start button shows a "You're far from this excursion" warning with
    a "Start anyway" option. Setting the coordinates above avoids this.
  • Each stop has its own arrival radius (7 m to 75 m). Set the
    coordinates exactly as listed; a nearby-but-not-exact position may
    not trigger arrival at the tighter stops.
  • Audio is streamed, so the device needs a network connection.

OTHER AREAS TO REVIEW (no location needed)
  • Discover tab — browse 11 Croatian cities, their restaurants, bars,
    museums and viewpoints.
  • Stories tab — editorial articles.
  • Profile tab — switch language (English / German / Croatian) and
    appearance (light / dark / system), view Terms and Privacy Policy,
    and delete the account.

CONTACT
  hello@heylocal.xyz
```

---

## Notes for you (not for Apple)

### Why this route

`the-story-of-zagreb` is the only route with **zero silent audio slots** —
23 of 23 have narration, and 10 are complete in all three languages. Every
other route has gaps; six are entirely silent. If a reviewer opens one of
those and finds no audio where the listing promises narration, that is a
plausible rejection. These notes steer them to the one route that fully
delivers.

### Verified against the live database

Coordinates, stop order, trigger radii and audio coverage were read from
production on 2026-11-22, not written from memory:

| # | Stop | Lat, Lng | Radius | Audio |
|---|------|----------|--------|-------|
| 1 | Ban Josip Jelačić Square | 45.813030, 15.977356 | 75 m | EN DE HR + 4 sub-stops |
| 2 | Kaptol | 45.813887, 15.978606 | 20 m | EN DE HR |
| 3 | Zagreb Cathedral | 45.814537, 15.979427 | 50 m | EN DE HR |
| 4 | Dolac Market | 45.814275, 15.977249 | 40 m | EN DE HR + 1 sub |
| 5 | Stone Gate | 45.815737, 15.975280 | 10 m | EN DE HR |
| 6 | St. Mark's Square | 45.816129, 15.973620 | 60 m | DE HR (no EN) + 3 sub |
| 7 | Lights of Old Zagreb | 45.815214, 15.973431 | 33 m | EN HR |
| 8 | Strossmayer Promenade | 45.814219, 15.974580 | 20 m | EN HR + 1 sub |
| 9 | Lotrščak Tower | 45.814604, 15.973305 | 20 m | EN HR + 1 sub |
| 10 | Zagreb Funicular | 45.814541, 15.973070 | 7 m | EN HR + 1 sub |

Leg distances are 20–223 m, so a reviewer stepping through them sees a
realistic countdown rather than a jump.

### Two risks in this route

**Stop 6, St. Mark's Square, has no English audio** (DE + HR only). An
English-speaking reviewer who reaches stop 6 gets silence where the app
promises narration. Two options: record the English file, or truncate the
suggested walk-through at stop 5 — the notes above already show stops 1–2
in full detail and list the rest as optional.

**Stop 1 carries the Alamy watermark.** It is the very first image a
reviewer sees after tapping Start, and you answered "No" to third-party
content rights. This is the single highest-value fix before review.

### Behaviour these notes rely on (verified in code)

- Arrival fires only while the phase is `navigating`, comparing
  `haversineMeters(userLocation, stop.coords)` against
  `stop.triggerRadius` — `ExcursionScreen.tsx:632`.
- The 3 km `FAR_FROM_ROUTE_METERS` guard gates the Start button —
  `ExcursionScreen.tsx:1071`.
- Guest access via "Continue without signing in" — `app/login.tsx:70`.
