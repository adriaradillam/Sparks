# Sparks 💖✨ — Comunidad y App de Citas Sáfica & Queer

[![React Native](https://img.shields.io/badge/React%20Native-0.74-blue.svg)](https://reactnative.dev)
[![Expo](https://img.shields.io/badge/Expo-SDK%2051-black.svg)](https://expo.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6.svg)](https://www.typescriptlang.org/)
[![Prisma](https://img.shields.io/badge/Prisma-ORM-2D3748.svg)](https://www.prisma.io/)
[![Express](https://img.shields.io/badge/Express-5.x-000000.svg)](https://expressjs.com/)
[![Spotify API](https://img.shields.io/badge/Spotify-Web%20API-1DB954.svg)](https://developer.spotify.com/)

**Sparks** es una aplicación móvil diseñada específicamente por y para la comunidad sáfica (mujeres lesbianas, bisexuales, pansexuales, personas trans y no binarias). Combina el descubrimiento visual estilo **Moodboard Queer**, afinidad musical con **Spotify (OAuth PKCE)**, eventos comunitarios, fotos efímeras y un riguroso sistema de seguridad y moderación preparado para **Apple App Store** y **Google Play**.

---

## 🌟 Características Principales

### 1. 🎨 Moodboard Queer & Exploración Visual
* Grid interactivo de dos columnas con espaciado equilibrado (`14px`) y estética visual cálida.
* **Insignias de Intención**: 💖 *Citas / Pareja*, 🌿 *Amistades*, ☕ *Charlar*, 🎟️ *Planes y Eventos*.
* **Filtros Avanzados**: Rango de edad (+/-), distancia máxima (5km - ilimitada), solo perfiles verificados y solo perfiles con música.

### 2. 🎵 Mi Obsesión Musical (Spotify Web API PKCE)
* Integración oficial de **Spotify OAuth 2.0 PKCE** client-side con `expo-auth-session`.
* Buscador en vivo de canciones del catálogo oficial de Spotify.
* Visualización de Top 5 artistas escuchados y pista destacada en tarjeta y perfil.

### 3. ✨ Flujo de Match Mutuo ("¡Es un Spark!")
* Modal de celebración con destellos, corona de fuego y avatares entrelazados.
* Acceso instantáneo a la conversación privada con un solo toque.

### 4. 🛡️ Seguridad, Moderación y Requisitos App Store
* **Sistema Oficial de Denuncia (`ReportBlockModal`)**: Acoso, Catfishing, Transfobia/Bifobia, Contenido explícito o Spam.
* **Bloqueo Bidireccional**: Ocultación total en grid, chats y planes.
* **Gestión de Bloqueadas (`BlockedUsersModal`)**: Consulta y desbloqueo en tiempo real.
* **Modo Discreción / Botón de Pánico (`PanicDisguiseModal`)**: Disfraz inmediato de "Bloc de Notas" para proteger la privacidad en público.
* **Modo Fantasma (Invisible)** y **Distancia Aproximada (< 5km)**.

### 5. 💬 Mensajería y Comunidad
* Respuestas inteligentes y banco de rompehielos queer/sáficos.
* Fotos efímeras con autodestrucción tras visualización.
* **Tablón de Planes Comunitarios**: Picnics, cinefórum queer, conciertos y senderismo.

---

## 🏗️ Arquitectura del Proyecto

```
lesbian_dating_app/
├── mobile/                   # App móvil en React Native con Expo
│   ├── assets/               # Iconos, logos y default_avatar oficial
│   ├── src/
│   │   ├── components/       # Modales reutilizables (Reportes, Match, Filtros, Discreción, Legal)
│   │   ├── screens/          # ExploreScreen, ChatsScreen, PlansScreen, ProfileScreen, AuthScreen
│   │   ├── theme.js          # Paleta adaptativa Claro (Rosa) / Oscuro (Vino & Neón)
│   │   └── api.js            # Cliente HTTP y servicio de subida FormData
│   └── package.json
│
├── backend/                  # API REST en Node.js + Express + TypeScript
│   ├── prisma/               # Schema relacional (schema.prisma) y base de datos SQLite/Postgres
│   ├── public/               # Archivos estáticos y fotos subidas (/uploads)
│   ├── src/
│   │   ├── controllers/      # auth, user, chat, plan, spotify, safety, upload
│   │   ├── middleware/       # Autenticación JWT y Multer upload
│   │   ├── store/            # MemoryStore con 14 perfiles diversos
│   │   ├── swagger.ts        # Especificación OpenAPI 3.0 (/api/docs)
│   │   └── index.ts          # Servidor principal y rutas
│   └── package.json
│
├── TERMS_OF_SERVICE.md       # EULA oficial para App Store (Guideline 1.2)
├── PRIVACY_POLICY.md         # Política de Privacidad conforme al RGPD UE
└── README.md                 # Documentación técnica maestra
```

---

## 🚀 Puesta en Marcha en Local (3 Pasos)

### Paso 1: Clonar y preparar el Backend
```bash
cd backend
npm install
npx prisma db push
npm run seed
npm run dev
```
* Servidor escuchando en: `http://localhost:5000`
* Documentación Swagger interactiva: `http://localhost:5000/api/docs`

### Paso 2: Configurar la App Móvil
```bash
cd ../mobile
npm install
npx expo start
```

### Paso 3: Abrir en tu Dispositivo
* **iOS**: Escanea el código QR con la app Cámara o abre en Expo Go / Simulador pulsando `i`.
* **Android**: Escanea el código QR con Expo Go o abre en Emulador pulsando `a`.
* **Web**: Pulsa `w` en la consola de Expo.

---

## 🔐 Variables de Entorno (`backend/.env`)

```env
PORT=5000
JWT_SECRET=super_sparks_jwt_secret_key_2026
DATABASE_URL="file:./dev.db"

# Spotify OAuth (Opcional para flujo personalizado)
SPOTIFY_CLIENT_ID=870735f5550f4f24b4f7d8ed3a87360c
SPOTIFY_CLIENT_SECRET=tu_spotify_client_secret
SPOTIFY_REDIRECT_URI=https://auth.expo.io/@anonymous/mobile
```

---

## 📄 Licencia y Legal
Este proyecto cuenta con [Términos y Condiciones (EULA)](TERMS_OF_SERVICE.md) y [Política de Privacidad RGPD](PRIVACY_POLICY.md). Todos los derechos reservados.
