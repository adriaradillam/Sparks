import { Request, Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { spotifyService } from '../services/spotifyService';
import { memoryStore, DEMO_SPOTIFY_ARTISTS, User } from '../store/memoryStore';

// ============================================================
// Estado temporal para OAuth: pendingOAuth[state] = userId
// ============================================================
const pendingOAuth: Record<string, string> = {};

function getOrRestoreUser(req: AuthRequest): User {
  let user = memoryStore.users.find(
    (u) => u.id === req.userId || (req.userEmail && u.email.toLowerCase() === req.userEmail.toLowerCase())
  );

  if (!user && req.userId) {
    user = memoryStore.addUser({
      email: req.userEmail || `user_${req.userId}@sparks.app`,
      passwordHash: '',
      name: 'Mi Perfil',
      age: 25,
      bio: 'En Sparks para conectar.',
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400',
      photos: ['https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400'],
      lat: 40.416775,
      lng: -3.703790
    });
    user.id = req.userId;
  }

  if (!user) {
    user = memoryStore.users[0];
  }

  return user;
}

// ============================================================
// GET /api/spotify/oauth/login
// Genera la URL de autorización de Spotify y redirige al navegador.
// El cliente envía su JWT como ?token= para identificar al usuario.
// ============================================================
export const spotifyOAuthLogin = async (req: AuthRequest, res: Response) => {
  const clientId = process.env.SPOTIFY_CLIENT_ID || '';
  const redirectUri = process.env.SPOTIFY_REDIRECT_URI || `http://localhost:5000/api/spotify/oauth/callback`;

  if (!clientId) {
    return res.status(500).send(`
      <html><body style="font-family:sans-serif;text-align:center;padding:40px;background:#121212;color:#fff">
        <h2 style="color:#1db954">⚠️ Spotify no configurado</h2>
        <p>Añade tu <strong>SPOTIFY_CLIENT_ID</strong> en el archivo <code>.env</code> del backend.</p>
        <p>Consigue tus credenciales gratis en <a href="https://developer.spotify.com/dashboard" style="color:#1db954">developer.spotify.com/dashboard</a></p>
        <p style="font-size:12px;color:#888">Luego reinicia el servidor y vuelve a intentarlo.</p>
      </body></html>
    `);
  }

  // Identificamos al usuario por su JWT
  // Soportamos tanto Authorization header como query param (el navegador del sistema no puede enviar headers)
  let userId = req.userId || '';
  if (!userId && req.query.token) {
    // Si el JWT viene como query param, lo decodificamos
    const jwt = require('jsonwebtoken');
    try {
      const decoded: any = jwt.verify(req.query.token as string, process.env.JWT_SECRET || 'super_sparks_jwt_secret_key_2026');
      userId = decoded.userId || decoded.id || '';
    } catch (e) {
      // Token inválido
    }
  }

  // Generamos un `state` único para CSRF protection
  const state = `${userId}_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  pendingOAuth[state] = String(userId);

  // Limpiamos estados viejos (más de 10 minutos)
  const tenMinutesAgo = Date.now() - 10 * 60 * 1000;
  for (const key of Object.keys(pendingOAuth)) {
    const ts = parseInt(key.split('_')[1] || '0', 10);
    if (!isNaN(ts) && ts < tenMinutesAgo) {
      delete pendingOAuth[key];
    }
  }

  const scopes = [
    'user-top-read',
    'user-read-private',
    'user-read-email',
    'user-read-playback-state',
    'user-read-currently-playing'
  ].join(' ');

  const authUrl = new URL('https://accounts.spotify.com/authorize');
  authUrl.searchParams.set('response_type', 'code');
  authUrl.searchParams.set('client_id', clientId);
  authUrl.searchParams.set('scope', scopes);
  authUrl.searchParams.set('redirect_uri', redirectUri);
  authUrl.searchParams.set('state', state);
  authUrl.searchParams.set('show_dialog', 'true'); // Siempre muestra el diálogo de consentimiento

  res.redirect(authUrl.toString());
};

// ============================================================
// GET /api/spotify/oauth/callback
// Spotify redirige aquí con el `code`. Intercambiamos por access_token
// y guardamos los datos reales del usuario de Spotify.
// ============================================================
export const spotifyOAuthCallback = async (req: Request, res: Response) => {
  const { code, state, error } = req.query as Record<string, string>;

  // Si el usuario canceló en Spotify
  if (error) {
    return res.send(`
      <html><body style="font-family:sans-serif;text-align:center;padding:40px;background:#121212;color:#fff">
        <h2 style="color:#e22">Autorización cancelada</h2>
        <p>No se vinculó ninguna cuenta. Puedes cerrar esta ventana.</p>
        <script>
          setTimeout(() => {
            window.close();
          }, 2000);
        </script>
      </body></html>
    `);
  }

  if (!code || !state || !pendingOAuth[state]) {
    return res.status(400).send(`
      <html><body style="font-family:sans-serif;text-align:center;padding:40px;background:#121212;color:#fff">
        <h2 style="color:#e22">Estado inválido</h2>
        <p>La solicitud de autorización expiró o no es válida. Vuelve a intentarlo.</p>
      </body></html>
    `);
  }

  const userId = pendingOAuth[state];
  delete pendingOAuth[state];

  const clientId = process.env.SPOTIFY_CLIENT_ID || '';
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET || '';
  const redirectUri = process.env.SPOTIFY_REDIRECT_URI || `http://localhost:5000/api/spotify/oauth/callback`;

  try {
    // 1. Intercambiar el código por access_token y refresh_token
    const authHeader = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
    const tokenResponse = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${authHeader}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: redirectUri
      }).toString()
    });

    if (!tokenResponse.ok) {
      const errData = await tokenResponse.text();
      console.error('Spotify token exchange error:', errData);
      throw new Error('Error al obtener el token de Spotify');
    }

    const tokenData: any = await tokenResponse.json();
    const accessToken: string = tokenData.access_token;
    const refreshToken: string = tokenData.refresh_token;

    // 2. Obtener el perfil real del usuario de Spotify
    const profileResponse = await fetch('https://api.spotify.com/v1/me', {
      headers: { 'Authorization': `Bearer ${accessToken}` }
    });
    const profileData: any = await profileResponse.json();

    // 3. Obtener los Top Artistas reales del usuario
    const topArtistsResponse = await fetch('https://api.spotify.com/v1/me/top/artists?limit=5&time_range=medium_term', {
      headers: { 'Authorization': `Bearer ${accessToken}` }
    });
    const topArtistsData: any = await topArtistsResponse.json();

    const topArtists = (topArtistsData.items || []).map((a: any) => ({
      id: a.id,
      name: a.name,
      image: a.images?.[0]?.url || 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=300',
      genres: a.genres?.slice(0, 2) || ['Pop'],
      popularity: a.popularity || 80
    }));

    // 4. Guardar en el perfil del usuario en memoryStore
    const user = memoryStore.users.find(u => String(u.id) === userId);
    if (user) {
      user.spotify = {
        connected: true,
        username: profileData.display_name || profileData.id || 'spotify_user',
        topArtists: topArtists.length > 0 ? topArtists : DEMO_SPOTIFY_ARTISTS,
        accessToken,
        refreshToken,
        spotifyId: profileData.id,
        spotifyProfileUrl: profileData.external_urls?.spotify,
        spotifyAvatar: profileData.images?.[0]?.url
      };
    }

    // 5. Responder con página de éxito que cierra la ventana y devuelve el control a la app
    const spotifyUsername = profileData.display_name || profileData.id || 'Spotify User';
    const artistNames = (topArtists.slice(0, 3) as any[]).map((a: any) => a.name).join(', ');

    return res.send(`
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <title>Spotify vinculado a Sparks</title>
      </head>
      <body style="font-family:-apple-system,BlinkMacSystemFont,sans-serif;text-align:center;padding:40px 20px;background:#121212;color:#fff;min-height:100vh;display:flex;flex-direction:column;align-items:center;justify-content:center;">
        <div style="background:#1db954;width:72px;height:72px;border-radius:50%;display:flex;align-items:center;justify-content:center;margin:0 auto 20px;font-size:36px;">✓</div>
        <h2 style="color:#ffffff;font-size:22px;margin-bottom:8px;">¡Spotify vinculado con éxito!</h2>
        <p style="color:#b3b3b3;margin-bottom:20px;">Conectado como <strong style="color:#1db954">@${spotifyUsername}</strong></p>
        ${artistNames ? `<p style="color:#888;font-size:13px;">Tus Top Artistas: ${artistNames}${topArtists.length > 3 ? '...' : ''}</p>` : ''}
        <p style="color:#555;font-size:12px;margin-top:30px;">Puedes cerrar esta ventana y volver a Sparks.</p>
        <script>
          // Notificar a la app que el OAuth completó (para Expo)
          if (window.opener) {
            window.opener.postMessage({ type: 'SPOTIFY_OAUTH_SUCCESS', userId: '${userId}' }, '*');
          }
          // También intentamos cerrar el navegador automáticamente después de 2s
          setTimeout(() => {
            window.close();
          }, 2500);
        </script>
      </body>
      </html>
    `);

  } catch (err: any) {
    console.error('Error en OAuth callback de Spotify:', err);
    return res.status(500).send(`
      <html><body style="font-family:sans-serif;text-align:center;padding:40px;background:#121212;color:#fff">
        <h2 style="color:#e22">Error al conectar Spotify</h2>
        <p>${err.message}</p>
        <p>Vuelve a intentarlo desde la app.</p>
      </body></html>
    `);
  }
};

// ============================================================
// GET /api/spotify/me — Devuelve el estado OAuth actual del usuario
// ============================================================
export const getSpotifyStatus = async (req: AuthRequest, res: Response) => {
  const user = getOrRestoreUser(req);
  res.json({
    connected: user.spotify?.connected || false,
    username: user.spotify?.username || '',
    topArtists: user.spotify?.topArtists || [],
    spotifyProfileUrl: (user.spotify as any)?.spotifyProfileUrl || null,
    spotifyAvatar: (user.spotify as any)?.spotifyAvatar || null
  });
};

// ============================================================
// RUTAS LEGACY (búsqueda con Client Credentials, sin usuario)
// ============================================================
export const searchSpotifyTracks = async (req: Request, res: Response) => {
  try {
    const query = (req.query.q as string) || '';
    if (!query.trim()) {
      return res.json({ tracks: [] });
    }

    const tracks = await spotifyService.searchTracks(query, 12);
    res.json({ tracks });
  } catch (error) {
    console.error('Error in searchSpotifyTracks:', error);
    res.status(500).json({ error: 'Error al buscar en Spotify.' });
  }
};

export const searchSpotifyArtists = async (req: Request, res: Response) => {
  try {
    const query = (req.query.q as string) || '';
    const artists = await spotifyService.searchArtists(query, 6);
    res.json({ artists });
  } catch (error) {
    console.error('Error in searchSpotifyArtists:', error);
    res.status(500).json({ error: 'Error al buscar artistas.' });
  }
};

export const connectSpotifyAccount = async (req: AuthRequest, res: Response) => {
  try {
    const user = getOrRestoreUser(req);
    const { username, artists } = req.body;
    const spotifyUsername = username && username.trim() ? username.trim() : `${user.name.toLowerCase().replace(/\s+/g, '_')}_spoti`;

    user.spotify = {
      connected: true,
      username: spotifyUsername,
      topArtists: artists && Array.isArray(artists) && artists.length > 0 ? artists : DEMO_SPOTIFY_ARTISTS
    };

    res.json({
      success: true,
      message: '¡Cuenta de Spotify enlazada con éxito!',
      spotify: user.spotify
    });
  } catch (error) {
    console.error('Error en connectSpotifyAccount:', error);
    res.status(500).json({ error: 'Error al conectar con Spotify.' });
  }
};

export const disconnectSpotifyAccount = async (req: AuthRequest, res: Response) => {
  try {
    const user = getOrRestoreUser(req);

    user.spotify = {
      connected: false,
      username: '',
      topArtists: []
    };

    res.json({
      success: true,
      message: 'Cuenta de Spotify desvinculada de tu perfil.',
      spotify: user.spotify
    });
  } catch (error) {
    console.error('Error en disconnectSpotifyAccount:', error);
    res.status(500).json({ error: 'Error al desconectar Spotify.' });
  }
};

// ============================================================
// POST /api/spotify/connect-token
// El cliente (PKCE) ya obtuvo el access_token directamente de Spotify.
// Solo guardamos los datos en el perfil del usuario.
// ============================================================
export const connectSpotifyToken = async (req: AuthRequest, res: Response) => {
  try {
    const user = getOrRestoreUser(req);
    const { spotifyId, username, topArtists, accessToken } = req.body;

    user.spotify = {
      connected: true,
      username: username || spotifyId || 'spotify_user',
      topArtists: Array.isArray(topArtists) && topArtists.length > 0 ? topArtists : DEMO_SPOTIFY_ARTISTS,
      accessToken,
      spotifyId,
    };

    res.json({
      success: true,
      message: '¡Cuenta de Spotify enlazada!',
      spotify: user.spotify
    });
  } catch (error) {
    console.error('Error en connectSpotifyToken:', error);
    res.status(500).json({ error: 'Error al guardar datos de Spotify.' });
  }
};
