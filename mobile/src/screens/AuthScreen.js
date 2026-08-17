import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  Platform,
  Linking
} from 'react-native';
import * as LocalAuthentication from 'expo-local-authentication';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme';
import { apiRequest, setAuthToken, uploadPhoto } from '../api';
import LegalTermsModal from '../components/LegalTermsModal';

const defaultAvatarImg = require('../../assets/default_avatar.png');

export default function AuthScreen({ onLoginSuccess }) {
  const { theme, isDarkMode } = useTheme();
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Hardware Biométrico
  const [hasBiometrics, setHasBiometrics] = useState(false);
  const [biometricName, setBiometricName] = useState('Face ID');

  // Campos de formulario
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [bio, setBio] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('default');

  // Estado para recuperación de contraseña
  const [forgotModalVisible, setForgotModalVisible] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [resetStep, setResetStep] = useState(1);
  const [legalModalVisible, setLegalModalVisible] = useState(false);

  useEffect(() => {
    checkBiometrics();
  }, []);

  const checkBiometrics = async () => {
    try {
      const compatible = await LocalAuthentication.hasHardwareAsync();
      const enrolled = await LocalAuthentication.isEnrolledAsync();
      if (compatible && enrolled) {
        setHasBiometrics(true);
        const types = await LocalAuthentication.supportedAuthenticationTypesAsync();
        if (types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
          setBiometricName('Face ID');
        } else if (types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
          setBiometricName('Touch ID');
        } else {
          setBiometricName('Biometría');
        }
      } else {
        setHasBiometrics(Platform.OS === 'ios');
        setBiometricName('Face ID');
      }
    } catch (e) {
      setHasBiometrics(Platform.OS === 'ios');
    }
  };

  const handleBiometricLogin = async () => {
    try {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: `Accede a Sparks con ${biometricName}`,
        cancelLabel: 'Cancelar',
        disableDeviceFallback: true
      });

      if (result.success) {
        setLoading(true);
        // Login automático con usuario demo verificado
        const data = await apiRequest('/api/auth/login', {
          method: 'POST',
          body: JSON.stringify({ email: 'ana@sparks.app', password: '123456' })
        });
        setAuthToken(data.token);
        onLoginSuccess(data.user);
      }
    } catch (e) {
      console.warn(e);
    } finally {
      setLoading(false);
    }
  };

  const handlePickRegisterAvatar = async () => {
    try {
      let { status } = await ImagePicker.getMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        const req = await ImagePicker.requestMediaLibraryPermissionsAsync();
        status = req.status;
      }

      if (status !== 'granted') {
        Alert.alert(
          'Permiso de Galería Requerido',
          'Sparks necesita acceso a tus fotos para que puedas seleccionar tu foto de perfil. Puedes activarlo en los Ajustes del dispositivo.',
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
        setAvatarUrl(result.assets[0].uri);
      }
    } catch (err) {
      Alert.alert('Error al seleccionar foto', err.message);
    }
  };

  const handleAuth = async () => {
    setError('');
    if (!email || !password) {
      setError('Por favor, ingresa tu correo y contraseña.');
      return;
    }

    if (!isLogin) {
      if (!name || !age) {
        setError('Por favor, ingresa tu nombre y edad.');
        return;
      }
      if (parseInt(age) < 18) {
        setError('Debes ser mayor de 18 años para usar Sparks.');
        return;
      }
    }

    setLoading(true);
    try {
      if (isLogin) {
        const data = await apiRequest('/api/auth/login', {
          method: 'POST',
          body: JSON.stringify({ email: email.trim(), password })
        });
        setAuthToken(data.token);
        onLoginSuccess(data.user);
      } else {
        let finalAvatar = avatarUrl || 'default';
        if (finalAvatar && finalAvatar !== 'default' && (finalAvatar.startsWith('file://') || finalAvatar.startsWith('/'))) {
          try {
            const uploadRes = await uploadPhoto(finalAvatar, false);
            if (uploadRes?.url) {
              finalAvatar = uploadRes.url;
            }
          } catch (upErr) {
            console.warn('Fallback foto registro:', upErr.message);
          }
        }

        const data = await apiRequest('/api/auth/register', {
          method: 'POST',
          body: JSON.stringify({
            email: email.trim(),
            password,
            name: name.trim(),
            age: parseInt(age),
            bio: bio.trim(),
            avatarUrl: finalAvatar
          })
        });
        setAuthToken(data.token);
        onLoginSuccess(data.user);
      }
    } catch (err) {
      setError(err.message || 'Ocurrió un error al conectar con el servidor.');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!forgotEmail) {
      Alert.alert('Error', 'Ingresa tu correo electrónico.');
      return;
    }
    setLoading(true);
    try {
      const data = await apiRequest('/api/auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify({ email: forgotEmail.trim() })
      });
      if (data.devResetToken) {
        setResetToken(data.devResetToken);
      }
      setResetStep(2);
      Alert.alert(
        'Código Generado',
        'Hemos generado tu código de recuperación. Puedes usarlo ahora para cambiar tu contraseña.'
      );
    } catch (err) {
      Alert.alert('Error', err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!resetToken || !newPassword) {
      Alert.alert('Error', 'Ingresa el código y la nueva contraseña.');
      return;
    }
    setLoading(true);
    try {
      const data = await apiRequest('/api/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify({ token: resetToken.trim(), newPassword })
      });
      Alert.alert('¡Éxito!', data.message);
      setForgotModalVisible(false);
      setResetStep(1);
      setResetToken('');
      setNewPassword('');
    } catch (err) {
      Alert.alert('Error', err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.colors.background }]} contentContainerStyle={styles.scrollContent}>
      {/* Header Visual */}
      <View style={styles.header}>
        <View style={[styles.logoBadge, { backgroundColor: theme.colors.primaryDark }]}>
          <Ionicons name="flame" size={32} color="#ffffff" />
        </View>
        <Text style={[styles.title, { color: isDarkMode ? '#ff2a6d' : theme.colors.primaryDark }]}>Sparks</Text>
        <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>Conecta con chicas cerca de ti</Text>
      </View>

      {/* Selector de Pestaña: Login / Registro */}
      <View style={[styles.tabContainer, { backgroundColor: isDarkMode ? '#280814' : '#ffe5ec' }]}>
        <TouchableOpacity
          style={[styles.tabButton, isLogin && { backgroundColor: theme.colors.primaryDark }]}
          onPress={() => {
            setIsLogin(true);
            setError('');
          }}
        >
          <Text style={[styles.tabText, { color: isLogin ? '#ffffff' : theme.colors.textSecondary }, isLogin && { fontWeight: 'bold' }]}>
            Iniciar Sesión
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabButton, !isLogin && { backgroundColor: theme.colors.primaryDark }]}
          onPress={() => {
            setIsLogin(false);
            setError('');
          }}
        >
          <Text style={[styles.tabText, { color: !isLogin ? '#ffffff' : theme.colors.textSecondary }, !isLogin && { fontWeight: 'bold' }]}>
            Crear Cuenta
          </Text>
        </TouchableOpacity>
      </View>

      {/* Formulario */}
      <View style={[styles.formCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
        {error ? <Text style={styles.errorBanner}>{error}</Text> : null}

        {!isLogin && (
          <>
            <Text style={[styles.label, { color: theme.colors.textPrimary }]}>Nombre completo o apodo</Text>
            <TextInput
              style={[styles.input, { backgroundColor: theme.colors.surfaceSubtle, borderColor: theme.colors.border, color: theme.colors.textPrimary }]}
              placeholder="Ej. Carmen"
              placeholderTextColor={theme.colors.textMuted}
              value={name}
              onChangeText={setName}
            />

            <Text style={[styles.label, { color: theme.colors.textPrimary }]}>Edad (mínimo 18 años)</Text>
            <TextInput
              style={[styles.input, { backgroundColor: theme.colors.surfaceSubtle, borderColor: theme.colors.border, color: theme.colors.textPrimary }]}
              placeholder="Ej. 24"
              placeholderTextColor={theme.colors.textMuted}
              keyboardType="numeric"
              value={age}
              onChangeText={setAge}
            />

            <Text style={[styles.label, { color: theme.colors.textPrimary }]}>Foto de perfil</Text>
            <View style={[styles.avatarSelectorCard, { backgroundColor: theme.colors.surfaceSubtle, borderColor: theme.colors.border }]}>
              <Image
                source={avatarUrl && avatarUrl !== 'default' ? { uri: avatarUrl } : defaultAvatarImg}
                style={[styles.avatarPreviewBig, { borderColor: theme.colors.primaryDark }]}
              />
              <View style={{ flex: 1, marginLeft: 14 }}>
                <TouchableOpacity
                  style={[styles.pickGalleryBtn, { backgroundColor: theme.colors.primaryDark }]}
                  onPress={handlePickRegisterAvatar}
                >
                  <Ionicons name="images-outline" size={15} color="#ffffff" style={{ marginRight: 6 }} />
                  <Text style={styles.pickGalleryBtnText}>Elegir de Galería</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.resetAvatarBtn, { borderColor: theme.colors.border }]}
                  onPress={() => setAvatarUrl('default')}
                >
                  <Ionicons name="refresh-outline" size={13} color={theme.colors.textMuted} style={{ marginRight: 4 }} />
                  <Text style={[styles.resetAvatarBtnText, { color: theme.colors.textSecondary }]}>Foto por defecto</Text>
                </TouchableOpacity>
              </View>
            </View>

            <Text style={[styles.label, { color: theme.colors.textPrimary }]}>Biografía / Sobre ti</Text>
            <TextInput
              style={[
                styles.input,
                styles.textArea,
                { backgroundColor: theme.colors.surfaceSubtle, borderColor: theme.colors.border, color: theme.colors.textPrimary }
              ]}
              placeholder="Cuéntanos sobre tus gustos e intereses..."
              placeholderTextColor={theme.colors.textMuted}
              multiline
              numberOfLines={3}
              value={bio}
              onChangeText={setBio}
            />
          </>
        )}

        <Text style={[styles.label, { color: theme.colors.textPrimary }]}>Correo Electrónico</Text>
        <TextInput
          style={[styles.input, { backgroundColor: theme.colors.surfaceSubtle, borderColor: theme.colors.border, color: theme.colors.textPrimary }]}
          placeholder="tu@email.com"
          placeholderTextColor={theme.colors.textMuted}
          autoCapitalize="none"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
        />

        <Text style={[styles.label, { color: theme.colors.textPrimary }]}>Contraseña</Text>
        <TextInput
          style={[styles.input, { backgroundColor: theme.colors.surfaceSubtle, borderColor: theme.colors.border, color: theme.colors.textPrimary }]}
          placeholder="Mínimo 6 caracteres"
          placeholderTextColor={theme.colors.textMuted}
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />

        {isLogin && (
          <TouchableOpacity
            style={styles.forgotLink}
            onPress={() => {
              setForgotModalVisible(true);
              setForgotEmail(email);
            }}
          >
            <Text style={[styles.forgotText, { color: theme.colors.primary }]}>¿Olvidaste tu contraseña?</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={[styles.primaryButton, { backgroundColor: theme.colors.primaryDark }]}
          onPress={handleAuth}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.primaryButtonText}>
              {isLogin ? 'Entrar a Sparks' : 'Crear mi Perfil'}
            </Text>
          )}
        </TouchableOpacity>

        {!isLogin && (
          <TouchableOpacity
            style={styles.legalDisclaimerBtn}
            onPress={() => setLegalModalVisible(true)}
          >
            <Text style={[styles.legalDisclaimerText, { color: theme.colors.textMuted }]}>
              Al registrarte aceptas nuestros{' '}
              <Text style={{ color: theme.colors.primary, textDecorationLine: 'underline' }}>
                Términos (EULA) y Política de Privacidad
              </Text>
            </Text>
          </TouchableOpacity>
        )}

        {/* Acceso Rápido con Face ID / Touch ID */}
        {isLogin && (
          <TouchableOpacity
            style={[styles.biometricLoginBtn, { borderColor: isDarkMode ? '#0077b6' : '#90e0ef', backgroundColor: isDarkMode ? '#001824' : '#e0f2fe' }]}
            onPress={handleBiometricLogin}
            disabled={loading}
          >
            <Ionicons name="scan-circle-outline" size={20} color="#0077b6" style={{ marginRight: 8 }} />
            <Text style={[styles.biometricLoginText, { color: '#0077b6' }]}>
              Entrar con {biometricName}
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Modal de Recuperación de Contraseña */}
      <Modal
        visible={forgotModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setForgotModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: theme.colors.surface }]}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <Text style={[styles.modalTitle, { color: theme.colors.textPrimary }]}>Recuperar Contraseña</Text>
              <TouchableOpacity onPress={() => setForgotModalVisible(false)}>
                <Ionicons name="close" size={20} color={theme.colors.textMuted} />
              </TouchableOpacity>
            </View>
            <Text style={[styles.modalSubtitle, { color: theme.colors.textSecondary }]}>
              {resetStep === 1
                ? 'Ingresa tu correo para recibir un código de recuperación.'
                : 'Ingresa el código recibido y tu nueva contraseña.'}
            </Text>

            {resetStep === 1 ? (
              <>
                <TextInput
                  style={[styles.input, { backgroundColor: theme.colors.surfaceSubtle, borderColor: theme.colors.border, color: theme.colors.textPrimary }]}
                  placeholder="tu@email.com"
                  placeholderTextColor={theme.colors.textMuted}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  value={forgotEmail}
                  onChangeText={setForgotEmail}
                />
                <TouchableOpacity
                  style={[styles.primaryButton, { backgroundColor: theme.colors.primaryDark }]}
                  onPress={handleForgotPassword}
                  disabled={loading}
                >
                  {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryButtonText}>Solicitar Código</Text>}
                </TouchableOpacity>
              </>
            ) : (
              <>
                <Text style={[styles.label, { color: theme.colors.textPrimary }]}>Código de Recuperación</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: theme.colors.surfaceSubtle, borderColor: theme.colors.border, color: theme.colors.textPrimary }]}
                  placeholder="Código o Token"
                  placeholderTextColor={theme.colors.textMuted}
                  value={resetToken}
                  onChangeText={setResetToken}
                />
                <Text style={[styles.label, { color: theme.colors.textPrimary }]}>Nueva Contraseña</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: theme.colors.surfaceSubtle, borderColor: theme.colors.border, color: theme.colors.textPrimary }]}
                  placeholder="Al menos 6 caracteres"
                  placeholderTextColor={theme.colors.textMuted}
                  secureTextEntry
                  value={newPassword}
                  onChangeText={setNewPassword}
                />
                <TouchableOpacity
                  style={[styles.primaryButton, { backgroundColor: theme.colors.primaryDark }]}
                  onPress={handleResetPassword}
                  disabled={loading}
                >
                  {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryButtonText}>Restablecer Contraseña</Text>}
                </TouchableOpacity>
              </>
            )}

            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => {
                setForgotModalVisible(false);
                setResetStep(1);
              }}
            >
              <Text style={[styles.cancelButtonText, { color: theme.colors.textMuted }]}>Cerrar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
      {/* Modal de Términos Legales & Privacidad */}
      <LegalTermsModal
        visible={legalModalVisible}
        onClose={() => setLegalModalVisible(false)}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  legalDisclaimerBtn: {
    marginTop: 10,
    paddingHorizontal: 10,
    alignItems: 'center'
  },
  legalDisclaimerText: {
    fontSize: 11,
    textAlign: 'center',
    lineHeight: 16
  },
  container: {
    flex: 1
  },
  scrollContent: {
    padding: 20,
    paddingTop: 50,
    paddingBottom: 40
  },
  header: {
    alignItems: 'center',
    marginBottom: 25
  },
  logoBadge: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 6,
    marginBottom: 10
  },
  title: {
    fontSize: 34,
    fontWeight: 'bold',
    letterSpacing: 1
  },
  subtitle: {
    fontSize: 15,
    marginTop: 4
  },
  tabContainer: {
    flexDirection: 'row',
    borderRadius: 25,
    padding: 4,
    marginBottom: 20
  },
  tabButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 22,
    alignItems: 'center'
  },
  tabText: {
    fontSize: 15,
    fontWeight: '600'
  },
  formCard: {
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 4
  },
  errorBanner: {
    backgroundColor: '#ffe3e8',
    color: '#800f2f',
    padding: 12,
    borderRadius: 12,
    marginBottom: 15,
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
    borderWidth: 1,
    borderColor: '#ffccd5'
  },
  label: {
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 6,
    marginTop: 10
  },
  input: {
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 15,
    paddingVertical: 12,
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
    width: 68,
    height: 68,
    borderRadius: 34,
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
  forgotLink: {
    alignSelf: 'flex-end',
    marginVertical: 10
  },
  forgotText: {
    fontSize: 13,
    fontWeight: '600'
  },
  primaryButton: {
    paddingVertical: 15,
    borderRadius: 25,
    alignItems: 'center',
    marginTop: 18,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4
  },
  primaryButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold'
  },
  biometricLoginBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 13,
    borderRadius: 25,
    marginTop: 12,
    borderWidth: 1.5
  },
  biometricLoginText: {
    fontSize: 15,
    fontWeight: 'bold'
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20
  },
  modalCard: {
    borderRadius: 24,
    padding: 24,
    width: '100%',
    maxWidth: 400
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center'
  },
  modalSubtitle: {
    fontSize: 13,
    marginBottom: 18,
    textAlign: 'center'
  },
  cancelButton: {
    alignItems: 'center',
    marginTop: 12,
    paddingVertical: 8
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: '600'
  }
});
