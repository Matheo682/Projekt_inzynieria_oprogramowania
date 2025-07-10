# 1. Inżynieria Wymagań - System Wspomagający Terapię Psychologiczną

## 1.1 Wprowadzenie

System wspomagający terapię psychologiczną został zaprojektowany w celu ułatwienia komunikacji między terapeutami a pacjentami oraz monitorowania postępów w terapii. Analiza wymagań została przeprowadzona z uwzględnieniem potrzeb obu grup użytkowników.

## 1.2 Metodyka Zbierania Wymagań

### 1.2.1 Techniki zastosowane:
- **Wywiad z ekspertami** - konsultacje z psychologami i terapeutami
- **Analiza istniejących rozwiązań** - przegląd konkurencyjnych aplikacji
- **Scenariusze użytkowania** - modelowanie typowych przypadków użycia
- **Prototypowanie** - iteracyjne dopracowanie interfejsu

### 1.2.2 Stakeholderzy:
- **Główni**: Pacjenci, Terapeuci/Psychologowie
- **Drugorzędni**: Administratorzy systemu, Dostawcy technologii
- **Kluczowi**: Regulatorzy ochrony danych (RODO/GDPR)

## 1.3 Wymagania Funkcjonalne

### 1.3.1 Wymagania dla Pacjentów

#### WF-P1: Zarządzanie dziennikiem nastroju
- **Opis**: Pacjent może dodawać codzienne wpisy o swoim nastroju
- **Kryteria akceptacji**:
  - Ocena nastroju w skali 1-10
  - Możliwość dodania notatek tekstowych (maks. 1000 znaków)
  - Wybór daty wpisu
  - Możliwość edycji i usuwania wpisów
- **Priorytet**: Wysoki
- **Kategoria**: Podstawowa funkcjonalność

#### WF-P2: Zarządzanie lekami
- **Opis**: Pacjent może prowadzić listę przyjmowanych leków
- **Kryteria akceptacji**:
  - Dodawanie nazwy leku, dawki, częstotliwości
  - Ustawianie godzin przyjmowania
  - Oznaczanie leku jako aktywny/nieaktywny
  - Historia przyjmowanych leków
- **Priorytet**: Średni
- **Kategoria**: Wspomagająca

#### WF-P3: Komunikacja z terapeutą
- **Opis**: Pacjent może wymieniać wiadomości z przypisanym terapeutą
- **Kryteria akceptacji**:
  - Wysyłanie i odbieranie wiadomości tekstowych
  - Historia konwersacji
  - Oznaczanie wiadomości jako przeczytane
  - Ograniczenie komunikacji tylko do przypisanego terapeuty
- **Priorytet**: Wysoki
- **Kategoria**: Komunikacja

#### WF-P4: Powiadomienia
- **Opis**: Pacjent otrzymuje powiadomienia o nowych wiadomościach
- **Kryteria akceptacji**:
  - Powiadomienia o nowych wiadomościach od terapeuty
  - Lista nieprzeczytanych powiadomień
  - Możliwość oznaczania jako przeczytane
- **Priorytet**: Średni
- **Kategoria**: Użyteczność

### 1.3.2 Wymagania dla Terapeutów

#### WF-T1: Zarządzanie pacjentami
- **Opis**: Terapeuta może przeglądać listę przypisanych pacjentów
- **Kryteria akceptacji**:
  - Lista pacjentów z podstawowymi informacjami
  - Liczba wpisów nastroju pacjenta
  - Liczba aktywnych leków pacjenta
  - Możliwość przejścia do szczegółów pacjenta
- **Priorytet**: Wysoki
- **Kategoria**: Podstawowa funkcjonalność

#### WF-T2: Monitoring dzienników nastroju
- **Opis**: Terapeuta może przeglądać wpisy nastroju swoich pacjentów
- **Kryteria akceptacji**:
  - Chronologiczna lista wpisów nastroju
  - Filtrowanie po dacie i pacjencie
  - Wyświetlanie ocen i notatek
  - Statystyki nastroju pacjenta
- **Priorytet**: Wysoki
- **Kategoria**: Analityczna

#### WF-T3: Przegląd leków pacjentów
- **Opis**: Terapeuta może monitorować leki przyjmowane przez pacjentów
- **Kryteria akceptacji**:
  - Lista aktywnych leków pacjenta
  - Historia zmian w lekach
  - Informacje o dawkowaniu i częstotliwości
- **Priorytet**: Średni
- **Kategoria**: Medyczna

#### WF-T4: Komunikacja z pacjentami
- **Opis**: Terapeuta może komunikować się ze swoimi pacjentami
- **Kryteria akceptacji**:
  - Wysyłanie wiadomości do przypisanych pacjentów
  - Odbieranie odpowiedzi od pacjentów
  - Historia konwersacji z każdym pacjentem
- **Priorytet**: Wysoki
- **Kategoria**: Komunikacja

### 1.3.3 Wymagania Systemowe

#### WF-S1: Autoryzacja i uwierzytelnianie
- **Opis**: System zapewnia bezpieczny dostęp dla użytkowników
- **Kryteria akceptacji**:
  - Rejestracja nowych użytkowników
  - Logowanie z email i hasłem
  - Tokenowa autoryzacja (JWT)
  - Rozróżnienie ról (pacjent/terapeuta)
- **Priorytet**: Krytyczny
- **Kategoria**: Bezpieczeństwo

#### WF-S2: Zarządzanie relacjami terapeuta-pacjent
- **Opis**: System kontroluje, kto może komunikować się z kim
- **Kryteria akceptacji**:
  - Przypisywanie pacjentów do terapeutów
  - Ograniczenie dostępu do danych pacjenta tylko dla przypisanego terapeuty
  - Możliwość zmiany przypisania
- **Priorytet**: Krytyczny
- **Kategoria**: Bezpieczeństwo

## 1.4 Wymagania Niefunkcjonalne

### 1.4.1 Wydajność (Performance)
- **WNF-1**: Czas odpowiedzi systemu nie może przekraczać 3 sekund dla 95% zapytań
- **WNF-2**: System musi obsługiwać minimum 100 jednoczesnych użytkowników
- **WNF-3**: Dostępność systemu na poziomie 99.5% w miesiącu

### 1.4.2 Bezpieczeństwo (Security)
- **WNF-4**: Wszystkie dane medyczne muszą być szyfrowane w bazie danych
- **WNF-5**: Komunikacja między klientem a serwerem musi być szyfrowana (HTTPS)
- **WNF-6**: Hasła muszą być hashowane z solą (bcrypt)
- **WNF-7**: Sesje użytkowników wygasają po 24 godzinach nieaktywności

### 1.4.3 Użyteczność (Usability)
- **WNF-8**: Interfejs musi być responsywny i działać na urządzeniach mobilnych
- **WNF-9**: System musi być dostępny w języku polskim
- **WNF-10**: Interfejs musi być intuicyjny dla użytkowników o podstawowej znajomości komputerów

### 1.4.4 Kompatybilność (Compatibility)
- **WNF-11**: System musi działać w przeglądarkach: Chrome, Firefox, Safari, Edge
- **WNF-12**: Wsparcie dla urządzeń z systemami iOS i Android
- **WNF-13**: Minimalne wymagania: 2GB RAM, połączenie internetowe 1 Mbps

### 1.4.5 Skalowalność (Scalability)
- **WNF-14**: Architektura musi umożliwiać łatwe zwiększenie liczby użytkowników
- **WNF-15**: Baza danych musi być optymalizowana pod kątem wzrostu danych

### 1.4.6 Prawne i Regulacyjne
- **WNF-16**: Zgodność z RODO/GDPR w zakresie ochrony danych osobowych
- **WNF-17**: Zgodność z ustawą o ochronie danych osobowych
- **WNF-18**: Możliwość eksportu/usunięcia danych użytkownika na żądanie

## 1.5 Ograniczenia Projektowe

### 1.5.1 Ograniczenia Technologiczne
- Wykorzystanie technologii: React.js, Node.js, PostgreSQL
- Hostowanie w środowisku on-premise lub chmurze publicznej
- Wykorzystanie istniejących bibliotek open-source

### 1.5.2 Ograniczenia Czasowe
- Czas realizacji projektu: 3 miesiące
- Iteracyjny proces rozwoju z cotygodniowymi demonstracjami

### 1.5.3 Ograniczenia Budżetowe
- Minimalizacja kosztów poprzez wykorzystanie darmowych technologii
- Optymalizacja pod kątem efektywności kosztowej w eksploatacji

## 1.6 Model Przypadków Użycia

### 1.6.1 Główne przypadki użycia dla Pacjenta:
1. **UC-P1**: Logowanie do systemu
2. **UC-P2**: Dodawanie wpisu do dziennika nastroju
3. **UC-P3**: Przeglądanie historii wpisów nastroju
4. **UC-P4**: Dodawanie nowego leku
5. **UC-P5**: Wysyłanie wiadomości do terapeuty
6. **UC-P6**: Sprawdzanie powiadomień

### 1.6.2 Główne przypadki użycia dla Terapeuty:
1. **UC-T1**: Logowanie do systemu
2. **UC-T2**: Przeglądanie listy pacjentów
3. **UC-T3**: Przegląd dziennika nastroju pacjenta
4. **UC-T4**: Wysyłanie wiadomości do pacjenta
5. **UC-T5**: Analiza statystyk pacjenta

## 1.7 Akceptacja Wymagań

### 1.7.1 Kryteria Akceptacji Projektu:
- ✅ Wszystkie wymagania funkcjonalne o priorytecie "Krytyczny" i "Wysoki" zostały zaimplementowane
- ✅ System przechodzi testy bezpieczeństwa
- ✅ System spełnia wymagania wydajnościowe
- ✅ Interfejs użytkownika jest zgodny z wytycznymi dostępności

### 1.7.2 Procedura Akceptacji:
1. Testy funkcjonalne przez zespół QA
2. Testy bezpieczeństwa przez eksperta ds. cyberbezpieczeństwa
3. Testy użyteczności z grupą testową użytkowników
4. Akceptacja przez klienta/stakeholderów

## 1.8 Śledzenie Wymagań

| ID Wymagania | Status | Implementacja | Testy | Uwagi |
|--------------|--------|---------------|-------|-------|
| WF-P1 | ✅ Zaimplementowane | v1.0 | Przeszło | Pełna funkcjonalność |
| WF-P2 | ✅ Zaimplementowane | v1.0 | Przeszło | - |
| WF-P3 | ✅ Zaimplementowane | v1.0 | Przeszło | - |
| WF-P4 | ✅ Zaimplementowane | v1.0 | Przeszło | - |
| WF-T1 | ✅ Zaimplementowane | v1.0 | Przeszło | Z licznikami |
| WF-T2 | ✅ Zaimplementowane | v1.0 | Przeszło | - |
| WF-T3 | ✅ Zaimplementowane | v1.0 | Przeszło | - |
| WF-T4 | ✅ Zaimplementowane | v1.0 | Przeszło | - |
| WF-S1 | ✅ Zaimplementowane | v1.0 | Przeszło | JWT + bcrypt |
| WF-S2 | ✅ Zaimplementowane | v1.0 | Przeszło | - |

---

*Dokument wersja 1.0*  
*Data ostatniej aktualizacji: Lipiec 2025*
