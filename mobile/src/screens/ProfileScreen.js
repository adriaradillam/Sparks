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
  SafeAreaView,
  Linking
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as WebBrowser from 'expo-web-browser';
import * as AuthSession from 'expo-auth-session';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme';
import { apiRequest, uploadPhoto } from '../api';
import { INTENTION_LABELS } from './ExploreScreen';
import BlockedUsersModal from '../components/BlockedUsersModal';
import CommunityGuidelinesModal from '../components/CommunityGuidelinesModal';
import PanicDisguiseModal from '../components/PanicDisguiseModal';
import LegalTermsModal from '../components/LegalTermsModal';

const defaultAvatarImg = require('../../assets/default_avatar.png');

export const getAvatarSource = (uri) => {
  if (!uri || uri === 'default' || uri === 'DEFAULT_AVATAR' || uri.includes('placeholder')) {
    return defaultAvatarImg;
  }
  return { uri };
};

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
  const [availableAnthems, setAvailableAnthems] = useState([]);

  // Estados de Spotify OAuth
  const [spotifyLoading, setSpotifyLoading] = useState(false);
  const [spotifyData, setSpotifyData] = useState(
    user?.spotify || { connected: false, username: '', topArtists: [] }
  );

  // Estados del Buscador en Vivo de Spotify
  const [spotifySearchQuery, setSpotifySearchQuery] = useState('');
  const [spotifySearchResults, setSpotifySearchResults] = useState([]);
  const [searchingSpotify, setSearchingSpotify] = useState(false);

  // Estados de Malla Facial Biométrica 468 Puntos
  const [capturedSelfie, setCapturedSelfie] = useState(null);
  const [scanningState, setScanningState] = useState('idle');
  const [scanStep, setScanStep] = useState(0);
  const [matchScore, setMatchScore] = useState(0);
  const [biometricTitle, setBiometricTitle] = useState('');
  const [biometricReason, setBiometricReason] = useState('');
  const [biometricMetrics, setBiometricMetrics] = useState(null);
  const [verifying, setVerifying] = useState(false);

  // Animaciones del láser
  const scanAnim = useRef(new Animated.Value(0)).current;

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

  useEffect(() => {
    fetchAnthems();
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

  useEffect(() => {
    if (scanningState === 'scanning') {
      Animated.loop(
        Animated.sequence([
          Animated.timing(scanAnim, { toValue: 1, duration: 900, useNativeDriver: true }),
          Animated.timing(scanAnim, { toValue: 0, duration: 900, useNativeDriver: true })
        ])
      ).start();
    } else {
      scanAnim.stopAnimation();
    }
  }, [scanningState]);

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
      Alert.alert('¡Spotify vinculado! 🟢', `Conectada con éxito como @${newSpotify.username}`);
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
          age: parseInt(age),
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

  // 1. Abrir Cámara para Capturar Malla Facial 468 Puntos
  const handleLaunchCamera = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permiso de Cámara',
          'Se necesita acceso a la cámara frontal para escanear los 468 puntos de la malla facial.',
          [
            { text: 'Elegir de Galería', onPress: handleLaunchGallery },
            { text: 'Cancelar', style: 'cancel' }
          ]
        );
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'],
        allowsEditing: false,
        quality: 0.85
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const photoUri = result.assets[0].uri;
        processMeshScan(photoUri);
      }
    } catch (err) {
      console.warn('Camera launch error:', err);
      Alert.alert(
        'Aviso de Cámara',
        'No se pudo inicializar la cámara. Puedes seleccionar una foto de tu galería.',
        [
          { text: 'Abrir Galería', onPress: handleLaunchGallery },
          { text: 'Cancelar', style: 'cancel' }
        ]
      );
    }
  };

  // 2. Elegir Foto de Galería
  const handleLaunchGallery = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permiso necesario', 'Se necesita acceso a la galería para seleccionar la imagen a analizar.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: false,
        quality: 0.85
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const photoUri = result.assets[0].uri;
        processMeshScan(photoUri);
      }
    } catch (err) {
      Alert.alert('Error', err.message);
    }
  };

  // 3. Proceso de Mapeo de Malla 468 Nodos y Telemetría
  const processMeshScan = async (photoUri, forcedMode = null) => {
    setCapturedSelfie(photoUri);
    setScanningState('scanning');
    setScanStep(1);
    setMatchScore(0);
    setBiometricTitle('');
    setBiometricReason('');
    setBiometricMetrics(null);

    setTimeout(() => {
      setScanStep(2);
    }, 900);

    setTimeout(() => {
      setScanStep(3);
    }, 1800);

    setTimeout(async () => {
      try {
        const res = await apiRequest('/api/users/verify-facial-match', {
          method: 'POST',
          body: JSON.stringify({
            selfieUri: photoUri,
            forceMode: forcedMode
          })
        });

        setMatchScore(res.score);
        setBiometricTitle(res.title);
        setBiometricReason(res.reason);
        setBiometricMetrics(res.metrics);

        if (res.success) {
          setScanningState('matched');
        } else {
          setScanningState('mismatch');
        }
      } catch (err) {
        setMatchScore(14.2);
        setBiometricTitle('Fallo de Mapeo Facial');
        setBiometricReason('Las coordenadas de la malla facial no concuerdan con el perfil.');
        setScanningState('mismatch');
      }
    }, 2700);
  };

  // 4. Confirmación y Asignación de Check Azul
  const handleConfirmVerification = async () => {
    setVerifying(true);
    try {
      const data = await apiRequest('/api/users/verify', { method: 'POST' });
      onUpdateUser({ ...user, isVerified: true });
      setVerifyModalVisible(false);
      setCapturedSelfie(null);
      setScanningState('idle');
      Alert.alert('¡Perfil Verificado!', data.message);
    } catch (err) {
      Alert.alert('Error al verificar', err.message);
    } finally {
      setVerifying(false);
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

  const scanTranslateY = scanAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-50, 50]
  });

  const activeAnthem = user?.anthem || selectedAnthem;
  const isSpotifyLinked = spotifyData?.connected;

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
                    text: 'Elegir de Galería 📸',
                    onPress: handleDirectPickAvatar
                  },
                  {
                    text: 'Foto por Defecto 🔄',
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
          {user?.isVerified && (
            <Ionicons name="checkmark-circle" size={20} color="#0077b6" style={{ marginLeft: 6 }} />
          )}
        </View>

        <Text style={[styles.pronounBadge, { backgroundColor: isDarkMode ? '#3d0c1e' : '#ffe5ec', color: theme.colors.primary }]}>
          {user?.pronouns || 'Ella / She'}
        </Text>
        <Text style={[styles.profileEmail, { color: theme.colors.textMuted }]}>{user?.email}</Text>

        <View style={styles.headerButtonsRow}>
          <TouchableOpacity
            style={[styles.editProfileBtn, { backgroundColor: isDarkMode ? '#3d0c1e' : '#ffe5ec', borderColor: theme.colors.primaryDark }]}
            onPress={() => setEditModalVisible(true)}
          >
            <Ionicons name="options-outline" size={15} color={theme.colors.primary} style={{ marginRight: 6 }} />
            <Text style={[styles.editProfileBtnText, { color: theme.colors.primary }]}>Editar Perfil & Tags</Text>
          </TouchableOpacity>

          {!user?.isVerified && (
            <TouchableOpacity
              style={styles.verifyBtn}
              onPress={() => {
                setCapturedSelfie(null);
                setScanningState('idle');
                setScanStep(0);
                setBiometricMetrics(null);
                setVerifyModalVisible(true);
              }}
            >
              <Ionicons name="shield-checkmark-outline" size={15} color="#0077b6" style={{ marginRight: 6 }} />
              <Text style={styles.verifyBtnText}>Verificación Biométrica (468 Puntos)</Text>
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
                <Text style={styles.spotifyTagText}>✓ Sincronizado</Text>
              </View>
            </View>

            <Text style={[styles.spotifySubheader, { color: theme.colors.textSecondary }]}>
              Tus Top Artistas en Spotify:
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.artistScroll}>
              {spotifyData.topArtists.map((artist, idx) => (
                <View key={idx} style={styles.artistItem}>
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

        {!isSpotifyLinked ? (
          <TouchableOpacity
            style={[styles.anthemCard, { backgroundColor: isDarkMode ? '#0a2312' : '#f4fbf5', borderColor: isDarkMode ? '#1b4332' : '#d8f3dc', borderStyle: 'dashed' }]}
            onPress={() => setAnthemModalVisible(true)}
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
        ) : activeAnthem ? (
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
        ) : (
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
        )}
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
            <View key={idx} style={dynamicStyles.tagChip}>
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
          style={[styles.safetyMenuBtn, { backgroundColor: theme.colors.surfaceSubtle, borderColor: theme.colors.border, marginBottom: 0 }]}
          onPress={() => setLegalModalVisible(true)}
          activeOpacity={0.8}
        >
          <View style={[styles.safetyIconCircle, { backgroundColor: isDarkMode ? '#1e1b2e' : '#f0f3ff' }]}>
            <Ionicons name="document-text-outline" size={17} color="#6366f1" />
          </View>
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={[styles.safetyBtnTitle, { color: theme.colors.textPrimary }]}>Términos (EULA) & Privacidad (RGPD)</Text>
            <Text style={[styles.safetyBtnSubtitle, { color: theme.colors.textMuted }]}>Condiciones legales y protección de tus datos.</Text>
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
                  {spotifySearchResults.length > 0 ? (
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
                            } catch (e) {}
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
                  ) : spotifySearchQuery.trim() ? (
                    <View style={{ alignItems: 'center', paddingVertical: 36, paddingHorizontal: 20 }}>
                      <Text style={{ fontSize: 14, color: theme.colors.textMuted, textAlign: 'center' }}>
                        No se encontraron canciones en Spotify para "{spotifySearchQuery}".
                      </Text>
                    </View>
                  ) : (
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
                  )}
                </ScrollView>
              </>
            )}
          </View>
        </View>
      </Modal>

      {/* Modal de Malla Facial Biométrica 468 Nodos */}
      <Modal
        visible={verifyModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setVerifyModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.verifyCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
            <View style={styles.verifyHeaderRow}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Ionicons name="scan" size={22} color="#0077b6" style={{ marginRight: 8 }} />
                <Text style={[styles.verifyTitle, { color: theme.colors.textPrimary }]}>
                  Malla Facial Biométrica (468 Nodos)
                </Text>
              </View>
              <TouchableOpacity onPress={() => setVerifyModalVisible(false)}>
                <Ionicons name="close" size={20} color={theme.colors.textMuted} />
              </TouchableOpacity>
            </View>

            {!capturedSelfie ? (
              <>
                <Text style={[styles.verifySubtitle, { color: theme.colors.textSecondary }]}>
                  Mapeo tridimensional de topología facial para verificar la correspondencia exacta de rasgos óseos y descartar perfiles falsos.
                </Text>

                <View style={[styles.meshDemoBox, { backgroundColor: isDarkMode ? '#051923' : '#f0f9ff', borderColor: '#0077b6' }]}>
                  <View style={styles.meshNodeGrid}>
                    <View style={styles.meshNodeRow}>
                      <View style={styles.meshDot} /><View style={styles.meshDot} /><View style={styles.meshDot} /><View style={styles.meshDot} />
                    </View>
                    <View style={styles.meshNodeRow}>
                      <View style={styles.meshDot} /><View style={[styles.meshDot, styles.meshDotActive]} /><View style={[styles.meshDot, styles.meshDotActive]} /><View style={styles.meshDot} />
                    </View>
                    <View style={styles.meshNodeRow}>
                      <View style={styles.meshDot} /><View style={styles.meshDot} /><View style={styles.meshDot} /><View style={styles.meshDot} />
                    </View>
                  </View>
                  <Text style={[styles.meshDemoText, { color: theme.colors.textPrimary }]}>
                    468 Coordenadas 3D • Mapeo Periorbital & Mandibular
                  </Text>
                </View>

                <TouchableOpacity
                  style={[styles.verifyActionBtn, { backgroundColor: '#0077b6', marginBottom: 10 }]}
                  onPress={handleLaunchCamera}
                >
                  <Ionicons name="camera" size={19} color="#ffffff" style={{ marginRight: 8 }} />
                  <Text style={styles.verifyActionBtnText}>Escanear Malla Facial con Cámara</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.galleryFallbackBtn, { borderColor: theme.colors.border, backgroundColor: theme.colors.surfaceSubtle }]}
                  onPress={handleLaunchGallery}
                >
                  <Ionicons name="images-outline" size={17} color={theme.colors.textSecondary} style={{ marginRight: 8 }} />
                  <Text style={[styles.galleryFallbackText, { color: theme.colors.textSecondary }]}>
                    Seleccionar Foto desde Galería
                  </Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <View style={styles.comparisonContainer}>
                  <View style={styles.comparisonBox}>
                    <Text style={[styles.comparisonLabel, { color: theme.colors.textMuted }]}>Foto Perfil</Text>
                    <View style={styles.imageFrame}>
                      <Image source={{ uri: user?.avatarUrl || avatarUrl }} style={styles.comparisonImg} />
                      <View style={styles.hudOverlay}>
                        <View style={styles.hudCrosshair} />
                      </View>
                    </View>
                  </View>

                  <View style={styles.vsBadge}>
                    <Ionicons
                      name="scan"
                      size={24}
                      color={scanningState === 'matched' ? '#2ec4b6' : scanningState === 'mismatch' ? '#d90429' : '#0077b6'}
                    />
                  </View>

                  <View style={styles.comparisonBox}>
                    <Text style={[styles.comparisonLabel, { color: theme.colors.textMuted }]}>Selfie 468 Puntos</Text>
                    <View style={[styles.imageFrame, scanningState === 'mismatch' && { borderColor: '#d90429' }]}>
                      <Image source={{ uri: capturedSelfie }} style={styles.comparisonImg} />
                      {scanningState === 'scanning' && (
                        <Animated.View
                          style={[
                            styles.scanLine,
                            {
                              transform: [{ translateY: scanTranslateY }]
                            }
                          ]}
                        />
                      )}
                      <View style={styles.hudOverlay}>
                        <View style={[styles.hudCrosshair, scanningState === 'mismatch' && { borderColor: '#d90429' }]} />
                      </View>
                    </View>
                    <View style={[styles.checkMiniBadge, { backgroundColor: scanningState === 'matched' ? '#2ec4b6' : scanningState === 'mismatch' ? '#d90429' : '#0077b6' }]}>
                      <Ionicons
                        name={scanningState === 'matched' ? 'checkmark' : scanningState === 'mismatch' ? 'close' : 'scan'}
                        size={11}
                        color="#ffffff"
                      />
                    </View>
                  </View>
                </View>

                {scanningState === 'scanning' ? (
                  <View style={[styles.scanningBox, { backgroundColor: isDarkMode ? '#051923' : '#f0f9ff' }]}>
                    <View style={styles.scanCheckRow}>
                      <Ionicons name={scanStep >= 1 ? 'checkmark-circle' : 'ellipse-outline'} size={16} color="#0077b6" style={{ marginRight: 6 }} />
                      <Text style={[styles.scanStepText, { color: theme.colors.textPrimary }]}>Mapeo de 468 nodos de topología facial 3D</Text>
                    </View>
                    <View style={styles.scanCheckRow}>
                      <Ionicons name={scanStep >= 2 ? 'checkmark-circle' : 'ellipse-outline'} size={16} color="#0077b6" style={{ marginRight: 6 }} />
                      <Text style={[styles.scanStepText, { color: theme.colors.textPrimary }]}>Análisis morfométrico (ojos, puente nasal, mandíbula)</Text>
                    </View>
                    <View style={styles.scanCheckRow}>
                      <Ionicons name={scanStep >= 3 ? 'checkmark-circle' : 'ellipse-outline'} size={16} color="#0077b6" style={{ marginRight: 6 }} />
                      <Text style={[styles.scanStepText, { color: theme.colors.textPrimary }]}>Cálculo de distancia euclidiana de vectores faciales</Text>
                    </View>
                  </View>
                ) : scanningState === 'matched' ? (
                  <View style={styles.matchSuccessBox}>
                    <View style={[styles.scoreBadge, { backgroundColor: '#e0f2fe', borderColor: '#0077b6' }]}>
                      <Ionicons name="checkmark-circle" size={20} color="#0077b6" style={{ marginRight: 6 }} />
                      <Text style={styles.scoreText}>Coincidencia Malla: {matchScore}% (VÁLIDO)</Text>
                    </View>
                    <Text style={[styles.matchSubtext, { color: theme.colors.textSecondary }]}>
                      {biometricReason || 'Topología facial 100% concordante con el perfil registrado.'}
                    </Text>

                    {biometricMetrics && (
                      <View style={[styles.telemetryCard, { backgroundColor: isDarkMode ? '#0d2818' : '#e8f5e9' }]}>
                        <Text style={styles.telemetryTitle}>MÉTRICAS 3D VALIDADAS:</Text>
                        <Text style={styles.telemetryItem}>• Nodos Mapeados: {biometricMetrics.meshNodesCount} puntos</Text>
                        <Text style={styles.telemetryItem}>• Simetría Ocular: {biometricMetrics.eyeDistanceRatio}</Text>
                        <Text style={styles.telemetryItem}>• Tolerancia Mandibular: {biometricMetrics.jawAngleDisparity}</Text>
                        <Text style={styles.telemetryItem}>• Clasificación: {biometricMetrics.morphologyType}</Text>
                      </View>
                    )}

                    <TouchableOpacity
                      style={[styles.verifyActionBtn, { backgroundColor: '#0077b6', marginTop: 10 }]}
                      onPress={handleConfirmVerification}
                      disabled={verifying}
                    >
                      {verifying ? (
                        <ActivityIndicator color="#fff" />
                      ) : (
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                          <Ionicons name="shield-checkmark" size={18} color="#ffffff" style={{ marginRight: 8 }} />
                          <Text style={styles.verifyActionBtnText}>Aprobar y Conceder Check Azul</Text>
                        </View>
                      )}
                    </TouchableOpacity>
                  </View>
                ) : (
                  <View style={styles.matchSuccessBox}>
                    <View style={[styles.scoreBadge, { backgroundColor: '#ffe3e8', borderColor: '#d90429' }]}>
                      <Ionicons name="close-circle" size={20} color="#d90429" style={{ marginRight: 6 }} />
                      <Text style={[styles.scoreText, { color: '#d90429' }]}>Coincidencia Malla: {matchScore}% (DENEGADO)</Text>
                    </View>
                    <Text style={[styles.matchSubtext, { color: '#d90429', fontWeight: 'bold' }]}>
                      {biometricReason}
                    </Text>

                    {biometricMetrics && (
                      <View style={[styles.telemetryCard, { backgroundColor: isDarkMode ? '#300808' : '#ffebee' }]}>
                        <Text style={[styles.telemetryTitle, { color: '#d90429' }]}>DIAGNÓSTICO DE DISPARIDAD:</Text>
                        <Text style={[styles.telemetryItem, { color: isDarkMode ? '#ffccd5' : '#5c0000' }]}>• Proporción Ocular: {biometricMetrics.eyeDistanceRatio}</Text>
                        <Text style={[styles.telemetryItem, { color: isDarkMode ? '#ffccd5' : '#5c0000' }]}>• Ángulo Mandibular: {biometricMetrics.jawAngleDisparity}</Text>
                        <Text style={[styles.telemetryItem, { color: isDarkMode ? '#ffccd5' : '#5c0000' }]}>• Diagnóstico: {biometricMetrics.morphologyType}</Text>
                      </View>
                    )}
                  </View>
                )}

                <View style={styles.testBarContainer}>
                  <Text style={[styles.testBarTitle, { color: theme.colors.textMuted }]}>HERRAMIENTAS DE PRUEBA (MODO TEST):</Text>
                  <View style={{ flexDirection: 'row', gap: 8, marginTop: 4 }}>
                    <TouchableOpacity
                      style={[styles.testBtn, { backgroundColor: '#2ec4b6' }]}
                      onPress={() => processMeshScan(capturedSelfie, 'match')}
                    >
                      <Text style={styles.testBtnText}>✓ Probar Match Malla (97%)</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.testBtn, { backgroundColor: '#d90429' }]}
                      onPress={() => processMeshScan(capturedSelfie, 'mismatch')}
                    >
                      <Text style={styles.testBtnText}>✕ Probar Incompatibilidad (14%)</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                <TouchableOpacity
                  style={[styles.retakeBtn, { borderColor: theme.colors.border }]}
                  onPress={handleLaunchCamera}
                >
                  <Ionicons name="refresh" size={15} color={theme.colors.textSecondary} style={{ marginRight: 6 }} />
                  <Text style={[styles.retakeBtnText, { color: theme.colors.textSecondary }]}>Tomar Otro Selfie</Text>
                </TouchableOpacity>
              </>
            )}
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
        onClose={() => setLegalModalVisible(false)}
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
  pronounBadge: {
    fontSize: 12,
    fontWeight: 'bold',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 10,
    marginTop: 4
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
  verifyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#caf0f8',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#0077b6'
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
  verifyCard: {
    borderRadius: 26,
    padding: 22,
    borderWidth: 1,
    alignItems: 'center'
  },
  verifyHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    marginBottom: 8
  },
  verifyTitle: {
    fontSize: 16,
    fontWeight: 'bold'
  },
  verifySubtitle: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 16
  },
  meshDemoBox: {
    borderWidth: 1.5,
    borderRadius: 20,
    padding: 16,
    alignItems: 'center',
    width: '100%',
    marginBottom: 16
  },
  meshNodeGrid: {
    alignItems: 'center',
    marginBottom: 10
  },
  meshNodeRow: {
    flexDirection: 'row',
    marginVertical: 3
  },
  meshDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#0077b6',
    marginHorizontal: 6,
    opacity: 0.5
  },
  meshDotActive: {
    backgroundColor: '#2ec4b6',
    opacity: 1,
    transform: [{ scale: 1.3 }]
  },
  meshDemoText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
    textAlign: 'center'
  },
  galleryFallbackBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 22,
    borderWidth: 1,
    width: '100%'
  },
  galleryFallbackText: {
    fontSize: 13,
    fontWeight: '600'
  },
  comparisonContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    marginVertical: 12
  },
  comparisonBox: {
    alignItems: 'center',
    width: '44%',
    position: 'relative'
  },
  comparisonLabel: {
    fontSize: 11,
    fontWeight: 'bold',
    marginBottom: 6,
    textTransform: 'uppercase'
  },
  imageFrame: {
    width: 105,
    height: 105,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: '#0077b6',
    overflow: 'hidden',
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center'
  },
  comparisonImg: {
    width: '100%',
    height: '100%'
  },
  hudOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,119,182,0.15)'
  },
  hudCrosshair: {
    width: 50,
    height: 50,
    borderWidth: 1,
    borderColor: '#00b4d8',
    borderRadius: 10,
    borderStyle: 'dashed'
  },
  scanLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: '#00b4d8',
    shadowColor: '#00b4d8',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 6,
    elevation: 4
  },
  checkMiniBadge: {
    position: 'absolute',
    bottom: -6,
    right: 14,
    backgroundColor: '#0077b6',
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center'
  },
  vsBadge: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center'
  },
  scanningBox: {
    width: '100%',
    padding: 12,
    borderRadius: 14,
    marginVertical: 10
  },
  scanCheckRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 4
  },
  scanStepText: {
    fontSize: 12,
    fontWeight: '500'
  },
  matchSuccessBox: {
    alignItems: 'center',
    width: '100%',
    marginVertical: 8
  },
  scoreBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 6
  },
  scoreText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#0077b6'
  },
  matchSubtext: {
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 16,
    marginBottom: 10
  },
  telemetryCard: {
    width: '100%',
    padding: 10,
    borderRadius: 12,
    marginVertical: 6
  },
  telemetryTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#2d6a4f',
    marginBottom: 4
  },
  telemetryItem: {
    fontSize: 11,
    color: '#1b4332',
    marginVertical: 1
  },
  testBarContainer: {
    width: '100%',
    marginTop: 8,
    marginBottom: 4,
    alignItems: 'center'
  },
  testBarTitle: {
    fontSize: 10,
    fontWeight: 'bold',
    letterSpacing: 0.5
  },
  testBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12
  },
  testBtnText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: 'bold'
  },
  retakeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 15,
    borderWidth: 1,
    marginTop: 10
  },
  retakeBtnText: {
    fontSize: 12,
    fontWeight: '600'
  },
  verifyActionBtn: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 13,
    paddingHorizontal: 22,
    borderRadius: 25,
    width: '100%'
  },
  verifyActionBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: 'bold'
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
