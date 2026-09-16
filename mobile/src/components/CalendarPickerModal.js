import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  Modal,
  TouchableOpacity,
  Platform
} from 'react-native';
import DateTimePicker, { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme';

const MONTH_NAMES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

const DAY_NAMES = [
  'Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'
];

export function formatDateTime(date) {
  if (!date || !(date instanceof Date) || isNaN(date.getTime())) return '';
  const dayOfWeek = DAY_NAMES[date.getDay()];
  const day = date.getDate();
  const month = MONTH_NAMES[date.getMonth()];
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${dayOfWeek}, ${day} de ${month} • ${hours}:${minutes}h`;
}

export default function CalendarPickerModal({
  visible,
  initialDateTimeText = '',
  onClose,
  onSelectDateTime
}) {
  const { theme, isDarkMode } = useTheme();

  // Fecha temporal en selección (para iOS)
  const [selectedDate, setSelectedDate] = useState(() => {
    const now = new Date();
    now.setMinutes(0, 0, 0);
    now.setHours(now.getHours() + 1);
    return now;
  });

  // En Android: usamos la API imperativa DateTimePickerAndroid.open oficial para cero lag y compatibilidad total
  useEffect(() => {
    if (!visible) return;

    if (Platform.OS === 'android') {
      const initial = new Date();
      initial.setMinutes(0, 0, 0);
      initial.setHours(initial.getHours() + 1);

      try {
        if (DateTimePickerAndroid && typeof DateTimePickerAndroid.open === 'function') {
          DateTimePickerAndroid.open({
            value: initial,
            mode: 'date',
            is24Hour: true,
            minimumDate: new Date(),
            onChange: (dateEvt, chosenDate) => {
              if (dateEvt.type === 'set' && chosenDate) {
                // Paso 2: Abrir inmediatamente el reloj nativo TimePicker de Android
                DateTimePickerAndroid.open({
                  value: chosenDate,
                  mode: 'time',
                  is24Hour: true,
                  onChange: (timeEvt, chosenTime) => {
                    if (timeEvt.type === 'set' && chosenTime) {
                      const finalDate = new Date(chosenDate);
                      finalDate.setHours(chosenTime.getHours(), chosenTime.getMinutes(), 0, 0);
                      const formatted = formatDateTime(finalDate);
                      onSelectDateTime(formatted, finalDate.toISOString());
                    }
                    onClose();
                  }
                });
              } else {
                onClose();
              }
            }
          });
        }
      } catch (err) {
        console.warn('Error abriendo DateTimePickerAndroid:', err);
        onClose();
      }
    } else {
      // iOS: inicializar fecha
      const now = new Date();
      now.setMinutes(0, 0, 0);
      now.setHours(now.getHours() + 1);
      setSelectedDate(now);
    }
  }, [visible]);

  // Manejador para iOS
  const handleIOSChange = (event, date) => {
    if (date) {
      setSelectedDate(date);
    }
  };

  const handleIOSConfirm = () => {
    const formatted = formatDateTime(selectedDate);
    onSelectDateTime(formatted, selectedDate.toISOString());
    onClose();
  };

  // En Android el diálogo del sistema se maneja imperativamente sin JSX
  if (Platform.OS === 'android') {
    return null;
  }

  if (!visible) return null;

  // En iOS: mostramos el UIDatePicker nativo de Apple con diseño de rueda/spinner
  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.iosOverlay}>
        <SafeAreaView style={[styles.iosSheet, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
          {/* Barra superior de herramientas estilo iOS */}
          <View style={[styles.iosToolbar, { borderBottomColor: theme.colors.border }]}>
            <TouchableOpacity onPress={onClose} style={styles.toolbarBtn}>
              <Text style={[styles.toolbarBtnTextCancel, { color: theme.colors.textMuted }]}>
                Cancelar
              </Text>
            </TouchableOpacity>

            <View style={{ alignItems: 'center' }}>
              <Text style={[styles.toolbarTitle, { color: theme.colors.textPrimary }]}>
                Fecha y Hora
              </Text>
            </View>

            <TouchableOpacity onPress={handleIOSConfirm} style={styles.toolbarBtn}>
              <Text style={[styles.toolbarBtnTextDone, { color: theme.colors.primary }]}>
                Listo
              </Text>
            </TouchableOpacity>
          </View>

          {/* UIDatePicker Nativo de Apple */}
          <View style={styles.pickerWrapper}>
            <DateTimePicker
              value={selectedDate}
              mode="datetime"
              display="spinner"
              locale="es-ES"
              minimumDate={new Date()}
              onChange={handleIOSChange}
              textColor={isDarkMode ? '#ffffff' : '#111827'}
              themeVariant={isDarkMode ? 'dark' : 'light'}
              style={styles.iosPicker}
            />
          </View>

          {/* Vista previa de la fecha seleccionada */}
          <View style={[styles.previewBox, { backgroundColor: isDarkMode ? '#280814' : '#ffe5ec' }]}>
            <Ionicons name="sparkles" size={16} color={theme.colors.primary} style={{ marginRight: 6 }} />
            <Text style={[styles.previewText, { color: isDarkMode ? '#ffb3c6' : theme.colors.primaryDark }]}>
              {formatDateTime(selectedDate)}
            </Text>
          </View>
        </SafeAreaView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  iosOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end'
  },
  iosSheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderTopWidth: 1,
    paddingBottom: 16
  },
  iosToolbar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth
  },
  toolbarBtn: {
    paddingVertical: 4,
    paddingHorizontal: 8
  },
  toolbarBtnTextCancel: {
    fontSize: 16
  },
  toolbarBtnTextDone: {
    fontSize: 16,
    fontWeight: 'bold'
  },
  toolbarTitle: {
    fontSize: 16,
    fontWeight: '600'
  },
  pickerWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10
  },
  iosPicker: {
    width: '100%',
    height: 216
  },
  previewBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 20,
    marginTop: 6,
    marginBottom: 10,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 14
  },
  previewText: {
    fontSize: 14,
    fontWeight: 'bold'
  }
});
