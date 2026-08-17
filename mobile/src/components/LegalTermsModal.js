import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  Modal,
  TouchableOpacity,
  ScrollView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme';

export default function LegalTermsModal({ visible, onClose }) {
  const { theme, isDarkMode } = useTheme();
  const [activeTab, setActiveTab] = useState('terms'); // 'terms' | 'privacy'

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={[styles.modalCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
          {/* Cabecera */}
          <View style={styles.header}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <View style={[styles.iconCircle, { backgroundColor: isDarkMode ? '#2d0c1b' : '#ffe5ec' }]}>
                <Ionicons name="document-text-outline" size={18} color={theme.colors.primaryDark} />
              </View>
              <View style={{ marginLeft: 10 }}>
                <Text style={[styles.title, { color: theme.colors.textPrimary }]}>
                  Legal & Privacidad
                </Text>
                <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
                  Compromiso de Transparencia Sparks
                </Text>
              </View>
            </View>
            <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
              <Ionicons name="close" size={20} color={theme.colors.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* Pestañas Selectoras */}
          <View style={[styles.tabsRow, { backgroundColor: theme.colors.surfaceSubtle }]}>
            <TouchableOpacity
              style={[
                styles.tabBtn,
                activeTab === 'terms' && { backgroundColor: theme.colors.primaryDark }
              ]}
              onPress={() => setActiveTab('terms')}
            >
              <Text
                style={[
                  styles.tabBtnText,
                  { color: activeTab === 'terms' ? '#ffffff' : theme.colors.textSecondary }
                ]}
              >
                Términos (EULA)
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.tabBtn,
                activeTab === 'privacy' && { backgroundColor: theme.colors.primaryDark }
              ]}
              onPress={() => setActiveTab('privacy')}
            >
              <Text
                style={[
                  styles.tabBtnText,
                  { color: activeTab === 'privacy' ? '#ffffff' : theme.colors.textSecondary }
                ]}
              >
                Privacidad (RGPD)
              </Text>
            </TouchableOpacity>
          </View>

          {/* Contenido Legal */}
          <ScrollView showsVerticalScrollIndicator={false} style={styles.body}>
            {activeTab === 'terms' ? (
              <View style={styles.textContainer}>
                <Text style={[styles.legalHeading, { color: theme.colors.textPrimary }]}>
                  Contrato de Licencia de Usuario Final (EULA)
                </Text>
                <Text style={[styles.legalPara, { color: theme.colors.textSecondary }]}>
                  <Text style={{ fontWeight: 'bold' }}>1. Requisito de Mayoría de Edad (+18):</Text> El acceso está estrictamente restringido a personas mayores de 18 años.
                </Text>
                <Text style={[styles.legalPara, { color: theme.colors.textSecondary }]}>
                  <Text style={{ fontWeight: 'bold' }}>2. Tolerancia Cero al Contenido Abusivo (Guideline 1.2 Apple):</Text> Queda totalmente prohibido el acoso, los discursos de odio, la transfobia, la homofobia, el envío de contenido explícito no consentido y el catfishing o suplantación.
                </Text>
                <Text style={[styles.legalPara, { color: theme.colors.textSecondary }]}>
                  <Text style={{ fontWeight: 'bold' }}>3. Moderación y Reportes:</Text> Toda usuaria dispone de botones para denunciar perfiles. Las cuentas infractoras son revisadas en menos de 24h y suspendidas de forma inmediata.
                </Text>
                <Text style={[styles.legalPara, { color: theme.colors.textSecondary }]}>
                  <Text style={{ fontWeight: 'bold' }}>4. Espacio Sáfico:</Text> Sparks está dedicado a la comunidad sáfica y queer para garantizar un entorno empático y libre de discriminación.
                </Text>
              </View>
            ) : (
              <View style={styles.textContainer}>
                <Text style={[styles.legalHeading, { color: theme.colors.textPrimary }]}>
                  Política de Privacidad y Protección de Datos (RGPD)
                </Text>
                <Text style={[styles.legalPara, { color: theme.colors.textSecondary }]}>
                  <Text style={{ fontWeight: 'bold' }}>1. Responsable del Tratamiento:</Text> Sparks Community Inc. / Sparks App S.L. Contacto: privacidad@sparks.app.
                </Text>
                <Text style={[styles.legalPara, { color: theme.colors.textSecondary }]}>
                  <Text style={{ fontWeight: 'bold' }}>2. Tratamiento de Ubicación:</Text> Tus coordenadas GPS solo se utilizan para calcular distancias aproximadas. Puedes activar el "Modo Fantasma" o "Distancia Aproximada" para no revelar tu localización exacta.
                </Text>
                <Text style={[styles.legalPara, { color: theme.colors.textSecondary }]}>
                  <Text style={{ fontWeight: 'bold' }}>3. Spotify Web API:</Text> Solo accedemos a tus canciones y artistas destacados mediante OAuth seguro. No almacenamos tus contraseñas de Spotify.
                </Text>
                <Text style={[styles.legalPara, { color: theme.colors.textSecondary }]}>
                  <Text style={{ fontWeight: 'bold' }}>4. Derecho al Olvido (Art. 17 RGPD):</Text> Al pulsar "Eliminar Cuenta" en los Ajustes, todos tus datos, fotos y conversaciones se borran permanentemente.
                </Text>
              </View>
            )}

            <TouchableOpacity
              style={[styles.acceptBtn, { backgroundColor: theme.colors.primaryDark }]}
              onPress={onClose}
            >
              <Text style={styles.acceptBtnText}>Entendido y Acepto</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent: 'flex-end'
  },
  modalCard: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: '85%',
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 35,
    borderTopWidth: 1
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center'
  },
  title: {
    fontSize: 17,
    fontWeight: 'bold'
  },
  subtitle: {
    fontSize: 12,
    marginTop: 2
  },
  closeBtn: {
    padding: 6
  },
  tabsRow: {
    flexDirection: 'row',
    borderRadius: 12,
    padding: 4,
    marginBottom: 14
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center'
  },
  tabBtnText: {
    fontSize: 12.5,
    fontWeight: 'bold'
  },
  body: {
    marginTop: 4
  },
  textContainer: {
    paddingBottom: 10
  },
  legalHeading: {
    fontSize: 14.5,
    fontWeight: 'bold',
    marginBottom: 10
  },
  legalPara: {
    fontSize: 12.5,
    lineHeight: 18,
    marginBottom: 10
  },
  acceptBtn: {
    paddingVertical: 14,
    borderRadius: 22,
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 10
  },
  acceptBtnText: {
    color: '#ffffff',
    fontSize: 14.5,
    fontWeight: 'bold'
  }
});
