import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  Modal,
  TouchableOpacity,
  ScrollView,
  SafeAreaView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const SAMPLE_NOTES = [
  { id: '1', title: 'Lista de la compra 🛒', date: 'Hoy, 16:40', preview: 'Leche de avena, café de especialidad, fruta, pan integral...' },
  { id: '2', title: 'Ideas regalo cumpleaños Sara 🎁', date: 'Ayer', preview: 'Libro de poesía, maceta de cerámica, sudadera vintage...' },
  { id: '3', title: 'Apuntes clase de diseño 💻', date: '12 Ago', preview: 'Revisar paleta de colores HSL, tipografías legibles...' },
  { id: '4', title: 'Películas pendientes 🎬', date: '8 Ago', preview: 'Past Lives, Portrait of a Lady on Fire, Carol...' }
];

export default function PanicDisguiseModal({ visible, onClose }) {
  const [activeNote, setActiveNote] = useState(null);

  if (!visible) return null;

  return (
    <Modal visible={visible} animationType="fade" transparent={false} onRequestClose={onClose}>
      <SafeAreaView style={styles.container}>
        {/* Cabecera Discreta */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Notas Personales</Text>
          <TouchableOpacity
            style={styles.hiddenExitBtn}
            onPress={onClose}
            activeOpacity={0.6}
          >
            <Ionicons name="ellipsis-horizontal" size={20} color="#8e8e93" />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.body}>
          {/* Barra de Búsqueda simulada */}
          <View style={styles.searchBar}>
            <Ionicons name="search" size={16} color="#8e8e93" style={{ marginRight: 8 }} />
            <Text style={styles.searchPlaceholder}>Buscar en notas...</Text>
          </View>

          <Text style={styles.folderTitle}>Todas las notas ({SAMPLE_NOTES.length})</Text>

          {SAMPLE_NOTES.map((note) => (
            <TouchableOpacity
              key={note.id}
              style={styles.noteCard}
              onPress={() => setActiveNote(note)}
              activeOpacity={0.7}
            >
              <Text style={styles.noteTitle}>{note.title}</Text>
              <Text style={styles.noteDate}>{note.date}</Text>
              <Text style={styles.notePreview} numberOfLines={2}>
                {note.preview}
              </Text>
            </TouchableOpacity>
          ))}

          <View style={styles.footerHelp}>
            <Text style={styles.footerHelpText}>
              Modo Discreción activado. Toca los tres puntos arriba para volver a Sparks.
            </Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f2f2f7'
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e5ea'
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000000'
  },
  hiddenExitBtn: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: '#f2f2f7'
  },
  body: {
    flex: 1,
    padding: 16
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e3e3e8',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 16
  },
  searchPlaceholder: {
    color: '#8e8e93',
    fontSize: 14
  },
  folderTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6c6c70',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 10,
    marginLeft: 4
  },
  noteCard: {
    backgroundColor: '#ffffff',
    padding: 14,
    borderRadius: 12,
    marginBottom: 10,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1
  },
  noteTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 4
  },
  noteDate: {
    fontSize: 12,
    color: '#8e8e93',
    marginBottom: 4
  },
  notePreview: {
    fontSize: 13,
    color: '#3a3a3c',
    lineHeight: 17
  },
  footerHelp: {
    alignItems: 'center',
    marginTop: 25,
    paddingHorizontal: 20
  },
  footerHelpText: {
    fontSize: 11,
    color: '#8e8e93',
    textAlign: 'center'
  }
});
