# 3. Dokumentacja UML - System Wspomagający Terapię Psychologiczną

## 3.1 Wprowadzenie

Niniejszy dokument zawiera kompletną dokumentację UML systemu wspomagającego terapię psychologiczną. Diagramy przedstawiają architekturę systemu, przepływ danych oraz interakcje między komponentami.

## 3.2 Diagram Przypadków Użycia (Use Case Diagram)

```
                    System Wspomagający Terapię Psychologiczną
    
    Pacjent                                                    Terapeuta
       |                                                          |
       |-- Rejestracja                                            |-- Logowanie
       |-- Logowanie                                              |-- Przeglądanie pacjentów
       |-- Zarządzanie dziennikiem nastroju                      |-- Przegląd dzienników nastroju
       |    |-- Dodawanie wpisu nastroju                         |-- Przegląd leków pacjentów  
       |    |-- Edycja wpisu nastroju                            |-- Wysyłanie wiadomości
       |    |-- Usuwanie wpisu nastroju                          |-- Odbieranie wiadomości
       |    |-- Przeglądanie historii                            |-- Przeglądanie powiadomień
       |-- Zarządzanie lekami                                    |-- Analiza statystyk pacjenta
       |    |-- Dodawanie leku                                   |
       |    |-- Edycja leku                                      |
       |    |-- Oznaczanie jako aktywny/nieaktywny               |
       |-- Komunikacja z terapeutą                               |
       |    |-- Wysyłanie wiadomości                             |
       |    |-- Odbieranie wiadomości                            |
       |-- Przeglądanie powiadomień                              |
       |-- Przeglądanie statystyk własnych                       |
       
                                |
                        Administrator Systemu
                                |
                                |-- Zarządzanie użytkownikami
                                |-- Tworzenie relacji terapeuta-pacjent
                                |-- Monitoring systemu
                                |-- Zarządzanie backupami
```

## 3.3 Diagram Klas (Class Diagram)

```
┌─────────────────┐       ┌──────────────────┐       ┌─────────────────┐
│     User        │       │  TherapistPatient │       │   MoodEntry     │
├─────────────────┤       ├──────────────────┤       ├─────────────────┤
│ + id: int       │◄──────┤ + id: int        │       │ + id: int       │
│ + email: string │       │ + therapist_id:int│       │ + user_id: int  │
│ + password: hash│       │ + patient_id: int │       │ + mood_rating:int│
│ + first_name: str│      │ + created_at: date│       │ + notes: text   │
│ + last_name: str│       └──────────────────┘       │ + entry_date:date│
│ + role: enum    │                                   │ + created_at:date│
│ + created_at:date│                                  └─────────────────┘
├─────────────────┤                                           │
│ + register()    │                                           │
│ + login()       │                                           │
│ + logout()      │                                           │
│ + updateProfile()│                                          │
└─────────────────┘                                          │
         │                                                    │
         │                                                    │
         │1                                                   │*
         │                                                    │
         ▼                                                    ▼
┌─────────────────┐       ┌──────────────────┐       ┌─────────────────┐
│   Medication    │       │     Message      │       │  Notification   │
├─────────────────┤       ├──────────────────┤       ├─────────────────┤
│ + id: int       │       │ + id: int        │       │ + id: int       │
│ + user_id: int  │       │ + sender_id: int │       │ + user_id: int  │
│ + name: string  │       │ + recipient_id:int│       │ + type: string  │
│ + dosage: string│       │ + content: text  │       │ + message: text │
│ + frequency: str│       │ + is_read: bool  │       │ + is_read: bool │
│ + time_slots:json│      │ + created_at:date│       │ + created_at:date│
│ + active: bool  │       ├──────────────────┤       ├─────────────────┤
│ + created_at:date│      │ + send()         │       │ + create()      │
├─────────────────┤       │ + markAsRead()   │       │ + markAsRead()  │
│ + add()         │       │ + getHistory()   │       │ + getUnread()   │
│ + update()      │       └──────────────────┘       └─────────────────┘
│ + delete()      │
│ + toggleActive()│
└─────────────────┘

Relationships:
- User (1) ←→ (*) MoodEntry
- User (1) ←→ (*) Medication  
- User (1) ←→ (*) Message (as sender)
- User (1) ←→ (*) Message (as recipient)
- User (1) ←→ (*) Notification
- User (*) ←→ (*) User (through TherapistPatient)
```

## 3.4 Diagram Sekwencji - Logowanie Użytkownika

```
Client          Frontend        AuthService     Database        JWT Service
  |               |               |               |               |
  |-- login() --->|               |               |               |
  |               |-- POST /api/auth/login ----->|               |
  |               |               |-- validateCredentials() ---->|
  |               |               |               |-- query() -->|
  |               |               |               |<-- result ---|
  |               |               |<-- user ------|               |
  |               |               |-- generateToken() --------->|
  |               |               |<-- token -----------------|
  |               |<-- 200 + token + user data ---|               |
  |<-- success ---|               |               |               |
  |               |-- setAuthHeader() ----------->|               |
  |               |-- saveToLocalStorage() ------>|               |
  |               |-- redirectToDashboard() ----->|               |
```

## 3.5 Diagram Sekwencji - Dodawanie Wpisu Nastroju

```
Patient     Frontend     MoodService     Validation     Database     NotificationService
  |           |             |               |             |               |
  |-- addMoodEntry() ----->|               |             |               |
  |           |-- POST /api/mood --------->|               |             |
  |           |             |-- validate() ------>|       |               |
  |           |             |<-- valid ----------|       |               |
  |           |             |-- authenticateUser() ----->|               |
  |           |             |<-- user -----------|       |               |
  |           |             |-- insert() ----------------->|               |
  |           |             |<-- moodEntry --------------|               |
  |           |             |-- createNotification() ------------------------>|
  |           |             |<-- notification ---------------------------|
  |           |<-- 201 + moodEntry data ---|             |               |
  |<-- success|             |               |             |               |
```

## 3.6 Diagram Aktywności - Proces Komunikacji Terapeuta-Pacjent

```
                        Start
                          |
                          ▼
                [Terapeuta loguje się]
                          |
                          ▼
                [Wybiera pacjenta z listy]
                          |
                          ▼
                [Sprawdza czy istnieje relacja] ──No──► [Error: Brak uprawnień]
                          |                                        |
                         Yes                                       ▼
                          ▼                                      End
                [Pisze wiadomość]
                          |
                          ▼
                [Walidacja treści] ──Invalid──► [Pokazuje błąd walidacji]
                          |                             |
                         Valid                          ▼
                          ▼                    [Poprawia wiadomość]
                [Zapisuje w bazie danych]               |
                          |                             |
                          ▼                             |
                [Tworzy powiadomienie dla pacjenta] ────┘
                          |
                          ▼
                [Pacjent otrzymuje powiadomienie]
                          |
                          ▼
                [Pacjent czyta wiadomość]
                          |
                          ▼
            [Pacjent może odpowiedzieć] ──No──► End
                          |                      
                         Yes                     
                          ▼                      
                [Proces powtarza się w drugą stronę]
                          |
                          ▼
                        End
```

## 3.7 Diagram Stanów - Cykl Życia Wpisu Nastroju

```
                    [Created]
                        |
                        | add()
                        ▼
                   [Pending Validation]
                        |
              validate() |
                        ▼
        Invalid ◄── [Validation] ──► Valid
           |                           |
           ▼                           ▼
      [Rejected]                   [Active]
           |                           |
           |                           | edit()
           |                           ▼
           |                    [Being Edited]
           |                           |
           |                    update() |
           |                           ▼
           |                      [Active]
           |                           |
           |                    delete() |
           |                           ▼
           └────────────────────► [Deleted]
                                      |
                                      ▼
                               [Soft Deleted]
                                      |
                              purge() |
                                      ▼
                              [Permanently Deleted]
```

## 3.8 Diagram Komponentów - Architektura Systemu

```
┌─────────────────────────────────────────────────────────────────┐
│                         Frontend (React)                        │
├─────────────────┬───────────────────┬───────────────────────────┤
│   Components    │     Contexts      │         Pages             │
│                 │                   │                           │
│ • Layout        │ • AuthContext     │ • Login/Register          │
│ • ProtectedRoute│ • NotificationCtx │ • Dashboard               │
│                 │                   │ • MoodDiary               │
│                 │                   │ • Medications             │
│                 │                   │ • Messages                │
│                 │                   │ • Patients                │
└─────────────────┴───────────────────┴───────────────────────────┘
                                │
                           HTTP/HTTPS
                                │
┌─────────────────────────────────────────────────────────────────┐
│                      Backend (Express.js)                       │
├─────────────────┬───────────────────┬───────────────────────────┤
│     Routes      │    Middleware     │        Services           │
│                 │                   │                           │
│ • /auth         │ • Authentication  │ • UserService             │
│ • /mood         │ • Validation      │ • MoodService             │
│ • /medication   │ • Error Handling  │ • MedicationService       │
│ • /messages     │ • CORS            │ • MessageService          │
│ • /notifications│ • Rate Limiting   │ • NotificationService     │
└─────────────────┴───────────────────┴───────────────────────────┘
                                │
                            SQL Queries
                                │
┌─────────────────────────────────────────────────────────────────┐
│                    Database (PostgreSQL)                        │
├─────────────────┬───────────────────┬───────────────────────────┤
│     Tables      │     Indexes       │        Constraints        │
│                 │                   │                           │
│ • users         │ • user_email_idx  │ • FK user_id              │
│ • mood_entries  │ • mood_date_idx   │ • FK therapist_id         │
│ • medications   │ • med_user_idx    │ • FK patient_id           │
│ • messages      │ • msg_users_idx   │ • CHECK mood_rating 1-10  │
│ • notifications │ • notif_user_idx  │ • UNIQUE email            │
│ • therapist_patients │             │                           │
└─────────────────┴───────────────────┴───────────────────────────┘
```

## 3.9 Diagram Wdrożenia (Deployment Diagram)

```
┌─────────────────────────────────────────────────────────────────┐
│                        Client Browser                           │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐  │
│  │   Chrome        │  │    Firefox      │  │     Safari      │  │
│  │                 │  │                 │  │                 │  │
│  │ React App       │  │ React App       │  │ React App       │  │
│  │ (localhost:3000)│  │ (localhost:3000)│  │ (localhost:3000)│  │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                                │
                           HTTP/HTTPS
                                │
┌─────────────────────────────────────────────────────────────────┐
│                      Application Server                         │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │                 Node.js Runtime                           │  │
│  │  ┌─────────────────┐  ┌─────────────────┐                │  │
│  │  │ Express Server  │  │ JWT Service     │                │  │
│  │  │ (Port 5000)     │  │                 │                │  │
│  │  │                 │  │                 │                │  │
│  │  │ • Auth Routes   │  │ • Token Gen     │                │  │
│  │  │ • API Routes    │  │ • Validation    │                │  │
│  │  │ • Middleware    │  │                 │                │  │
│  │  └─────────────────┘  └─────────────────┘                │  │
│  └───────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                                │
                         TCP/IP (Port 5432)
                                │
┌─────────────────────────────────────────────────────────────────┐
│                       Database Server                           │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │                PostgreSQL Database                       │  │
│  │                                                           │  │
│  │  Database: therapy_support                               │  │
│  │  User: postgres                                          │  │
│  │  Host: localhost                                         │  │
│  │  Port: 5432                                              │  │
│  │                                                           │  │
│  │  Tables:                                                 │  │
│  │  • users                                                 │  │
│  │  • mood_entries                                          │  │
│  │  • medications                                           │  │
│  │  • messages                                              │  │
│  │  • notifications                                         │  │
│  │  • therapist_patients                                    │  │
│  └───────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

## 3.10 Diagram Pakietów - Struktura Kodu

```
┌─────────────────────────────────────────────────────────────────┐
│                         therapy-app                             │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────────┐                ┌─────────────────┐          │
│  │     client      │                │     server      │          │
│  ├─────────────────┤                ├─────────────────┤          │
│  │ ┌─────────────┐ │                │ ┌─────────────┐ │          │
│  │ │     src     │ │                │ │   routes    │ │          │
│  │ ├─────────────┤ │                │ ├─────────────┤ │          │
│  │ │ • components│ │                │ │ • auth.js   │ │          │
│  │ │ • pages     │ │                │ │ • mood.js   │ │          │
│  │ │ • contexts  │ │                │ │ • medication│ │          │
│  │ │ • assets    │ │                │ │ • messages  │ │          │
│  │ └─────────────┘ │                │ │ • notifications │ │        │
│  │ ┌─────────────┐ │                │ └─────────────┘ │          │
│  │ │   public    │ │                │ ┌─────────────┐ │          │
│  │ ├─────────────┤ │                │ │   config    │ │          │
│  │ │ • index.html│ │                │ ├─────────────┤ │          │
│  │ │ • vite.svg  │ │                │ │ • database  │ │          │
│  │ └─────────────┘ │                │ └─────────────┘ │          │
│  │ • package.json  │                │ ┌─────────────┐ │          │
│  │ • vite.config   │                │ │ middleware  │ │          │
│  └─────────────────┘                │ ├─────────────┤ │          │
│                                     │ │ • auth.js   │ │          │
│                                     │ └─────────────┘ │          │
│                                     │ • index.js      │          │
│                                     │ • package.json  │          │
│                                     │ • .env          │          │
│                                     └─────────────────┘          │
│  ┌─────────────────┐                                             │
│  │      docs       │                                             │
│  ├─────────────────┤                                             │
│  │ • README.md     │                                             │
│  │ • UML_DOCS.md   │                                             │
│  │ • REQUIREMENTS  │                                             │
│  │ • TESTING.md    │                                             │
│  └─────────────────┘                                             │
└─────────────────────────────────────────────────────────────────┘
```

## 3.11 Diagram Komunikacji - Przepływ Danych

```
Browser                 React App              Express API           Database
   │                       │                       │                    │
   │── HTTP Request ───────►│                       │                    │
   │                       │── API Call ───────────►│                    │
   │                       │   (axios)              │                    │
   │                       │                       │── SQL Query ───────►│
   │                       │                       │                    │
   │                       │                       │◄── Result Set ─────│
   │                       │◄── JSON Response ─────│                    │
   │◄── DOM Update ────────│                       │                    │
   │                       │                       │                    │
   │                       │                       │                    │
   │        WebSocket       │      WebSocket        │    Database        │
   │     (for future)       │    (for real-time)    │   Triggers         │
   │◄─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ──│◄─ ─ ─ ─ ─ ─ ─ ─ ─ ──│◄─ ─ ─ ─ ─ ─ ─ ─ ─│
   │   Push Notifications   │    Event Handling     │   Change Events    │

Authentication Flow:
Browser ──login──► React ──POST /auth/login──► Express ──validate──► Database
Browser ◄─token───│ React ◄─JWT token─────────│ Express ◄─user─────│ Database
Browser ──auth────► React ──Authorization─────► Express ──verify───► Database
        header           header                         JWT
```

## 3.12 Diagram ERD - Model Danych

```
┌─────────────────┐         ┌──────────────────┐         ┌─────────────────┐
│      users      │         │ therapist_patients│         │   mood_entries  │
├─────────────────┤         ├──────────────────┤         ├─────────────────┤
│ 🔑 id (PK)      │◄───┐    │ 🔑 id (PK)       │    ┌───►│ 🔑 id (PK)      │
│ 🔒 email (UQ)   │    │    │ 🔗 therapist_id  │    │    │ 🔗 user_id (FK) │
│   password      │    │    │    (FK)          │    │    │   mood_rating   │
│   first_name    │    │    │ 🔗 patient_id    │    │    │   notes         │
│   last_name     │    │    │    (FK)          │    │    │   entry_date    │
│   role          │    │    │   created_at     │    │    │   created_at    │
│   created_at    │    │    └──────────────────┘    │    └─────────────────┘
└─────────────────┘    │              │             │
         │              │              │             │
         │              │              │             │
         │              └──────────────┼─────────────┘
         │                             │
         │                             │
┌─────────────────┐                    │         ┌─────────────────┐
│   medications   │                    │         │    messages     │
├─────────────────┤                    │         ├─────────────────┤
│ 🔑 id (PK)      │◄───────────────────┘    ┌───►│ 🔑 id (PK)      │
│ 🔗 user_id (FK) │                         │    │ 🔗 sender_id    │
│   name          │                         │    │    (FK)         │
│   dosage        │                         │    │ 🔗 recipient_id │
│   frequency     │                         │    │    (FK)         │
│   time_slots    │                         │    │   content       │
│   active        │                         │    │   is_read       │
│   created_at    │                         │    │   created_at    │
└─────────────────┘                         │    └─────────────────┘
                                            │
                                            │
                              ┌─────────────────┐
                              │ notifications   │
                              ├─────────────────┤
                              │ 🔑 id (PK)      │
                              │ 🔗 user_id (FK) │◄───┘
                              │   type          │
                              │   message       │
                              │   is_read       │
                              │   created_at    │
                              └─────────────────┘

Relationships:
• users (1) ←→ (*) mood_entries
• users (1) ←→ (*) medications
• users (1) ←→ (*) messages (as sender)
• users (1) ←→ (*) messages (as recipient)
• users (1) ←→ (*) notifications
• users (*) ←→ (*) users (through therapist_patients)

Constraints:
• mood_rating: CHECK (mood_rating >= 1 AND mood_rating <= 10)
• role: CHECK (role IN ('patient', 'therapist'))
• email: UNIQUE, NOT NULL
• All FKs: ON DELETE CASCADE
```

## 3.13 Podsumowanie Architektury

### 3.13.1 Kluczowe Wzorce Projektowe:
- **MVC (Model-View-Controller)**: Separacja logiki biznesowej od prezentacji
- **Repository Pattern**: Abstrakcja dostępu do danych
- **Middleware Pattern**: Przetwarzanie żądań HTTP
- **Observer Pattern**: System powiadomień
- **Authentication/Authorization Pattern**: Bezpieczeństwo systemu

### 3.13.2 Charakterystyka Architektury:
- **Architektura 3-warstwowa**: Prezentacja, Logika, Dane
- **RESTful API**: Standaryzowana komunikacja
- **Reactive Components**: React hooks i context
- **Database-First**: PostgreSQL jako główne źródło prawdy
- **Stateless Backend**: JWT dla autoryzacji

### 3.13.3 Zalety Rozwiązania:
- ✅ **Skalowalność**: Łatwe dodawanie nowych funkcji
- ✅ **Maintainability**: Czysta separacja odpowiedzialności  
- ✅ **Security**: Wielopoziomowe zabezpieczenia
- ✅ **Performance**: Optymalizowane zapytania i indeksy
- ✅ **Usability**: Intuicyjny interfejs użytkownika

---

*Dokument wersja 1.0*  
*Data ostatniej aktualizacji: Lipiec 2025*
