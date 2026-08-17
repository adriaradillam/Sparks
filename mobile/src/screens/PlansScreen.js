import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  TouchableOpacity,
  Image,
  Modal,
  TextInput,
  ActivityIndicator,
  ScrollView,
  Alert,
  RefreshControl
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme';
import { apiRequest } from '../api';

const CATEGORIES = [
  { id: 'all', label: 'Todos', icon: 'apps' },
  { id: 'coffee', label: 'Café & Tapas', icon: 'cafe' },
  { id: 'outdoor', label: 'Aire Libre', icon: 'leaf' },
  { id: 'party', label: 'Fiesta & Juegos', icon: 'musical-notes' },
  { id: 'culture', label: 'Cultura & Libros', icon: 'book' }
];

const CATEGORY_COLORS = {
  coffee: { bg: '#ffe8d6', text: '#b08968', icon: 'cafe' },
  outdoor: { bg: '#d8f3dc', text: '#2d6a4f', icon: 'leaf' },
  party: { bg: '#ffccd5', text: '#c9184a', icon: 'musical-notes' },
  culture: { bg: '#e0aaff', text: '#5a189a', icon: 'book' },
  sports: { bg: '#caf0f8', text: '#0077b6', icon: 'fitness' }
};

export default function PlansScreen({ onOpenChatWithOrganizer }) {
  const { theme, isDarkMode } = useTheme();
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('all');

  // Modal para publicar plan
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState('coffee');
  const [newDateTime, setNewDateTime] = useState('');
  const [newLocation, setNewLocation] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [publishing, setPublishing] = useState(false);

  useEffect(() => {
    fetchPlans(selectedCategory);
  }, [selectedCategory]);

  const fetchPlans = async (category = 'all') => {
    try {
      const data = await apiRequest(`/api/plans?category=${category}`);
      setPlans(data.plans || []);
    } catch (err) {
      console.error('Error fetching plans:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchPlans(selectedCategory);
  };

  const handleToggleJoin = async (plan) => {
    try {
      const data = await apiRequest(`/api/plans/${plan.id}/join`, { method: 'POST' });
      setPlans((prev) =>
        prev.map((p) =>
          p.id === plan.id
            ? { ...p, isJoined: data.isJoined, attendeeCount: data.attendeeCount }
            : p
        )
      );
      Alert.alert(data.isJoined ? '¡Genial!' : 'Desapuntada', data.message);
    } catch (err) {
      Alert.alert('Error', err.message);
    }
  };

  const handlePublishPlan = async () => {
    if (!newTitle.trim() || !newDateTime.trim() || !newLocation.trim() || !newDescription.trim()) {
      Alert.alert('Campos incompletos', 'Por favor rellena todos los datos de tu plan.');
      return;
    }

    setPublishing(true);
    try {
      await apiRequest('/api/plans', {
        method: 'POST',
        body: JSON.stringify({
          title: newTitle.trim(),
          category: newCategory,
          dateTimeText: newDateTime.trim(),
          locationName: newLocation.trim(),
          description: newDescription.trim()
        })
      });
      setCreateModalVisible(false);
      setNewTitle('');
      setNewDateTime('');
      setNewLocation('');
      setNewDescription('');
      fetchPlans(selectedCategory);
      Alert.alert('¡Plan publicado!', 'Tu plan ya es visible para toda la comunidad.');
    } catch (err) {
      Alert.alert('Error al publicar', err.message);
    } finally {
      setPublishing(false);
    }
  };

  const renderPlanItem = ({ item }) => {
    const catStyle = CATEGORY_COLORS[item.category] || CATEGORY_COLORS.coffee;

    return (
      <View style={[styles.planCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
        {/* Encabezado del Plan */}
        <View style={styles.cardHeader}>
          <View style={[styles.categoryBadge, { backgroundColor: isDarkMode ? '#2d0c1b' : catStyle.bg }]}>
            <Ionicons
              name={catStyle.icon}
              size={12}
              color={isDarkMode ? theme.colors.primary : catStyle.text}
              style={{ marginRight: 4 }}
            />
            <Text style={[styles.categoryBadgeText, { color: isDarkMode ? theme.colors.primary : catStyle.text }]}>
              {item.category.toUpperCase()}
            </Text>
          </View>
          <View style={styles.planDateRow}>
            <Ionicons name="time-outline" size={13} color={theme.colors.primary} style={{ marginRight: 4 }} />
            <Text style={[styles.planDateText, { color: theme.colors.primary }]}>{item.dateTimeText}</Text>
          </View>
        </View>

        <Text style={[styles.planTitle, { color: theme.colors.textPrimary }]}>{item.title}</Text>
        <View style={styles.locationRow}>
          <Ionicons name="location-outline" size={14} color={theme.colors.textSecondary} style={{ marginRight: 4 }} />
          <Text style={[styles.planLocationText, { color: theme.colors.textSecondary }]}>{item.locationName}</Text>
        </View>
        <Text style={[styles.planDescription, { color: theme.colors.textPrimary }]}>{item.description}</Text>

        {/* Organizadora y Asistentes */}
        <View style={[styles.attendeesRow, { borderColor: theme.colors.border }]}>
          <View style={styles.organizerInfo}>
            <Image source={{ uri: item.creator.avatarUrl }} style={styles.organizerAvatar} />
            <View>
              <Text style={[styles.organizerRole, { color: theme.colors.textMuted }]}>Propuesto por</Text>
              <Text style={[styles.organizerName, { color: theme.colors.textPrimary }]}>{item.creator.name}</Text>
            </View>
          </View>

          <View style={[styles.attendeesCounter, { backgroundColor: isDarkMode ? '#3d0c1e' : '#ffe5ec' }]}>
            <Ionicons name="people" size={13} color={theme.colors.primary} style={{ marginRight: 4 }} />
            <Text style={[styles.attendeesCountText, { color: theme.colors.primary }]}>
              <Text style={{ fontWeight: 'bold' }}>{item.attendeeCount}</Text> apuntadas
            </Text>
          </View>
        </View>

        {/* Botones de Acción */}
        <View style={styles.actionsRow}>
          <TouchableOpacity
            style={[
              styles.joinBtn,
              item.isJoined ? styles.joinBtnActive : { backgroundColor: theme.colors.primaryDark }
            ]}
            onPress={() => handleToggleJoin(item)}
          >
            <Ionicons
              name={item.isJoined ? 'checkmark-circle' : 'hand-right'}
              size={16}
              color="#ffffff"
              style={{ marginRight: 6 }}
            />
            <Text
              style={[
                styles.joinBtnText,
                item.isJoined ? styles.joinBtnTextActive : styles.joinBtnTextInactive
              ]}
            >
              {item.isJoined ? '¡Estás apuntada!' : '¡Me apunto!'}
            </Text>
          </TouchableOpacity>

          {!item.isMine && (
            <TouchableOpacity
              style={[styles.chatOrganizerBtn, { backgroundColor: isDarkMode ? '#3d0c1e' : '#ffe5ec', borderColor: theme.colors.border }]}
              onPress={() => onOpenChatWithOrganizer(item.creator)}
            >
              <Ionicons name="chatbubble-ellipses" size={18} color={theme.colors.primary} />
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Barra Superior */}
      <View style={[styles.topBar, { backgroundColor: theme.colors.surface, borderBottomColor: theme.colors.border }]}>
        <View>
          <Text style={[styles.heading, { color: isDarkMode ? theme.colors.primary : theme.colors.primaryDark }]}>
            Planes & Quedadas
          </Text>
          <Text style={[styles.subheading, { color: theme.colors.textSecondary }]}>
            Únete a planes de la comunidad
          </Text>
        </View>
        <TouchableOpacity
          style={[styles.newPlanHeaderBtn, { backgroundColor: theme.colors.primaryDark }]}
          onPress={() => setCreateModalVisible(true)}
        >
          <Ionicons name="add" size={16} color="#ffffff" style={{ marginRight: 2 }} />
          <Text style={styles.newPlanHeaderBtnText}>Crear Plan</Text>
        </TouchableOpacity>
      </View>

      {/* Selector de Categorías */}
      <View style={[styles.categoriesWrapper, { backgroundColor: theme.colors.surface, borderBottomColor: theme.colors.border }]}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.catScroll}>
          {CATEGORIES.map((cat) => {
            const isSelected = selectedCategory === cat.id;
            return (
              <TouchableOpacity
                key={cat.id}
                style={[
                  styles.catChip,
                  { backgroundColor: theme.colors.surfaceSubtle, borderColor: theme.colors.border },
                  isSelected && { backgroundColor: theme.colors.primaryDark, borderColor: theme.colors.primaryDark }
                ]}
                onPress={() => setSelectedCategory(cat.id)}
              >
                <Ionicons
                  name={cat.icon}
                  size={14}
                  color={isSelected ? '#ffffff' : theme.colors.textSecondary}
                  style={{ marginRight: 5 }}
                />
                <Text
                  style={[
                    styles.catChipText,
                    { color: theme.colors.textSecondary },
                    isSelected && { color: '#ffffff', fontWeight: 'bold' }
                  ]}
                >
                  {cat.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {loading ? (
        <View style={styles.centerBox}>
          <ActivityIndicator size="large" color={theme.colors.primaryDark} />
        </View>
      ) : (
        <FlatList
          data={plans}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderPlanItem}
          contentContainerStyle={styles.plansList}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[theme.colors.primaryDark]}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyBox}>
              <Ionicons name="calendar-outline" size={44} color={theme.colors.textMuted} style={{ marginBottom: 10 }} />
              <Text style={[styles.emptyTitle, { color: theme.colors.textPrimary }]}>No hay planes en esta categoría</Text>
              <Text style={[styles.emptySubtitle, { color: theme.colors.textMuted }]}>
                ¡Sé la primera en proponer un café, una ruta o un concierto!
              </Text>
              <TouchableOpacity
                style={[styles.createFirstBtn, { backgroundColor: theme.colors.primaryDark }]}
                onPress={() => setCreateModalVisible(true)}
              >
                <Text style={styles.createFirstBtnText}>+ Publicar un Plan</Text>
              </TouchableOpacity>
            </View>
          }
        />
      )}

      {/* Modal para Crear y Publicar Plan */}
      <Modal
        visible={createModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setCreateModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: theme.colors.surface }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.colors.textPrimary }]}>Publicar Nuevo Plan</Text>
              <TouchableOpacity onPress={() => setCreateModalVisible(false)}>
                <Ionicons name="close" size={20} color={theme.colors.textMuted} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={[styles.label, { color: theme.colors.textPrimary }]}>Título del Plan</Text>
              <TextInput
                style={[styles.input, { backgroundColor: theme.colors.surfaceSubtle, borderColor: theme.colors.border, color: theme.colors.textPrimary }]}
                placeholder="Ej. Tarde de café y libros en Malasaña"
                placeholderTextColor={theme.colors.textMuted}
                value={newTitle}
                onChangeText={setNewTitle}
              />

              <Text style={[styles.label, { color: theme.colors.textPrimary }]}>Categoría</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.choiceRow}>
                {CATEGORIES.filter((c) => c.id !== 'all').map((cat) => {
                  const isSelected = newCategory === cat.id;
                  return (
                    <TouchableOpacity
                      key={cat.id}
                      style={[
                        styles.choiceChip,
                        { backgroundColor: theme.colors.surfaceSubtle, borderColor: theme.colors.border },
                        isSelected && { backgroundColor: theme.colors.primaryDark, borderColor: theme.colors.primaryDark }
                      ]}
                      onPress={() => setNewCategory(cat.id)}
                    >
                      <Ionicons
                        name={cat.icon}
                        size={13}
                        color={isSelected ? '#ffffff' : theme.colors.textSecondary}
                        style={{ marginRight: 4 }}
                      />
                      <Text
                        style={[
                          styles.choiceChipText,
                          { color: theme.colors.textSecondary },
                          isSelected && { color: '#ffffff', fontWeight: 'bold' }
                        ]}
                      >
                        {cat.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>

              <Text style={[styles.label, { color: theme.colors.textPrimary }]}>¿Cuándo? (Fecha y hora)</Text>
              <TextInput
                style={[styles.input, { backgroundColor: theme.colors.surfaceSubtle, borderColor: theme.colors.border, color: theme.colors.textPrimary }]}
                placeholder="Ej. Este Viernes • 19:30"
                placeholderTextColor={theme.colors.textMuted}
                value={newDateTime}
                onChangeText={setNewDateTime}
              />

              <Text style={[styles.label, { color: theme.colors.textPrimary }]}>¿Dónde? (Lugar o zona)</Text>
              <TextInput
                style={[styles.input, { backgroundColor: theme.colors.surfaceSubtle, borderColor: theme.colors.border, color: theme.colors.textPrimary }]}
                placeholder="Ej. Parque del Retiro / Cafetería Federal"
                placeholderTextColor={theme.colors.textMuted}
                value={newLocation}
                onChangeText={setNewLocation}
              />

              <Text style={[styles.label, { color: theme.colors.textPrimary }]}>Descripción del Plan</Text>
              <TextInput
                style={[
                  styles.input,
                  styles.textArea,
                  { backgroundColor: theme.colors.surfaceSubtle, borderColor: theme.colors.border, color: theme.colors.textPrimary }
                ]}
                placeholder="Cuéntanos de qué va el plan y a quién esperas conocer..."
                placeholderTextColor={theme.colors.textMuted}
                multiline
                numberOfLines={3}
                value={newDescription}
                onChangeText={setNewDescription}
              />

              <TouchableOpacity
                style={[styles.publishBtn, { backgroundColor: theme.colors.primaryDark }]}
                onPress={handlePublishPlan}
                disabled={publishing}
              >
                {publishing ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.publishBtnText}>Publicar en el Tablón</Text>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1
  },
  heading: {
    fontSize: 22,
    fontWeight: 'bold'
  },
  subheading: {
    fontSize: 13
  },
  newPlanHeaderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20
  },
  newPlanHeaderBtnText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 13
  },
  categoriesWrapper: {
    paddingVertical: 10,
    borderBottomWidth: 1
  },
  catScroll: {
    paddingHorizontal: 14
  },
  catChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1
  },
  catChipText: {
    fontSize: 13,
    fontWeight: '600'
  },
  plansList: {
    padding: 16,
    paddingBottom: 30
  },
  planCard: {
    borderRadius: 22,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 8,
    elevation: 3
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10
  },
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12
  },
  categoryBadgeText: {
    fontSize: 11,
    fontWeight: 'bold'
  },
  planDateRow: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  planDateText: {
    fontSize: 12,
    fontWeight: '700'
  },
  planTitle: {
    fontSize: 17,
    fontWeight: 'bold',
    lineHeight: 22,
    marginBottom: 6
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8
  },
  planLocationText: {
    fontSize: 13,
    fontWeight: '600'
  },
  planDescription: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 14
  },
  attendeesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    marginBottom: 12
  },
  organizerInfo: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  organizerAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginRight: 10
  },
  organizerRole: {
    fontSize: 10
  },
  organizerName: {
    fontSize: 13,
    fontWeight: 'bold'
  },
  attendeesCounter: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12
  },
  attendeesCountText: {
    fontSize: 12
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  joinBtn: {
    flex: 1,
    flexDirection: 'row',
    paddingVertical: 12,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center'
  },
  joinBtnActive: {
    backgroundColor: '#2ec4b6'
  },
  joinBtnText: {
    fontSize: 14,
    fontWeight: 'bold'
  },
  joinBtnTextInactive: {
    color: '#ffffff'
  },
  joinBtnTextActive: {
    color: '#ffffff'
  },
  chatOrganizerBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 10,
    borderWidth: 1
  },
  centerBox: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  emptyBox: {
    alignItems: 'center',
    marginTop: 60,
    paddingHorizontal: 30
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center'
  },
  emptySubtitle: {
    fontSize: 13,
    marginTop: 6,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 16
  },
  createFirstBtn: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25
  },
  createFirstBtnText: {
    color: '#fff',
    fontWeight: 'bold'
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    padding: 16
  },
  modalCard: {
    borderRadius: 26,
    padding: 22,
    maxHeight: '90%'
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14
  },
  modalTitle: {
    fontSize: 19,
    fontWeight: 'bold'
  },
  label: {
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 6,
    marginTop: 10
  },
  choiceRow: {
    flexDirection: 'row',
    marginBottom: 6
  },
  choiceChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    marginRight: 8
  },
  choiceChipText: {
    fontSize: 12
  },
  input: {
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    marginBottom: 6
  },
  textArea: {
    height: 75,
    textAlignVertical: 'top'
  },
  publishBtn: {
    paddingVertical: 14,
    borderRadius: 25,
    alignItems: 'center',
    marginTop: 16
  },
  publishBtnText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: 'bold'
  }
});
