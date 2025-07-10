# Therapy Support Application

System wspomagający terapię psychologiczną zbudowany w React.js + Express.js + PostgreSQL.

## 🎯 Funkcjonalności

### Dla pacjentów:
- 📝 **Dziennik nastroju** - ocena 1-10 z opcjonalnymi notatkami
- 💊 **Zarządzanie lekami** - harmonogram z godzinami przyjmowania  
- 💬 **Komunikacja z terapeutą** - wymiana wiadomości
- 🔔 **Powiadomienia** - przypomnienia i wiadomości w aplikacji
- 📊 **Statystyki** - przegląd postępów w terapii

### Dla terapeutów:
- 👥 **Zarządzanie pacjentami** - przegląd przypisanych pacjentów z licznikami wpisów i leków
- 📊 **Podgląd dzienników nastroju** - monitoring stanu pacjentów
- 💬 **Komunikacja z pacjentami** - wymiana wiadomości
- 📋 **Przegląd leków pacjentów** - kontrola terapii farmakologicznej

## 🚀 Struktura technologiczna

- **Frontend**: React.js z Vite, Material-UI (MUI), React Router
- **Backend**: Express.js z autoryzacją JWT
- **Baza danych**: PostgreSQL
- **Komunikacja**: REST API

## ⚙️ Instalacja i uruchomienie

### Wymagania
- Node.js (v16 lub nowszy)
- PostgreSQL (v12 lub nowszy)
- npm

### 1. Klonowanie repozytorium
```bash
git clone <repository-url>
cd therapy-support-app
```

### 2. Instalacja zależności

#### Serwer
```bash
cd server
npm install
```

#### Klient
```bash
cd ../client
npm install
```

### 3. Konfiguracja bazy danych

1. Utwórz bazę danych PostgreSQL:
```sql
CREATE DATABASE therapy_support;
```

2. Wykonaj skrypt SQL z pliku `server/database.sql`

3. Utwórz plik `.env` w folderze `server` z następującą zawartością:
```env
DATABASE_URL=postgresql://username:password@localhost:5432/therapy_support
JWT_SECRET=your-secret-key
PORT=5000
```

### 4. Uruchomienie aplikacji

Uruchomienie w trybie deweloperskim (frontend + backend):
```bash
npm run dev
```

Lub osobno:

Backend (port 5000):
```bash
npm run server
```

Frontend (port 5173):
```bash
npm run client
```

### 5. Dostęp do aplikacji
- Frontend: http://localhost:5173
- Backend API: http://localhost:5000

## API Endpoints

### Autoryzacja
- `POST /api/auth/register` - Rejestracja użytkownika
- `POST /api/auth/login` - Logowanie
- `GET /api/auth/profile` - Profil użytkownika
- `GET /api/auth/patients` - Lista pacjentów (tylko dla terapeutów)
- `GET /api/auth/therapists` - Lista terapeutów

### Dziennik nastroju
- `GET /api/mood` - Lista wpisów nastroju
- `POST /api/mood` - Dodanie wpisu
- `PUT /api/mood/:id` - Edycja wpisu
- `DELETE /api/mood/:id` - Usunięcie wpisu
- `GET /api/mood/patient/:id` - Wpisy pacjenta (tylko dla terapeutów)

### Leki
- `GET /api/medication` - Lista leków
- `POST /api/medication` - Dodanie leku
- `PUT /api/medication/:id` - Edycja leku
- `DELETE /api/medication/:id` - Usunięcie leku
- `GET /api/medication/today` - Dzisiejsze leki

### Wiadomości
- `GET /api/messages/conversations` - Lista konwersacji
- `GET /api/messages/:recipientId` - Wiadomości z użytkownikiem
- `POST /api/messages` - Wysłanie wiadomości
- `PUT /api/messages/mark-read/:senderId` - Oznaczenie jako przeczytane

### Powiadomienia
- `GET /api/notifications` - Lista powiadomień
- `PUT /api/notifications/:id/read` - Oznaczenie jako przeczytane

## Struktura projektu

```
therapy-support-app/
├── client/                 # Frontend (React + Vite)
│   ├── src/
│   │   ├── components/     # Komponenty wielokrotnego użytku
│   │   ├── contexts/       # Konteksty React (Auth, Notifications)
│   │   ├── pages/          # Strony aplikacji
│   │   ├── App.jsx         # Główny komponent
│   │   └── main.jsx        # Punkt wejścia
│   └── package.json
├── server/                 # Backend (Express.js)
│   ├── config/            # Konfiguracja bazy danych
│   ├── middleware/        # Middleware (auth, validation)
│   ├── routes/            # Endpointy API
│   ├── database.sql       # Schema bazy danych
│   ├── index.js           # Punkt wejścia serwera
│   └── package.json
├── .github/
│   └── copilot-instructions.md
└── package.json           # Skrypty główne
```

## Bezpieczeństwo

- Hasła są hashowane używając bcrypt
- Autoryzacja oparta na JWT tokenach
- Walidacja danych na froncie i backendzie
- Zabezpieczenie przed SQL Injection (parametrized queries)
- CORS skonfigurowany dla bezpiecznej komunikacji

## Responsywność

Aplikacja jest w pełni responsywna i dostosowana do:
- Komputerów stacjonarnych
- Tabletów
- Telefonów komórkowych

## Rozwój

### Dodawanie nowych funkcji

1. Backend: Dodaj nowe endpointy w `server/routes/`
2. Frontend: Utwórz nowe komponenty w `client/src/components/` lub strony w `client/src/pages/`
3. Baza danych: Aktualizuj schema w `server/database.sql`

### Testing

Aby uruchomić testy (gdy zostaną dodane):
```bash
npm test
```

## Licencja

Ten projekt jest stworzony do celów edukacyjnych.
