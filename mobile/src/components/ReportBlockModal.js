import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  Modal,
  TouchableOpacity,
  ScrollView,
  TextInput,
  ActivityIndicator,
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme';
import { apiRequest } from '../api';

const REPORT_REASONS = [
  {
    id: 'harassment',
    label: 'Acoso o mensajes intimidatorios',
    sublabel: 'Insultos, amenazas, insistencia no deseada o comportamiento abusivo.',
    icon: 'hand-left-outline'
  },
  {
    id: 'fake_profile',
    label: 'Perfil falso o suplantación',
    sublabel: 'Usa fotos de otra persona, catfishing o información engañosa.',
    icon: 'person-remove-outline'
  },
  {
    id: 'hate_speech',
    label: 'Discurso de odio, transfobia o bifobia',
    sublabel: 'Discriminación, comentarios tránsfobos, homófobos o intolerantes.',
    icon: 'warning-outline'
  },
  {
    id: 'inappropriate_content',
    label: 'Contenido explícito no solicitado',
    sublabel: 'Fotos o textos sexuales explícitos sin consentimiento previo.',
    icon: 'eye-off-outline'
  },
  {
    id: 'spam',
    label: 'Spam, estafa o bots',
    sublabel: 'Enlaces sospechosos, publicidad comercial o cuentas automatizadas.',
    icon: 'megaphone-outline'
  },
  {
    id: 'other',
    label: 'Otro motivo',
    sublabel: 'Cualquier otra vulneración de las normas de la comunidad.',
    icon: 'help-circle-outline'
  }
];

export default function ReportBlockModal({
  visible,
  targetUser,
  onClose,
  onSuccessBlockOrReport
}) {
  const { theme, isDarkMode } = useTheme();
  const [selectedReason, setSelectedReason] = useState('harassment');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);

  if (!targetUser) return null;

  const handleReportAndBlock = async () => {
    setLoading(true);
    try {
      const data = await apiRequest(`/api/users/${targetUser.id}/report`, {
        method: 'POST',
        body: JSON.stringify({
          reason: selectedReason,
          description: description.trim()
        })
      });

      Alert.alert(
        '🛡️ Reporte Enviado',
        data.message || 'La usuaria ha sido reportada a moderación y bloqueada.',
        [{ text: 'Entendido', onPress: () => {
          onClose();
          if (onSuccessBlockOrReport) onSuccessBlockOrReport(targetUser.id);
        }}]
      );
    } catch (err) {
      Alert.alert('Error al reportar', err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleBlockOnly = () => {
    Alert.alert(
      '¿Bloquear a ' + targetUser.name + '?',
      'No volverás a ver su perfil ni sus mensajes en la aplicación. Esta acción es bidireccional.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Bloquear',
          style: 'destructive',
          onPress: async () => {
            setLoading(true);
            try {
              const data = await apiRequest(`/api/users/${targetUser.id}/block`, {
                method: 'POST'
              });
              Alert.alert('Usuaria Bloqueada', data.message, [
                {
                  text: 'Entendido',
                  onPress: () => {
                    onClose();
                    if (onSuccessBlockOrReport) onSuccessBlockOrReport(targetUser.id);
                  }
                }
              ]);
            } catch (err) {
              Alert.alert('Error al bloquear', err.message);
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={[styles.modalCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
          {/* Cabecera */}
          <View style={styles.header}>
            <View style={styles.headerTitleRow}>
              <View style={styles.shieldBadge}>
                <Ionicons name="shield-checkmark" size={18} color="#d90429" />
              </View>
              <View style={{ flex: 1, marginLeft: 10 }}>
                <Text style={[styles.title, { color: theme.colors.textPrimary }]}>
                  Seguridad y Moderación
                </Text>
                <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
                  Opciones para {targetUser.name}
                </Text>
              </View>
            </View>
            <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
              <Ionicons name="close" size={20} color={theme.colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} style={styles.body}>
            <Text style={[styles.sectionLabel, { color: theme.colors.textPrimary }]}>
              ¿Cuál es el motivo de tu reporte?
            </Text>

            {REPORT_REASONS.map((item) => {
              const isSelected = selectedReason === item.id;
              return (
                <TouchableOpacity
                  key={item.id}
                  style={[
                    styles.reasonItem,
                    {
                      backgroundColor: theme.colors.surfaceSubtle,
                      borderColor: isSelected ? '#d90429' : theme.colors.border
                    },
                    isSelected && { backgroundColor: isDarkMode ? '#2b0b14' : '#fff0f3' }
                  ]}
                  onPress={() => setSelectedReason(item.id)}
                  activeOpacity={0.8}
                >
                  <Ionicons
                    name={item.icon}
                    size={20}
                    color={isSelected ? '#d90429' : theme.colors.textSecondary}
                    style={{ marginRight: 12 }}
                  />
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.reasonTitle, { color: theme.colors.textPrimary }]}>
                      {item.label}
                    </Text>
                    <Text style={[styles.reasonSub, { color: theme.colors.textMuted }]}>
                      {item.sublabel}
                    </Text>
                  </View>
                  <View style={[styles.radioCircle, isSelected && styles.radioCircleSelected]}>
                    {isSelected && <View style={styles.radioInner} />}
                  </View>
                </TouchableOpacity>
              );
            })}

            <Text style={[styles.sectionLabel, { color: theme.colors.textPrimary, marginTop: 14 }]}>
              Detalles adicionales (opcional)
            </Text>
            <TextInput
              style={[
                styles.textArea,
                {
                  backgroundColor: theme.colors.surfaceSubtle,
                  borderColor: theme.colors.border,
                  color: theme.colors.textPrimary
                }
              ]}
              placeholder="Explica qué ha sucedido para ayudar al equipo de moderación..."
              placeholderTextColor={theme.colors.textMuted}
              multiline
              numberOfLines={3}
              value={description}
              onChangeText={setDescription}
            />

            {/* Botones de Acción */}
            <TouchableOpacity
              style={[styles.reportBtn, loading && { opacity: 0.7 }]}
              onPress={handleReportAndBlock}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#ffffff" size="small" />
              ) : (
                <>
                  <Ionicons name="alert-circle" size={18} color="#ffffff" style={{ marginRight: 6 }} />
                  <Text style={styles.reportBtnText}>Reportar y Bloquear</Text>
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.blockOnlyBtn, { borderColor: theme.colors.border }]}
              onPress={handleBlockOnly}
              disabled={loading}
            >
              <Ionicons name="ban-outline" size={16} color="#d90429" style={{ marginRight: 6 }} />
              <Text style={styles.blockOnlyBtnText}>Solo Bloquear sin Reportar</Text>
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
    maxHeight: '90%',
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 35,
    borderTopWidth: 1
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 15
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1
  },
  shieldBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(217, 4, 41, 0.12)',
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
  body: {
    marginTop: 5
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: 'bold',
    marginBottom: 8
  },
  reasonItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 14,
    borderWidth: 1.2,
    marginBottom: 8
  },
  reasonTitle: {
    fontSize: 13.5,
    fontWeight: '600'
  },
  reasonSub: {
    fontSize: 11,
    marginTop: 2,
    lineHeight: 14
  },
  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#9ca3af',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8
  },
  radioCircleSelected: {
    borderColor: '#d90429'
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#d90429'
  },
  textArea: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 12,
    fontSize: 13,
    height: 75,
    textAlignVertical: 'top',
    marginBottom: 16
  },
  reportBtn: {
    backgroundColor: '#d90429',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 22,
    marginBottom: 10
  },
  reportBtnText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: 'bold'
  },
  blockOnlyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 22,
    borderWidth: 1,
    marginBottom: 10
  },
  blockOnlyBtnText: {
    color: '#d90429',
    fontSize: 13.5,
    fontWeight: '600'
  }
});
