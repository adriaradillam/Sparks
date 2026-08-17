import React from 'react';
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

const GUIDELINES = [
  {
    icon: 'heart-circle-outline',
    color: '#ff4d6d',
    title: '1. Espacio Sáfico e Inclusivo',
    desc: 'Sparks es un refugio creado por y para mujeres lesbianas, bisexuales, pansexuales, trans y personas no binarias. La diversidad en todas sus expresiones es bienvenida y celebrada.'
  },
  {
    icon: 'shield-checkmark-outline',
    color: '#00b4d8',
    title: '2. Tolerancia Cero al Odio y Acoso',
    desc: 'No permitimos ninguna forma de transfobia, lesbofobia, bifobia, racismo, acoso ni discursos de odio. Las cuentas infractoras son eliminadas de forma inmediata y permanente.'
  },
  {
    icon: 'chatbubbles-outline',
    color: '#9b5de5',
    title: '3. Consentimiento y Respeto en el Chat',
    desc: 'Respeta los ritmos y los límites de las demás. Queda terminantemente prohibido el envío de fotos o contenido explícito no consentido.'
  },
  {
    icon: 'person-circle-outline',
    color: '#f77f00',
    title: '4. Autenticidad y Perfiles Reales',
    desc: 'Fomentamos perfiles verificados con fotos reales. El catfishing, la suplantación de identidad o el uso de cuentas comerciales/bots resultará en bloqueo.'
  },
  {
    icon: 'lock-closed-outline',
    color: '#10b981',
    title: '5. Tu Privacidad es Sagrada',
    desc: 'Protege tus datos personales. Utiliza el Modo Fantasma y las distancias aproximadas siempre que desees mayor discreción en tu zona.'
  }
];

export default function CommunityGuidelinesModal({ visible, onClose }) {
  const { theme, isDarkMode } = useTheme();

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={[styles.modalCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
          {/* Header */}
          <View style={styles.header}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <View style={[styles.iconCircle, { backgroundColor: isDarkMode ? '#2d0c1b' : '#ffe5ec' }]}>
                <Ionicons name="sparkles" size={18} color={theme.colors.primaryDark} />
              </View>
              <View style={{ marginLeft: 10 }}>
                <Text style={[styles.title, { color: theme.colors.textPrimary }]}>
                  Normas de la Comunidad
                </Text>
                <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
                  Compromiso de Convivencia en Sparks
                </Text>
              </View>
            </View>
            <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
              <Ionicons name="close" size={20} color={theme.colors.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* Guidelines list */}
          <ScrollView showsVerticalScrollIndicator={false} style={{ marginTop: 6 }}>
            {GUIDELINES.map((item, idx) => (
              <View
                key={idx}
                style={[
                  styles.ruleCard,
                  { backgroundColor: theme.colors.surfaceSubtle, borderColor: theme.colors.border }
                ]}
              >
                <View style={styles.ruleHeader}>
                  <View style={[styles.ruleIconBox, { backgroundColor: `${item.color}18` }]}>
                    <Ionicons name={item.icon} size={18} color={item.color} />
                  </View>
                  <Text style={[styles.ruleTitle, { color: theme.colors.textPrimary }]}>
                    {item.title}
                  </Text>
                </View>
                <Text style={[styles.ruleDesc, { color: theme.colors.textSecondary }]}>
                  {item.desc}
                </Text>
              </View>
            ))}

            <TouchableOpacity
              style={[styles.understandBtn, { backgroundColor: theme.colors.primaryDark }]}
              onPress={onClose}
            >
              <Text style={styles.understandBtnText}>Entendido y Acepto las Normas</Text>
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
    maxHeight: '88%',
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
  ruleCard: {
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 10
  },
  ruleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6
  },
  ruleIconBox: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8
  },
  ruleTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    flex: 1
  },
  ruleDesc: {
    fontSize: 12.5,
    lineHeight: 18
  },
  understandBtn: {
    paddingVertical: 14,
    borderRadius: 22,
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 10
  },
  understandBtnText: {
    color: '#ffffff',
    fontSize: 14.5,
    fontWeight: 'bold'
  }
});
