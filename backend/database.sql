-- Esquema de Base de Datos para Sparks (App de Citas)
-- Ejecutar en PostgreSQL con la extensión PostGIS habilitada

CREATE EXTENSION IF NOT EXISTS postgis;

-- 1. Tabla de Usuarias y Autenticación
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(100) NOT NULL,
    age INT NOT NULL,
    bio TEXT DEFAULT '',
    avatar_url TEXT DEFAULT '',
    photos TEXT[] DEFAULT '{}',
    location GEOMETRY(Point, 4326),
    reset_token VARCHAR(255),
    reset_token_expires TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_active TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índice espacial para búsquedas ultrarrápidas de ubicación
CREATE INDEX IF NOT EXISTS user_location_idx ON users USING GIST (location);

-- 2. Tabla de Interacciones / Matches (Likes / Flechazos)
CREATE TABLE IF NOT EXISTS matches (
    id SERIAL PRIMARY KEY,
    user_id_1 INT REFERENCES users(id) ON DELETE CASCADE,
    user_id_2 INT REFERENCES users(id) ON DELETE CASCADE,
    is_matched BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (user_id_1, user_id_2)
);

-- 3. Tabla de Conversaciones
CREATE TABLE IF NOT EXISTS conversations (
    id SERIAL PRIMARY KEY,
    user1_id INT REFERENCES users(id) ON DELETE CASCADE,
    user2_id INT REFERENCES users(id) ON DELETE CASCADE,
    last_message TEXT DEFAULT '',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (user1_id, user2_id)
);

-- 4. Tabla de Mensajes de Chat
CREATE TABLE IF NOT EXISTS messages (
    id SERIAL PRIMARY KEY,
    conversation_id INT REFERENCES conversations(id) ON DELETE CASCADE,
    sender_id INT REFERENCES users(id) ON DELETE CASCADE,
    text TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_read BOOLEAN DEFAULT FALSE
);

-- Datos de ejemplo iniciales (password: 123456)
-- Hash bcrypt para '123456': $2a$10$wE9OqE40NqOqfKj3/F5aLe7p1vCq8dZ9B9L4X3.2U6Y4C6X9v2tZa (ejemplo)
INSERT INTO users (email, password_hash, name, age, bio, avatar_url, location) VALUES
('ana@sparks.app', '$2a$10$wE9OqE40NqOqfKj3/F5aLe7p1vCq8dZ9B9L4X3.2U6Y4C6X9v2tZa', 'Ana', 28, 'Amante de los gatos, la música indie y el buen café ☕🐾', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400', ST_SetSRID(ST_MakePoint(-3.703790, 40.416775), 4326)),
('laura@sparks.app', '$2a$10$wE9OqE40NqOqfKj3/F5aLe7p1vCq8dZ9B9L4X3.2U6Y4C6X9v2tZa', 'Laura', 32, 'Fotógrafa y escaladora. Buscando a alguien para salir de ruta 🏔️📸', 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400', ST_SetSRID(ST_MakePoint(-3.713790, 40.426775), 4326)),
('elena@sparks.app', '$2a$10$wE9OqE40NqOqfKj3/F5aLe7p1vCq8dZ9B9L4X3.2U6Y4C6X9v2tZa', 'Elena', 25, 'Arquitecta de interiores. Me encanta el arte moderno y el vino 🍷🎨', 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=400', ST_SetSRID(ST_MakePoint(-3.603790, 40.316775), 4326)),
('sofia@sparks.app', '$2a$10$wE9OqE40NqOqfKj3/F5aLe7p1vCq8dZ9B9L4X3.2U6Y4C6X9v2tZa', 'Sofía', 29, 'Lectora empedernida, gamer y cocinera aficionada 📚🎮', 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400', ST_SetSRID(ST_MakePoint(-3.700000, 40.420000), 4326))
ON CONFLICT (email) DO NOTHING;
