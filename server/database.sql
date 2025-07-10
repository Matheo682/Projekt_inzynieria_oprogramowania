-- Tworzenie bazy danych (uruchom jako superuser)
-- CREATE DATABASE therapy_support;

-- Tabela użytkowników (pacjenci i terapeuci)
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    role VARCHAR(20) CHECK (role IN ('patient', 'therapist')) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela relacji terapeuta-pacjent
CREATE TABLE therapist_patients (
    id SERIAL PRIMARY KEY,
    therapist_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    patient_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(therapist_id, patient_id)
);

-- Tabela wpisów do dziennika nastroju
CREATE TABLE mood_entries (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    mood_rating INTEGER CHECK (mood_rating >= 1 AND mood_rating <= 10) NOT NULL,
    notes TEXT,
    entry_date DATE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela leków
CREATE TABLE medications (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    dosage VARCHAR(100),
    frequency VARCHAR(100),
    time_to_take TIME[],
    notes TEXT,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela wiadomości między terapeutą a pacjentem
CREATE TABLE messages (
    id SERIAL PRIMARY KEY,
    sender_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    recipient_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    read_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela powiadomień w aplikacji
CREATE TABLE notifications (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL, -- 'medication', 'message', 'general'
    title VARCHAR(255) NOT NULL,
    content TEXT,
    read_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indeksy dla lepszej wydajności
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_mood_entries_user_date ON mood_entries(user_id, entry_date);
CREATE INDEX idx_medications_user ON medications(user_id);
CREATE INDEX idx_messages_recipient ON messages(recipient_id, created_at);
CREATE INDEX idx_notifications_user ON notifications(user_id, created_at);
