# Sparks — Comunidad y App de Citas Sáfica & Queer

[![React Native](https://img.shields.io/badge/React%20Native-0.86-blue.svg)](https://reactnative.dev)
[![Expo](https://img.shields.io/badge/Expo-SDK%2057-black.svg)](https://expo.dev)
[![React](https://img.shields.io/badge/React-19-61DAFB.svg)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6.svg)](https://www.typescriptlang.org/)
[![Prisma](https://img.shields.io/badge/Prisma-ORM%206-2D3748.svg)](https://www.prisma.io/)
[![Express](https://img.shields.io/badge/Express-5.2-000000.svg)](https://expressjs.com/)
[![Spotify API](https://img.shields.io/badge/Spotify-Web%20API%20PKCE-1DB954.svg)](https://developer.spotify.com/)

**Sparks** es una plataforma móvil y web integral concebida para la comunidad sáfica (mujeres lesbianas, bisexuales, pansexuales, personas trans y no binarias). Combina descubrimiento visual estilo **Moodboard Queer**, afinidad musical en tiempo real mediante **Spotify (OAuth 2.0 PKCE)**, eventos comunitarios, fotos efímeras de privacidad protegida, verificación biométrica y un **Backoffice Web Profesional de Administración y Moderación Forense** conforme a las directrices de publicación de **Apple App Store** y **Google Play**.

---

## Características Principales

### 1. Moodboard Queer & Exploración Visual
* Cuadrícula interactiva de dos columnas con espaciado equilibrado (`14px`) y renderizado fluido.
* **Insignias de Intención**: *Citas / Pareja*, *Amistades*, *Charlar*, *Planes y Eventos*.
* **Filtros Dinámicos**: Rango de edad (+/-), distancia máxima (5 km a ilimitada), solo perfiles verificados y solo perfiles con integración musical activa.

### 2. Mi Obsesión Musical (Spotify Web API PKCE)
* Autenticación oficial **Spotify OAuth 2.0 PKCE** client-side con `expo-auth-session` y fallback REST.
* Buscador de canciones en vivo integrado con el catálogo oficial de Spotify.
* Visualización de Top 5 artistas y reproducción/muestra de pista destacada en tarjeta y perfil.

### 3. Flujo de Match Mutuo ("Es un Spark")
* Modal de celebración con animación visual de avatares entrelazados.
* Acceso directo e instantáneo a la conversación privada tras el match mutuo.

### 4. Seguridad, Privacidad y Verificación Biométrica
* **Verificación de Perfil**: Proceso de selfie biométrica con cotejo manual y auditoría en Backoffice.
* **Sistema Oficial de Denuncia (`ReportBlockModal`)**: Categorización de reportes (Acoso, Suplantación / Catfishing, Bifobia / Transfobia, Contenido Explícito, Spam) con opción de bloqueo automático.
* **Bloqueo Bidireccional**: Ocultación instantánea en cuadrícula de descubrimiento, chats y tablón de planes.
* **Gestión de Bloqueadas (`BlockedUsersModal`)**: Consulta y revocación de bloqueos en tiempo real.
* **Modo Discreción / Pantalla de Pánico (`PanicDisguiseModal`)**: Disfraz inmediato de "Bloc de Notas" para resguardar la privacidad en espacios públicos.
* **Modo Fantasma (Invisible)** y **Distancia Aproximada (< 5 km)** para prevenir triangulación geográfica.

### 5. Mensajería y Tablón de Planes
* Conversaciones individuales con soporte de fotos efímeras (autodestrucción tras apertura).
* Banco de rompehielos sáficos y preguntas rápidas para iniciar conversaciones.
* Tablón de planes y quedadas grupales con punto de encuentro, categoría (café, fiesta, cultura, naturaleza, deporte) y chat grupal moderado.

---

## Panel de Administración Web & Backoffice Pro

El sistema incorpora un panel web de control centralizado para el equipo de seguridad y soporte, servido directamente por la API en `http://localhost:5000/admin`.

* **Métricas y KPIs en Tiempo Real**:
  * Total de usuarias activas, ratios de verificación, reportes urgentes pendientes, fotos biométricas en cola y distribución porcentual de intenciones.
* **Directorio y Gestión de Usuarias**:
  * Búsqueda por nombre o correo, filtrado por rol y estado (Activa, Suspendida, Baneada).
  * Drawer lateral de inspección profunda con historial de likes, reportes acumulados y bio completa.
* **Cola de Verificación Biométrica**:
  * Comparador lado a lado del avatar de perfil y la selfie de verificación enviada por la usuaria.
  * Aprobación o rechazo con un solo clic y actualización inmediata de la insignia oficial.
* **Centro de Moderación y Visor Forense de Chat**:
  * Listado de reportes con nivel de gravedad y tarjetas de enfrentamiento (Denunciante vs Denunciada).
  * **Inspector Forense de Conversación**: Apertura del historial completo de mensajes intercambiados para auditar el contexto real antes de emitir sanciones.
  * Acciones directas: Resolver reporte, descartar o suspender/banear cuenta de forma irrevocable.
* **Gestión de Planes Comunitarios**:
  * Auditoría de eventos publicados, participantes confirmados y opción de baja por incumplimiento de normas.
* **Emisión de Comunicados Globales**:
  * Difusión de anuncios oficiales de la plataforma a todas las usuarias activas.

> **Acceso al Panel de Administración**:
> * En entornos de desarrollo local, las cuentas de prueba se configuran a través del script de base de datos (`npm run seed`).
> * Las credenciales de acceso se gestionan mediante variables de entorno y los datos de inicialización locales (nunca expuestas en entornos públicos ni en el repositorio).
> * En entorno de desarrollo local, el panel web incluye una opción de acceso rápido para agilizar las pruebas.

---

## Arquitectura del Proyecto

```
Sparks/
├── mobile/                   # Aplicación móvil (React Native + Expo SDK 57)
│   ├── assets/               # Logotipos oficiales, iconos y avatar por defecto
│   ├── src/
│   │   ├── components/       # Componentes y modales (Reportes, Match, Filtros, Disfraz, Legal)
│   │   ├── screens/          # ExploreScreen, ChatsScreen, PlansScreen, ProfileScreen, AuthScreen, AdminModerationScreen
│   │   ├── theme.js          # Sistema de diseño con temas Claro y Oscuro
│   │   └── api.js            # Cliente HTTP REST y servicio de subida multimedia
│   ├── App.js                # Shell principal con navegación por pestañas y modal de pánico
│   └── package.json
│
├── backend/                  # API REST (Node.js + Express 5.2 + TypeScript)
│   ├── prisma/               # Esquema relacional Prisma (schema.prisma) y semillas
│   ├── public/               # Archivos estáticos y subidas (/uploads)
│   │   └── admin/            # SPA Web Backoffice (index.html, styles.css, app.js)
│   ├── src/
│   │   ├── controllers/      # auth, user, chat, plan, spotify, safety, upload, adminController
│   │   ├── middleware/       # Autenticación JWT, verificación de rol y Multer
│   │   ├── store/            # MemoryStore con perfiles sáficos preconfigurados
│   │   ├── swagger.ts        # Especificación OpenAPI 3.0 (/api/docs)
│   │   └── index.ts          # Servidor Express, montaje de rutas y archivos estáticos
│   └── package.json
│
├── TERMS_OF_SERVICE.md       # EULA oficial para App Store (Apple Guideline 1.2)
├── PRIVACY_POLICY.md         # Política de Privacidad conforme al RGPD (UE)
└── README.md                 # Documentación técnica maestra
```

---

## Puesta en Marcha en Local

### Requisitos Previos
* Node.js v18 o superior.
* npm v9 o superior.
* Expo Go (opcional, para ejecución física en iOS/Android).

---

### Paso 1: Configurar y Levantar el Backend

```bash
cd backend
npm install
npm run seed     # Opcional: inicializa la base de datos con perfiles demo
npm run dev
```

* **Servidor API**: `http://localhost:5000`
* **Panel de Administración Web**: `http://localhost:5000/admin`
* **Documentación Swagger OpenAPI**: `http://localhost:5000/api/docs`

---

### Paso 2: Configurar y Levantar la App Móvil

```bash
cd ../mobile
npm install
npx expo start
```

### Opciones de Visualización
* **Dispositivo Físico**: Escanea el código QR con la app Expo Go (Android) o la Cámara (iOS).
* **Emulador Android**: Pulsa `a` en la terminal de Expo.
* **Simulador iOS**: Pulsa `i` en la terminal de Expo (macOS).
* **Navegador Web**: Pulsa `w` en la terminal de Expo.

---

## Variables de Entorno (`backend/.env`)

Crea un archivo `.env` dentro del directorio `backend/` tomando como referencia las siguientes variables:

```env
PORT=5000
JWT_SECRET=tu_clave_secreta_jwt
DATABASE_URL="file:./dev.db"

# Integración con Spotify Web API (Opcional)
SPOTIFY_CLIENT_ID=tu_spotify_client_id
SPOTIFY_CLIENT_SECRET=tu_spotify_client_secret
SPOTIFY_REDIRECT_URI=https://auth.expo.io/@tu_usuario/mobile
```

> **Aviso de Seguridad**:
> * Nunca subas archivos `.env` ni claves de producción al repositorio de control de versiones.
> * Genera un `JWT_SECRET` seguro y aleatorio para entornos productivos.
> * Las credenciales de Spotify Web API se obtienen de forma individual desde el portal oficial de desarrolladores de Spotify.

---

## Conformidad y Requisitos de Publicación

1. **Apple App Store Review Guidelines (Sección 1.2 - Contenido Generado por Usuarias y Sección 5.1.1 - Privacidad)**:
   * Términos de servicio (EULA) vinculantes con declaración jurada de mayoría de edad (mayores de 18 años) y tolerancia cero ante abusos.
   * Mecanismo accesible en dos toques para denunciar perfiles o mensajes inapropiados con revisión en menos de 24 horas.
   * Capacidad de bloqueo inmediato bidireccional que oculta el contenido para ambas partes.
   * URLs web públicas requeridas para la revisión de tienda:
     * Términos de Servicio (EULA): `http://localhost:5000/terms` (o `/legal/terms`)
     * Política de Privacidad (RGPD): `http://localhost:5000/privacy` (o `/legal/privacy`)

2. **Reglamento General de Protección de Datos (RGPD UE & LOPDGDD)**:
   * Consentimiento explícito previo para el tratamiento de categorías especiales (Art. 9 RGPD: orientación e identidad queer).
   * Modo de distancia aproximada (&lt; 5 km) y Modo Fantasma para salvaguardar la geolocalización.
   * Fotos efímeras con purga del servidor tras visualización única.
   * Procedimiento de supresión definitiva ("Derecho al Olvido", Art. 17 RGPD) al pulsar "Eliminar Cuenta".

---

## Licencia y Marco Legal
Este proyecto incluye documentación jurídica completa conforme a los estándares de Tinder, Bumble y la industria del dating:
* [Términos y Condiciones de Uso (EULA)](TERMS_OF_SERVICE.md) — Accesible en web en `/terms`.
* [Política de Privacidad y Protección de Datos](PRIVACY_POLICY.md) — Accesible en web en `/privacy`.
* Pautas de Seguridad en Citas Presenciales integradas en el Centro Legal de la aplicación móvil.
