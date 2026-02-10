# Product Requirements Document (PRD)
## Edzés & Munka Ütemező Webalkalmazás

---

## 1. Executive Summary

**Termék neve:** FitSchedule Pro  
**Cél:** Személyes használatra szánt webalkalmazás, amely intelligensen koordinálja az edzésterveket, munkabeosztást és személyes időt egy áttekinthető naptár és progresszió követő rendszerben.

**Fő értékajánlat:**
- Automatikus Push-Pull-Legs-Rest edzésciklus megjelenítés
- Intelligens műszak javaslatok az edzések és külső korlátok alapján
- **Barát éjszakai műszakjainak kezelése**: automatikus délelőtti edzés blokkolás és munkaidő priorizálás
- Részletes edzésnapló és progresszió analitika
- Munkaidő követelmények automatikus ellenőrzése

---

## 2. Technológiai Stack

### Backend
- **Supabase**: Authentication, PostgreSQL database, real-time subscriptions, Row Level Security
- **Python**: Backend logika, algoritmusok (Supabase Edge Functions vagy külön API)

### Frontend
- **Next.js 14+**: React framework App Router-rel
- **TypeScript**: Type safety
- **Tailwind CSS**: Styling
- **shadcn/ui**: UI komponensek

### Hosting & Deployment
- **Vercel**: Next.js frontend hosting
- **Supabase**: Backend infrastruktúra

---

## 3. Architektúra

```
┌─────────────────────────────────────────┐
│          Next.js Frontend               │
│  ┌──────────┐  ┌──────────┐  ┌────────┐│
│  │ Naptár   │  │ Edzés-   │  │ Munka- ││
│  │ Modul    │  │ napló    │  │ követés││
│  └──────────┘  └──────────┘  └────────┘│
└─────────────────┬───────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────┐
│         Supabase Backend                │
│  ┌──────────────────────────────────┐   │
│  │  PostgreSQL Database             │   │
│  │  - users                         │   │
│  │  - workouts                      │   │
│  │  - workout_logs                  │   │
│  │  - work_shifts                   │   │
│  │  - schedule_events               │   │
│  └──────────────────────────────────┘   │
│  ┌──────────────────────────────────┐   │
│  │  Edge Functions (Python/Deno)   │   │
│  │  - shift_optimizer               │   │
│  │  - progression_analyzer          │   │
│  └──────────────────────────────────┘   │
└─────────────────────────────────────────┘
```

---

## 4. Adatbázis Séma

### 4.1 Tables

#### `users`
```sql
- id: uuid (PK)
- email: text
- name: text
- created_at: timestamp
```

#### `workout_plan`
```sql
- id: uuid (PK)
- user_id: uuid (FK)
- name: text (pl. "PUSH A")
- week_type: text ('A' vagy 'B')
- order_in_cycle: integer (1-3: push/pull/legs)
- created_at: timestamp
```

#### `exercises`
```sql
- id: uuid (PK)
- workout_plan_id: uuid (FK)
- name: text
- sets: integer
- reps: text (pl. "8-12" vagy "Bukásig")
- rir: integer
- rest_seconds: integer
- order_index: integer
- created_at: timestamp
```

#### `workout_logs`
```sql
- id: uuid (PK)
- user_id: uuid (FK)
- exercise_id: uuid (FK)
- workout_date: date
- set_number: integer
- reps_completed: integer
- weight_kg: decimal
- rir_actual: integer
- notes: text
- created_at: timestamp
```

#### `work_shifts`
```sql
- id: uuid (PK)
- user_id: uuid (FK)
- shift_date: date
- start_time: time
- end_time: time
- duration_hours: decimal
- shift_type: text ('délelőtt'/'délután'/'hétvége')
- created_at: timestamp
```

#### `schedule_events`
```sql
- id: uuid (PK)
- user_id: uuid (FK)
- event_type: text ('workout'/'girlfriend'/'cooking'/'other')
- event_date: date
- start_time: time
- end_time: time
- title: text
- description: text
- created_at: timestamp
```

#### `workout_cycle`
```sql
- id: uuid (PK)
- user_id: uuid (FK)
- cycle_start_date: date
- current_week: integer (1-10)
- current_week_type: text ('A' vagy 'B')
- current_day_index: integer (0-3: push/pull/legs/rest)
- last_updated: timestamp
```

#### `friend_schedule`
```sql
- id: uuid (PK)
- user_id: uuid (FK)
- day_of_week: integer (0-6, 0=hétfő)
- start_time: time
- end_time: time
- is_available: boolean
- event_name: text
- is_night_shift: boolean (ha true, akkor 21:00-07:00 dolgozik)
- notes: text
```

#### `friend_night_shifts`
```sql
- id: uuid (PK)
- user_id: uuid (FK)
- night_shift_date: date (az éjszaka kezdő dátuma)
- start_time: time (általában 21:00)
- end_time: time (általában 07:00 másnap)
- sleep_until: time (általában 14:00-15:00 másnap)
- notes: text
- created_at: timestamp
```

---

## 5. Core Features & User Stories

### 5.1 Naptár Modul

#### User Story 1: Push-Pull-Legs Ciklus Megjelenítés
**Mint felhasználó**, szeretném látni a naptárban a következő 4 hetet az edzéstervemmel, hogy tudjam melyik napra hogyan készüljek.

**Acceptance Criteria:**
- [ ] A naptár automatikusan megjeleníti a Push-Pull-Legs-Rest mintát
- [ ] Az A és B hetek váltakoznak a 10 hetes cikluson keresztül
- [ ] Minden edzésnap mutatja a fő gyakorlatokat
- [ ] A Rest napok egyértelműen jelölve vannak
- [ ] A jelenlegi hét/nap kiemelve

#### User Story 2: Intelligens Műszak Javaslat
**Mint felhasználó**, szeretnék javaslatokat kapni a műszakjaim időzítésére, hogy optimálisan tudjam beilleszteni az edzéseket és a barátnőmmel töltött időt.

**Acceptance Criteria:**
- [ ] A rendszer figyelembe veszi az edzés időtartamát (2-2.5 óra)
- [ ] A barát órarendje alapján szabad időszakokat azonosít
- [ ] Javasolja a műszak kezdési időpontját és időtartamát (2-6 óra között)
- [ ] Vizuálisan jelzi a javasolt és már beállított műszakokat
- [ ] Figyelmeztet, ha a heti/havi minimumok nincsenek teljesítve

#### User Story 3: Munkaidő Követelmények Követése
**Mint felhasználó**, szeretném látni a havi és heti munkaidő követelményeim teljesítését.

**Acceptance Criteria:**
- [ ] Dashboard mutatja: havi eddig ledolgozott órák / 60
- [ ] Dashboard mutatja: aktuális hét órái / 12
- [ ] Mutatja: délelőtti órák / 8, délutáni / 8, hétvégi / 8 (havonta)
- [ ] Progressz bárok színkódolva (piros/sárga/zöld)
- [ ] Előrejelzés: ha így folytatom, teljesítem-e a hónap végére?

### 5.2 Edzésnapló Modul

#### User Story 4: Edzés Rögzítése
**Mint felhasználó**, szeretném rögzíteni minden gyakorlatom minden szettjét az előírt paraméterekkel.

**Acceptance Criteria:**
- [ ] Az aktuális nap edzésterve automatikusan megjelenik
- [ ] Minden gyakorlatnál látom: cél szett/ismétlés, RIR, pihenő idő
- [ ] Szettenkénti rögzítés: ismétlések száma, súly, tényleges RIR
- [ ] Jegyzet mező minden szetthez
- [ ] Időzítő a pihenő időkhöz
- [ ] Előző hetekhez képesti súly/ismétlés összehasonlítás

#### User Story 5: Progresszió Analitika
**Mint felhasználó**, szeretném látni melyik gyakorlatban fejlődök a leggyorsabban, hogy tudjam hol kell jobban fókuszálnom.

**Acceptance Criteria:**
- [ ] Grafikon gyakorlatonként: súly/ismétlés változása idővel
- [ ] Összehasonlító táblázat: melyik gyakorlat hány %-ot fejlődött
- [ ] Figyelmeztetés, ha egy gyakorlat stagnál 2+ hétig
- [ ] Heti/havi összefoglaló jelentés
- [ ] Izomcsoport alapú összesítés (mellkas, láb, hát, stb.)

### 5.3 Barátnő & Egyéb Események

#### User Story 6: Személyes Idő Kezelése
**Mint felhasználó**, szeretném beütemezni a barátnőmmel töltött időt és egyéb tevékenységeket (főzés, stb.).

**Acceptance Criteria:**
- [ ] Egyedi események létrehozása a naptárban
- [ ] Esemény típusok: barátnő, főzés, egyéb
- [ ] Időtartam és ismétlődés beállítása
- [ ] Színkódolás esemény típus szerint
- [ ] Ütközés jelzés (ha edzés vagy munka időponttal egybeesik)

#### User Story 7: Barát Éjszakai Műszakjának Kezelése
**Mint felhasználó**, szeretném rögzíteni amikor a barátom éjszakázik (21:00-07:00), hogy a rendszer automatikusan tudja, hogy másnap délelőtt nem tudunk edzeni, de én dolgozhatom.

**Acceptance Criteria:**
- [ ] Éjszakai műszak rögzítése konkrét dátumra
- [ ] Automatikus blokkolás: következő nap délelőtt (07:00-14:00) NEM edzés idő
- [ ] Vizuális jelzés a naptárban: éjszakai műszak ikon + másnap délelőtt "alvás" jelölés
- [ ] Műszak javaslat PRIORIZÁLJA a következő nap délelőttöt (mivel úgysem lehet edzés)
- [ ] Figyelmeztetés, ha mégis edzést próbálnék beütemezni délelőttre
- [ ] Dashboard widget: "Következő éjszakás napok" listázása

---

## 6. UI/UX Requirements

### 6.1 Layout Struktúra

```
┌─────────────────────────────────────────────────┐
│  Header: FitSchedule Pro │ [User] │ [Settings] │
├─────────────────────────────────────────────────┤
│                                                 │
│  ┌─────────────────┐  ┌───────────────────────┐│
│  │   Sidebar       │  │   Main Content        ││
│  │                 │  │                       ││
│  │ • Dashboard     │  │  [Current View]       ││
│  │ • Naptár        │  │                       ││
│  │ • Edzésnapló    │  │                       ││
│  │ • Munkaidő      │  │                       ││
│  │ • Statisztika   │  │                       ││
│  │ • Beállítások   │  │                       ││
│  └─────────────────┘  └───────────────────────┘│
│                                                 │
└─────────────────────────────────────────────────┘
```

### 6.2 Naptár Nézet

**Havi Nézet:**
- Hagyományos havi naptár
- Minden nap mutatja: edzéstípus (Push/Pull/Legs/Rest), műszakok, események
- Színkódolás:
  - **Kék**: Push nap
  - **Zöld**: Pull nap
  - **Narancs**: Legs nap
  - **Szürke**: Rest nap
  - **Lila**: Munkaidő
  - **Rózsaszín**: Barátnő
  - **Piros**: Barát órái (nem elérhető időszakok)
  - **Sötétkék (éjszakai)**: Barát éjszakai műszakja (21:00-07:00)
  - **Világoskék csíkozás**: Következő nap délelőtt (barát alszik)

**Heti Nézet:**
- Részletesebb óra-alapú nézet
- Drag-and-drop műszak és esemény mozgatás
- Barát órarendje háttérben jelölve (overlay rétegként)
- **ÚJ**: Éjszakai műszakok megjelenítése:
  - Sötétkék csík 21:00-tól másnap 07:00-ig
  - Másnap 07:00-14:00 halvány kék háttér + alvás ikon
  - Tooltip: "Barát éjszakázik - délelőtt nem elérhető edzésre"

**Napi Nézet:**
- Órás bontásban (00:00 - 23:59)
- Ha van éjszakai műszak az előző nap:
  - Reggeli rész (07:00-14:00) speciális jelöléssel
  - Edzés javaslat CSAK 14:00 után
  - Délelőtti munkaidő JAVASOLT (zöld kiemelés)

### 6.3 Dashboard Widgets

1. **Heti Összefoglaló Kártya**
   - Edzések száma / 3-4 (cél)
   - Ledolgozott órák / 12+
   - Következő edzés: [típus] [időpont]

2. **Havi Munkaidő Kártya**
   - Kördiagram: 60 órából mennyit teljesítettél
   - Részletezés: délelőtt/délután/hétvége

3. **Aktuális Hét Edzésterve**
   - Push/Pull/Legs/Rest minta
   - A/B hét jelzés
   - Hetes pozíció: 3/10

4. **Legutóbbi Progresszió**
   - Top 3 legjobban fejlődő gyakorlat
   - Bottom 3 stagnáló gyakorlat

5. **Barát Éjszakai Műszakjai (ÚJ)**
   - Következő 2 hét éjszakás napjai
   - Mely napokon NEM lehet délelőtt edzeni
   - Ajánlott délelőtti munkaidő ezekre a napokra
   - Ikon: 🌙 éjszaka, 😴 másnap délelőtt

---

## 7. Algoritmusok & Logika

### 7.1 Műszak Optimalizáló Algoritmus

**Input:**
- Aktuális hét edzésterve (Push/Pull/Legs napok)
- Barát heti órarendje (foglalt időszakok)
- **Barát éjszakai műszakjai** (konkrét dátumokhoz kötve)
- Barátnővel tervezett időpontok
- Már beállított műszakok és események
- Minimum ledolgozandó órák (heti/havi)

**Output:**
- Javasolt műszak időpontok listája (nap, kezdés, időtartam)

**Pszeudokód:**
```python
def suggest_shifts(week_data):
    available_slots = []
    
    for day in week:
        # 1. Ellenőrizd a barát éjszakai műszakját
        friend_night_shift = get_friend_night_shift(day - 1)  # Előző éjszaka
        
        # 2. Ha barát éjszakázott, akkor délelőtt alszik (07:00-14:00)
        friend_sleeping = None
        if friend_night_shift:
            friend_sleeping = {
                'start_time': time(7, 0),
                'end_time': time(14, 0),
                'reason': 'Barát alszik (éjszakai műszak után)'
            }
        
        # 3. Azonosítsd az edzés időpontokat (fix 2-2.5h)
        # Ha barát alszik délelőtt, NEM lehet edzés délelőtt
        workout_time = get_workout_time(
            day, 
            friend_schedule,
            friend_sleeping_period=friend_sleeping
        )
        
        # 4. Azonosítsd a barátnő időpontokat
        girlfriend_time = get_girlfriend_events(day)
        
        # 5. Azonosítsd a barát óráit (NEM ELÉRHETŐ időszakok)
        friend_busy_times = get_friend_schedule(day)
        
        # 6. Számítsd ki a szabad időszakokat
        free_slots = calculate_free_time(
            day, 
            workout_time, 
            girlfriend_time, 
            cooking_time,
            friend_busy_times,
            friend_sleeping  # ÚJ: Barát alvás ideje
        )
        
        # 7. Ha barát alszik délelőtt, PRIORIZÁLD a délelőtti műszakot
        if friend_sleeping:
            # Délelőtt ideális munkaidő, mert úgysem lehet edzés
            prioritize_morning_shift = True
        
        # 8. Javasolt műszak időpontok
        for slot in free_slots:
            if slot.duration >= 2:  # min 2 óra
                suggested_shift = optimize_shift_timing(
                    slot, 
                    remaining_hours_this_week,
                    shift_type_requirements,  # délelőtt/délután/hétvége
                    prioritize_morning=prioritize_morning_shift if friend_sleeping else False
                )
                available_slots.append(suggested_shift)
    
    # 9. Priorizálás és ranking
    ranked_suggestions = rank_by_priority(available_slots)
    
    return ranked_suggestions[:5]  # Top 5 javaslat
```

**Edzés időpont meghatározás logika (frissített):**
```python
def get_workout_time(day, friend_schedule, friend_sleeping_period=None):
    """
    Az edzés ideális időpontja a barát órarendje és alvási ideje alapján.
    
    SZABÁLY: Ha barát éjszakázott, akkor délelőtt (07:00-14:00) alszik,
    így NEM lehet edzés délelőtt. Csak délután/este lehetséges.
    """
    friend_classes = get_friend_classes_for_day(day)
    
    # Ha barát alszik (éjszakázás után), kizárjuk a délelőtti időpontokat
    if friend_sleeping_period:
        available_time_windows = [
            {'start': time(14, 0), 'end': time(23, 0)}  # Csak délután/este
        ]
    else:
        available_time_windows = [
            {'start': time(6, 0), 'end': time(23, 0)}  # Egész nap
        ]
    
    if not friend_classes:
        # Ha nincs órája ÉS nem alszik, akkor flexibilis
        if not friend_sleeping_period:
            return suggest_flexible_workout_time(day)
        else:
            # Ha alszik, akkor csak délután
            return suggest_afternoon_workout_time(day)
    
    # Találd meg a legjobb edzés időpontot a barát órái körül
    # (de NEM az alvási időszakban)
    suggested_times = []
    
    for class_session in friend_classes:
        # Közvetlenül az óra után
        after_class = class_session.end_time + timedelta(minutes=30)
        
        # Ellenőrizd, hogy nem ütközik-e az alvási idővel
        if not conflicts_with_sleeping(after_class, friend_sleeping_period):
            suggested_times.append({
                'start': after_class,
                'reasoning': f'Barát órája után ({class_session.name})',
                'priority': 'high'
            })
        
        # Közvetlenül az óra előtt (ha van elég idő)
        before_class = class_session.start_time - timedelta(hours=3)
        
        if before_class.hour >= 6 and not conflicts_with_sleeping(before_class, friend_sleeping_period):
            suggested_times.append({
                'start': before_class,
                'reasoning': f'Barát órája előtt ({class_session.name})',
                'priority': 'medium'
            })
    
    return rank_workout_times(suggested_times)


def conflicts_with_sleeping(workout_start_time, sleeping_period):
    """
    Ellenőrzi, hogy az edzés időpont ütközik-e a barát alvási idejével.
    """
    if not sleeping_period:
        return False
    
    workout_end_time = workout_start_time + timedelta(hours=2.5)
    
    # Ha az edzés bármilyen része beleesik az alvási időbe
    if (workout_start_time.time() < sleeping_period['end_time'] and 
        workout_end_time.time() > sleeping_period['start_time']):
        return True
    
    return False
```

### 7.2 Progresszió Analizáló

**Metrika:**
- **Volume Load**: szett × ismétlés × súly
- **Relatív erő növekedés**: (aktuális - kezdeti) / kezdeti × 100%
- **Tendencia**: lineáris regresszió a súlyokra/ismétlésekre

**Pszeudokód:**
```python
def analyze_progression(exercise_id, weeks=4):
    logs = get_workout_logs(exercise_id, last_n_weeks=weeks)
    
    # Heti átlagok számítása
    weekly_averages = calculate_weekly_averages(logs)
    
    # Tendencia számítás
    trend = linear_regression(weekly_averages)
    
    # Kategorizálás
    if trend.slope > 5:  # 5%+ növekedés
        category = "excellent_progress"
    elif trend.slope > 0:
        category = "steady_progress"
    elif trend.slope == 0:
        category = "plateau"
    else:
        category = "regression"
    
    return {
        "category": category,
        "improvement_percentage": trend.slope,
        "recommendation": get_recommendation(category)
    }
```

---

## 8. API Endpoints (Supabase Edge Functions)

### 8.1 Workout Cycle Management
- `GET /api/workout-cycle/current` - Aktuális ciklus pozíció
- `POST /api/workout-cycle/advance` - Következő napra lépés
- `GET /api/workout-cycle/preview?weeks=4` - Következő N hét előnézet

### 8.2 Workout Logging
- `POST /api/workout-log` - Szett rögzítése
- `GET /api/workout-log/{date}` - Napi edzésnapló
- `GET /api/workout-log/history/{exercise_id}` - Gyakorlat előzmények

### 8.3 Work Shift Management
- `POST /api/shift-suggestions` - Műszak javaslatok generálása
- `POST /api/shifts` - Műszak létrehozása
- `PUT /api/shifts/{id}` - Műszak módosítása
- `DELETE /api/shifts/{id}` - Műszak törlése
- `GET /api/shifts/stats` - Munkaidó statisztikák

### 8.4 Analytics
- `GET /api/analytics/progression` - Progresszió összefoglaló
- `GET /api/analytics/exercise/{id}` - Gyakorlat részletes analitika
- `GET /api/analytics/muscle-group` - Izomcsoport alapú összesítés

### 8.5 Friend Schedule
- `GET /api/friend-schedule` - Barát teljes heti órarendje
- `GET /api/friend-schedule/conflicts` - Ütköző időpontok azonosítása
- `POST /api/friend-schedule` - Órarend feltöltése/frissítése
- **`GET /api/friend-night-shifts`** - Barát éjszakai műszakjai (következő 4 hét)
- **`POST /api/friend-night-shifts`** - Éjszakai műszak rögzítése
- **`DELETE /api/friend-night-shifts/{id}`** - Éjszakai műszak törlése
- **`GET /api/friend-night-shifts/affected-days`** - Mely napokon nem lehet délelőtt edzeni

---

## 9. Implementációs Fázisok

### Phase 1: Core Infrastructure (1-2 hét)
- [ ] Supabase projekt setup
- [ ] Adatbázis táblák létrehozása
- [ ] Next.js projekt inicializálás
- [ ] Alapvető authentication (Supabase Auth)
- [ ] Alap routing és layout

### Phase 2: Naptár Modul (1-2 hét)
- [ ] Naptár UI komponens
- [ ] Push-Pull-Legs ciklus logika
- [ ] Workout cycle state management
- [ ] Események létrehozása/szerkesztése
- [ ] Barát órarend integráció és overlay megjelenítés

### Phase 3: Munkaidő Modul (1 hét)
- [ ] Műszak CRUD műveletek
- [ ] Munkaidő követés dashboard
- [ ] Minimum óraszám ellenőrzés
- [ ] Műszak javaslat algoritmus v1 (barát órarend figyelembevételével)

### Phase 4: Edzésnapló (1-2 hét)
- [ ] Gyakorlat lista megjelenítés
- [ ] Szett rögzítő űrlap
- [ ] Pihenő időzítő
- [ ] Workout log history view

### Phase 5: Analitika (1 hét)
- [ ] Progresszió grafikonok
- [ ] Gyakorlat összehasonlítás
- [ ] Fejlődés kategorizálás
- [ ] Javaslatok generálása

### Phase 6: Optimalizálás & Polish (1 hét)
- [ ] UI/UX finomhangolás
- [ ] Teljesítmény optimalizálás
- [ ] Mobilra optimalizálás
- [ ] Hibakezelés javítása

**Teljes becsült időkeret: 6-9 hét**

---

## 10. Barát Órarend Integráció

### 10.1 Adatmodell

A `friend_schedule` tábla heti mintát tárol a barát egyetemi óráihoz:

**Séma példa:**
```json
[
  {
    "day_of_week": 0,  // Hétfő
    "start_time": "15:00",
    "end_time": "17:00",
    "event_name": "Programozási nyelvek",
    "is_available": false
  },
  {
    "day_of_week": 1,  // Kedd
    "start_time": "14:00",
    "end_time": "16:00",
    "event_name": "Információbiztonság",
    "is_available": false
  }
]
```

### 10.2 Használat a műszak javaslatban

**Logika:**
1. **Edzés ideális időpont**: A barát órái után/előtt ±30 perc toleranciával
2. **ÚJ - Éjszakai műszak után**: Ha barát éjszakázott (21:00-07:00), akkor másnap 07:00-14:00 alszik → NEM lehet edzés
3. **Munkaidő javaslat**: 
   - Normál napok: Kerüli az edzés időt (2-2.5h) ÉS a barát óráit
   - Éjszakázás utáni napok: PRIORIZÁLJA a délelőtti munkaidőt (07:00-14:00), mivel úgysem lehet edzés
4. **Konfliktus detektálás**: Ha a felhasználó olyan műszakot vesz fel, ami ütközik a barát óráival, figyelmeztetés

**Példa algoritmus:**
```python
def calculate_available_time_slots(day):
    """
    Számítsd ki az elérhető időszakokat egy adott napra.
    Figyelembe veszi: barát órái, éjszakai műszak, edzés, barátnő programok.
    """
    day_start = datetime.combine(day, time(6, 0))  # 6:00
    day_end = datetime.combine(day, time(23, 0))   # 23:00
    
    # Foglalt időszakok összegyűjtése
    busy_periods = []
    
    # 1. Barát órái
    friend_classes = get_friend_classes(day)
    busy_periods.extend(friend_classes)
    
    # 2. KRITIKUS: Barát éjszakai műszakja ELŐZŐ napról
    previous_day_night_shift = get_friend_night_shift(day - timedelta(days=1))
    friend_sleeping = None
    
    if previous_day_night_shift:
        # Ha barát éjszakázott, akkor mai napon 07:00-14:00 alszik
        friend_sleeping = {
            'start_time': time(7, 0),
            'end_time': time(14, 0),
            'reason': 'Barát alszik (éjszakai műszak után)',
            'blocks_workout': True  # NEM lehet edzés ebben az időszakban
        }
        busy_periods.append(friend_sleeping)
    
    # 3. Edzés időpont (ha van edzésnap)
    if is_workout_day(day):
        workout_slot = determine_workout_time(
            day, 
            friend_classes,
            friend_sleeping_period=friend_sleeping
        )
        busy_periods.append(workout_slot)
    
    # 4. Barátnő és egyéb programok
    personal_events = get_personal_events(day)
    busy_periods.extend(personal_events)
    
    # 5. Szabad időszakok számítása
    busy_periods.sort(key=lambda x: x.start_time)
    free_slots = []
    current_time = day_start
    
    for busy in busy_periods:
        if current_time < busy.start_time:
            slot_info = {
                'start': current_time,
                'end': busy.start_time,
                'duration': (busy.start_time - current_time).seconds / 3600
            }
            
            # FONTOS: Ha ez a 07:00-14:00 időszak ÉS barát alszik
            # → Speciális jelölés: IDEÁLIS MUNKAIDŐ
            if friend_sleeping and is_morning_slot(slot_info):
                slot_info['recommended_for'] = 'work'
                slot_info['priority'] = 'high'
                slot_info['reason'] = 'Barát alszik, nem lehet edzés - ideális munkaidő!'
            
            free_slots.append(slot_info)
        current_time = max(current_time, busy.end_time)
    
    # Utolsó szabad időszak a nap végéig
    if current_time < day_end:
        free_slots.append({
            'start': current_time,
            'end': day_end,
            'duration': (day_end - current_time).seconds / 3600
        })
    
    return free_slots
```

### 10.3 UI Megjelenítés

**Naptár nézet:**
- A barát órái **piros** háttérrel jelennek meg
- Hover-nél tooltip: "Barát órája: Programozási nyelvek"
- Nem szerkeszthető blokkok (read-only)

**Heti timeline nézet:**
- A barát órái overlay rétegként (átlátszó piros csíkok)
- Edzés javasolt idősáv (zöld keret) a barát órái körül
- Munkaidő javasolt sávok (kék) a fennmaradó időben

---

## 11. Kezdő Adatok (Seed Data)

### 11.1 Edzésterv Seed

Az alkalmazás első indulásakor automatikusan betöltődik a 10 hetes A/B program:

```python
# A és B heti edzéstervek
PUSH_A_EXERCISES = [
    {
        "name": "30 fokos nyomás kézi súllyal",
        "sets": 3,
        "reps": "8-12",
        "rir": 2,
        "rest_seconds": 150
    },
    {
        "name": "Mellnyomó gép (Chest Press)",
        "sets": 3,
        "reps": "10-15",
        "rir": 1,
        "rest_seconds": 120
    },
    {
        "name": "Y emelés (Y-Raise)",
        "sets": 3,
        "reps": "12-15",
        "rir": 1,
        "rest_seconds": 90
    },
    {
        "name": "Kábeles tricepsz nyújtás",
        "sets": 3,
        "reps": "12-15",
        "rir": 0,
        "rest_seconds": 90
    },
    {
        "name": "Lábemelés függeszkedve",
        "sets": 3,
        "reps": "Bukásig",
        "rir": 0,
        "rest_seconds": 90
    }
]

PULL_A_EXERCISES = [
    {
        "name": "Széles lehúzás (Lat Pulldown)",
        "sets": 3,
        "reps": "10-12",
        "rir": 2,
        "rest_seconds": 150
    },
    {
        "name": "Melltámaszos evezés",
        "sets": 3,
        "reps": "10-15",
        "rir": 1,
        "rest_seconds": 120
    },
    {
        "name": "Scott pados karhajlítás",
        "sets": 3,
        "reps": "10-12",
        "rir": 0,
        "rest_seconds": 90
    },
    {
        "name": "Kalapács bicepsz",
        "sets": 3,
        "reps": "12-15",
        "rir": 0,
        "rest_seconds": 90
    }
]

LEGS_A_EXERCISES = [
    {
        "name": "Pendulum guggolás (vagy Hack)",
        "sets": 3,
        "reps": "8-10",
        "rir": 2,
        "rest_seconds": 180
    },
    {
        "name": "RDL (Román felhúzás)",
        "sets": 3,
        "reps": "8-12",
        "rir": 2,
        "rest_seconds": 180
    },
    {
        "name": "Bolgár guggolás",
        "sets": 2,
        "reps": "10-12",
        "rir": 1,
        "rest_seconds": 150
    },
    {
        "name": "Ülő combhajlító",
        "sets": 3,
        "reps": "12-15",
        "rir": 0,
        "rest_seconds": 90
    },
    {
        "name": "Álló vádli",
        "sets": 4,
        "reps": "10-15",
        "rir": 0,
        "rest_seconds": 90
    }
]

PUSH_B_EXERCISES = [
    {
        "name": "Smith keretes mellnyomás",
        "sets": 3,
        "reps": "8-12",
        "rir": 2,
        "rest_seconds": 150
    },
    {
        "name": "Vállból nyomás (Dumbbell Press)",
        "sets": 3,
        "reps": "10-12",
        "rir": 1,
        "rest_seconds": 120
    },
    {
        "name": "Pec Deck (Tárogató gép)",
        "sets": 3,
        "reps": "12-15",
        "rir": 0,
        "rest_seconds": 90
    },
    {
        "name": "Tricepsz nyújtás fej felett",
        "sets": 3,
        "reps": "10-15",
        "rir": 0,
        "rest_seconds": 90
    }
]

PULL_B_EXERCISES = [
    {
        "name": "Húzódzkodás (súlyos vagy segített)",
        "sets": 3,
        "reps": "6-10",
        "rir": 1,
        "rest_seconds": 180
    },
    {
        "name": "Merev karos lehúzás",
        "sets": 3,
        "reps": "12-15",
        "rir": 1,
        "rest_seconds": 90
    },
    {
        "name": "Kelso Shrug (Vállvonogatás)",
        "sets": 3,
        "reps": "12-15",
        "rir": 1,
        "rest_seconds": 90
    },
    {
        "name": "Bicepsz ülve (Incline Curl)",
        "sets": 3,
        "reps": "10-12",
        "rir": 0,
        "rest_seconds": 90
    }
]

LEGS_B_EXERCISES = [
    {
        "name": "Hip Thrust",
        "sets": 3,
        "reps": "10-12",
        "rir": 1,
        "rest_seconds": 150
    },
    {
        "name": "Hack guggolás",
        "sets": 3,
        "reps": "10-12",
        "rir": 1,
        "rest_seconds": 180
    },
    {
        "name": "Hyperhajlítás (Hyperextension)",
        "sets": 3,
        "reps": "12-15",
        "rir": 0,
        "rest_seconds": 90
    },
    {
        "name": "Lábnyújtás (Leg Extension)",
        "sets": 3,
        "reps": "12-15",
        "rir": 0,
        "rest_seconds": 90
    }
]
```

### 11.2 Barát Órarend Seed

```python
# Barát heti órarendje - seed adatok
FRIEND_WEEKLY_SCHEDULE = [
    # Hétfő
    {
        "day_of_week": 0,
        "start_time": "15:00",
        "end_time": "17:00",
        "event_name": "Programozási nyelvek",
        "is_available": False,
        "notes": "Előadás"
    },
    # Kedd
    {
        "day_of_week": 1,
        "start_time": "14:00",
        "end_time": "16:00",
        "event_name": "Információbiztonság",
        "is_available": False,
        "notes": "Előadás"
    },
    # Szerda
    {
        "day_of_week": 2,
        "start_time": "16:00",
        "end_time": "18:00",
        "event_name": "Programozási II. gyak.",
        "is_available": False,
        "notes": "Gyakorlat"
    },
    # Csütörtök - több óra
    {
        "day_of_week": 3,
        "start_time": "09:00",
        "end_time": "10:00",
        "event_name": "Szoftvertejlesztési folyamatok gy.",
        "is_available": False,
        "notes": "Gyakorlat"
    },
    {
        "day_of_week": 3,
        "start_time": "14:00",
        "end_time": "15:00",
        "event_name": "Programozási nyelvek gyak.",
        "is_available": False,
        "notes": "Gyakorlat"
    },
    {
        "day_of_week": 3,
        "start_time": "17:00",
        "end_time": "18:00",
        "event_name": "Információbiztonság",
        "is_available": False,
        "notes": "Gyakorlat"
    },
    # Péntek
    {
        "day_of_week": 4,
        "start_time": "18:00",
        "end_time": "20:00",
        "event_name": "Alkalmazásfejlesztés I.",
        "is_available": False,
        "notes": "Előadás/gyakorlat"
    }
]
```

**Magyarázat:**
- `day_of_week`: 0 = hétfő, 1 = kedd, ..., 6 = vasárnap
- `is_available`: False = NEM elérhető (órája van), True = szabad
- Ez egy ismétlődő heti minta, minden héten ugyanez az órarend

---

## 12. Nem-funkcionális követelmények

### Teljesítmény
- Naptár renderelés < 500ms
- Edzésnapló szett mentés < 200ms
- Dashboard betöltés < 1s

### Biztonság
- Supabase Row Level Security minden táblán
- Csak a saját adataidat láthatod/szerkesztheted

### Használhatóság
- Reszponzív design (desktop + mobil)
- Offline support (később, optional)
- Dark mode support

---

## 13. Későbbi továbbfejlesztési ötletek (Post-MVP)

1. **Mobil app** (React Native)
2. **Barát/barátnő megosztás** (collaborative scheduling)
3. **Étkezés napló** integráció
4. **Export/Import** funkció (CSV, PDF)
5. **Push notifikációk** (edzés emlékeztető, műszak kezdés)
6. **AI-alapú form check** (videó upload, ha edzés közben felvéve)
7. **Közösségi funkciók** (ha többen használják)
8. **Barát órarendjének automatikus szinkronizálása** (pl. egyetemi rendszerből importálás)
9. **Hangalapú napló rögzítés** (edzés közben diktálás)

---

## 14. Success Metrics

### Használati metrikák
- Napi aktív edzésnapló rögzítések száma
- Heti műszak tervezés aktivitás
- Progresszió analitika megtekintések
- **Éjszakai műszakok rögzítése és kezelése**
- **Éjszakázás utáni napok munkaidő kihasználtsága**

### Cél KPI-k (első 3 hónap)
- 90%+ edzések naplózva
- Havi munkaidő követelmény 100% teljesítése
- 0 nap kimaradás az edzésciklusból
- Maximális edzés-barát órarend átfedés < 5%
- **Éjszakázás utáni napokon 0% délelőtti edzés ütközés**
- **Éjszakázás utáni napokon átlagosan 6+ óra délelőtti munkaidő**

---

## 15. Kockázatok és Mitigációs Stratégiák

| Kockázat | Hatás | Mitigáció |
|----------|-------|-----------|
| Barát órarendje változik | Műszak javaslatok pontatlanok | Könnyű módosítás UI + értesítések + flexibilis algoritmus |
| **Barát éjszakázási mintája változik** | **Hibás délelőtti edzés javaslatok** | **Egyszerű rögzítés + automatikus validáció + naptár figyelmeztetések** |
| Edzésterv túl komplex | Nehéz naplózás | Egyszerűsített gyors rögzítés mód + sablonok |
| Supabase cost túllépés | Költségvetés | Csak personal use, figyelés + limitek + optimalizálás |
| Progresszió stagnálás | Motiváció csökkenés | Automatikus javaslatok + deload hetek észlelése |

---

## 16. Tesztelési Stratégia

### Unit tesztek
- Műszak optimalizáló algoritmus
- Progresszió számítások
- Workout cycle management logika

### Integrációs tesztek
- Supabase Edge Functions
- API endpoints
- Adatbázis műveletek

### E2E tesztek (Playwright/Cypress)
- Naptár interakciók
- Edzésnapló rögzítés flow
- Műszak létrehozás és módosítás

### Manuális tesztek
- UI/UX responsive design
- Különböző képernyőméretek
- Dark mode

---

## 17. Deployment & DevOps

### Development
- **Local development**: 
  - Next.js dev server: `npm run dev`
  - Supabase local: `supabase start`
  - PostgreSQL seed scripts

### Staging
- **Vercel Preview**: minden PR automatikus deploy
- **Supabase Preview**: külön staging project

### Production
- **Domain**: fitschedule.pro (vagy hasonló)
- **Hosting**: Vercel Pro (optional)
- **Database**: Supabase Production
- **Monitoring**: Vercel Analytics + Supabase Logs

### CI/CD Pipeline
```yaml
# GitHub Actions example
name: Deploy
on:
  push:
    branches: [main]
jobs:
  deploy:
    - Lint & Type check
    - Run unit tests
    - Build Next.js
    - Deploy to Vercel
    - Run E2E tests
    - Notify success/failure
```

---

## 18. Dokumentáció

### Developer Documentation
- README.md: Setup instructions
- API.md: API endpoints dokumentáció
- DATABASE.md: Adatbázis séma és migrációk
- ALGORITHMS.md: Műszak optimalizáló és analitika részletesen

### User Documentation
- Használati útmutató (built-in help)
- FAQ section
- Video tutorialok (opcionális)

---

## Függelékek

### A. Workout Plan Data (Teljes)

```python
WORKOUT_DATA = {
    "PUSH_A": [
        {"exercise": "30 fokos nyomás kézi súllyal", "sets": 3, "reps": "8-12", "rir": 2, "rest": "2-3 p"},
        {"exercise": "Mellnyomó gép (Chest Press)", "sets": 3, "reps": "10-15", "rir": 1, "rest": "2 p"},
        {"exercise": "Y emelés (Y-Raise)", "sets": 3, "reps": "12-15", "rir": 1, "rest": "1.5 p"},
        {"exercise": "Kábeles tricepsz nyújtás", "sets": 3, "reps": "12-15", "rir": 0, "rest": "1.5 p"},
        {"exercise": "Lábemelés függeszkedve", "sets": 3, "reps": "Bukásig", "rir": 0, "rest": "1.5 p"}
    ],
    "PULL_A": [
        {"exercise": "Széles lehúzás (Lat Pulldown)", "sets": 3, "reps": "10-12", "rir": 2, "rest": "2-3 p"},
        {"exercise": "Melltámaszos evezés", "sets": 3, "reps": "10-15", "rir": 1, "rest": "2 p"},
        {"exercise": "Scott pados karhajlítás", "sets": 3, "reps": "10-12", "rir": 0, "rest": "1.5 p"},
        {"exercise": "Kalapács bicepsz", "sets": 3, "reps": "12-15", "rir": 0, "rest": "1.5 p"}
    ],
    "LEGS_A": [
        {"exercise": "Pendulum guggolás (vagy Hack)", "sets": 3, "reps": "8-10", "rir": 2, "rest": "3 p"},
        {"exercise": "RDL (Román felhúzás)", "sets": 3, "reps": "8-12", "rir": 2, "rest": "3 p"},
        {"exercise": "Bolgár guggolás", "sets": 2, "reps": "10-12", "rir": 1, "rest": "2-3 p"},
        {"exercise": "Ülő combhajlító", "sets": 3, "reps": "12-15", "rir": 0, "rest": "1.5 p"},
        {"exercise": "Álló vádli", "sets": 4, "reps": "10-15", "rir": 0, "rest": "1.5 p"}
    ],
    "PUSH_B": [
        {"exercise": "Smith keretes mellnyomás", "sets": 3, "reps": "8-12", "rir": 2, "rest": "2-3 p"},
        {"exercise": "Vállból nyomás (Dumbbell Press)", "sets": 3, "reps": "10-12", "rir": 1, "rest": "2 p"},
        {"exercise": "Pec Deck (Tárogató gép)", "sets": 3, "reps": "12-15", "rir": 0, "rest": "1.5 p"},
        {"exercise": "Tricepsz nyújtás fej felett", "sets": 3, "reps": "10-15", "rir": 0, "rest": "1.5 p"}
    ],
    "PULL_B": [
        {"exercise": "Húzódzkodás (súlyos vagy segített)", "sets": 3, "reps": "6-10", "rir": 1, "rest": "3 p"},
        {"exercise": "Merev karos lehúzás", "sets": 3, "reps": "12-15", "rir": 1, "rest": "1.5 p"},
        {"exercise": "Kelso Shrug (Vállvonogatás)", "sets": 3, "reps": "12-15", "rir": 1, "rest": "1.5 p"},
        {"exercise": "Bicepsz ülve (Incline Curl)", "sets": 3, "reps": "10-12", "rir": 0, "rest": "1.5 p"}
    ],
    "LEGS_B": [
        {"exercise": "Hip Thrust", "sets": 3, "reps": "10-12", "rir": 1, "rest": "2-3 p"},
        {"exercise": "Hack guggolás", "sets": 3, "reps": "10-12", "rir": 1, "rest": "3 p"},
        {"exercise": "Hyperhajlítás (Hyperextension)", "sets": 3, "reps": "12-15", "rir": 0, "rest": "1.5 p"},
        {"exercise": "Lábnyújtás (Leg Extension)", "sets": 3, "reps": "12-15", "rir": 0, "rest": "1.5 p"}
    ]
}
```

### B. Barát Heti Órarendje (Részletes)

#### Áttekintő Táblázat

| Nap | Időpont | Óra neve | Típus |
|-----|---------|----------|-------|
| **Hétfő** | 15:00 - 17:00 | Programozási nyelvek | Előadás |
| **Kedd** | 14:00 - 16:00 | Információbiztonság | Előadás |
| **Szerda** | 16:00 - 18:00 | Programozási II. gyak. | Gyakorlat |
| **Csütörtök** | 09:00 - 10:00 | Szoftvertejlesztési folyamatok gy. | Gyakorlat |
| **Csütörtök** | 14:00 - 15:00 | Programozási nyelvek gyak. | Gyakorlat |
| **Csütörtök** | 17:00 - 18:00 | Információbiztonság | Gyakorlat |
| **Péntek** | 18:00 - 20:00 | Alkalmazásfejlesztés I. | Előadás/Gyak. |

#### Edzés Időpont Javaslatok Barát Órarendje Alapján

**Hétfő:**
- **Javasolt edzés idő**: 17:30 - 20:00 (barát órája után)
- Alternatíva: 12:00 - 14:30 (óra előtt)

**Kedd:**
- **Javasolt edzés idő**: 16:30 - 19:00 (barát órája után)
- Alternatíva: 10:00 - 12:30 (óra előtt)

**Szerda:**
- **Javasolt edzés idő**: 18:30 - 21:00 (barát órája után)
- Alternatíva: 12:00 - 14:30 (óra előtt)

**Csütörtök:**
- **Javasolt edzés idő**: 10:30 - 13:00 (reggeli óra után, délutáni előtt)
- Alternatíva: 18:30 - 21:00 (összes óra után)
- KERÜLENDŐ: 09:00-10:00, 14:00-15:00, 17:00-18:00

**Péntek:**
- **Javasolt edzés idő**: 14:00 - 16:30 (este óra előtt)
- Nem javasolt: 20:00 után (túl késő este)

**Hétvége (Szombat/Vasárnap):**
- **Flexibilis**: Nincs órája, bármikor egyeztethető

#### Munkaidő Optimalizálási Példák

**Hétfő (Push nap, A hét):**
```
06:00-09:00: Délelőtti műszak (3 óra) ✅
09:00-12:00: Szabad/admin
12:00-15:00: Prep + ebéd
15:00-17:00: ❌ BARÁT ÓRÁ (Programozási nyelvek)
17:30-20:00: 🏋️ EDZÉS (Push A, 2.5h)
20:30-22:00: Barátnő / vacsi
```

**Kedd (Pull nap):**
```
08:00-14:00: Délelőtti műszak (6 óra) ✅
14:00-16:00: ❌ BARÁT ÓRÁ (Információbiztonság)
16:30-19:00: 🏋️ EDZÉS (Pull A, 2.5h)
19:30-22:00: Barátnő / szabad idő
```

**Szerda (Legs nap):**
```
09:00-13:00: Délelőtti műszak (4 óra) ✅
13:00-16:00: Ebéd + prep
16:00-18:00: ❌ BARÁT ÓRÁ (Programozási II. gyak.)
18:30-21:00: 🏋️ EDZÉS (Legs A, 2.5h)
21:00-22:00: Stretching + recovery
```

**Csütörtök (Rest nap):**
```
10:30-16:30: Műszak (6 óra) ✅
  - Kerüli: 09:00-10:00 ❌ (Barát órája)
  - Kerüli: 14:00-15:00 ❌ (Barát órája)
  - Kerüli: 17:00-18:00 ❌ (Barát órája)
19:00-23:00: Barátnő / szabad program / főzés
```

### C. Workflow Diagram: Napi Rutin

```
Reggel 06:00
    ↓
Ellenőrizd Dashboard
    ↓
┌───────────────────────────────────────────┐
│ Barát éjszakázott tegnap?                 │
├─────────────┬─────────────────────────────┤
│ IGEN        │ NEM                         │
│ ↓           │ ↓                           │
│ 🌙→😴       │ Normál nap                  │
│ 07:00-14:00 │ ↓                           │
│ Barát alszik│ Van edzés ma?               │
│ ↓           ├─────────────┬───────────────┤
│ NEM lehet   │ IGEN        │ NEM           │
│ edzés!      │ ↓           │ ↓             │
│ ↓           │ Naptárban   │ Műszak        │
│ IDEÁLIS     │ edzés       │ tervezés      │
│ MUNKAIDŐ    │ időpont     │ (barát órái   │
│ ↓           │ (barát      │ körül)        │
│ Délelőtti   │ óráit       │ ↓             │
│ műszak      │ figyelembe  │ Műszak        │
│ felvétele   │ véve)       │ elvégzése     │
│ (6-8 óra)   │ ↓           │ (2-6h)        │
│ ↓           │ Edzésre     │ ↓             │
│ Délután:    │ készülés    └───────────────┤
│ - Edzés     │ ↓                           │
│   (ha van)  │ 🏋️ EDZÉS (2-2.5h)          │
│ - Barátnő   │ ↓                           │
│ ↓           │ Napló rögzítése             │
└─────────────┤ (szettek, súlyok, RIR)      │
              │ ↓                           │
              └─────────────┬───────────────┘
                            ↓
                Barátnő / Főzés / Pihenés
                            ↓
                Nap vége: Progresszió
                áttekintés (opcionális)
```

**Példa Szcenáriók:**

**Szcenárió 1: Hétfő (Push A nap) - Barát NEM éjszakázott vasárnap**
```
06:00-09:00: Reggeli rutin + admin
09:00-13:00: Délelőtti műszak (4 óra) ✅
13:00-15:00: Ebéd + pihenés
15:00-17:00: ❌ BARÁT ÓRÁ (Programozási nyelvek)
17:30-20:00: 🏋️ PUSH A EDZÉS (2.5h)
20:30-22:30: Barátnő / vacsi
```

**Szcenárió 2: Kedd (Pull A nap) - Barát ÉJSZAKÁZOTT hétfőn (21:00-07:00)**
```
07:00-14:00: ⚠️ BARÁT ALSZIK - NEM LEHET EDZÉS!
              💡 IDEÁLIS MUNKAIDŐ!
07:00-13:00: Délelőtti műszak (6 óra) ✅✅ (priorizált)
13:00-14:00: Ebéd
14:00-16:00: ❌ BARÁT ÓRÁ (Információbiztonság)
16:30-19:00: 🏋️ PULL A EDZÉS (2.5h)
19:30-22:00: Barátnő / szabad idő
```

**Szcenárió 3: Szerda (Legs A nap) - Normál nap**
```
09:00-13:00: Délelőtti műszak (4 óra) ✅
13:00-16:00: Ebéd + prep
16:00-18:00: ❌ BARÁT ÓRÁ (Programozási II. gyak.)
18:30-21:00: 🏋️ LEGS A EDZÉS (2.5h)
21:00-22:00: Stretching + recovery
```

**Szcenárió 4: Csütörtök (Rest nap) - Barát ÉJSZAKÁZOTT szerda este**
```
07:00-14:00: ⚠️ BARÁT ALSZIK
07:00-14:00: Hosszú délelőtti műszak (7 óra) ✅✅✅
              (mivel rest nap, nincs edzés)
14:00-15:00: Pihenés
15:00-20:00: Barátnő program (mozi, vacsora)
20:00-23:00: Szabad / tévé / pihenés
```
```

### D. Database Migration Scripts

#### Initial Migration
```sql
-- 001_create_users_table.sql
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT UNIQUE NOT NULL,
    name TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- 002_create_workout_tables.sql
CREATE TABLE workout_plan (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    week_type TEXT CHECK (week_type IN ('A', 'B')),
    order_in_cycle INTEGER CHECK (order_in_cycle BETWEEN 1 AND 3),
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE exercises (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workout_plan_id UUID REFERENCES workout_plan(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    sets INTEGER NOT NULL,
    reps TEXT NOT NULL,
    rir INTEGER CHECK (rir >= 0),
    rest_seconds INTEGER,
    order_index INTEGER,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE workout_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    exercise_id UUID REFERENCES exercises(id) ON DELETE CASCADE,
    workout_date DATE NOT NULL,
    set_number INTEGER NOT NULL,
    reps_completed INTEGER,
    weight_kg DECIMAL(5, 2),
    rir_actual INTEGER,
    notes TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- 003_create_schedule_tables.sql
CREATE TABLE work_shifts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    shift_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    duration_hours DECIMAL(4, 2),
    shift_type TEXT CHECK (shift_type IN ('délelőtt', 'délután', 'hétvége')),
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE schedule_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    event_type TEXT CHECK (event_type IN ('workout', 'girlfriend', 'cooking', 'other')),
    event_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    title TEXT,
    description TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE workout_cycle (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    cycle_start_date DATE NOT NULL,
    current_week INTEGER CHECK (current_week BETWEEN 1 AND 10),
    current_week_type TEXT CHECK (current_week_type IN ('A', 'B')),
    current_day_index INTEGER CHECK (current_day_index BETWEEN 0 AND 3),
    last_updated TIMESTAMP DEFAULT NOW()
);

CREATE TABLE friend_schedule (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    day_of_week INTEGER CHECK (day_of_week BETWEEN 0 AND 6),
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    is_available BOOLEAN DEFAULT FALSE,
    event_name TEXT,
    notes TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE friend_night_shifts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    night_shift_date DATE NOT NULL,
    start_time TIME DEFAULT '21:00',
    end_time TIME DEFAULT '07:00',
    sleep_until TIME DEFAULT '14:00',
    notes TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(user_id, night_shift_date)
);

-- 004_create_indexes.sql
CREATE INDEX idx_workout_logs_user_date ON workout_logs(user_id, workout_date);
CREATE INDEX idx_workout_logs_exercise ON workout_logs(exercise_id);
CREATE INDEX idx_work_shifts_user_date ON work_shifts(user_id, shift_date);
CREATE INDEX idx_schedule_events_user_date ON schedule_events(user_id, event_date);
CREATE INDEX idx_friend_schedule_day ON friend_schedule(user_id, day_of_week);
CREATE INDEX idx_friend_night_shifts_date ON friend_night_shifts(user_id, night_shift_date);

-- 005_enable_rls.sql
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE workout_plan ENABLE ROW LEVEL SECURITY;
ALTER TABLE exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE workout_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE work_shifts ENABLE ROW LEVEL SECURITY;
ALTER TABLE schedule_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE workout_cycle ENABLE ROW LEVEL SECURITY;
ALTER TABLE friend_schedule ENABLE ROW LEVEL SECURITY;
ALTER TABLE friend_night_shifts ENABLE ROW LEVEL SECURITY;

-- Create policies (example for users table)
CREATE POLICY "Users can view own data" ON users
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own data" ON users
    FOR UPDATE USING (auth.uid() = id);

-- Similar policies for other tables...
```

---

**Dokumentum verziója:** 1.2  
**Utolsó frissítés:** 2026-02-09  
**Készítette:** User & Claude  
**Státusz:** ✅ Ready for Antigravity Implementation

**Mellékletek:** 
- Barát heti órarendje integrálva  
- **Barát éjszakai műszakjainak kezelése (ÚJ v1.2)**

**Changelog:**
- v1.2: Éjszakai műszak funkció hozzáadva (délelőtti edzés blokkolás, munkaidő priorizálás)
- v1.1: Barát órarend integráció
- v1.0: Alapvető PRD  

---

## Quick Start Guide (Antigravity-hez)

### 1. Projekt Inicializálás
```bash
# Supabase projekt létrehozása
supabase init

# Next.js app létrehozása
npx create-next-app@latest fitschedule-pro --typescript --tailwind --app

# Függőségek telepítése
npm install @supabase/supabase-js date-fns recharts
```

### 2. Környezeti Változók
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 3. Első Lépések
1. Adatbázis migrációk futtatása (lásd Függelék D)
2. Seed scriptek futtatása (Függelék A, B - workout data és barát órarendje)
3. Next.js projekt mappastruktúra felállítása
4. Alapvető komponensek létrehozása (Calendar, Dashboard, WorkoutLog)
5. Supabase client setup
6. Authentication flow implementálása

### 4. Prioritási Sorrend
1. ✅ Adatbázis + Auth
2. ✅ Naptár modul (Push-Pull-Legs ciklus)
3. ✅ Barát órarend integráció + **Éjszakai műszak kezelés**
4. ✅ Edzésnapló rögzítés
5. ✅ Munkaidő követés
6. ✅ Műszak javaslat algoritmus (éjszakai műszak priorizálással)
7. ✅ Progresszió analitika

---

### E. Barát Éjszakai Műszakjainak Kezelése

#### Általános Szabályok

**Éjszakai műszak definíció:**
- Kezdés: 21:00
- Befejezés: Másnap 07:00
- Alvási idő másnap: 07:00 - 14:00 (kb. 7 óra)

**Hatás az edzésre:**
- Az éjszakázást KÖVETŐ nap délelőtt (07:00-14:00) **NEM LEHET EDZÉS**
- Barát alszik, nem elérhető
- Csak délután/este lehetséges edzés (14:00 után)

**Hatás a munkaidőre:**
- Az éjszakázást követő nap délelőtt **IDEÁLIS MUNKAIDŐ**
- 6-8 órás délelőtti műszak javasolt
- Segít a havi/heti minimumok teljesítésében
- Hasznosítja az "elveszett" délelőtti időt

#### Adatmodell Példa

```python
# Éjszakai műszak seed példa
FRIEND_NIGHT_SHIFTS_EXAMPLE = [
    {
        "night_shift_date": "2026-02-10",  # Hétfő éjszaka
        "start_time": "21:00",
        "end_time": "07:00",  # Kedd reggel
        "sleep_until": "14:00",  # Kedd délután
        "notes": "Heti rendszeres éjszaka"
    },
    {
        "night_shift_date": "2026-02-17",  # Következő hétfő
        "start_time": "21:00",
        "end_time": "07:00",
        "sleep_until": "14:00",
        "notes": "Heti rendszeres éjszaka"
    }
]
```

#### UI Jelölések

**Naptár nézetben:**

```
┌─────────────────────────────────┐
│ Hétfő (Feb 10)                  │
│ ─────────────────────────────── │
│ 09:00-13:00: Munkaidő ✅        │
│ 15:00-17:00: Barát órája ❌     │
│ 18:00-20:30: Push A edzés 🏋️   │
│ 21:00-       🌙 ÉJSZAKAI MŰSZAK│
└─────────────────────────────────┘

┌─────────────────────────────────┐
│ Kedd (Feb 11)                   │
│ ─────────────────────────────── │
│       -07:00: 🌙 (folytatás)    │
│ 07:00-14:00: 😴 BARÁT ALSZIK    │
│             ⚠️ NEM LEHET EDZÉS! │
│             💡 IDEÁLIS MUNKAIDŐ │
│ ─────────────────────────────── │
│ 07:00-13:00: Munkaidő ✅✅      │
│ 14:00-16:00: Barát órája ❌     │
│ 17:00-19:30: Pull A edzés 🏋️   │
└─────────────────────────────────┘
```

#### Műszak Javaslat Példák

**Normál hét (nincs éjszakázás):**
```python
Hétfő:   Délelőtt 3-4h ✅, Este edzés
Kedd:    Délelőtt 3-4h ✅, Este edzés  
Szerda:  Délelőtt 3-4h ✅, Este edzés
Csütörtök: Délután 6h ✅ (rest nap)
Összesen: ~15h
```

**Hét éjszakázással (pl. hétfő éjszaka):**
```python
Hétfő:   Délelőtt 3h ✅, Este 21:00-tól 🌙 ÉJSZAKA
Kedd:    Délelőtt 7h ✅✅✅ (PRIORIZÁLT!), Este edzés
Szerda:  Délelőtt 3h ✅, Este edzés
Csütörtök: Délután 5h ✅ (rest nap)
Összesen: ~18h (!) - plusz a kedd hosszú napja miatt
```

#### Dashboard Widget Példa

```
┌────────────────────────────────────────┐
│ 🌙 Barát Éjszakai Műszakjai           │
├────────────────────────────────────────┤
│ Következő 2 hét:                       │
│                                        │
│ • Hétfő, Feb 10 (21:00)                │
│   → Kedd délelőtt NEM edzés!           │
│   → 💡 Hosszú délelőtti műszak javasolt│
│                                        │
│ • Hétfő, Feb 17 (21:00)                │
│   → Kedd délelőtt NEM edzés!           │
│   → 💡 Hosszú délelőtti műszak javasolt│
│                                        │
│ [+ Új éjszakai műszak hozzáadása]     │
└────────────────────────────────────────┘
```

#### Validation Rules

**Edzés időpont validáció:**
```python
def validate_workout_time(workout_date, workout_start_time):
    """
    Ellenőrzi, hogy az edzés időpont érvényes-e az éjszakai műszakok alapján.
    """
    previous_day = workout_date - timedelta(days=1)
    night_shift = get_friend_night_shift(previous_day)
    
    if night_shift:
        # Ha barát éjszakázott tegnap, ma délelőtt NEM lehet edzés
        if time(7, 0) <= workout_start_time.time() < time(14, 0):
            return {
                'valid': False,
                'error': 'Barát alszik (éjszakai műszak után). Edzés csak 14:00 után!',
                'suggested_times': ['16:00', '17:00', '18:00']
            }
    
    return {'valid': True}
```

**Műszak javaslat priorizálás:**
```python
def prioritize_shift_suggestions(free_slots, night_shift_info):
    """
    Ha van éjszakai műszak info, priorizálja a délelőtti munkaidőt.
    """
    if night_shift_info and night_shift_info['friend_sleeping']:
        for slot in free_slots:
            # 07:00-14:00 közötti slot = TOP PRIORITY
            if is_morning_slot(slot):
                slot['priority'] = 10  # Highest
                slot['reason'] = 'Barát alszik - ideális munkaidő!'
                slot['highlight'] = True
    
    return sorted(free_slots, key=lambda x: x.get('priority', 0), reverse=True)
```

#### Database Migration (Kiegészítés)

```sql
-- 006_add_night_shifts_table.sql
CREATE TABLE friend_night_shifts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    night_shift_date DATE NOT NULL,  -- Az éjszaka kezdő dátuma
    start_time TIME DEFAULT '21:00',
    end_time TIME DEFAULT '07:00',   -- Másnap reggel
    sleep_until TIME DEFAULT '14:00', -- Másnap délután
    notes TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    
    -- Constraint: egy user egy napon max 1 éjszakai műszak
    UNIQUE(user_id, night_shift_date)
);

CREATE INDEX idx_night_shifts_date ON friend_night_shifts(user_id, night_shift_date);

-- Helper view: következő napon érintett délelöttök
CREATE VIEW affected_mornings AS
SELECT 
    user_id,
    night_shift_date,
    night_shift_date + INTERVAL '1 day' AS affected_date,
    '07:00'::TIME AS no_workout_start,
    '14:00'::TIME AS no_workout_end,
    'Barát alszik (éjszakai műszak után)' AS reason
FROM friend_night_shifts;
```

#### Tesztelési Szcenáriók

**Test Case 1: Edzés próbálkozás éjszakázás utáni délelőttre**
```
Given: Barát éjszakázott hétfőn (21:00-07:00)
When: Felhasználó kedd 10:00-ra akar edzést betenni
Then: Hibaüzenet: "Barát alszik (07:00-14:00), edzés csak 14:00 után!"
```

**Test Case 2: Műszak javaslat éjszakázás után**
```
Given: Barát éjszakázott hétfőn
When: Felhasználó műszak javaslatot kér keddre
Then: Top javaslat: "07:00-14:00 délelőtti műszak (7h)" - PRIORIZÁLT
```

**Test Case 3: Naptár megjelenítés**
```
Given: Barát éjszakázott hétfőn
When: Felhasználó megnézi a kedd napi naptárt
Then: 
  - 07:00-14:00 sáv jelölve "Barát alszik 😴"
  - Edzés javaslat CSAK 14:00 után látható
  - Délelőtti munkaidő kiemelve zöld színnel
```

---

**Happy Coding! 🚀💪**