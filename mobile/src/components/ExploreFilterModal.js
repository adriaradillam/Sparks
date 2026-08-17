import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  Modal,
  TouchableOpacity,
  ScrollView,
  Switch
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme';

const DISTANCE_OPTIONS = [
  { label: '5 km', value: 5 },
  { label: '15 km', value: 15 },
  { label: '30 km', value: 30 },
  { label: '50 km', value: 50 },
  { label: 'Ilimitada', value: null }
];

export default function ExploreFilterModal({
  visible,
  currentFilters,
  onApplyFilters,
  onClose
}) {
  const { theme, isDarkMode } = useTheme();

  const [minAge, setMinAge] = useState(currentFilters.minAge || 18);
  const [maxAge, setMaxAge] = useState(currentFilters.maxAge || 45);
  const [maxDist, setMaxDist] = useState(currentFilters.maxDist !== undefined ? currentFilters.maxDist : null);
  const [onlyVerified, setOnlyVerified] = useState(currentFilters.onlyVerified || false);
  const [hasSpotify, setHasSpotify] = useState(currentFilters.hasSpotify || false);

  const handleReset = () => {
    setMinAge(18);
    setMaxAge(45);
    setMaxDist(null);
    setOnlyVerified(false);
    setHasSpotify(false);
  };

  const handleApply = () => {
    onApplyFilters({
      minAge,
      maxAge,
      maxDist,
      onlyVerified,
      hasSpotify
    });
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={[styles.modalCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
          {/* Header */}
          <View style={styles.header}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <View style={[styles.iconCircle, { backgroundColor: isDarkMode ? '#2d0c1b' : '#ffe5ec' }]}>
                <Ionicons name="options-outline" size={18} color={theme.colors.primaryDark} />
              </View>
              <View style={{ marginLeft: 10 }}>
                <Text style={[styles.title, { color: theme.colors.textPrimary }]}>
                  Filtros de Búsqueda
                </Text>
                <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
                  Personaliza a quién deseas encontrar
                </Text>
              </View>
            </View>

            <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
              <Ionicons name="close" size={20} color={theme.colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} style={{ marginTop: 10 }}>
            {/* Rango de Edad */}
            <View style={styles.filterSection}>
              <View style={styles.sectionHeaderRow}>
                <Text style={[styles.sectionTitle, { color: theme.colors.textPrimary }]}>
                  Rango de Edad
                </Text>
                <Text style={[styles.sectionValue, { color: theme.colors.primaryDark }]}>
                  {minAge} - {maxAge} años
                </Text>
              </View>

              <View style={styles.ageButtonsRow}>
                <View style={styles.ageControl}>
                  <Text style={[styles.ageLabel, { color: theme.colors.textMuted }]}>Mínima</Text>
                  <View style={styles.stepperRow}>
                    <TouchableOpacity
                      style={[styles.stepBtn, { backgroundColor: theme.colors.surfaceSubtle, borderColor: theme.colors.border }]}
                      onPress={() => setMinAge(Math.max(18, minAge - 1))}
                    >
                      <Ionicons name="remove" size={16} color={theme.colors.textPrimary} />
                    </TouchableOpacity>
                    <Text style={[styles.stepVal, { color: theme.colors.textPrimary }]}>{minAge}</Text>
                    <TouchableOpacity
                      style={[styles.stepBtn, { backgroundColor: theme.colors.surfaceSubtle, borderColor: theme.colors.border }]}
                      onPress={() => setMinAge(Math.min(maxAge - 1, minAge + 1))}
                    >
                      <Ionicons name="add" size={16} color={theme.colors.textPrimary} />
                    </TouchableOpacity>
                  </View>
                </View>

                <View style={styles.ageControl}>
                  <Text style={[styles.ageLabel, { color: theme.colors.textMuted }]}>Máxima</Text>
                  <View style={styles.stepperRow}>
                    <TouchableOpacity
                      style={[styles.stepBtn, { backgroundColor: theme.colors.surfaceSubtle, borderColor: theme.colors.border }]}
                      onPress={() => setMaxAge(Math.max(minAge + 1, maxAge - 1))}
                    >
                      <Ionicons name="remove" size={16} color={theme.colors.textPrimary} />
                    </TouchableOpacity>
                    <Text style={[styles.stepVal, { color: theme.colors.textPrimary }]}>{maxAge}</Text>
                    <TouchableOpacity
                      style={[styles.stepBtn, { backgroundColor: theme.colors.surfaceSubtle, borderColor: theme.colors.border }]}
                      onPress={() => setMaxAge(Math.min(60, maxAge + 1))}
                    >
                      <Ionicons name="add" size={16} color={theme.colors.textPrimary} />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </View>

            {/* Distancia Máxima */}
            <View style={styles.filterSection}>
              <Text style={[styles.sectionTitle, { color: theme.colors.textPrimary, marginBottom: 8 }]}>
                Distancia Máxima
              </Text>
              <View style={styles.pillsRow}>
                {DISTANCE_OPTIONS.map((opt, idx) => {
                  const isSelected = maxDist === opt.value;
                  return (
                    <TouchableOpacity
                      key={idx}
                      style={[
                        styles.distPill,
                        {
                          backgroundColor: isSelected ? theme.colors.primaryDark : theme.colors.surfaceSubtle,
                          borderColor: isSelected ? theme.colors.primaryDark : theme.colors.border
                        }
                      ]}
                      onPress={() => setMaxDist(opt.value)}
                    >
                      <Text style={[styles.distPillText, { color: isSelected ? '#ffffff' : theme.colors.textPrimary }]}>
                        {opt.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Toggle: Solo Perfiles Verificados */}
            <View style={[styles.toggleRow, { borderColor: theme.colors.border }]}>
              <View style={{ flex: 1, paddingRight: 10 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Ionicons name="checkmark-circle" size={16} color="#0077b6" style={{ marginRight: 6 }} />
                  <Text style={[styles.toggleTitle, { color: theme.colors.textPrimary }]}>
                    Solo Perfiles Verificados
                  </Text>
                </View>
                <Text style={[styles.toggleSub, { color: theme.colors.textMuted }]}>
                  Muestra únicamente perfiles con verificación biométrica activa.
                </Text>
              </View>
              <Switch
                value={onlyVerified}
                onValueChange={setOnlyVerified}
                trackColor={{ false: '#ffd0d8', true: theme.colors.primaryDark }}
                thumbColor={onlyVerified ? '#ffffff' : '#f4f3f4'}
              />
            </View>

            {/* Toggle: Con Obsesión Musical */}
            <View style={[styles.toggleRow, { borderColor: theme.colors.border }]}>
              <View style={{ flex: 1, paddingRight: 10 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Ionicons name="musical-notes" size={16} color="#1db954" style={{ marginRight: 6 }} />
                  <Text style={[styles.toggleTitle, { color: theme.colors.textPrimary }]}>
                    Con Obsesión Musical / Spotify
                  </Text>
                </View>
                <Text style={[styles.toggleSub, { color: theme.colors.textMuted }]}>
                  Solo usuarias que tengan su canción o cuenta de Spotify destacada.
                </Text>
              </View>
              <Switch
                value={hasSpotify}
                onValueChange={setHasSpotify}
                trackColor={{ false: '#ffd0d8', true: '#1db954' }}
                thumbColor={hasSpotify ? '#ffffff' : '#f4f3f4'}
              />
            </View>

            {/* Botones Aplicar / Restablecer */}
            <View style={styles.actionButtonsRow}>
              <TouchableOpacity
                style={[styles.resetBtn, { borderColor: theme.colors.border }]}
                onPress={handleReset}
              >
                <Text style={[styles.resetBtnText, { color: theme.colors.textSecondary }]}>
                  Restablecer
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.applyBtn, { backgroundColor: theme.colors.primaryDark }]}
                onPress={handleApply}
              >
                <Text style={styles.applyBtnText}>Aplicar Filtros</Text>
              </TouchableOpacity>
            </View>
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
  filterSection: {
    marginBottom: 16
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10
  },
  sectionTitle: {
    fontSize: 13.5,
    fontWeight: 'bold'
  },
  sectionValue: {
    fontSize: 13,
    fontWeight: 'bold'
  },
  ageButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12
  },
  ageControl: {
    flex: 1
  },
  ageLabel: {
    fontSize: 11.5,
    marginBottom: 6
  },
  stepperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  stepBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center'
  },
  stepVal: {
    fontSize: 15,
    fontWeight: 'bold'
  },
  pillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8
  },
  distPill: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 18,
    borderWidth: 1
  },
  distPillText: {
    fontSize: 12.5,
    fontWeight: '600'
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderTopWidth: 0.8
  },
  toggleTitle: {
    fontSize: 13.5,
    fontWeight: '600'
  },
  toggleSub: {
    fontSize: 11,
    marginTop: 2,
    lineHeight: 14
  },
  actionButtonsRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 18,
    marginBottom: 10
  },
  resetBtn: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: 22,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center'
  },
  resetBtnText: {
    fontSize: 13.5,
    fontWeight: 'bold'
  },
  applyBtn: {
    flex: 2,
    paddingVertical: 13,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center'
  },
  applyBtnText: {
    color: '#ffffff',
    fontSize: 14.5,
    fontWeight: 'bold'
  }
});
