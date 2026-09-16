import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Image,
  TouchableOpacity,
  Modal,
  TextInput,
  ActivityIndicator,
  Alert,
  Switch,
  Platform,
  Animated,
  Linking
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as WebBrowser from 'expo-web-browser';
import * as AuthSession from 'expo-auth-session';
import * as LocalAuthentication from 'expo-local-authentication';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme';
import { apiRequest, uploadPhoto } from '../api';
import { INTENTION_LABELS } from '../constants';
import BlockedUsersModal from '../components/BlockedUsersModal';
import CommunityGuidelinesModal from '../components/CommunityGuidelinesModal';
import PanicDisguiseModal from '../components/PanicDisguiseModal';
import LegalTermsModal from '../components/LegalTermsModal';
import AdminModerationScreen from './AdminModerationScreen';
import { getAvatarSource } from '../utils/avatar';

export { getAvatarSource };

// Necesario para que el navegador pueda cerrar la sesión OAuth correctamente
WebBrowser.maybeCompleteAuthSession();

const SPOTIFY_CLIENT_ID = '870735f5550f4f24b4f7d8ed3a87360c';
const SPOTIFY_SCOPES = ['user-top-read', 'user-read-private', 'user-read-email'];
const SPOTIFY_DISCOVERY = {
  authorizationEndpoint: 'https://accounts.spotify.com/authorize',
  tokenEndpoint: 'https://accounts.spotify.com/api/token',
};

export const DEFAULT_AVATAR = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500';

const PRONOUN_CHOICES = ['Ella / She', 'Ella / Elle', 'Elle / They', 'She / They', 'Cualquiera'];

const INTENTION_CHOICES = [
  { id: 'dating', label: 'Citas / Amor', icon: 'heart' },
  { id: 'friends', label: 'Hacer Amigas', icon: 'people' },
  { id: 'chat', label: 'Charlar y Conectar', icon: 'cafe' },
  { id: 'events', label: 'Planes y Eventos', icon: 'ticket' }
];

const AVAILABLE_TAGS = [
  'Femme',
  'Masc / Butch',
  'Andrógina',
  'Queer',
  'Plant Lover',
  'Gamer',
  'Música indie',
  'Café lover',
  'Mascotas',
  'Astrología',
  'Cine & Libros',
  'Arte & Diseño',
  'Vino & Tapas',
  'Senderismo'
];

export default function ProfileScreen({ user, onUpdateUser, onLogout }) {
  const { theme, isDarkMode, toggleTheme } = useTheme();

  const [editModalVisible, setEditModalVisible] = useState(false);
  const [verifyModalVisible, setVerifyModalVisible] = useState(false);
  const [anthemModalVisible, setAnthemModalVisible] = useState(false);
  const [adminModalVisible, setAdminModalVisible] = useState(false);

  // Estados de Spotify OAuth
  const [spotifyLoading, setSpotifyLoading] = useState(false);
  const [spotifyData, setSpotifyData] = useState(
    user?.spotify || { connected: false, username: '', topArtists: [] }
  );

  // Estados del Buscador en Vivo de Spotify
  const [spotifySearchQuery, setSpotifySearchQuery] = useState('');
  const [spotifySearchResults, setSpotifySearchResults] = useState([]);
  const [searchingSpotify, setSearchingSpotify] = useState(false);

  // Estados de Verificación Biométrica Real (Face ID / Huella / Biometría)
  const [biometricType, setBiometricType] = useState('Face ID');
  const [verifyState, setVerifyState] = useState('idle'); // 'idle' | 'authenticating' | 'success' | 'error' | 'no_hardware'
  const [verifyErrorMsg, setVerifyErrorMsg] = useState('');

  // Animación de pulso del radar biométrico
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // Estados de edición de perfil
  const [name, setName] = useState(user?.name || '');
  const [age, setAge] = useState(user?.age ? user.age.toString() : '25');
  const [bio, setBio] = useState(user?.bio || '');
  const [pronouns, setPronouns] = useState(user?.pronouns || PRONOUN_CHOICES[0]);
  const [intention, setIntention] = useState(user?.intention || 'dating');
  const [selectedTags, setSelectedTags] = useState(user?.tags || ['Femme', 'Música indie']);
  const [selectedAnthem, setSelectedAnthem] = useState(user?.anthem || null);
  const [avatarUrl, setAvatarUrl] = useState(
    user?.avatarUrl || 'default'
  );
  const [saving, setSaving] = useState(false);

  // Estados de Privacidad & Modo Fantasma
  const [ghostMode, setGhostMode] = useState(user?.ghostMode || false);
  const [approxDistance, setApproxDistance] = useState(user?.approxDistanceOnly || false);

  // Modales de Seguridad & Moderación
  const [blockedModalVisible, setBlockedModalVisible] = useState(false);
  const [guidelinesModalVisible, setGuidelinesModalVisible] = useState(false);
  const [panicModalVisible, setPanicModalVisible] = useState(false);
  const [legalModalVisible, setLegalModalVisible] = useState(false);
  const [legalModalTab, setLegalModalTab] = useState('terms');

  const openLegalModal = (tab = 'terms') => {
    setLegalModalTab(tab);
    setLegalModalVisible(true);
  };

  useEffect(() => {
    fetchAnthems();
    checkBiometricSupport();

    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.15,
          duration: 1100,
          useNativeDriver: true
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1100,
          useNativeDriver: true
        })
      ])
    );
    pulseLoop.start();

    return () => pulseLoop.stop();
  }, []);

  const fetchAnthems = async () => {
    try {
      const data = await apiRequest('/api/music/anthems');
      setAvailableAnthems(data.anthems || []);
    } catch (err) {
      console.error('Error fetching anthems:', err);
    }
  };

  // Buscador de canciones en vivo: usa el access_token real del usuario si está conectado,
  // si no, cae al backend con Client Credentials
  useEffect(() => {
    if (!spotifySearchQuery.trim()) {
      setSpotifySearchResults([]);
      setSearchingSpotify(false);
      return;
    }
    setSearchingSpotify(true);
    const delayDebounce = setTimeout(async () => {
      try {
        const userAccessToken = spotifyData?.accessToken;
        if (userAccessToken) {
          // Búsqueda directa con el token real del usuario → incluye preview_url
          const res = await fetch(
            `https://api.spotify.com/v1/search?q=${encodeURIComponent(spotifySearchQuery)}&type=track&limit=10`,
            { headers: { Authorization: `Bearer ${userAccessToken}` } }
          );
          const json = await res.json();
          const tracks = (json.tracks?.items || []).map(t => ({
            id: t.id,
            title: t.name,
            artist: t.artists?.[0]?.name || '',
            album: t.album?.name || '',
            coverUrl: t.album?.images?.[0]?.url || 'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?w=300',
          }));
          setSpotifySearchResults(tracks);
        } else {
          // Fallback al backend (Client Credentials)
          const res = await apiRequest(`/api/spotify/search?q=${encodeURIComponent(spotifySearchQuery)}`);
          setSpotifySearchResults(res.tracks || []);
        }
      } catch (err) {
        console.error('Error searching Spotify:', err);
      } finally {
        setSearchingSpotify(false);
      }
    }, 400);
    return () => clearTimeout(delayDebounce);
  }, [spotifySearchQuery, spotifyData?.accessToken]);

  const toggleTag = (tag) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter((t) => t !== tag));
    } else {
      if (selectedTags.length >= 6) {
        Alert.alert('Límite alcanzado', 'Puedes seleccionar hasta 6 etiquetas de intereses.');
        return;
      }
      setSelectedTags([...selectedTags, tag]);
    }
  };

  // ===================================================================
  // SPOTIFY OAUTH — PKCE client-side con expo-auth-session
  // ===================================================================
  const spotifyRedirectUri = AuthSession.makeRedirectUri({ useProxy: true });

  const [spotifyRequest, spotifyResponse, promptSpotifyAsync] = AuthSession.useAuthRequest(
    {
      clientId: SPOTIFY_CLIENT_ID,
      scopes: SPOTIFY_SCOPES,
      usePKCE: true,
      redirectUri: spotifyRedirectUri,
    },
    SPOTIFY_DISCOVERY
  );

  // Reaccionar cuando Spotify responde con el code
  useEffect(() => {
    if (spotifyResponse?.type === 'success') {
      const { code } = spotifyResponse.params;
      exchangeSpotifyCode(code, spotifyRequest?.codeVerifier);
    } else if (spotifyResponse?.type === 'error') {
      Alert.alert('Error Spotify', spotifyResponse.error?.message || 'No se pudo conectar con Spotify.');
    }
  }, [spotifyResponse]);

  // Intercambiar el code por un access_token (PKCE, sin client_secret)
  const exchangeSpotifyCode = async (code, codeVerifier) => {
    setSpotifyLoading(true);
    try {
      // 1. Obtener access_token
      const tokenRes = await fetch('https://accounts.spotify.com/api/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: [
          `grant_type=authorization_code`,
          `code=${code}`,
          `redirect_uri=${encodeURIComponent(spotifyRedirectUri)}`,
          `client_id=${SPOTIFY_CLIENT_ID}`,
          `code_verifier=${codeVerifier || ''}`,
        ].join('&'),
      });
      const tokenData = await tokenRes.json();
      if (!tokenData.access_token) {
        throw new Error(tokenData.error_description || 'No se obtuvo access_token de Spotify');
      }

      // 2. Obtener perfil de usuario
      const profileRes = await fetch('https://api.spotify.com/v1/me', {
        headers: { Authorization: `Bearer ${tokenData.access_token}` },
      });
      const profile = await profileRes.json();

      // 3. Obtener top artistas
      let topArtists = [];
      try {
        const artistsRes = await fetch('https://api.spotify.com/v1/me/top/artists?limit=5&time_range=medium_term', {
          headers: { Authorization: `Bearer ${tokenData.access_token}` },
        });
        const artistsData = await artistsRes.json();
        topArtists = (artistsData.items || []).slice(0, 5).map(a => ({
          name: a.name,
          image: a.images?.[0]?.url || '',
          genres: a.genres?.slice(0, 2) || [],
        }));
      } catch (artErr) {
        console.warn('No se pudieron obtener top artistas:', artErr);
      }

      // 4. Guardar en el backend
      const saved = await apiRequest('/api/spotify/connect-token', {
        method: 'POST',
        body: JSON.stringify({
          spotifyId: profile.id || 'spotify_user',
          username: profile.display_name || profile.id || 'spotify_user',
          topArtists,
          accessToken: tokenData.access_token,
        }),
      });

      const newSpotify = saved.spotify || {
        connected: true,
        username: profile.display_name || profile.id || 'spotify_user',
        topArtists,
        accessToken: tokenData.access_token,
      };
      setSpotifyData(newSpotify);
      onUpdateUser({ ...user, spotify: newSpotify });
      Alert.alert('¡Spotify vinculado!', `Conectada con éxito como @${newSpotify.username}`);
    } catch (err) {
      console.error('Error Spotify PKCE:', err);
      Alert.alert('Error', `No se pudo completar la conexión con Spotify: ${err.message}`);
    } finally {
      setSpotifyLoading(false);
    }
  };

  const handleConnectSpotify = async () => {
    try {
      setSpotifyLoading(true);
      if (promptSpotifyAsync) {
        const res = await promptSpotifyAsync();
        if (res?.type === 'success') {
          const { code } = res.params;
          await exchangeSpotifyCode(code, spotifyRequest?.codeVerifier);
        } else if (res?.type === 'error') {
          Alert.alert('Error Spotify', res.error?.message || 'No se pudo autorizar.');
        }
      } else {
        Alert.alert(
          'Configurando Spotify',
          'La sesión de autenticación se está inicializando. Por favor, pulsa de nuevo en 2 segundos.'
        );
      }
    } catch (err) {
      console.error('Error al abrir Spotify:', err);
      Alert.alert('Error al abrir Spotify', err.message || 'No se pudo abrir la ventana de autorización.');
    } finally {
      setSpotifyLoading(false);
    }
  };

  const handleDisconnectSpotify = async () => {
    Alert.alert(
      'Desvincular Spotify',
      '¿Quieres desconectar tu cuenta de Spotify de tu perfil de Sparks?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Desvincular',
          style: 'destructive',
          onPress: async () => {
            setSpotifyLoading(true);
            try {
              const data = await apiRequest('/api/spotify/disconnect', { method: 'DELETE' });
              setSpotifyData(data.spotify);
              onUpdateUser({ ...user, spotify: data.spotify });
              Alert.alert('Spotify Desvinculado', 'Tu perfil ya no muestra tus artistas de Spotify.');
            } catch (err) {
              Alert.alert('Error', err.message);
            } finally {
              setSpotifyLoading(false);
            }
          }
        }
      ]
    );
  };

  const handleSaveProfile = async () => {
    if (!name.trim() || !age.trim()) {
      Alert.alert('Error', 'El nombre y la edad son obligatorios.');
      return;
    }

    setSaving(true);
    try {
      const data = await apiRequest('/api/users/me', {
        method: 'PUT',
        body: JSON.stringify({
          name: name.trim(),
          age: Number.parseInt(age, 10),
          bio: bio.trim(),
          avatarUrl,
          pronouns,
          intention,
          tags: selectedTags,
          anthem: selectedAnthem
        })
      });
      onUpdateUser(data.user);
      setEditModalVisible(false);
      Alert.alert('¡Éxito!', 'Tu perfil, obsesión musical y preferencias han sido actualizados.');
    } catch (err) {
      Alert.alert('Error al guardar', err.message);
    } finally {
      setSaving(false);
    }
  };

  // Seleccionar foto de perfil desde la galería del móvil (dentro del modal de edición)
  const handlePickAvatarFromGallery = async () => {
    try {
      let { status } = await ImagePicker.getMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        const req = await ImagePicker.requestMediaLibraryPermissionsAsync();
        status = req.status;
      }

      if (status !== 'granted') {
        Alert.alert(
          'Permiso de Galería Requerido',
          'Sparks necesita acceso a tus fotos para que puedas seleccionar tu foto de perfil. Puedes activarlo en los Ajustes.',
          [
            { text: 'Abrir Ajustes', onPress: () => Linking.openSettings() },
            { text: 'Cancelar', style: 'cancel' }
          ]
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.85,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const pickedUri = result.assets[0].uri;
        setAvatarUrl(pickedUri);
      }
    } catch (err) {
      Alert.alert('Error al seleccionar foto', err.message);
    }
  };

  // Cambiar foto directamente desde el avatar principal sin abrir el modal completo
  const handleDirectPickAvatar = async () => {
    try {
      let { status } = await ImagePicker.getMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        const req = await ImagePicker.requestMediaLibraryPermissionsAsync();
        status = req.status;
      }

      if (status !== 'granted') {
        Alert.alert(
          'Permiso de Galería Requerido',
          'Sparks necesita acceso a tus fotos para cambiar tu foto de perfil. Puedes activarlo en los Ajustes.',
          [
            { text: 'Abrir Ajustes', onPress: () => Linking.openSettings() },
            { text: 'Cancelar', style: 'cancel' }
          ]
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.85,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const pickedUri = result.assets[0].uri;
        let finalAvatarUrl = pickedUri;

        try {
          const uploadRes = await uploadPhoto(pickedUri, true);
          if (uploadRes?.url) {
            finalAvatarUrl = uploadRes.url;
          }
        } catch (upErr) {
          console.warn('Fallback a URI local:', upErr.message);
        }

        setAvatarUrl(finalAvatarUrl);

        // Guardar directamente en el backend
        const res = await apiRequest('/api/users/me', {
          method: 'PUT',
          body: JSON.stringify({ avatarUrl: finalAvatarUrl })
        });
        if (res?.user) {
          onUpdateUser(res.user);
        }
        Alert.alert('¡Foto actualizada!', 'Tu nueva foto de perfil se ha guardado en el servidor.');
      }
    } catch (err) {
      console.warn('Error al seleccionar foto de galería:', err);
      Alert.alert('Error', 'No se pudo cargar la foto seleccionada.');
    }
  };

  // Restablecer foto por defecto directamente desde el avatar principal
  const handleDirectResetAvatar = async () => {
    try {
      setAvatarUrl('default');
      const res = await apiRequest('/api/users/me', {
        method: 'PUT',
        body: JSON.stringify({ avatarUrl: 'default' })
      });
      if (res?.user) {
        onUpdateUser(res.user);
      }
      Alert.alert('Foto restablecida', 'Se ha establecido la silueta por defecto.');
    } catch (err) {
      console.warn('Error al restablecer foto por defecto:', err);
      Alert.alert('Error', 'No se pudo restablecer la foto.');
    }
  };

  // Restablecer foto de perfil a la predeterminada (dentro del modal)
  const handleResetDefaultAvatar = () => {
    setAvatarUrl('default');
  };

  const handleToggleGhostMode = async (val) => {
    setGhostMode(val);
    try {
      await apiRequest('/api/users/me/privacy', {
        method: 'PUT',
        body: JSON.stringify({ ghostMode: val, approxDistanceOnly: approxDistance })
      });
      onUpdateUser({ ...user, ghostMode: val });
    } catch (err) {
      setGhostMode(!val);
      Alert.alert('Error', err.message);
    }
  };

  const handleToggleApproxDistance = async (val) => {
    setApproxDistance(val);
    try {
      await apiRequest('/api/users/me/privacy', {
        method: 'PUT',
        body: JSON.stringify({ ghostMode, approxDistanceOnly: val })
      });
      onUpdateUser({ ...user, approxDistanceOnly: val });
    } catch (err) {
      setApproxDistance(!val);
      Alert.alert('Error', err.message);
    }
  };

  // 1. Detección y Comprobación Real de Soporte de Biometría
  const checkBiometricSupport = async () => {
    try {
      const compatible = await LocalAuthentication.hasHardwareAsync();

      if (compatible) {
        const types = await LocalAuthentication.supportedAuthenticationTypesAsync();
        if (types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
          setBiometricType('Face ID');
        } else if (types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
          setBiometricType('Touch ID / Huella');
        } else if (types.includes(LocalAuthentication.AuthenticationType.IRIS)) {
          setBiometricType('Sensor de Iris');
        } else {
          setBiometricType(Platform.OS === 'ios' ? 'Face ID' : 'Biometría');
        }
      } else {
        setBiometricType(Platform.OS === 'ios' ? 'Face ID' : 'Biometría');
      }
    } catch (err) {
      console.warn('No se pudo determinar soporte biométrico:', err);
      setBiometricType(Platform.OS === 'ios' ? 'Face ID' : 'Biometría');
    }
  };

  // 2. Abrir Modal de Verificación Biométrica
  const handleOpenVerifyModal = async () => {
    await checkBiometricSupport();
    setVerifyState('idle');
    setVerifyErrorMsg('');
    setVerifyModalVisible(true);
  };

  // 3. Ejecutar Autenticación Biométrica Real con Hardware Nativo
  const handlePerformBiometricVerification = async () => {
    try {
      setVerifyState('authenticating');
      setVerifyErrorMsg('');

      const compatible = await LocalAuthentication.hasHardwareAsync();
      const enrolled = await LocalAuthentication.isEnrolledAsync();

      if (!compatible) {
        setVerifyState('no_hardware');
        setVerifyErrorMsg('Tu dispositivo no dispone de sensor biométrico compatible.');
        return;
      }

      if (!enrolled) {
        setVerifyState('no_hardware');
        setVerifyErrorMsg(
          `No tienes ${biometricType} configurado en tu móvil. Actívalo en los Ajustes de tu dispositivo para poder verificar tu identidad de verdad.`
        );
        return;
      }

      // Ejecución real del sensor biométrico del hardware (Face ID / Huella / Biometría)
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: `Verifica tu identidad con ${biometricType} en Sparks`,
        cancelLabel: 'Cancelar',
        fallbackLabel: 'Usar código del teléfono',
        disableDeviceFallback: false
      });

      // VALIDACIÓN ESTRICTA: Solo si el sensor del teléfono certifica coincidencia real
      if (result.success) {
        const res = await apiRequest('/api/users/verify', {
          method: 'POST',
          body: JSON.stringify({
            method: biometricType
          })
        });

        const verifiedAt = res.verifiedAt || new Date().toISOString();
        const verificationMethod = res.verificationMethod || biometricType;

        onUpdateUser({
          ...user,
          isVerified: true,
          verifiedAt,
          verificationMethod
        });

        setVerifyState('success');
      } else {
        // Fallo real o cancelación: ¡NO se verifica!
        setVerifyState('error');
        if (result.error === 'user_cancel') {
          setVerifyErrorMsg('Has cancelado la verificación biométrica.');
        } else if (result.error === 'not_enrolled') {
          setVerifyErrorMsg(`No tienes ${biometricType} registrado en este teléfono.`);
        } else if (result.error === 'lockout') {
          setVerifyErrorMsg('Demasiados intentos fallidos. Sensor bloqueado temporalmente por seguridad.');
        } else {
          setVerifyErrorMsg(
            `No se pudo verificar tu ${biometricType}. El sensor biométrico no reconoció tu identidad o no coincidió.`
          );
        }
      }
    } catch (err) {
      setVerifyState('error');
      setVerifyErrorMsg(err.message || 'Error al conectar con el sensor biométrico.');
    }
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Eliminar Cuenta',
      '¿Estás completamente segura? Esta acción borrará permanentemente todos tus matches, fotos y mensajes.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Sí, Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              await apiRequest('/api/users/me', { method: 'DELETE' });
              onLogout();
            } catch (err) {
              Alert.alert('Error', err.message);
            }
          }
        }
      ]
    );
  };

  const dynamicStyles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background
    },
    card: {
      backgroundColor: theme.colors.surface,
      borderRadius: 22,
      padding: 20,
      marginBottom: 16,
      shadowColor: theme.colors.shadow,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.2,
      shadowRadius: 8,
      elevation: 4
    },
    title: {
      fontSize: 22,
      fontWeight: 'bold',
      color: theme.colors.textPrimary
    },
    sectionTitle: {
      fontSize: 15,
      fontWeight: 'bold',
      color: theme.colors.primary,
      marginBottom: 10
    },
    tagChip: {
      backgroundColor: isDarkMode ? '#2d0c1b' : '#ffe5ec',
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 16,
      marginRight: 8,
      marginBottom: 8
    },
    tagChipText: {
      fontSize: 12,
      color: theme.colors.primary,
      fontWeight: '600'
    },
    switchRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border
    }
  });

  const activeAnthem = user?.anthem || selectedAnthem;
  const isSpotifyLinked = spotifyData?.connected;

  const renderAnthemSection = () => {
    if (!isSpotifyLinked) {
      return (
        <TouchableOpacity
          style={[styles.anthemCard, { backgroundColor: isDarkMode ? '#0a2312' : '#f4fbf5', borderColor: isDarkMode ? '#1b4332' : '#d8f3dc', borderStyle: 'dashed' }]}
          onPress={handleConnectSpotify}
          activeOpacity={0.85}
        >
          <View style={{ width: 50, height: 50, borderRadius: 8, backgroundColor: '#1db95420', alignItems: 'center', justifyContent: 'center' }}>
            <Ionicons name="musical-note" size={24} color="#1db954" />
          </View>
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={[styles.anthemTitle, { color: theme.colors.textPrimary, fontSize: 14 }]} numberOfLines={1}>
              Conectar con Spotify
            </Text>
            <Text style={[styles.anthemArtist, { color: theme.colors.textMuted, fontSize: 12 }]} numberOfLines={2}>
              Enlaza tu cuenta para elegir tu canción favorita del catálogo oficial.
            </Text>
          </View>
          <View style={{ paddingHorizontal: 10, paddingVertical: 6, borderRadius: 14, backgroundColor: '#1db954', flexDirection: 'row', alignItems: 'center' }}>
            <Ionicons name="link-outline" size={13} color="#ffffff" style={{ marginRight: 4 }} />
            <Text style={{ fontSize: 11, fontWeight: 'bold', color: '#ffffff' }}>Enlazar</Text>
          </View>
        </TouchableOpacity>
      );
    }

    if (activeAnthem) {
      return (
        <TouchableOpacity
          style={[styles.anthemCard, { backgroundColor: isDarkMode ? '#141d17' : '#f4fbf5', borderColor: isDarkMode ? '#1db95440' : '#b7e4c7' }]}
          onPress={() => setAnthemModalVisible(true)}
          activeOpacity={0.85}
        >
          <Image source={{ uri: activeAnthem.coverUrl }} style={styles.anthemCover} />
          <View style={styles.anthemInfo}>
            <Text style={[styles.anthemTitle, { color: theme.colors.textPrimary }]} numberOfLines={1}>
              {activeAnthem.title}
            </Text>
            <Text style={[styles.anthemArtist, { color: theme.colors.textSecondary }]} numberOfLines={1}>
              {activeAnthem.artist}
            </Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
              <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: '#1db954', alignItems: 'center', justifyContent: 'center', marginRight: 4 }}>
                <Ionicons name="musical-note" size={6} color="#000" />
              </View>
              <Text style={{ fontSize: 10, color: '#1db954', fontWeight: 'bold' }}>Spotify Track</Text>
            </View>
          </View>

          <View style={{ paddingHorizontal: 10, paddingVertical: 6, borderRadius: 14, backgroundColor: isDarkMode ? '#1b4332' : '#d8f3dc', flexDirection: 'row', alignItems: 'center' }}>
            <Ionicons name="sparkles" size={13} color="#1db954" style={{ marginRight: 4 }} />
            <Text style={{ fontSize: 11, fontWeight: 'bold', color: '#1db954' }}>Top Song</Text>
          </View>
        </TouchableOpacity>
      );
    }

    return (
      <TouchableOpacity
        style={[styles.anthemCard, { backgroundColor: isDarkMode ? '#141d17' : '#f4fbf5', borderColor: isDarkMode ? '#1db95440' : '#b7e4c7', borderStyle: 'dashed' }]}
        onPress={() => setAnthemModalVisible(true)}
        activeOpacity={0.85}
      >
        <View style={{ width: 50, height: 50, borderRadius: 8, backgroundColor: '#1db95420', alignItems: 'center', justifyContent: 'center' }}>
          <Ionicons name="search" size={24} color="#1db954" />
        </View>
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={[styles.anthemTitle, { color: theme.colors.textPrimary, fontSize: 14 }]} numberOfLines={1}>
            Elige tu obsesión musical
          </Text>
          <Text style={[styles.anthemArtist, { color: theme.colors.textMuted, fontSize: 12 }]} numberOfLines={2}>
            Toca para buscar y seleccionar tu canción favorita en Spotify.
          </Text>
        </View>
        <View style={{ paddingHorizontal: 10, paddingVertical: 6, borderRadius: 14, backgroundColor: '#1db954', flexDirection: 'row', alignItems: 'center' }}>
          <Ionicons name="add" size={14} color="#ffffff" style={{ marginRight: 2 }} />
          <Text style={{ fontSize: 11, fontWeight: 'bold', color: '#ffffff' }}>Buscar</Text>
        </View>
      </TouchableOpacity>
    );
  };

  const renderSpotifySearchResults = () => {
    if (spotifySearchResults.length > 0) {
      return (
        <>
          <Text style={[styles.searchResultsHeader, { color: theme.colors.textSecondary }]}>
            RESULTADOS EN SPOTIFY:
          </Text>
          {spotifySearchResults.map((track) => (
            <TouchableOpacity
              key={track.id}
              style={[
                styles.anthemChoiceItem,
                { backgroundColor: isDarkMode ? '#280814' : '#f8f9fa', borderColor: theme.colors.border }
              ]}
              onPress={async () => {
                const newAnthem = {
                  id: track.id,
                  title: track.title,
                  artist: track.artist,
                  coverUrl: track.coverUrl,
                  album: track.album
                };
                setSelectedAnthem(newAnthem);
                setAnthemModalVisible(false);
                try {
                  await apiRequest('/api/users/me', {
                    method: 'PUT',
                    body: JSON.stringify({ anthem: newAnthem })
                  });
                  onUpdateUser({ ...user, anthem: newAnthem });
                } catch (e) {
                  console.warn('Error al guardar nuevo anthem en el perfil:', e);
                }
              }}
            >
              <Image source={{ uri: track.coverUrl }} style={styles.anthemChoiceCover} />
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={[styles.anthemTitle, { color: theme.colors.textPrimary }]} numberOfLines={1}>
                  {track.title}
                </Text>
                <Text style={[styles.anthemArtist, { color: theme.colors.textSecondary }]} numberOfLines={1}>
                  {track.artist}
                </Text>
                {track.album ? (
                  <Text style={{ fontSize: 10, color: theme.colors.textMuted, marginTop: 2 }} numberOfLines={1}>
                    {track.album}
                  </Text>
                ) : null}
              </View>
              <View style={styles.selectGreenPill}>
                <Text style={styles.selectGreenPillText}>Elegir</Text>
              </View>
            </TouchableOpacity>
          ))}
        </>
      );
    }

    if (spotifySearchQuery.trim()) {
      return (
        <View style={{ alignItems: 'center', paddingVertical: 36, paddingHorizontal: 20 }}>
          <Text style={{ fontSize: 14, color: theme.colors.textMuted, textAlign: 'center' }}>
            No se encontraron canciones en Spotify para "{spotifySearchQuery}".
          </Text>
        </View>
      );
    }

    return (
      <View style={{ alignItems: 'center', paddingVertical: 40, paddingHorizontal: 24 }}>
        <View style={{ width: 54, height: 54, borderRadius: 27, backgroundColor: '#1db95415', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
          <Ionicons name="search" size={26} color="#1db954" />
        </View>
        <Text style={{ fontSize: 15, fontWeight: '700', color: theme.colors.textPrimary, textAlign: 'center', marginBottom: 6 }}>
          Escribe el nombre de una canción
        </Text>
        <Text style={{ fontSize: 12, color: theme.colors.textSecondary, textAlign: 'center', lineHeight: 18 }}>
          Busca por título o artista para encontrar tu obsesión musical en Spotify y destacarla en tu perfil.
        </Text>
      </View>
    );
  };

  const renderBiometricModalBody = () => {
    if (user?.isVerified && verifyState === 'idle') {
      return (
        <View style={styles.bioContentContainer}>
          <View style={styles.bioSuccessRingContainer}>
            <View style={[styles.bioCertGlow, { backgroundColor: isDarkMode ? '#00334e' : '#e0f2fe' }]}>
              <Ionicons name="shield-checkmark" size={44} color="#0077b6" />
            </View>
            <View style={styles.bioCertMiniBadge}>
              <Ionicons name="checkmark" size={14} color="#ffffff" />
            </View>
          </View>

          <Text style={[styles.bioSuccessTitle, { color: theme.colors.textPrimary }]}>
            ¡Perfil Oficialmente Verificado!
          </Text>
          <Text style={[styles.bioSuccessSub, { color: theme.colors.textSecondary }]}>
            Tu identidad ha sido comprobada con biometría real. Cuentas con el Check Azul de Sparks activo en todas tus apariciones.
          </Text>

          <View
            style={[
              styles.bioCertCard,
              {
                backgroundColor: isDarkMode ? '#001b29' : '#f0f9ff',
                borderColor: '#0077b6'
              }
            ]}
          >
            <View style={styles.bioCertRow}>
              <Text style={[styles.bioCertLabel, { color: theme.colors.textMuted }]}>
                Distintivo:
              </Text>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Ionicons name="checkmark-circle" size={15} color="#0077b6" style={{ marginRight: 4 }} />
                <Text style={[styles.bioCertValue, { color: '#0077b6', fontWeight: 'bold' }]}>
                  Check Azul Sparks
                </Text>
              </View>
            </View>
            <View style={[styles.bioCertDivider, { backgroundColor: isDarkMode ? '#00334e' : '#e0f2fe' }]} />
            <View style={styles.bioCertRow}>
              <Text style={[styles.bioCertLabel, { color: theme.colors.textMuted }]}>
                Método seguro:
              </Text>
              <Text style={[styles.bioCertValue, { color: theme.colors.textPrimary }]}>
                {user.verificationMethod || biometricType || 'Sensor Biométrico'}
              </Text>
            </View>
            <View style={[styles.bioCertDivider, { backgroundColor: isDarkMode ? '#00334e' : '#e0f2fe' }]} />
            <View style={styles.bioCertRow}>
              <Text style={[styles.bioCertLabel, { color: theme.colors.textMuted }]}>
                Estado:
              </Text>
              <Text style={[styles.bioCertValue, { color: '#2ec4b6', fontWeight: 'bold' }]}>
                Auténtico y Protegido
              </Text>
            </View>
          </View>

          <TouchableOpacity
            style={[styles.bioReverifyBtn, { borderColor: theme.colors.border }]}
            onPress={handlePerformBiometricVerification}
          >
            <Ionicons name="refresh" size={16} color={theme.colors.textSecondary} style={{ marginRight: 6 }} />
            <Text style={[styles.bioReverifyText, { color: theme.colors.textSecondary }]}>
              Re-verificar con {biometricType}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.bioPrimaryBtn, { backgroundColor: '#0077b6', marginTop: 12 }]}
            onPress={() => setVerifyModalVisible(false)}
          >
            <Text style={styles.bioPrimaryBtnText}>Entendido</Text>
          </TouchableOpacity>
        </View>
      );
    }

    if (verifyState === 'success') {
      return (
        <View style={styles.bioContentContainer}>
          <View style={styles.bioSuccessRingContainer}>
            <View style={[styles.bioCertGlow, { backgroundColor: isDarkMode ? '#003820' : '#e8f5e9' }]}>
              <Ionicons name="checkmark-circle" size={48} color="#2ec4b6" />
            </View>
          </View>

          <Text style={[styles.bioSuccessTitle, { color: theme.colors.textPrimary }]}>
            ¡Identidad Biométrica Certificada!
          </Text>
          <Text style={[styles.bioSuccessSub, { color: theme.colors.textSecondary }]}>
            Tu {biometricType} ha sido verificado con éxito. Tu perfil ahora tiene la insignia de Verificada oficial.
          </Text>

          <View style={[styles.bioVerifiedPillBanner, { backgroundColor: isDarkMode ? '#002538' : '#e0f2fe' }]}>
            <Ionicons name="checkmark-circle" size={20} color="#0077b6" style={{ marginRight: 8 }} />
            <Text style={[styles.bioVerifiedPillText, { color: '#0077b6' }]}>
              Check Azul de Confianza Activado
            </Text>
          </View>

          <TouchableOpacity
            style={[styles.bioPrimaryBtn, { backgroundColor: '#0077b6', marginTop: 16 }]}
            onPress={() => {
              setVerifyState('idle');
              setVerifyModalVisible(false);
            }}
          >
            <Text style={styles.bioPrimaryBtnText}>Ver mi Perfil Verificado</Text>
          </TouchableOpacity>
        </View>
      );
    }

    if (verifyState === 'error') {
      return (
        <View style={styles.bioContentContainer}>
          <View style={styles.bioSuccessRingContainer}>
            <View style={[styles.bioCertGlow, { backgroundColor: isDarkMode ? '#380c16' : '#ffebee' }]}>
              <Ionicons name="close-circle" size={46} color="#d90429" />
            </View>
          </View>

          <Text style={[styles.bioSuccessTitle, { color: '#d90429' }]}>
            Verificación No Completada
          </Text>
          <Text style={[styles.bioSuccessSub, { color: theme.colors.textSecondary }]}>
            {verifyErrorMsg || 'El sensor biométrico no reconoció tu identidad o se canceló el escaneo.'}
          </Text>

          <View style={[styles.bioAlertBox, { backgroundColor: isDarkMode ? '#2b0711' : '#fff0f3', borderColor: '#d90429' }]}>
            <Ionicons name="information-circle" size={18} color="#d90429" style={{ marginRight: 8 }} />
            <Text style={[styles.bioAlertText, { color: theme.colors.textPrimary }]}>
              Asegúrate de mirar a la cámara con buena luz o colocar firmemente tu huella en el sensor.
            </Text>
          </View>

          <TouchableOpacity
            style={[styles.bioPrimaryBtn, { backgroundColor: '#0077b6', marginTop: 14 }]}
            onPress={handlePerformBiometricVerification}
          >
            <Ionicons name="refresh" size={17} color="#ffffff" style={{ marginRight: 8 }} />
            <Text style={styles.bioPrimaryBtnText}>Reintentar con {biometricType}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={{ marginTop: 12, paddingVertical: 6 }}
            onPress={() => setVerifyModalVisible(false)}
          >
            <Text style={{ color: theme.colors.textMuted, fontSize: 13, fontWeight: '600' }}>
              Cerrar
            </Text>
          </TouchableOpacity>
        </View>
      );
    }

    if (verifyState === 'no_hardware') {
      return (
        <View style={styles.bioContentContainer}>
          <View style={styles.bioSuccessRingContainer}>
            <View style={[styles.bioCertGlow, { backgroundColor: isDarkMode ? '#332600' : '#fffbeb' }]}>
              <Ionicons name="hardware-chip-outline" size={42} color="#f59e0b" />
            </View>
          </View>

          <Text style={[styles.bioSuccessTitle, { color: theme.colors.textPrimary }]}>
            Biometría No Disponible
          </Text>
          <Text style={[styles.bioSuccessSub, { color: theme.colors.textSecondary }]}>
            {verifyErrorMsg || 'Este dispositivo no tiene biometría configurada.'}
          </Text>

          <TouchableOpacity
            style={[styles.bioPrimaryBtn, { backgroundColor: '#0077b6', marginTop: 16 }]}
            onPress={() => setVerifyModalVisible(false)}
          >
            <Text style={styles.bioPrimaryBtnText}>Entendido</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <View style={styles.bioContentContainer}>
        <Text style={[styles.bioHeroSub, { color: theme.colors.textSecondary }]}>
          Autenticación de identidad con la tecnología nativa de tu teléfono para garantizar que eres tú de verdad.
        </Text>

        {/* Radar biométrico visual con pulso */}
        <View style={styles.bioRadarWrapper}>
          <Animated.View
            style={[
              styles.bioRadarPulse,
              {
                transform: [{ scale: pulseAnim }],
                borderColor: '#0077b6'
              }
            ]}
          />
          <View style={[styles.bioRadarCore, { backgroundColor: isDarkMode ? '#001e30' : '#e0f2fe', borderColor: '#0077b6' }]}>
            <Ionicons
              name={biometricType.includes('Huella') ? 'finger-print-outline' : 'scan-outline'}
              size={46}
              color="#0077b6"
            />
          </View>
        </View>

        <Text style={[styles.bioScannerLabel, { color: theme.colors.textPrimary }]}>
          Sensor seguro: {biometricType}
        </Text>

        {/* 3 Garantías de Seguridad */}
        <View style={[styles.bioPerksBox, { backgroundColor: isDarkMode ? '#001522' : '#f8fcff', borderColor: theme.colors.border }]}>
          <View style={styles.bioPerkRow}>
            <Ionicons name="lock-closed" size={17} color="#0077b6" style={{ marginRight: 10 }} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.bioPerkTitle, { color: theme.colors.textPrimary }]}>Privacidad en Enclave Seguro</Text>
              <Text style={[styles.bioPerkDesc, { color: theme.colors.textMuted }]}>Tus datos biométricos nunca salen de tu teléfono ni se guardan en servidores.</Text>
            </View>
          </View>

          <View style={[styles.bioPerkDivider, { backgroundColor: theme.colors.border }]} />

          <View style={styles.bioPerkRow}>
            <Ionicons name="checkmark-circle" size={17} color="#0077b6" style={{ marginRight: 10 }} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.bioPerkTitle, { color: theme.colors.textPrimary }]}>Insignia Oficial Verificada</Text>
              <Text style={[styles.bioPerkDesc, { color: theme.colors.textMuted }]}>Consigue el Check Azul para generar confianza en tus quedadas y chats.</Text>
            </View>
          </View>
        </View>

        {/* Botón de Acción Principal */}
        <TouchableOpacity
          style={[styles.bioPrimaryBtn, { backgroundColor: '#0077b6' }]}
          onPress={handlePerformBiometricVerification}
          disabled={verifyState === 'authenticating'}
        >
          {verifyState === 'authenticating' ? (
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <ActivityIndicator color="#ffffff" style={{ marginRight: 10 }} />
              <Text style={styles.bioPrimaryBtnText}>Comprobando {biometricType}...</Text>
            </View>
          ) : (
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Ionicons
                name={biometricType.includes('Huella') ? 'finger-print' : 'scan'}
                size={19}
                color="#ffffff"
                style={{ marginRight: 8 }}
              />
              <Text style={styles.bioPrimaryBtnText}>
                Verificar mi Rostro con {biometricType}
              </Text>
            </View>
          )}
        </TouchableOpacity>

        <Text style={[styles.bioFootnote, { color: theme.colors.textMuted }]}>
          Solo se aprobará la verificación si el sensor biométrico valida tu identidad con éxito.
        </Text>
      </View>
    );
  };

  return (
    <ScrollView style={dynamicStyles.container} contentContainerStyle={styles.scrollContent}>
      {/* Tarjeta Superior de Perfil */}
      <View style={[dynamicStyles.card, { alignItems: 'center' }]}>
        <View style={styles.avatarContainer}>
          <Image
            source={getAvatarSource(user?.avatarUrl || avatarUrl)}
            style={[styles.profileAvatar, { borderColor: theme.colors.primaryDark }]}
          />
          <TouchableOpacity
            style={[styles.editBadge, { backgroundColor: theme.colors.primaryDark }]}
            onPress={() => {
              Alert.alert(
                'Cambiar Foto de Perfil',
                'Selecciona una opción:',
                [
                  {
                    text: 'Elegir de Galería',
                    onPress: handleDirectPickAvatar
                  },
                  {
                    text: 'Foto por Defecto',
                    onPress: handleDirectResetAvatar
                  },
                  { text: 'Cancelar', style: 'cancel' }
                ]
              );
            }}
          >
            <Ionicons name="camera" size={14} color="#ffffff" />
          </TouchableOpacity>
        </View>

        <View style={styles.profileNameRow}>
          <Text style={dynamicStyles.title}>
            {user?.name || 'Mi Perfil'}, <Text style={{ color: theme.colors.textSecondary, fontWeight: 'normal' }}>{user?.age || 25}</Text>
          </Text>
          {user?.isVerified ? (
            <TouchableOpacity
              style={styles.verifiedHeaderBadge}
              onPress={handleOpenVerifyModal}
              activeOpacity={0.8}
            >
              <Ionicons name="checkmark-circle" size={18} color="#0077b6" />
              <Text style={styles.verifiedHeaderText}>Verificada</Text>
            </TouchableOpacity>
          ) : null}
        </View>

        <Text style={[styles.pronounBadge, { backgroundColor: isDarkMode ? '#3d0c1e' : '#ffe5ec', color: theme.colors.primary }]}>
          {user?.pronouns || 'Ella / She'}
        </Text>
        {user?.isAdmin && (
          <View style={[styles.adminRoleBadge, { backgroundColor: isDarkMode ? '#2b1b00' : '#fef3c7', borderColor: '#f59e0b' }]}>
            <Ionicons name="shield" size={13} color="#d97706" style={{ marginRight: 5 }} />
            <Text style={{ fontSize: 11, fontWeight: 'bold', color: '#d97706', textTransform: 'uppercase', letterSpacing: 0.5 }}>
              Administradora Oficial
            </Text>
          </View>
        )}
        <Text style={[styles.profileEmail, { color: theme.colors.textMuted }]}>{user?.email}</Text>

        <View style={styles.headerButtonsRow}>
          <TouchableOpacity
            style={[styles.editProfileBtn, { backgroundColor: isDarkMode ? '#3d0c1e' : '#ffe5ec', borderColor: theme.colors.primaryDark }]}
            onPress={() => setEditModalVisible(true)}
          >
            <Ionicons name="options-outline" size={15} color={theme.colors.primary} style={{ marginRight: 6 }} />
            <Text style={[styles.editProfileBtnText, { color: theme.colors.primary }]}>Editar Perfil & Tags</Text>
          </TouchableOpacity>

          {user?.isVerified ? (
            <TouchableOpacity
              style={[styles.verifiedBadgeBtn, { backgroundColor: isDarkMode ? '#002538' : '#e0f2fe', borderColor: '#0077b6' }]}
              onPress={handleOpenVerifyModal}
            >
              <Ionicons name="shield-checkmark" size={15} color="#0077b6" style={{ marginRight: 6 }} />
              <Text style={styles.verifiedBadgeBtnText}>Certificado Activo</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[styles.verifyBtn, { backgroundColor: isDarkMode ? '#002538' : '#e0f2fe', borderColor: '#0077b6' }]}
              onPress={handleOpenVerifyModal}
            >
              <Ionicons name="scan-outline" size={16} color="#0077b6" style={{ marginRight: 6 }} />
              <Text style={styles.verifyBtnText}>Verificar con {biometricType}</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Integración Oficial con Spotify Web API */}
      <View style={dynamicStyles.card}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Ionicons name="musical-notes" size={18} color="#1db954" style={{ marginRight: 6 }} />
            <Text style={[dynamicStyles.sectionTitle, { color: '#1db954', marginBottom: 0 }]}>
              Spotify
            </Text>
          </View>
          {isSpotifyLinked ? (
            <TouchableOpacity onPress={handleDisconnectSpotify} disabled={spotifyLoading}>
              <Text style={{ fontSize: 12, color: theme.colors.textMuted, fontWeight: '600' }}>Desvincular</Text>
            </TouchableOpacity>
          ) : null}
        </View>

        {!isSpotifyLinked ? (
          <View style={[styles.spotifyConnectPrompt, { backgroundColor: isDarkMode ? '#0a2312' : '#ebfbee', borderColor: '#1db954' }]}>
            <View style={{ width: 26, height: 26, borderRadius: 13, backgroundColor: '#1db954', alignItems: 'center', justifyContent: 'center', marginBottom: 6 }}>
              <Ionicons name="musical-notes" size={14} color="#000" />
            </View>
            <Text style={[styles.spotifyPromptTitle, { color: theme.colors.textPrimary }]}>
              Enlaza tu cuenta de Spotify
            </Text>
            <Text style={[styles.spotifyPromptSub, { color: theme.colors.textSecondary }]}>
              Abre la pestaña oficial de Spotify para autorizar y mostrar tus canciones y artistas más escuchados en tu perfil.
            </Text>
            <TouchableOpacity
              style={styles.spotifyConnectBtn}
              onPress={handleConnectSpotify}
              disabled={spotifyLoading}
            >
              {spotifyLoading ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <View style={{ width: 18, height: 18, borderRadius: 9, backgroundColor: '#1db954', alignItems: 'center', justifyContent: 'center', marginRight: 8 }}>
                    <Ionicons name="musical-notes" size={10} color="#000" />
                  </View>
                  <Text style={styles.spotifyConnectBtnText}>Conectar con Spotify</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        ) : (
          <View>
            <View style={styles.spotifyLinkedHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <View style={styles.spotifyDot} />
                <Text style={[styles.spotifyUserText, { color: theme.colors.textPrimary }]}>
                  Conectado como <Text style={{ fontWeight: 'bold', color: '#1db954' }}>@{spotifyData.username}</Text>
                </Text>
              </View>
              <View style={styles.spotifyTag}>
                <Text style={styles.spotifyTagText}>Sincronizado</Text>
              </View>
            </View>

            <Text style={[styles.spotifySubheader, { color: theme.colors.textSecondary }]}>
              Tus Top Artistas en Spotify:
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.artistScroll}>
              {spotifyData.topArtists.map((artist, idx) => (
                <View key={artist.name || `${idx}`} style={styles.artistItem}>
                  <Image source={{ uri: artist.image }} style={styles.artistImage} />
                  <Text style={[styles.artistName, { color: theme.colors.textPrimary }]} numberOfLines={1}>
                    {artist.name}
                  </Text>
                  <Text style={[styles.artistGenre, { color: theme.colors.textMuted }]} numberOfLines={1}>
                    {artist.genres ? artist.genres[0] : 'Artist'}
                  </Text>
                </View>
              ))}
            </ScrollView>
          </View>
        )}
      </View>

      {/* Mi Obsesión Musical (Spotify Song) */}
      <View style={dynamicStyles.card}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <View style={{ width: 22, height: 22, borderRadius: 11, backgroundColor: '#1db954', alignItems: 'center', justifyContent: 'center', marginRight: 8 }}>
              <Ionicons name="musical-notes" size={12} color="#000" />
            </View>
            <Text style={[dynamicStyles.sectionTitle, { color: theme.colors.textPrimary, marginBottom: 0, fontSize: 16 }]}>
              Mi Obsesión Musical
            </Text>
          </View>
          {isSpotifyLinked && activeAnthem && (
            <TouchableOpacity
              style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: isDarkMode ? '#1a2e22' : '#e8f5e9', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 12 }}
              onPress={() => setAnthemModalVisible(true)}
            >
              <Ionicons name="search" size={12} color="#1db954" style={{ marginRight: 4 }} />
              <Text style={{ fontSize: 12, fontWeight: '700', color: '#1db954' }}>Cambiar</Text>
            </TouchableOpacity>
          )}
        </View>

        {renderAnthemSection()}
      </View>

      {/* Intención Actual */}
      <View style={dynamicStyles.card}>
        <Text style={dynamicStyles.sectionTitle}>¿Qué estás buscando?</Text>
        <View style={[styles.intentionPill, { backgroundColor: isDarkMode ? '#2d0c1b' : '#fff0f3', borderColor: theme.colors.border }]}>
          <Ionicons name="heart" size={16} color={theme.colors.primary} style={{ marginRight: 8 }} />
          <Text style={[styles.intentionPillText, { color: theme.colors.primary }]}>
            {INTENTION_LABELS[user?.intention] || 'Buscando Citas / Pareja'}
          </Text>
        </View>
      </View>

      {/* Etiquetas e Intereses */}
      <View style={dynamicStyles.card}>
        <Text style={dynamicStyles.sectionTitle}>Mis Intereses & Identidad</Text>
        <View style={styles.tagsContainer}>
          {(user?.tags || ['Femme', 'Música indie']).map((tag, idx) => (
            <View key={tag || `${idx}`} style={dynamicStyles.tagChip}>
              <Text style={dynamicStyles.tagChipText}>{tag}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Ajustes de Tema y Modo Oscuro */}
      <View style={dynamicStyles.card}>
        <Text style={dynamicStyles.sectionTitle}>Apariencia & Tema</Text>

        <View style={[dynamicStyles.switchRow, { borderBottomWidth: 0, paddingBottom: 0 }]}>
          <View style={{ flex: 1, paddingRight: 10 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 2 }}>
              <Ionicons name={isDarkMode ? 'moon' : 'sunny'} size={18} color={theme.colors.primary} style={{ marginRight: 6 }} />
              <Text style={[styles.switchTitle, { color: theme.colors.textPrimary }]}>
                {isDarkMode ? 'Modo Oscuro (Vino & Neón)' : 'Modo Claro (Rosa & Carmín)'}
              </Text>
            </View>
            <Text style={[styles.switchSubtitle, { color: theme.colors.textMuted }]}>
              {isDarkMode ? 'Paleta nocturna en tonos vino y negro terciopelo.' : 'Paleta diurna luminosa en tonos rosa.'}
            </Text>
          </View>
          <Switch
            value={isDarkMode}
            onValueChange={toggleTheme}
            trackColor={{ false: '#ffd0d8', true: theme.colors.primaryDark }}
            thumbColor={isDarkMode ? '#ffffff' : '#f4f3f4'}
          />
        </View>
      </View>

      {/* Privacidad & Modo Fantasma */}
      <View style={dynamicStyles.card}>
        <Text style={dynamicStyles.sectionTitle}>Privacidad & Modo Fantasma</Text>

        <View style={dynamicStyles.switchRow}>
          <View style={{ flex: 1, paddingRight: 10 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 2 }}>
              <Ionicons name="eye-off-outline" size={17} color={theme.colors.primary} style={{ marginRight: 6 }} />
              <Text style={[styles.switchTitle, { color: theme.colors.textPrimary }]}>Modo Fantasma (Invisible)</Text>
            </View>
            <Text style={[styles.switchSubtitle, { color: theme.colors.textMuted }]}>
              Oculta tu perfil temporalmente del Grid para que nadie te vea.
            </Text>
          </View>
          <Switch
            value={ghostMode}
            onValueChange={handleToggleGhostMode}
            trackColor={{ false: '#ffd0d8', true: theme.colors.primaryDark }}
            thumbColor={ghostMode ? '#ffffff' : '#f4f3f4'}
          />
        </View>

        <View style={[dynamicStyles.switchRow, { borderBottomWidth: 0, paddingBottom: 0 }]}>
          <View style={{ flex: 1, paddingRight: 10 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 2 }}>
              <Ionicons name="location-outline" size={17} color={theme.colors.primary} style={{ marginRight: 6 }} />
              <Text style={[styles.switchTitle, { color: theme.colors.textPrimary }]}>Distancia Aproximada</Text>
            </View>
            <Text style={[styles.switchSubtitle, { color: theme.colors.textMuted }]}>
              Oculta los metros exactos y muestra "&lt; 5 km" para mayor privacidad.
            </Text>
          </View>
          <Switch
            value={approxDistance}
            onValueChange={handleToggleApproxDistance}
            trackColor={{ false: '#ffd0d8', true: theme.colors.primaryDark }}
            thumbColor={approxDistance ? '#ffffff' : '#f4f3f4'}
          />
        </View>
      </View>

      {/* Apartado de Moderación & Administración (Solo Admin) */}
      {(user?.isAdmin || user?.role === 'admin') && (
        <View style={[dynamicStyles.card, { borderColor: theme.colors.primaryDark, borderWidth: 1.5 }]}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <View style={[styles.safetyIconCircle, { backgroundColor: isDarkMode ? '#3b0c16' : '#ffe5ea' }]}>
                <Ionicons name="shield-checkmark" size={18} color="#d90429" />
              </View>
              <Text style={[dynamicStyles.sectionTitle, { marginBottom: 0, marginLeft: 10, color: isDarkMode ? '#ff2a6d' : theme.colors.primaryDark }]}>
                Panel de Moderación
              </Text>
            </View>
            <View style={[styles.adminPillBadge, { backgroundColor: isDarkMode ? '#3d0c1e' : '#ffe5ec' }]}>
              <Text style={[styles.adminPillBadgeText, { color: theme.colors.primary }]}>ADMIN</Text>
            </View>
          </View>
          <Text style={[styles.safetyBtnSubtitle, { color: theme.colors.textMuted, marginBottom: 12 }]}>
            Revisa reportes de la comunidad, inspecciona en vivo los chats denunciados y dictamina suspensiones.
          </Text>

          <TouchableOpacity
            style={[styles.openAdminDashboardBtn, { backgroundColor: theme.colors.primaryDark }]}
            onPress={() => setAdminModalVisible(true)}
            activeOpacity={0.8}
          >
            <Ionicons name="shield-sharp" size={17} color="#ffffff" style={{ marginRight: 8 }} />
            <Text style={styles.openAdminDashboardBtnText}>Abrir Panel de Moderadora</Text>
            <Ionicons name="arrow-forward" size={16} color="#ffffff" style={{ marginLeft: 6 }} />
          </TouchableOpacity>
        </View>
      )}

      {/* Seguridad & Comunidad */}
      <View style={dynamicStyles.card}>
        <Text style={dynamicStyles.sectionTitle}>Seguridad & Normas de la Comunidad</Text>

        <TouchableOpacity
          style={[styles.safetyMenuBtn, { backgroundColor: theme.colors.surfaceSubtle, borderColor: theme.colors.border }]}
          onPress={() => setBlockedModalVisible(true)}
          activeOpacity={0.8}
        >
          <View style={[styles.safetyIconCircle, { backgroundColor: isDarkMode ? '#2d0c1b' : '#ffe5ec' }]}>
            <Ionicons name="ban-outline" size={17} color="#d90429" />
          </View>
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={[styles.safetyBtnTitle, { color: theme.colors.textPrimary }]}>Usuarias Bloqueadas</Text>
            <Text style={[styles.safetyBtnSubtitle, { color: theme.colors.textMuted }]}>Gestiona o desbloquea perfiles bloqueados.</Text>
          </View>
          <Ionicons name="chevron-forward" size={16} color={theme.colors.textSecondary} />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.safetyMenuBtn, { backgroundColor: theme.colors.surfaceSubtle, borderColor: theme.colors.border }]}
          onPress={() => setGuidelinesModalVisible(true)}
          activeOpacity={0.8}
        >
          <View style={[styles.safetyIconCircle, { backgroundColor: isDarkMode ? '#132a26' : '#e8f8f5' }]}>
            <Ionicons name="shield-checkmark-outline" size={17} color="#00b4d8" />
          </View>
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={[styles.safetyBtnTitle, { color: theme.colors.textPrimary }]}>Normas de la Comunidad</Text>
            <Text style={[styles.safetyBtnSubtitle, { color: theme.colors.textMuted }]}>Espacio seguro sáfico, respeto y tolerancia cero.</Text>
          </View>
          <Ionicons name="chevron-forward" size={16} color={theme.colors.textSecondary} />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.safetyMenuBtn, { backgroundColor: theme.colors.surfaceSubtle, borderColor: theme.colors.border }]}
          onPress={() => setPanicModalVisible(true)}
          activeOpacity={0.8}
        >
          <View style={[styles.safetyIconCircle, { backgroundColor: isDarkMode ? '#282315' : '#fef9e7' }]}>
            <Ionicons name="eye-outline" size={17} color="#f77f00" />
          </View>
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={[styles.safetyBtnTitle, { color: theme.colors.textPrimary }]}>Modo Discreción (Quick Exit)</Text>
            <Text style={[styles.safetyBtnSubtitle, { color: theme.colors.textMuted }]}>Oculta la app con una pantalla de notas neutra.</Text>
          </View>
          <Ionicons name="chevron-forward" size={16} color={theme.colors.textSecondary} />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.safetyMenuBtn, { backgroundColor: theme.colors.surfaceSubtle, borderColor: theme.colors.border }]}
          onPress={() => openLegalModal('terms')}
          activeOpacity={0.8}
        >
          <View style={[styles.safetyIconCircle, { backgroundColor: isDarkMode ? '#1e1b2e' : '#f0f3ff' }]}>
            <Ionicons name="document-text-outline" size={17} color="#6366f1" />
          </View>
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={[styles.safetyBtnTitle, { color: theme.colors.textPrimary }]}>Términos de Servicio (EULA)</Text>
            <Text style={[styles.safetyBtnSubtitle, { color: theme.colors.textMuted }]}>Condiciones de uso, elegibilidad +18 y normas.</Text>
          </View>
          <Ionicons name="chevron-forward" size={16} color={theme.colors.textSecondary} />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.safetyMenuBtn, { backgroundColor: theme.colors.surfaceSubtle, borderColor: theme.colors.border }]}
          onPress={() => openLegalModal('privacy')}
          activeOpacity={0.8}
        >
          <View style={[styles.safetyIconCircle, { backgroundColor: isDarkMode ? '#0d1f2d' : '#e6f7ff' }]}>
            <Ionicons name="lock-closed-outline" size={17} color="#00b4d8" />
          </View>
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={[styles.safetyBtnTitle, { color: theme.colors.textPrimary }]}>Política de Privacidad (RGPD)</Text>
            <Text style={[styles.safetyBtnSubtitle, { color: theme.colors.textMuted }]}>Cómo protegemos y tratamos tus datos personales.</Text>
          </View>
          <Ionicons name="chevron-forward" size={16} color={theme.colors.textSecondary} />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.safetyMenuBtn, { backgroundColor: theme.colors.surfaceSubtle, borderColor: theme.colors.border, marginBottom: 0 }]}
          onPress={() => openLegalModal('safety')}
          activeOpacity={0.8}
        >
          <View style={[styles.safetyIconCircle, { backgroundColor: isDarkMode ? '#241a0e' : '#fffbeb' }]}>
            <Ionicons name="heart-half-outline" size={17} color="#f59e0b" />
          </View>
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={[styles.safetyBtnTitle, { color: theme.colors.textPrimary }]}>Seguridad en Citas (IRL)</Text>
            <Text style={[styles.safetyBtnSubtitle, { color: theme.colors.textMuted }]}>Pautas esenciales para encuentros presenciales seguros.</Text>
          </View>
          <Ionicons name="chevron-forward" size={16} color={theme.colors.textSecondary} />
        </TouchableOpacity>
      </View>

      {/* Sección Sobre Mí */}
      <View style={dynamicStyles.card}>
        <Text style={dynamicStyles.sectionTitle}>Sobre mí</Text>
        <Text style={[styles.bioText, { color: theme.colors.textPrimary }]}>
          {user?.bio || 'Aún no has añadido una descripción sobre tus gustos o aficiones.'}
        </Text>
      </View>

      {/* Botones de Acción */}
      <TouchableOpacity
        style={[styles.logoutBtn, { backgroundColor: theme.colors.surface, borderColor: theme.colors.primaryDark }]}
        onPress={onLogout}
      >
        <Ionicons name="log-out-outline" size={18} color={theme.colors.primaryDark} style={{ marginRight: 8 }} />
        <Text style={[styles.logoutBtnText, { color: theme.colors.primaryDark }]}>Cerrar Sesión</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.deleteAccountBtn} onPress={handleDeleteAccount}>
        <Ionicons name="trash-outline" size={15} color="#d90429" style={{ marginRight: 6 }} />
        <Text style={styles.deleteAccountText}>Eliminar Cuenta</Text>
      </TouchableOpacity>


      {/* Modal para Editar Perfil */}
      <Modal
        visible={editModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setEditModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.editCard, { backgroundColor: theme.colors.surface }]}>
            <Text style={[styles.modalTitle, { color: theme.colors.textPrimary }]}>Editar Mi Perfil</Text>

            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Sección de Foto de Perfil */}
              <Text style={[styles.label, { color: theme.colors.textPrimary }]}>Foto de Perfil</Text>
              
              <View style={[styles.avatarSelectorCard, { backgroundColor: theme.colors.surfaceSubtle, borderColor: theme.colors.border }]}>
                <Image
                  source={getAvatarSource(avatarUrl)}
                  style={[styles.avatarPreviewBig, { borderColor: theme.colors.primary }]}
                />
                
                <View style={{ flex: 1, marginLeft: 14 }}>
                  <TouchableOpacity
                    style={[styles.pickGalleryBtn, { backgroundColor: theme.colors.primaryDark }]}
                    onPress={handlePickAvatarFromGallery}
                  >
                    <Ionicons name="images-outline" size={15} color="#ffffff" style={{ marginRight: 6 }} />
                    <Text style={styles.pickGalleryBtnText}>Elegir de Galería</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    style={[styles.resetAvatarBtn, { borderColor: theme.colors.border }]}
                    onPress={handleResetDefaultAvatar}
                  >
                    <Ionicons name="refresh-outline" size={13} color={theme.colors.textMuted} style={{ marginRight: 4 }} />
                    <Text style={[styles.resetAvatarBtnText, { color: theme.colors.textSecondary }]}>Foto por defecto</Text>
                  </TouchableOpacity>
                </View>
              </View>

              <Text style={[styles.label, { color: theme.colors.textPrimary }]}>Nombre</Text>
              <TextInput
                style={[styles.input, { backgroundColor: theme.colors.surfaceSubtle, borderColor: theme.colors.border, color: theme.colors.textPrimary }]}
                value={name}
                onChangeText={setName}
                placeholder="Tu nombre"
                placeholderTextColor={theme.colors.textMuted}
              />

              <Text style={[styles.label, { color: theme.colors.textPrimary }]}>Edad</Text>
              <TextInput
                style={[styles.input, { backgroundColor: theme.colors.surfaceSubtle, borderColor: theme.colors.border, color: theme.colors.textPrimary }]}
                value={age}
                onChangeText={setAge}
                keyboardType="numeric"
                placeholder="Tu edad"
                placeholderTextColor={theme.colors.textMuted}
              />

              {/* Selector de Pronombres */}
              <Text style={[styles.label, { color: theme.colors.textPrimary }]}>Pronombres</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.choiceRow}>
                {PRONOUN_CHOICES.map((p, idx) => (
                  <TouchableOpacity
                    key={idx}
                    style={[
                      styles.choiceChip,
                      { backgroundColor: theme.colors.surfaceSubtle, borderColor: theme.colors.border },
                      pronouns === p && { backgroundColor: theme.colors.primaryDark, borderColor: theme.colors.primaryDark }
                    ]}
                    onPress={() => setPronouns(p)}
                  >
                    <Text
                      style={[
                        styles.choiceChipText,
                        { color: theme.colors.textSecondary },
                        pronouns === p && { color: '#ffffff', fontWeight: 'bold' }
                      ]}
                    >
                      {p}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              {/* Selector de Intención */}
              <Text style={[styles.label, { color: theme.colors.textPrimary }]}>¿Qué estás buscando?</Text>
              <View style={styles.intentionChoicesContainer}>
                {INTENTION_CHOICES.map((item) => (
                  <TouchableOpacity
                    key={item.id}
                    style={[
                      styles.intentionSelectBtn,
                      { backgroundColor: theme.colors.surfaceSubtle, borderColor: theme.colors.border },
                      intention === item.id && { backgroundColor: isDarkMode ? '#3d0c1e' : '#ffccd5', borderColor: theme.colors.primaryDark }
                    ]}
                    onPress={() => setIntention(item.id)}
                  >
                    <Ionicons
                      name={item.icon}
                      size={13}
                      color={intention === item.id ? theme.colors.primary : theme.colors.textSecondary}
                      style={{ marginRight: 5 }}
                    />
                    <Text
                      style={[
                        styles.intentionSelectText,
                        { color: theme.colors.textSecondary },
                        intention === item.id && { color: theme.colors.primary, fontWeight: 'bold' }
                      ]}
                    >
                      {item.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Selector de Etiquetas */}
              <Text style={[styles.label, { color: theme.colors.textPrimary }]}>Etiquetas e Intereses (hasta 6)</Text>
              <View style={styles.tagsContainer}>
                {AVAILABLE_TAGS.map((tag, idx) => {
                  const isSelected = selectedTags.includes(tag);
                  return (
                    <TouchableOpacity
                      key={idx}
                      style={[
                        styles.selectableTagChip,
                        { backgroundColor: theme.colors.surfaceSubtle, borderColor: theme.colors.border },
                        isSelected && { backgroundColor: theme.colors.primaryDark, borderColor: theme.colors.primaryDark }
                      ]}
                      onPress={() => toggleTag(tag)}
                    >
                      <Text
                        style={[
                          styles.selectableTagText,
                          { color: theme.colors.textSecondary },
                          isSelected && { color: '#ffffff', fontWeight: 'bold' }
                        ]}
                      >
                        {tag}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Selector de Obsesión Musical */}
              <Text style={[styles.label, { color: theme.colors.textPrimary }]}>Mi Obsesión Musical (Spotify)</Text>
              <TouchableOpacity
                style={[styles.anthemSelectorRow, { backgroundColor: theme.colors.surfaceSubtle, borderColor: theme.colors.border }]}
                onPress={() => setAnthemModalVisible(true)}
              >
                {selectedAnthem?.coverUrl ? (
                  <Image source={{ uri: selectedAnthem.coverUrl }} style={styles.anthemSmallCover} />
                ) : (
                  <View style={[styles.anthemSmallCover, { backgroundColor: '#1db95420', alignItems: 'center', justifyContent: 'center' }]}>
                    <Ionicons name="musical-notes" size={16} color="#1db954" />
                  </View>
                )}
                <View style={{ flex: 1, marginLeft: 10 }}>
                  <Text style={[styles.anthemTitle, { color: theme.colors.textPrimary }]} numberOfLines={1}>
                    {selectedAnthem?.title || 'Sin canción seleccionada'}
                  </Text>
                  <Text style={[styles.anthemArtist, { color: theme.colors.textSecondary }]} numberOfLines={1}>
                    {selectedAnthem?.artist || (isSpotifyLinked ? 'Toca para buscar en Spotify' : 'Conecta Spotify primero')}
                  </Text>
                </View>
                <Ionicons name="search" size={18} color="#1db954" />
              </TouchableOpacity>

              <Text style={[styles.label, { color: theme.colors.textPrimary }]}>Biografía</Text>
              <TextInput
                style={[
                  styles.input,
                  styles.textArea,
                  { backgroundColor: theme.colors.surfaceSubtle, borderColor: theme.colors.border, color: theme.colors.textPrimary }
                ]}
                value={bio}
                onChangeText={setBio}
                multiline
                numberOfLines={3}
                placeholder="Cuéntanos tus gustos, aficiones o qué buscas..."
                placeholderTextColor={theme.colors.textMuted}
              />

              <TouchableOpacity
                style={[styles.saveBtn, { backgroundColor: theme.colors.primaryDark }]}
                onPress={handleSaveProfile}
                disabled={saving}
              >
                {saving ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.saveBtnText}>Guardar Cambios</Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.cancelEditBtn}
                onPress={() => setEditModalVisible(false)}
              >
                <Text style={[styles.cancelEditText, { color: theme.colors.textMuted }]}>Cancelar</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Modal de Buscador de Obsesión Musical con Spotify Web API */}
      <Modal
        visible={anthemModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setAnthemModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.anthemModalCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
            <View style={styles.verifyHeaderRow}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <View style={{ width: 22, height: 22, borderRadius: 11, backgroundColor: '#1db954', alignItems: 'center', justifyContent: 'center', marginRight: 8 }}>
                  <Ionicons name="musical-notes" size={12} color="#000" />
                </View>
                <Text style={[styles.verifyTitle, { color: theme.colors.textPrimary }]}>
                  Elige tu Obsesión Musical
                </Text>
              </View>
              <TouchableOpacity onPress={() => setAnthemModalVisible(false)}>
                <Ionicons name="close" size={20} color={theme.colors.textMuted} />
              </TouchableOpacity>
            </View>

            {!isSpotifyLinked ? (
              /* Si Spotify NO está conectado, requerir conexión primero */
              <View style={{ alignItems: 'center', paddingVertical: 24, paddingHorizontal: 12 }}>
                <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: '#1db95418', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
                  <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: '#1db954', alignItems: 'center', justifyContent: 'center' }}>
                    <Ionicons name="musical-notes" size={24} color="#000" />
                  </View>
                </View>
                <Text style={{ fontSize: 18, fontWeight: 'bold', color: theme.colors.textPrimary, marginBottom: 8, textAlign: 'center' }}>
                  Conecta tu Spotify primero
                </Text>
                <Text style={{ fontSize: 13, color: theme.colors.textSecondary, textAlign: 'center', lineHeight: 19, marginBottom: 22 }}>
                  Para buscar canciones y añadir tu obsesión musical directamente desde Spotify, primero necesitas enlazar tu cuenta.
                </Text>
                <TouchableOpacity
                  style={{
                    backgroundColor: '#1db954',
                    paddingVertical: 14,
                    paddingHorizontal: 24,
                    borderRadius: 25,
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '100%',
                    marginBottom: 12,
                    shadowColor: '#1db954',
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.3,
                    shadowRadius: 8,
                    elevation: 4
                  }}
                  onPress={() => {
                    setAnthemModalVisible(false);
                    setTimeout(() => {
                      handleConnectSpotify();
                    }, 300);
                  }}
                  disabled={spotifyLoading}
                >
                  <View style={{ width: 20, height: 20, borderRadius: 10, backgroundColor: '#000', alignItems: 'center', justifyContent: 'center', marginRight: 8 }}>
                    <Ionicons name="musical-notes" size={11} color="#1db954" />
                  </View>
                  <Text style={{ color: '#ffffff', fontWeight: 'bold', fontSize: 15 }}>
                    Conectar con Spotify
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setAnthemModalVisible(false)} style={{ paddingVertical: 6 }}>
                  <Text style={{ color: theme.colors.textMuted, fontSize: 13 }}>Cancelar</Text>
                </TouchableOpacity>
              </View>
            ) : (
              /* Si Spotify SÍ está conectado, mostrar el buscador en vivo */
              <>
                {/* Input de Búsqueda en Vivo */}
                <View style={[styles.spotifySearchInputBox, { backgroundColor: theme.colors.surfaceSubtle, borderColor: '#1db954' }]}>
                  <Ionicons name="search" size={18} color="#1db954" style={{ marginRight: 8 }} />
                  <TextInput
                    style={[styles.spotifySearchInput, { color: theme.colors.textPrimary }]}
                    placeholder="Buscar canción o artista en Spotify..."
                    placeholderTextColor={theme.colors.textMuted}
                    value={spotifySearchQuery}
                    onChangeText={setSpotifySearchQuery}
                    autoFocus
                  />
                  {searchingSpotify && <ActivityIndicator size="small" color="#1db954" />}
                </View>

                <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 380 }}>
                  {/* Resultados de Búsqueda de Spotify API */}
                  {renderSpotifySearchResults()}
                </ScrollView>
              </>
            )}
          </View>
        </View>
      </Modal>

      {/* ================= MODAL DE VERIFICACIÓN BIOMÉTRICA REAL ================= */}
      <Modal
        visible={verifyModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setVerifyModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.bioModalCard,
              {
                backgroundColor: theme.colors.surface,
                borderColor: theme.colors.border
              }
            ]}
          >
            {/* Cabecera del Modal */}
            <View style={styles.bioModalHeader}>
              <View style={styles.bioModalTitleGroup}>
                <View
                  style={[
                    styles.bioIconBadge,
                    { backgroundColor: isDarkMode ? '#002538' : '#e0f2fe' }
                  ]}
                >
                  <Ionicons name="shield-checkmark" size={18} color="#0077b6" />
                </View>
                <Text style={[styles.bioModalTitle, { color: theme.colors.textPrimary }]}>
                  Verificación de Identidad
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setVerifyModalVisible(false)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons name="close" size={22} color={theme.colors.textMuted} />
              </TouchableOpacity>
            </View>

            {/* Cuerpo del Modal Biométrico según Estado */}
            {renderBiometricModalBody()}
          </View>
        </View>
      </Modal>
      {/* Modales de Seguridad y Moderación */}
      <BlockedUsersModal
        visible={blockedModalVisible}
        onClose={() => setBlockedModalVisible(false)}
      />

      <CommunityGuidelinesModal
        visible={guidelinesModalVisible}
        onClose={() => setGuidelinesModalVisible(false)}
      />

      <PanicDisguiseModal
        visible={panicModalVisible}
        onClose={() => setPanicModalVisible(false)}
      />

      <LegalTermsModal
        visible={legalModalVisible}
        initialTab={legalModalTab}
        onClose={() => setLegalModalVisible(false)}
      />

      <AdminModerationScreen
        visible={adminModalVisible}
        onClose={() => setAdminModalVisible(false)}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    padding: 16,
    paddingBottom: 40
  },
  safetyMenuBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 10
  },
  adminPillBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8
  },
  adminPillBadgeText: {
    fontSize: 10,
    fontWeight: 'bold'
  },
  openAdminDashboardBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 16,
    shadowColor: '#ff2a6d',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 5,
    elevation: 3
  },
  openAdminDashboardBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: 'bold'
  },
  safetyIconCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center'
  },
  safetyBtnTitle: {
    fontSize: 13.5,
    fontWeight: 'bold'
  },
  safetyBtnSubtitle: {
    fontSize: 11,
    marginTop: 2
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 12
  },
  profileAvatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3
  },
  editBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#ffffff'
  },
  profileNameRow: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  verifiedHeaderBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0077b618',
    borderColor: '#0077b655',
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    marginLeft: 8
  },
  verifiedHeaderText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0077b6',
    marginLeft: 3
  },
  pronounBadge: {
    fontSize: 12,
    fontWeight: 'bold',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 10,
    marginTop: 4
  },
  adminRoleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 6
  },
  profileEmail: {
    fontSize: 13,
    marginTop: 4,
    marginBottom: 14
  },
  headerButtonsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8
  },
  editProfileBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1
  },
  editProfileBtnText: {
    fontWeight: 'bold',
    fontSize: 13
  },
  verifiedBadgeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1.5
  },
  verifiedBadgeBtnText: {
    color: '#0077b6',
    fontWeight: '700',
    fontSize: 13
  },
  verifyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1
  },
  verifyBtnText: {
    color: '#0077b6',
    fontWeight: 'bold',
    fontSize: 13
  },
  spotifyConnectPrompt: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center'
  },
  spotifyPromptTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    marginBottom: 4
  },
  spotifyPromptSub: {
    fontSize: 12,
    textAlign: 'center',
    marginBottom: 12,
    lineHeight: 16
  },
  spotifyConnectBtn: {
    backgroundColor: '#1db954',
    paddingVertical: 11,
    paddingHorizontal: 20,
    borderRadius: 25,
    shadowColor: '#1db954',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.35,
    shadowRadius: 4,
    elevation: 3
  },
  spotifyConnectBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: 'bold'
  },
  spotifyLinkedHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12
  },
  spotifyDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#1db954',
    marginRight: 6
  },
  spotifyUserText: {
    fontSize: 13
  },
  spotifyTag: {
    backgroundColor: '#d8f3dc',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10
  },
  spotifyTagText: {
    color: '#1b4332',
    fontSize: 11,
    fontWeight: 'bold'
  },
  spotifySubheader: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5
  },
  artistScroll: {
    flexDirection: 'row',
    marginTop: 2
  },
  artistItem: {
    alignItems: 'center',
    marginRight: 14,
    width: 70
  },
  artistImage: {
    width: 58,
    height: 58,
    borderRadius: 29,
    marginBottom: 6,
    borderWidth: 1.5,
    borderColor: '#1db954'
  },
  artistName: {
    fontSize: 11,
    fontWeight: 'bold',
    textAlign: 'center'
  },
  artistGenre: {
    fontSize: 9,
    textAlign: 'center',
    marginTop: 1
  },
  anthemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 16,
    borderWidth: 1
  },
  anthemCover: {
    width: 52,
    height: 52,
    borderRadius: 10
  },
  anthemInfo: {
    flex: 1,
    marginLeft: 12
  },
  anthemTitle: {
    fontSize: 14,
    fontWeight: 'bold'
  },
  anthemArtist: {
    fontSize: 12,
    marginTop: 2
  },
  playBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8
  },
  anthemSelectorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 12
  },
  anthemSmallCover: {
    width: 40,
    height: 40,
    borderRadius: 8
  },
  anthemModalCard: {
    borderRadius: 24,
    padding: 22,
    maxHeight: '85%',
    borderWidth: 1
  },
  spotifySearchInputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 14,
    marginTop: 4
  },
  spotifySearchInput: {
    flex: 1,
    fontSize: 14,
    paddingVertical: 2
  },
  searchResultsHeader: {
    fontSize: 11,
    fontWeight: 'bold',
    letterSpacing: 0.5,
    marginBottom: 8,
    marginTop: 4
  },
  anthemChoiceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 8
  },
  anthemChoiceCover: {
    width: 48,
    height: 48,
    borderRadius: 10
  },
  selectGreenPill: {
    backgroundColor: '#1db954',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14
  },
  selectGreenPillText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold'
  },
  intentionPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 14,
    borderWidth: 1
  },
  intentionPillText: {
    fontSize: 14,
    fontWeight: 'bold'
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 4
  },
  switchTitle: {
    fontSize: 14,
    fontWeight: 'bold'
  },
  switchSubtitle: {
    fontSize: 12,
    marginTop: 2
  },
  bioText: {
    fontSize: 14,
    lineHeight: 20
  },
  logoutBtn: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 14,
    borderRadius: 25,
    marginTop: 8,
    borderWidth: 1.5
  },
  logoutBtnText: {
    fontSize: 15,
    fontWeight: 'bold'
  },
  deleteAccountBtn: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 12,
    marginTop: 10
  },
  deleteAccountText: {
    color: '#d90429',
    fontSize: 13,
    fontWeight: '600'
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'center',
    padding: 20
  },
  editCard: {
    borderRadius: 24,
    padding: 24,
    maxHeight: '90%'
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center'
  },
  label: {
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 6,
    marginTop: 12
  },
  choiceRow: {
    flexDirection: 'row',
    marginBottom: 8
  },
  choiceChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    marginRight: 8
  },
  choiceChipText: {
    fontSize: 12
  },
  intentionChoicesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 4
  },
  intentionSelectBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 14,
    borderWidth: 1,
    marginRight: 8,
    marginBottom: 8
  },
  intentionSelectText: {
    fontSize: 12
  },
  selectableTagChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 14,
    borderWidth: 1,
    marginRight: 6,
    marginBottom: 6
  },
  selectableTagText: {
    fontSize: 11
  },
  input: {
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 15,
    paddingVertical: 10,
    fontSize: 15,
    marginBottom: 8
  },
  textArea: {
    height: 75,
    textAlignVertical: 'top'
  },
  avatarSelectorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 18,
    borderWidth: 1,
    marginBottom: 12
  },
  avatarPreviewBig: {
    width: 70,
    height: 70,
    borderRadius: 35,
    borderWidth: 2.5
  },
  pickGalleryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 9,
    paddingHorizontal: 12,
    borderRadius: 20,
    marginBottom: 6
  },
  pickGalleryBtnText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 12
  },
  resetAvatarBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 7,
    paddingHorizontal: 10,
    borderRadius: 20,
    borderWidth: 1
  },
  resetAvatarBtnText: {
    fontSize: 11,
    fontWeight: '600'
  },
  saveBtn: {
    paddingVertical: 14,
    borderRadius: 25,
    alignItems: 'center',
    marginTop: 18
  },
  saveBtnText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold'
  },
  cancelEditBtn: {
    alignItems: 'center',
    marginTop: 12,
    paddingVertical: 8
  },
  cancelEditText: {
    fontSize: 14,
    fontWeight: '600'
  },
  // Estilos de Verificación Biométrica Real (Apple / Android Native)
  bioModalCard: {
    borderRadius: 28,
    padding: 22,
    borderWidth: 1,
    width: '94%',
    maxWidth: 420,
    alignItems: 'center'
  },
  bioModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    marginBottom: 16
  },
  bioModalTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  bioIconBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10
  },
  bioModalTitle: {
    fontSize: 17,
    fontWeight: 'bold'
  },
  bioContentContainer: {
    width: '100%',
    alignItems: 'center'
  },
  bioHeroSub: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 18,
    paddingHorizontal: 8
  },
  bioRadarWrapper: {
    width: 130,
    height: 130,
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 12,
    position: 'relative'
  },
  bioRadarPulse: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 2,
    opacity: 0.45
  },
  bioRadarCore: {
    width: 86,
    height: 86,
    borderRadius: 43,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center'
  },
  bioScannerLabel: {
    fontSize: 14,
    fontWeight: '700',
    marginTop: 4,
    marginBottom: 16
  },
  bioPerksBox: {
    width: '100%',
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    marginBottom: 18
  },
  bioPerkRow: {
    flexDirection: 'row',
    alignItems: 'flex-start'
  },
  bioPerkTitle: {
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 2
  },
  bioPerkDesc: {
    fontSize: 11,
    lineHeight: 15
  },
  bioPerkDivider: {
    height: 1,
    width: '100%',
    marginVertical: 10
  },
  bioPrimaryBtn: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 25,
    width: '100%'
  },
  bioPrimaryBtnText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: 'bold'
  },
  bioFootnote: {
    fontSize: 11,
    textAlign: 'center',
    marginTop: 12,
    lineHeight: 15,
    paddingHorizontal: 12
  },
  bioSuccessRingContainer: {
    marginVertical: 14,
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center'
  },
  bioCertGlow: {
    width: 84,
    height: 84,
    borderRadius: 42,
    justifyContent: 'center',
    alignItems: 'center'
  },
  bioCertMiniBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    backgroundColor: '#0077b6',
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#ffffff'
  },
  bioSuccessTitle: {
    fontSize: 19,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8
  },
  bioSuccessSub: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 16,
    paddingHorizontal: 10
  },
  bioCertCard: {
    width: '100%',
    borderRadius: 18,
    borderWidth: 1.5,
    padding: 14,
    marginBottom: 14
  },
  bioCertRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6
  },
  bioCertLabel: {
    fontSize: 13,
    fontWeight: '600'
  },
  bioCertValue: {
    fontSize: 13
  },
  bioCertDivider: {
    height: 1,
    width: '100%'
  },
  bioReverifyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 18,
    borderWidth: 1,
    width: '100%'
  },
  bioReverifyText: {
    fontSize: 13,
    fontWeight: '600'
  },
  bioVerifiedPillBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 20,
    width: '100%',
    marginBottom: 8
  },
  bioVerifiedPillText: {
    fontSize: 14,
    fontWeight: '700'
  },
  bioAlertBox: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    width: '100%',
    marginBottom: 10
  },
  bioAlertText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 16
  },

  // Estilos de la Pestaña Oficial Spotify OAuth
  spotifyOAuthContainer: {
    flex: 1,
    backgroundColor: '#121212'
  },
  spotifyBrowserHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#181818',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#282828'
  },
  browserCloseBtn: {
    padding: 4
  },
  browserUrlBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#282828',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16
  },
  browserUrlText: {
    color: '#e5e5e5',
    fontSize: 11,
    fontWeight: '500'
  },
  spotifyOAuthContent: {
    padding: 24,
    alignItems: 'center'
  },
  spotifyLogoRow: {
    marginTop: 15,
    marginBottom: 20
  },
  spotifyLogoCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: '#1db954',
    justifyContent: 'center',
    alignItems: 'center'
  },
  spotifyOAuthHeading: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 28
  },
  spotifyUserBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1e1e1e',
    padding: 14,
    borderRadius: 14,
    width: '100%',
    marginBottom: 22,
    borderWidth: 1,
    borderColor: '#282828'
  },
  spotifyUserAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    marginRight: 12
  },
  spotifyUserLabel: {
    fontSize: 11,
    color: '#b3b3b3',
    fontWeight: '500'
  },
  spotifyAccountName: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#ffffff',
    marginTop: 2
  },
  spotifyScopesTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#b3b3b3',
    letterSpacing: 0.8,
    alignSelf: 'flex-start',
    marginBottom: 14
  },
  spotifyScopeItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    width: '100%',
    marginBottom: 14
  },
  spotifyScopeText: {
    flex: 1,
    fontSize: 13,
    color: '#b3b3b3',
    lineHeight: 18
  },
  spotifyAuthorizeBtn: {
    backgroundColor: '#1db954',
    width: '100%',
    paddingVertical: 14,
    borderRadius: 25,
    alignItems: 'center',
    marginTop: 20
  },
  spotifyAuthorizeBtnText: {
    color: '#121212',
    fontSize: 14,
    fontWeight: 'bold',
    letterSpacing: 1
  },
  spotifyCancelBtn: {
    width: '100%',
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 6
  },
  spotifyCancelBtnText: {
    color: '#b3b3b3',
    fontSize: 13,
    fontWeight: 'bold',
    letterSpacing: 0.5
  },
  spotifyOAuthFooter: {
    fontSize: 11,
    color: '#727272',
    textAlign: 'center',
    lineHeight: 16,
    marginTop: 15
  }
});
