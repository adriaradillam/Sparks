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
  RefreshControl,
  Linking,
  Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme';
import { apiRequest } from '../api';
import PlanChatModal from '../components/PlanChatModal';
import CalendarPickerModal from '../components/CalendarPickerModal';
import PlacePickerModal from '../components/PlacePickerModal';

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

  // Modal para publicar o editar plan
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [editingPlan, setEditingPlan] = useState(null);
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState('coffee');
  const [newDateTime, setNewDateTime] = useState('');
  const [newLocation, setNewLocation] = useState('');
  const [newLocationLat, setNewLocationLat] = useState(null);
  const [newLocationLng, setNewLocationLng] = useState(null);
  const [newDescription, setNewDescription] = useState('');
  const [publishing, setPublishing] = useState(false);

  // Modales de Fecha y Lugar
  const [calendarModalVisible, setCalendarModalVisible] = useState(false);
  const [placeModalVisible, setPlaceModalVisible] = useState(false);

  // Chat del Plan estilo WhatsApp
  const [selectedPlanForChat, setSelectedPlanForChat] = useState(null);
  const [chatModalVisible, setChatModalVisible] = useState(false);

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
      if (data.isJoined) {
        Alert.alert(
          '¡Te has apuntado al plan!',
          '¿Quieres entrar ya al chat de grupo para saludar a las demás chicas?',
          [
            { text: 'Más tarde', style: 'cancel' },
            {
              text: 'Entrar al Chat',
              onPress: () => {
                setSelectedPlanForChat(plan);
                setChatModalVisible(true);
              }
            }
          ]
        );
      } else {
        Alert.alert('Desapuntada', data.message);
      }
    } catch (err) {
      Alert.alert('Error', err.message);
    }
  };

  const handleOpenCreateModal = () => {
    setEditingPlan(null);
    setNewTitle('');
    setNewCategory('coffee');
    setNewDateTime('');
    setNewLocation('');
    setNewLocationLat(null);
    setNewLocationLng(null);
    setNewDescription('');
    setCreateModalVisible(true);
  };

  const handleOpenEditModal = (plan) => {
    setEditingPlan(plan);
    setNewTitle(plan.title);
    setNewCategory(plan.category);
    setNewDateTime(plan.dateTimeText);
    setNewLocation(plan.locationName);
    setNewLocationLat(plan.locationLat || null);
    setNewLocationLng(plan.locationLng || null);
    setNewDescription(plan.description);
    setCreateModalVisible(true);
  };

  const handleShowLocationInfo = (plan) => {
    Alert.alert(
      'Punto de Encuentro',
      `${plan.locationName}\n\nCoordina la hora exacta y detalles con las demás chicas en el chat del plan.`
    );
  };

  const handleSavePlan = async () => {
    if (!newTitle.trim() || !newDateTime.trim() || !newLocation.trim() || !newDescription.trim()) {
      Alert.alert('Campos incompletos', 'Por favor rellena todos los datos de tu plan.');
      return;
    }

    setPublishing(true);
    try {
      if (editingPlan) {
        await apiRequest(`/api/plans/${editingPlan.id}`, {
          method: 'PUT',
          body: JSON.stringify({
            title: newTitle.trim(),
            category: newCategory,
            dateTimeText: newDateTime.trim(),
            locationName: newLocation.trim(),
            locationLat: newLocationLat,
            locationLng: newLocationLng,
            description: newDescription.trim()
          })
        });
        Alert.alert('¡Plan actualizado!', 'Los cambios se han guardado con éxito.');
      } else {
        await apiRequest('/api/plans', {
          method: 'POST',
          body: JSON.stringify({
            title: newTitle.trim(),
            category: newCategory,
            dateTimeText: newDateTime.trim(),
            locationName: newLocation.trim(),
            locationLat: newLocationLat,
            locationLng: newLocationLng,
            description: newDescription.trim()
          })
        });
        Alert.alert('¡Plan publicado!', 'Tu plan ya es visible para toda la comunidad.');
      }
      setCreateModalVisible(false);
      setEditingPlan(null);
      setNewTitle('');
      setNewDateTime('');
      setNewLocation('');
      setNewLocationLat(null);
      setNewLocationLng(null);
      setNewDescription('');
      fetchPlans(selectedCategory);
    } catch (err) {
      Alert.alert('Error al guardar', err.message);
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
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
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

            {item.isMine && (
              <TouchableOpacity
                style={[styles.editBadgeBtn, { backgroundColor: isDarkMode ? '#3d0c1e' : '#ffe5ec', borderColor: theme.colors.border }]}
                onPress={() => handleOpenEditModal(item)}
              >
                <Ionicons name="pencil" size={11} color={theme.colors.primary} style={{ marginRight: 3 }} />
                <Text style={[styles.editBadgeBtnText, { color: theme.colors.primary }]}>Editar</Text>
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.planDateRow}>
            <Ionicons name="time-outline" size={13} color={theme.colors.primary} style={{ marginRight: 4 }} />
            <Text style={[styles.planDateText, { color: theme.colors.primary }]}>{item.dateTimeText}</Text>
          </View>
        </View>

        <Text style={[styles.planTitle, { color: theme.colors.textPrimary }]}>{item.title}</Text>
        <View style={styles.locationRow}>
          <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, marginRight: 8 }}>
            <Ionicons name="location" size={14} color={theme.colors.primary} style={{ marginRight: 4 }} />
            <Text style={[styles.planLocationText, { color: theme.colors.textSecondary }]} numberOfLines={1}>
              {item.locationName}
            </Text>
          </View>
          <TouchableOpacity
            style={[
              styles.openMapsPillBtn,
              { backgroundColor: isDarkMode ? '#3d0c1e' : '#ffe5ec', borderColor: theme.colors.border }
            ]}
            onPress={() => handleShowLocationInfo(item)}
            activeOpacity={0.7}
          >
            <Ionicons name="pin" size={12} color={theme.colors.primary} style={{ marginRight: 4 }} />
            <Text style={[styles.openMapsPillText, { color: theme.colors.primary }]}>Lugar</Text>
          </TouchableOpacity>
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

        {/* Vista previa de último mensaje del grupo estilo WhatsApp */}
        {item.lastMessage && (
          <TouchableOpacity
            style={[
              styles.lastMessagePreview,
              { backgroundColor: isDarkMode ? '#240713' : '#fff5f7', borderColor: theme.colors.border }
            ]}
            onPress={() => {
              if (!item.isJoined) {
                Alert.alert(
                  'Únete al plan',
                  'Debes apuntarte a este plan para acceder a su chat de grupo y hablar con las demás chicas.',
                  [
                    { text: 'Cancelar', style: 'cancel' },
                    { text: '¡Me apunto!', onPress: () => handleToggleJoin(item) }
                  ]
                );
                return;
              }
              setSelectedPlanForChat(item);
              setChatModalVisible(true);
            }}
            activeOpacity={0.7}
          >
            <Ionicons name="chatbubbles" size={13} color={theme.colors.primary} style={{ marginRight: 6 }} />
            <Text style={[styles.lastMessagePreviewText, { color: theme.colors.textSecondary }]} numberOfLines={1}>
              <Text style={{ fontWeight: 'bold', color: theme.colors.textPrimary }}>{item.lastMessage.senderName}: </Text>
              {item.lastMessage.text}
            </Text>
          </TouchableOpacity>
        )}

        {/* Botones de Acción */}
        <View style={styles.actionsRow}>
          {item.isJoined ? (
            <TouchableOpacity
              style={[styles.groupChatBtn, { backgroundColor: theme.colors.primaryDark }]}
              onPress={() => {
                setSelectedPlanForChat(item);
                setChatModalVisible(true);
              }}
            >
              <Ionicons name="chatbubbles" size={16} color="#ffffff" style={{ marginRight: 6 }} />
              <Text style={styles.groupChatBtnText}>Chat del Grupo ({item.attendeeCount})</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[styles.joinBtn, { backgroundColor: theme.colors.primaryDark }]}
              onPress={() => handleToggleJoin(item)}
            >
              <Ionicons name="hand-right" size={15} color="#ffffff" style={{ marginRight: 6 }} />
              <Text style={styles.joinBtnText}>¡Me apunto para chatear!</Text>
            </TouchableOpacity>
          )}

          {/* Botón secundario si está unida */}
          {item.isJoined && (
            item.isMine ? (
              <TouchableOpacity
                style={[styles.statusBadgeBtn, { backgroundColor: isDarkMode ? '#3d0c1e' : '#ffe5ec', borderColor: theme.colors.border }]}
                onPress={() => handleOpenEditModal(item)}
                title="Editar este plan"
              >
                <Ionicons name="create-outline" size={18} color={theme.colors.primary} />
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={[styles.statusBadgeBtn, { backgroundColor: isDarkMode ? '#1e382b' : '#d8f3dc', borderColor: '#2d6a4f' }]}
                onPress={() => handleToggleJoin(item)}
                title="Estás apuntada (toca para desapuntarte)"
              >
                <Ionicons name="checkmark-circle" size={19} color="#2d6a4f" />
              </TouchableOpacity>
            )
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
          onPress={handleOpenCreateModal}
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
                onPress={handleOpenCreateModal}
              >
                <Text style={styles.createFirstBtnText}>+ Publicar un Plan</Text>
              </TouchableOpacity>
            </View>
          }
        />
      )}

      {/* Modal para Crear y Publicar Plan */}
      {/* Vista para Crear y Publicar Plan (Overlay sin conflicto de Modales) */}
      {createModalVisible && (
        <View style={styles.createPlanFullOverlay}>
          <View style={[styles.modalCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.colors.textPrimary }]}>
                {editingPlan ? 'Editar Mi Plan' : 'Publicar Nuevo Plan'}
              </Text>
              <TouchableOpacity onPress={() => setCreateModalVisible(false)} style={{ padding: 4 }}>
                <Ionicons name="close-circle" size={24} color={theme.colors.textMuted} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
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
              <TouchableOpacity
                style={[
                  styles.input,
                  styles.pickerTriggerBtn,
                  { backgroundColor: theme.colors.surfaceSubtle, borderColor: theme.colors.border }
                ]}
                onPress={() => setCalendarModalVisible(true)}
                activeOpacity={0.7}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, marginRight: 8 }}>
                  <Ionicons
                    name="calendar"
                    size={17}
                    color={newDateTime ? theme.colors.primary : theme.colors.textMuted}
                    style={{ marginRight: 8 }}
                  />
                  <Text
                    style={[
                      styles.pickerTriggerText,
                      { color: newDateTime ? theme.colors.textPrimary : theme.colors.textMuted },
                      newDateTime && { fontWeight: '600' }
                    ]}
                    numberOfLines={1}
                  >
                    {newDateTime || 'Toca para elegir fecha y hora...'}
                  </Text>
                </View>
                <View style={[styles.platformTinyBadge, { backgroundColor: isDarkMode ? '#3d0c1e' : '#ffe5ec' }]}>
                  <Ionicons
                    name={Platform.OS === 'ios' ? 'logo-apple' : 'logo-android'}
                    size={12}
                    color={theme.colors.primary}
                    style={{ marginRight: 3 }}
                  />
                  <Text style={[styles.platformTinyBadgeText, { color: theme.colors.primary }]}>
                    {Platform.OS === 'ios' ? 'Apple' : 'Android'}
                  </Text>
                </View>
              </TouchableOpacity>

              <Text style={[styles.label, { color: theme.colors.textPrimary }]}>¿Dónde? (Lugar o zona)</Text>
              <TouchableOpacity
                style={[
                  styles.input,
                  styles.pickerTriggerBtn,
                  { backgroundColor: theme.colors.surfaceSubtle, borderColor: theme.colors.border }
                ]}
                onPress={() => setPlaceModalVisible(true)}
                activeOpacity={0.7}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, marginRight: 8 }}>
                  <Ionicons
                    name="location"
                    size={17}
                    color={newLocation ? theme.colors.primary : theme.colors.textMuted}
                    style={{ marginRight: 8 }}
                  />
                  <Text
                    style={[
                      styles.pickerTriggerText,
                      { color: newLocation ? theme.colors.textPrimary : theme.colors.textMuted },
                      newLocation && { fontWeight: '600' }
                    ]}
                    numberOfLines={1}
                  >
                    {newLocation || 'Toca para abrir el buscador de lugares...'}
                  </Text>
                </View>
                <View style={[styles.platformTinyBadge, { backgroundColor: isDarkMode ? '#3d0c1e' : '#ffe5ec' }]}>
                  <Ionicons name="search" size={12} color={theme.colors.primary} style={{ marginRight: 3 }} />
                  <Text style={[styles.platformTinyBadgeText, { color: theme.colors.primary }]}>
                    Buscador
                  </Text>
                </View>
              </TouchableOpacity>

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
                onPress={handleSavePlan}
                disabled={publishing}
              >
                {publishing ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.publishBtnText}>
                    {editingPlan ? 'Guardar Cambios' : 'Publicar en el Tablón'}
                  </Text>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      )}

      {/* Modal del Chat de Grupo estilo WhatsApp con Detalles de Asistentes */}
      <PlanChatModal
        visible={chatModalVisible}
        planId={selectedPlanForChat?.id}
        onClose={() => {
          setChatModalVisible(false);
          setSelectedPlanForChat(null);
        }}
        onOpenDirectChat={(user) => {
          setChatModalVisible(false);
          setSelectedPlanForChat(null);
          if (onOpenChatWithOrganizer) {
            onOpenChatWithOrganizer(user);
          }
        }}
        onEditPlan={(planToEdit) => {
          setChatModalVisible(false);
          setSelectedPlanForChat(null);
          handleOpenEditModal(planToEdit);
        }}
        onPlanUpdated={() => fetchPlans(selectedCategory)}
      />

      {/* Modal de Calendario Interactivo */}
      <CalendarPickerModal
        visible={calendarModalVisible}
        initialDateTimeText={newDateTime}
        onClose={() => setCalendarModalVisible(false)}
        onSelectDateTime={(formattedText) => {
          setNewDateTime(formattedText);
        }}
      />

      {/* Modal de Búsqueda de Lugares en Google Maps */}
      <PlacePickerModal
        visible={placeModalVisible}
        initialLocation={newLocation}
        onClose={() => setPlaceModalVisible(false)}
        onSelectLocation={({ name, lat, lng }) => {
          setNewLocation(name);
          setNewLocationLat(lat || null);
          setNewLocationLng(lng || null);
        }}
      />
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
  editBadgeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    marginLeft: 8,
    borderWidth: 1
  },
  editBadgeBtnText: {
    fontSize: 10,
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
  lastMessagePreview: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12
  },
  lastMessagePreviewText: {
    fontSize: 12,
    flex: 1
  },
  groupChatBtn: {
    flex: 1,
    flexDirection: 'row',
    paddingVertical: 12,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#ff2a6d',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 2
  },
  groupChatBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: 'bold'
  },
  statusBadgeBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
    borderWidth: 1.5
  },
  peekChatBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
    borderWidth: 1
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
    fontWeight: 'bold',
    color: '#ffffff'
  },
  chatOrganizerBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
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
  },
  openMapsPillBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    borderWidth: 1
  },
  openMapsPillText: {
    fontSize: 10,
    fontWeight: 'bold'
  },
  pickerTriggerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 13
  },
  pickerTriggerText: {
    fontSize: 14
  },
  createPlanFullOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    padding: 16,
    zIndex: 999,
    elevation: 999
  },
  platformTinyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8
  },
  platformTinyBadgeText: {
    fontSize: 10,
    fontWeight: 'bold'
  }
});
