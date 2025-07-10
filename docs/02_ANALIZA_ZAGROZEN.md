# 2. Analiza Zagrożeń i Zarządzanie Ryzykiem

## 2.1 Wprowadzenie

Dokument przedstawia analizę potencjalnych zagrożeń dla systemu wspomagającego terapię psychologiczną oraz strategie zarządzania ryzykiem. Ze względu na wrażliwy charakter danych medycznych, analiza bezpieczeństwa jest kluczowa dla projektu.

## 2.2 Metodologia Analizy Ryzyka

### 2.2.1 Skala Prawdopodobieństwa:
- **Bardzo niskie (1)**: < 5%
- **Niskie (2)**: 5-20%
- **Średnie (3)**: 20-50%
- **Wysokie (4)**: 50-80%
- **Bardzo wysokie (5)**: > 80%

### 2.2.2 Skala Wpływu:
- **Minimalny (1)**: Niewielkie zakłócenia
- **Niski (2)**: Krótkotrwałe problemy
- **Średni (3)**: Znaczące opóźnienia
- **Wysoki (4)**: Poważne straty
- **Krytyczny (5)**: Zagrożenie dla projektu

### 2.2.3 Poziom Ryzyka = Prawdopodobieństwo × Wpływ

## 2.3 Zagrożenia Bezpieczeństwa

### 2.3.1 Cyberbezpieczeństwo

#### RYZ-001: Ataki typu SQL Injection
- **Opis**: Możliwość wstrzyknięcia złośliwego kodu SQL przez formularze
- **Prawdopodobieństwo**: Średnie (3)
- **Wpływ**: Wysoki (4)
- **Poziom ryzyka**: 12 (WYSOKIE)
- **Mitygacja**:
  - ✅ Użycie parametryzowanych zapytań (pg library)
  - ✅ Walidacja danych wejściowych
  - ✅ Escape'owanie danych użytkownika
- **Monitoring**: Logi błędów bazy danych
- **Plan awaryjny**: Rollback bazy danych, analiza logów

#### RYZ-002: Cross-Site Scripting (XSS)
- **Opis**: Wstrzyknięcie złośliwego kodu JavaScript
- **Prawdopodobieństwo**: Średnie (3)
- **Wpływ**: Średni (3)
- **Poziom ryzyka**: 9 (ŚREDNIE)
- **Mitygacja**:
  - ✅ Sanityzacja danych wejściowych
  - ✅ Content Security Policy (CSP)
  - ✅ Escape'owanie HTML w React
- **Monitoring**: Analiza logów przeglądarki
- **Plan awaryjny**: Natychmiastowa aktualizacja kodu

#### RYZ-003: Nieautoryzowany dostęp do danych
- **Opis**: Przełamanie systemu uwierzytelniania
- **Prawdopodobieństwo**: Niskie (2)
- **Wpływ**: Krytyczny (5)
- **Poziom ryzyka**: 10 (WYSOKIE)
- **Mitygacja**:
  - ✅ JWT z krótkim czasem wygaśnięcia (24h)
  - ✅ Hashowanie haseł (bcrypt)
  - ✅ Kontrola dostępu oparta na rolach
  - ✅ HTTPS dla wszystkich komunikacji
- **Monitoring**: Logi logowania, nieudane próby dostępu
- **Plan awaryjny**: Zablokowanie kont, zmiana kluczy JWT

#### RYZ-004: Ataki typu Man-in-the-Middle
- **Opis**: Przechwycenie komunikacji między klientem a serwerem
- **Prawdopodobieństwo**: Niskie (2)
- **Wpływ**: Wysoki (4)
- **Poziom ryzyka**: 8 (ŚREDNIE)
- **Mitygacja**:
  - ✅ Wymaganie HTTPS
  - ✅ Certyfikaty SSL/TLS
  - ⚠️ HTTP Strict Transport Security (HSTS) - do wdrożenia
- **Monitoring**: Analiza ruchu sieciowego
- **Plan awaryjny**: Natychmiastowe przełączenie na bezpieczne połączenia

### 2.3.2 Prywatność i Ochrona Danych

#### RYZ-005: Naruszenie RODO/GDPR
- **Opis**: Niewłaściwe przetwarzanie danych osobowych
- **Prawdopodobieństwo**: Średnie (3)
- **Wpływ**: Krytyczny (5)
- **Poziom ryzyka**: 15 (KRYTYCZNE)
- **Mitygacja**:
  - ⚠️ Implementacja mechanizmów consent management
  - ⚠️ Prawo do zapomnienia (usuwanie danych)
  - ⚠️ Eksport danych użytkownika
  - ✅ Minimalizacja zbieranych danych
- **Monitoring**: Audyty zgodności z RODO
- **Plan awaryjny**: Natychmiastowe zgłoszenie naruszenia UODO

#### RYZ-006: Wyciek danych medycznych
- **Opis**: Przypadkowe lub celowe ujawnienie wrażliwych danych
- **Prawdopodobieństwo**: Niskie (2)
- **Wpływ**: Krytyczny (5)
- **Poziom ryzyka**: 10 (WYSOKIE)
- **Mitygacja**:
  - ⚠️ Szyfrowanie danych w spoczynku
  - ✅ Kontrola dostępu do bazy danych
  - ✅ Logi dostępu do danych
  - ⚠️ Pseudonimizacja danych wrażliwych
- **Monitoring**: Logi dostępu, nietypowe zapytania
- **Plan awaryjny**: Powiadomienie użytkowników, analiza zakresu wycieku

## 2.4 Zagrożenia Techniczne

### 2.4.1 Wydajność i Dostępność

#### RYZ-007: Przeciążenie serwera
- **Opis**: Zbyt duża liczba jednoczesnych użytkowników
- **Prawdopodobieństwo**: Średnie (3)
- **Wpływ**: Wysoki (4)
- **Poziom ryzyka**: 12 (WYSOKIE)
- **Mitygacja**:
  - ⚠️ Load balancing
  - ⚠️ Auto-scaling w chmurze
  - ✅ Optymalizacja zapytań do bazy
  - ⚠️ Implementacja cache'owania
- **Monitoring**: Monitoring CPU, RAM, czasu odpowiedzi
- **Plan awaryjny**: Dodatkowe instancje serwera

#### RYZ-008: Awaria bazy danych
- **Opis**: Utrata dostępu do bazy danych PostgreSQL
- **Prawdopodobieństwo**: Niskie (2)
- **Wpływ**: Krytyczny (5)
- **Poziom ryzyka**: 10 (WYSOKIE)
- **Mitygacja**:
  - ✅ Fallback do pamięci (tymczasowy)
  - ⚠️ Replikacja bazy danych
  - ⚠️ Automatyczne backupy
  - ⚠️ Monitoring zdrowia bazy
- **Monitoring**: Ping bazy danych, logi błędów
- **Plan awaryjny**: Przywrócenie z backup'u, przełączenie na replikę

#### RYZ-009: Utrata danych
- **Opis**: Przypadkowe usunięcie lub korupcja danych
- **Prawdopodobieństwo**: Niskie (2)
- **Wpływ**: Krytyczny (5)
- **Poziom ryzyka**: 10 (WYSOKIE)
- **Mitygacja**:
  - ⚠️ Automatyczne backup'y co 6 godzin
  - ⚠️ Testowanie procedur odzyskiwania
  - ✅ Soft delete zamiast fizycznego usuwania
  - ⚠️ Replikacja danych
- **Monitoring**: Integralność danych, rozmiar bazy
- **Plan awaryjny**: Przywrócenie z backup'u

### 2.4.2 Kompatybilność i Integracja

#### RYZ-010: Niekompatybilność przeglądarek
- **Opis**: Aplikacja nie działa w niektórych przeglądarkach
- **Prawdopodobieństwo**: Średnie (3)
- **Wpływ**: Średni (3)
- **Poziom ryzyka**: 9 (ŚREDNIE)
- **Mitygacja**:
  - ✅ Testy w różnych przeglądarkach
  - ✅ Użycie React (cross-browser compatibility)
  - ✅ Polyfills dla starszych przeglądarek
- **Monitoring**: Raporty błędów od użytkowników
- **Plan awaryjny**: Hotfix dla problematycznych przeglądarek

## 2.5 Zagrożenia Projektowe

### 2.5.1 Zarządzanie Projektem

#### RYZ-011: Przekroczenie budżetu
- **Opis**: Koszty przekraczają założony budżet
- **Prawdopodobieństwo**: Średnie (3)
- **Wpływ**: Wysoki (4)
- **Poziom ryzyka**: 12 (WYSOKIE)
- **Mitygacja**:
  - ✅ Użycie darmowych technologii open-source
  - ✅ Agile - iteracyjne dostarczanie wartości
  - ✅ Regularne przeglądy budżetu
- **Monitoring**: Tygodniowe raporty kosztów
- **Plan awaryjny**: Redukcja zakresu funkcjonalności

#### RYZ-012: Opóźnienia w dostarczeniu
- **Opis**: Projekt nie zostanie ukończony w terminie
- **Prawdopodobieństwo**: Wysokie (4)
- **Wpływ**: Średni (3)
- **Poziom ryzyka**: 12 (WYSOKIE)
- **Mitygacja**:
  - ✅ Agile methodology z krótkimi sprintami
  - ✅ MVP (Minimum Viable Product) approach
  - ✅ Priorytetyzacja funkcjonalności
- **Monitoring**: Burndown charts, velocity tracking
- **Plan awaryjny**: Przesunięcie terminu, redukcja zakresu

### 2.5.2 Zasoby Ludzkie

#### RYZ-013: Utrata kluczowego członka zespołu
- **Opis**: Odejście developera lub eksperta domenowego
- **Prawdopodobieństwo**: Średnie (3)
- **Wpływ**: Wysoki (4)
- **Poziom ryzyka**: 12 (WYSOKIE)
- **Mitygacja**:
  - ✅ Dokumentacja kodu i architektury
  - ✅ Code review - dzielenie wiedzy
  - ✅ Pair programming
- **Monitoring**: Regularne 1-on-1 z zespołem
- **Plan awaryjny**: Rekrutacja zastępstwa, redistrybucja zadań

## 2.6 Zagrożenia Regulacyjne

### 2.6.1 Zgodność Prawna

#### RYZ-014: Zmiana przepisów dotyczących danych medycznych
- **Opis**: Nowe regulacje mogą wymagać zmian w systemie
- **Prawdopodobieństwo**: Średnie (3)
- **Wpływ**: Wysoki (4)
- **Poziom ryzyka**: 12 (WYSOKIE)
- **Mitygacja**:
  - ✅ Monitoring zmian legislacyjnych
  - ✅ Elastyczna architektura umożliwiająca zmiany
  - ⚠️ Konsultacje z prawnikami
- **Monitoring**: Śledzenie aktów prawnych
- **Plan awaryjny**: Szybka implementacja wymaganych zmian

## 2.7 Plan Zarządzania Ryzykiem

### 2.7.1 Matryca Ryzyka

| Ryzyko | Prawdopodobieństwo | Wpływ | Poziom | Status | Akcje |
|--------|-------------------|-------|---------|---------|--------|
| RYZ-005 | 3 | 5 | 15 | 🔴 Krytyczne | Implementacja GDPR compliance |
| RYZ-001 | 3 | 4 | 12 | 🟡 Wysokie | ✅ Zaimplementowane |
| RYZ-007 | 3 | 4 | 12 | 🟡 Wysokie | Monitoring + auto-scaling |
| RYZ-011 | 3 | 4 | 12 | 🟡 Wysokie | ✅ Kontrola budżetu |
| RYZ-012 | 4 | 3 | 12 | 🟡 Wysokie | ✅ Agile approach |
| RYZ-013 | 3 | 4 | 12 | 🟡 Wysokie | ✅ Dokumentacja |
| RYZ-014 | 3 | 4 | 12 | 🟡 Wysokie | Monitoring legislacji |
| RYZ-003 | 2 | 5 | 10 | 🟡 Wysokie | ✅ JWT + HTTPS |
| RYZ-006 | 2 | 5 | 10 | 🟡 Wysokie | Szyfrowanie danych |
| RYZ-008 | 2 | 5 | 10 | 🟡 Wysokie | ✅ Fallback + backup |
| RYZ-009 | 2 | 5 | 10 | 🟡 Wysokie | Backup strategy |

### 2.7.2 Procedury Monitorowania

#### Codzienne:
- Sprawdzenie logów bezpieczeństwa
- Monitoring wydajności systemu
- Backup'y danych

#### Tygodniowe:
- Przegląd incydentów bezpieczeństwa
- Analiza metryk wydajności
- Przegląd postępu projektu

#### Miesięczne:
- Audyt bezpieczeństwa
- Przegląd compliance z RODO
- Analiza trendów ryzyka
- Update planu zarządzania ryzykiem

### 2.7.3 Procedury Reagowania na Incydenty

#### Incydent Bezpieczeństwa:
1. **Natychmiastowe** (0-1h): Izolacja systemu, powiadomienie zespołu
2. **Krótkoterminowe** (1-24h): Analiza zakresu, containment
3. **Średnioterminowe** (1-7 dni): Eradykacja, odzyskiwanie
4. **Długoterminowe** (>7 dni): Lessons learned, poprawki systemowe

#### Awaria Systemu:
1. **Natychmiastowe**: Aktivacja fallback'ów, powiadomienie użytkowników
2. **Krótkoterminowe**: Diagnoza problemu, temporary workaround
3. **Średnioterminowe**: Naprawa root cause
4. **Długoterminowe**: Post-mortem, zapobieganie powtórzeniu

## 2.8 Kluczowe Wskaźniki Ryzyka (KRI)

### 2.8.1 Wskaźniki Bezpieczeństwa:
- Liczba nieudanych prób logowania > 10/godzinę
- Czas odpowiedzi systemu > 5 sekund
- Liczba błędów 5xx > 1% requestów
- Dostępność systemu < 99%

### 2.8.2 Wskaźniki Projektu:
- Velocity spadek > 20%
- Budget burn rate > 110% planu
- Liczba otwartych bugów > 50
- Code coverage < 80%

### 2.8.3 Wskaźniki Compliance:
- Liczba żądań GDPR > 5/miesiąc
- Czas odpowiedzi na żądania GDPR > 30 dni
- Liczba raportów naruszeń danych > 0

## 2.9 Podsumowanie

System zawiera solidne mechanizmy zarządzania ryzykiem, ale wymaga dalszych usprawnień w obszarach:

### 🔴 Priorytet 1 - Krytyczne:
- Implementacja pełnej zgodności z RODO/GDPR
- Szyfrowanie danych wrażliwych w bazie

### 🟡 Priorytet 2 - Wysokie:
- Implementacja automatycznych backup'ów
- Load balancing i auto-scaling
- HSTS i zaawansowane nagłówki bezpieczeństwa

### 🟢 Priorytet 3 - Średnie:
- Monitoring i alerting
- Disaster recovery procedures
- Performance optimization

---

*Dokument wersja 1.0*  
*Data ostatniej aktualizacji: Lipiec 2025*  
*Następny przegląd: Sierpień 2025*
