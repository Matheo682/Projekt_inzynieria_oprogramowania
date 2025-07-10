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
git clone https://github.com/Matheo682/Projekt_inzynieria_oprogramowania.git
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

### Testing

```bash
npm test
```

