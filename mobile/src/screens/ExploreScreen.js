import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Modal,
  ScrollView,
  Alert,
  RefreshControl
} from 'react-native';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme';
import { apiRequest } from '../api';
import { getAvatarSource } from './ProfileScreen';
import ReportBlockModal from '../components/ReportBlockModal';
import MatchCelebrationModal from '../components/MatchCelebrationModal';
import ExploreFilterModal from '../components/ExploreFilterModal';

const INTENTIONS = [
  { id: 'all', label: 'Todas', icon: 'flame' },
  { id: 'dating', label: 'Citas', icon: 'heart' },
  { id: 'friends', label: 'Amistad', icon: 'people' },
  { id: 'chat', label: 'Charlar', icon: 'cafe' },
  { id: 'events', label: 'Planes', icon: 'ticket' }
];

export const INTENTION_LABELS = {
  dating: 'Buscando Citas / Pareja',
  friends: 'Buscando Amistades',
  chat: 'Charlar y conocer gente',
  events: 'Compañera de planes y eventos'
};

export default function ExploreScreen({ onOpenChat }) {
  const { theme, isDarkMode } = useTheme();
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedIntention, setSelectedIntention] = useState('all');
  const [location, setLocation] = useState({ lat: 40.416775, lng: -3.703790 });
  const [likeLoading, setLikeLoading] = useState(false);
  const [reportModalVisible, setReportModalVisible] = useState(false);

  // Estados de Match y Filtros
  const [matchModalVisible, setMatchModalVisible] = useState(false);
  const [matchData, setMatchData] = useState(null);
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [filters, setFilters] = useState({
    minAge: 18,
    maxAge: 45,
    maxDist: null,
    onlyVerified: false,
    hasSpotify: false
  });

  const hasActiveFilters =
    filters.minAge !== 18 ||
    filters.maxAge !== 45 ||
    filters.maxDist !== null ||
    filters.onlyVerified ||
    filters.hasSpotify;

  useEffect(() => {
    initLocationAndFetch();
  }, []);

  useEffect(() => {
    fetchNearby(location.lat, location.lng, selectedIntention);
  }, [selectedIntention]);

  const initLocationAndFetch = async () => {
    try {
      let { status } = await Location.requestForegroundPermissionsAsync().catch(() => ({ status: 'denied' }));
      let coords = { latitude: 40.416775, longitude: -3.703790 };

      if (status === 'granted') {
        const currentPos = await Location.getCurrentPositionAsync({}).catch(() => null);
        if (currentPos) {
          coords = currentPos.coords;
          setLocation({ lat: coords.latitude, lng: coords.longitude });
        }
      }
      await fetchNearby(coords.latitude, coords.longitude, selectedIntention);
    } catch (err) {
      console.error(err);
      await fetchNearby(40.416775, -3.703790, selectedIntention);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchNearby = async (lat, lng, intention = 'all', currentFilters = filters) => {
    try {
      let query = `/api/users/nearby?lat=${lat}&lng=${lng}&intention=${intention}`;
      if (currentFilters.minAge) query += `&minAge=${currentFilters.minAge}`;
      if (currentFilters.maxAge) query += `&maxAge=${currentFilters.maxAge}`;
      if (currentFilters.maxDist) query += `&maxDist=${currentFilters.maxDist}`;
      if (currentFilters.onlyVerified) query += `&onlyVerified=true`;
      if (currentFilters.hasSpotify) query += `&hasSpotify=true`;

      const data = await apiRequest(query);
      setProfiles(data.users || []);
    } catch (err) {
      console.error('Error fetching nearby profiles:', err);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchNearby(location.lat, location.lng, selectedIntention, filters).finally(() => setRefreshing(false));
  };

  const handleApplyFilters = (newFilters) => {
    setFilters(newFilters);
    setLoading(true);
    fetchNearby(location.lat, location.lng, selectedIntention, newFilters);
  };

  const handleLike = async (user) => {
    setLikeLoading(true);
    try {
      const data = await apiRequest(`/api/users/${user.id}/like`, { method: 'POST' });
      if (data.isMatch) {
        setMatchData({
          partner: data.partner || user,
          myUser: data.myUser,
          conversationId: data.conversationId
        });
        setSelectedUser(null);
        setMatchModalVisible(true);
      } else {
        Alert.alert('¡Flechazo enviado! 💖', data.message || 'Le hemos avisado de que te gusta.');
      }
    } catch (err) {
      Alert.alert('Error', err.message);
    } finally {
      setLikeLoading(false);
    }
  };

  const handleDirectChat = async (user) => {
    try {
      const data = await apiRequest(`/api/chats/start/${user.id}`, { method: 'POST' });
      setSelectedUser(null);
      onOpenChat(user, data.conversationId);
    } catch (err) {
      Alert.alert('Error al abrir chat', err.message);
    }
  };

  const INTENTION_CONFIG = {
    dating: { label: 'Citas', icon: 'heart', color: '#ff4d6d', bg: 'rgba(255, 77, 109, 0.85)' },
    friends: { label: 'Amigas', icon: 'people', color: '#9b5de5', bg: 'rgba(155, 93, 229, 0.85)' },
    chat: { label: 'Charlar', icon: 'cafe', color: '#f77f00', bg: 'rgba(247, 127, 0, 0.85)' },
    events: { label: 'Planes', icon: 'ticket', color: '#00b4d8', bg: 'rgba(0, 180, 216, 0.85)' },
  };

  const renderItem = ({ item }) => {
    const intentionInfo = INTENTION_CONFIG[item.intention] || INTENTION_CONFIG.dating;

    return (
      <TouchableOpacity
        style={[styles.card, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}
        activeOpacity={0.88}
        onPress={() => {
          setSelectedUser(item);
        }}
      >
        <View style={styles.imageContainer}>
          <Image
            source={getAvatarSource(item.avatarUrl)}
            style={styles.cardImage}
          />
          {/* Insignia de Intención en la foto */}
          <View style={[styles.cardIntentionBadge, { backgroundColor: intentionInfo.bg }]}>
            <Ionicons name={intentionInfo.icon} size={10} color="#ffffff" style={{ marginRight: 3 }} />
            <Text style={styles.cardIntentionText}>{intentionInfo.label}</Text>
          </View>

          {/* Distancia GPS */}
          <View style={styles.distanceBadge}>
            <Ionicons name="location-sharp" size={10} color="#ffffff" style={{ marginRight: 2 }} />
            <Text style={styles.distanceText}>
              {item.approxDistanceOnly ? '< 5 km' : `${item.distance_km ? item.distance_km.toFixed(1) : '1.2'} km`}
            </Text>
          </View>
        </View>

        <View style={styles.cardInfo}>
          <View style={styles.nameRow}>
            <Text style={[styles.cardName, { color: theme.colors.textPrimary }]} numberOfLines={1}>
              {item.name}, <Text style={[styles.cardAge, { color: theme.colors.textSecondary }]}>{item.age}</Text>
            </Text>
            {item.isVerified && (
              <Ionicons name="checkmark-circle" size={15} color="#0077b6" style={{ marginLeft: 4 }} />
            )}
            <View style={styles.onlineDot} />
          </View>

          {item.pronouns ? (
            <Text style={[styles.cardPronouns, { color: theme.colors.primary }]}>{item.pronouns}</Text>
          ) : null}

          {/* Píldora de Obsesión Musical de Spotify si tiene */}
          {item.anthem ? (
            <View style={[styles.cardAnthemPill, { backgroundColor: isDarkMode ? '#0a2312' : '#ebfbee', borderColor: isDarkMode ? '#1b4332' : '#b7e4c7' }]}>
              <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: '#1db954', alignItems: 'center', justifyContent: 'center', marginRight: 4 }}>
                <Ionicons name="musical-notes" size={7} color="#000" />
              </View>
              <Text style={[styles.cardAnthemText, { color: '#1db954' }]} numberOfLines={1}>
                {item.anthem.title} • {item.anthem.artist}
              </Text>
            </View>
          ) : null}

          {/* Micro-tags / Intereses de la usuaria */}
          {item.tags && item.tags.length > 0 ? (
            <View style={styles.cardTagsRow}>
              {item.tags.slice(0, 2).map((tag, idx) => (
                <View key={idx} style={[styles.cardMiniTag, { backgroundColor: isDarkMode ? '#2d0c1b' : '#fff0f3' }]}>
                  <Text style={[styles.cardMiniTagText, { color: theme.colors.primary }]} numberOfLines={1}>{tag}</Text>
                </View>
              ))}
            </View>
          ) : null}

          <Text style={[styles.cardBio, { color: theme.colors.textMuted }]} numberOfLines={2}>
            {item.bio || 'Escríbeme para charlar un rato.'}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Barra superior de la pantalla */}
      <View style={[styles.topBar, { backgroundColor: theme.colors.surface, borderBottomColor: theme.colors.border }]}>
        <View>
          <Text style={[styles.heading, { color: isDarkMode ? theme.colors.primary : theme.colors.primaryDark }]}>
            Cerca de ti
          </Text>
          <Text style={[styles.subheading, { color: theme.colors.textSecondary }]}>
            {profiles.length} perfiles en tu zona
          </Text>
        </View>
        <TouchableOpacity
          style={[styles.refreshIcon, { backgroundColor: theme.colors.surfaceSubtle }]}
          onPress={onRefresh}
        >
          <Ionicons name="refresh-outline" size={18} color={theme.colors.textPrimary} />
        </TouchableOpacity>
      </View>

      {/* Barra de Filtros e Intenciones */}
      <View style={styles.filterBarContainer}>
        <TouchableOpacity
          style={[
            styles.filterTriggerBtn,
            {
              backgroundColor: hasActiveFilters ? theme.colors.primaryDark : theme.colors.surfaceSubtle,
              borderColor: hasActiveFilters ? theme.colors.primaryDark : theme.colors.border
            }
          ]}
          onPress={() => setFilterModalVisible(true)}
          activeOpacity={0.8}
        >
          <Ionicons
            name="options"
            size={16}
            color={hasActiveFilters ? '#ffffff' : theme.colors.textPrimary}
          />
          {hasActiveFilters && <View style={styles.activeFilterDot} />}
        </TouchableOpacity>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.filtersScroll}
          contentContainerStyle={styles.filtersScrollContent}
        >
          {INTENTIONS.map((filter) => {
            const isSelected = selectedIntention === filter.id;
            return (
              <TouchableOpacity
                key={filter.id}
                style={[
                  styles.filterChip,
                  { backgroundColor: theme.colors.surfaceSubtle, borderColor: theme.colors.border },
                  isSelected && { backgroundColor: theme.colors.primaryDark, borderColor: theme.colors.primaryDark }
                ]}
                onPress={() => setSelectedIntention(filter.id)}
              >
                <Ionicons
                  name={filter.icon}
                  size={14}
                  color={isSelected ? '#ffffff' : theme.colors.textSecondary}
                  style={{ marginRight: 5 }}
                />
                <Text
                  style={[
                    styles.filterChipText,
                    { color: theme.colors.textSecondary },
                    isSelected && { color: '#ffffff', fontWeight: 'bold' }
                  ]}
                >
                  {filter.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {loading ? (
        <View style={styles.centerBox}>
          <ActivityIndicator size="large" color={theme.colors.primaryDark} />
          <Text style={[styles.loadingMsg, { color: theme.colors.textSecondary }]}>Calculando distancias GPS...</Text>
        </View>
      ) : (
        <FlatList
          data={profiles}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderItem}
          numColumns={2}
          columnWrapperStyle={styles.row}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[theme.colors.primaryDark]} />}
          ListEmptyComponent={
            <View style={styles.emptyBox}>
              <Ionicons name="search-outline" size={44} color={theme.colors.textMuted} style={{ marginBottom: 10 }} />
              <Text style={[styles.emptyTitle, { color: theme.colors.textPrimary }]}>No hay perfiles con este filtro</Text>
              <Text style={[styles.emptySubtitle, { color: theme.colors.textMuted }]}>Prueba seleccionando "Todas" o amplía tu radio</Text>
            </View>
          }
        />
      )}

      {/* Modal de Detalle de Perfil */}
      <Modal
        visible={!!selectedUser}
        transparent
        animationType="slide"
        onRequestClose={() => setSelectedUser(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.detailCard, { backgroundColor: theme.colors.surface }]}>
            {/* Botones de Cabecera: Reportar/Bloquear y Cerrar */}
            <TouchableOpacity
              style={styles.reportHeaderBtn}
              onPress={() => setReportModalVisible(true)}
              activeOpacity={0.8}
            >
              <Ionicons name="shield-outline" size={17} color="#ffffff" />
            </TouchableOpacity>

            <TouchableOpacity style={styles.closeModalBtn} onPress={() => setSelectedUser(null)}>
              <Ionicons name="close" size={20} color="#ffffff" />
            </TouchableOpacity>

            <ScrollView showsVerticalScrollIndicator={false}>
              {selectedUser && (
                <>
                  <Image
                    source={getAvatarSource(selectedUser.avatarUrl)}
                    style={styles.detailImage}
                  />
                  <View style={styles.detailBody}>
                    <View style={styles.detailHeaderRow}>
                      <View>
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                          <Text style={[styles.detailName, { color: theme.colors.textPrimary }]}>
                            {selectedUser.name}, <Text style={[styles.detailAge, { color: theme.colors.textSecondary }]}>{selectedUser.age}</Text>
                          </Text>
                          {selectedUser.isVerified && (
                            <Ionicons name="checkmark-circle" size={20} color="#0077b6" style={{ marginLeft: 6 }} />
                          )}
                        </View>
                        {selectedUser.pronouns ? (
                          <Text style={[styles.detailPronouns, { color: theme.colors.primary }]}>{selectedUser.pronouns}</Text>
                        ) : null}
                      </View>
                      <View style={[styles.distanceBadgeDetail, { backgroundColor: isDarkMode ? '#3d0c1e' : '#ffe5ec' }]}>
                        <Ionicons name="location-sharp" size={13} color={theme.colors.primary} style={{ marginRight: 4 }} />
                        <Text style={[styles.distanceBadgeDetailText, { color: theme.colors.primary }]}>
                          {selectedUser.approxDistanceOnly ? '< 5 km' : `${selectedUser.distance_km ? selectedUser.distance_km.toFixed(1) : '1.2'} km`}
                        </Text>
                      </View>
                    </View>

                    {/* Obsesión Musical de la Usuaria */}
                    {selectedUser.anthem && (
                      <View style={[styles.userAnthemCard, { backgroundColor: isDarkMode ? '#141d17' : '#f4fbf5', borderColor: isDarkMode ? '#1db95440' : '#b7e4c7' }]}>
                        <Image source={{ uri: selectedUser.anthem.coverUrl }} style={styles.userAnthemCover} />
                        <View style={{ flex: 1, marginLeft: 12 }}>
                          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 2 }}>
                            <View style={{ width: 14, height: 14, borderRadius: 7, backgroundColor: '#1db954', alignItems: 'center', justifyContent: 'center', marginRight: 5 }}>
                              <Ionicons name="musical-notes" size={8} color="#000" />
                            </View>
                            <Text style={{ fontSize: 11, fontWeight: 'bold', color: '#1db954' }}>Obsesión Musical</Text>
                          </View>
                          <Text style={[styles.anthemTitle, { color: theme.colors.textPrimary }]} numberOfLines={1}>
                            {selectedUser.anthem.title}
                          </Text>
                          <Text style={[styles.anthemArtist, { color: theme.colors.textSecondary }]} numberOfLines={1}>
                            {selectedUser.anthem.artist}
                          </Text>
                        </View>
                        <View style={{ paddingHorizontal: 8, paddingVertical: 5, borderRadius: 12, backgroundColor: isDarkMode ? '#1b4332' : '#d8f3dc', flexDirection: 'row', alignItems: 'center' }}>
                          <Ionicons name="sparkles" size={12} color="#1db954" style={{ marginRight: 3 }} />
                          <Text style={{ fontSize: 10, fontWeight: 'bold', color: '#1db954' }}>Top</Text>
                        </View>
                      </View>
                    )}

                    {/* Top Artistas de Spotify de la Usuaria */}
                    {selectedUser.spotify?.connected && selectedUser.spotify.topArtists?.length > 0 && (
                      <View style={[styles.userSpotifyCard, { backgroundColor: isDarkMode ? '#0a2312' : '#f4fbf5', borderColor: isDarkMode ? '#1b4332' : '#d8f3dc' }]}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                            <View style={{ width: 16, height: 16, borderRadius: 8, backgroundColor: '#1db954', alignItems: 'center', justifyContent: 'center', marginRight: 6 }}>
                              <Ionicons name="musical-notes" size={9} color="#000" />
                            </View>
                            <Text style={{ fontSize: 12, fontWeight: 'bold', color: '#1db954' }}>
                              Top Artistas en Spotify
                            </Text>
                          </View>
                          <Text style={{ fontSize: 10, color: theme.colors.textMuted }}>@{selectedUser.spotify.username}</Text>
                        </View>

                        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 2 }}>
                          {selectedUser.spotify.topArtists.map((artist, idx) => (
                            <View key={idx} style={styles.artistMiniItem}>
                              <Image source={{ uri: artist.image }} style={styles.artistMiniImage} />
                              <Text style={[styles.artistMiniName, { color: theme.colors.textPrimary }]} numberOfLines={1}>
                                {artist.name}
                              </Text>
                            </View>
                          ))}
                        </ScrollView>
                      </View>
                    )}

                    {/* Intención */}
                    {selectedUser.intention && (
                      <View style={[styles.intentionCard, { backgroundColor: isDarkMode ? '#2a0a18' : '#fff0f3', borderColor: theme.colors.border }]}>
                        <Ionicons name="heart" size={14} color={theme.colors.primary} style={{ marginRight: 6 }} />
                        <Text style={[styles.intentionLabel, { color: theme.colors.primary }]}>
                          {INTENTION_LABELS[selectedUser.intention] || 'Buscando conectar'}
                        </Text>
                      </View>
                    )}

                    {/* Etiquetas / Tags */}
                    {selectedUser.tags && selectedUser.tags.length > 0 && (
                      <View style={styles.tagsSection}>
                        <Text style={[styles.sectionTitle, { color: theme.colors.textSecondary }]}>Intereses & Identidad</Text>
                        <View style={styles.tagsContainer}>
                          {selectedUser.tags.map((tag, idx) => (
                            <View key={idx} style={[styles.tagChip, { backgroundColor: isDarkMode ? '#3d0c1e' : '#ffe5ec' }]}>
                              <Text style={[styles.tagChipText, { color: theme.colors.primary }]}>{tag}</Text>
                            </View>
                          ))}
                        </View>
                      </View>
                    )}

                    <Text style={[styles.sectionTitle, { color: theme.colors.textSecondary }]}>Sobre mí</Text>
                    <Text style={[styles.detailBio, { color: theme.colors.textPrimary }]}>
                      {selectedUser.bio || 'Esta usuaria aún no ha escrito su biografía.'}
                    </Text>

                    {/* Botones de Acción */}
                    <View style={styles.actionButtonsRow}>
                      <TouchableOpacity
                        style={[styles.actionBtn, styles.likeBtn, { backgroundColor: isDarkMode ? '#3d0c1e' : '#ffe5ec', borderColor: theme.colors.primaryDark }]}
                        onPress={() => handleLike(selectedUser)}
                        disabled={likeLoading}
                      >
                        <Ionicons name="heart" size={18} color={theme.colors.primary} style={{ marginRight: 6 }} />
                        <Text style={[styles.likeBtnText, { color: theme.colors.primary }]}>Flechazo</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={[styles.actionBtn, { backgroundColor: theme.colors.primaryDark }]}
                        onPress={() => handleDirectChat(selectedUser)}
                      >
                        <Ionicons name="chatbubble-ellipses" size={18} color="#ffffff" style={{ marginRight: 6 }} />
                        <Text style={styles.chatBtnText}>Chatear</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
      {/* Modal de Reporte y Bloqueo */}
      <ReportBlockModal
        visible={reportModalVisible}
        targetUser={selectedUser}
        onClose={() => setReportModalVisible(false)}
        onSuccessBlockOrReport={(blockedId) => {
          setProfiles((prev) => prev.filter((p) => p.id !== blockedId));
          setSelectedUser(null);
        }}
      />

      {/* Modal de Celebración de Match Mutuo */}
      <MatchCelebrationModal
        visible={matchModalVisible}
        matchData={matchData}
        onSendMessage={(partner, conversationId) => {
          setMatchModalVisible(false);
          if (onOpenChat) onOpenChat(partner, conversationId);
        }}
        onKeepExploring={() => setMatchModalVisible(false)}
      />

      {/* Modal de Filtros Avanzados */}
      <ExploreFilterModal
        visible={filterModalVisible}
        currentFilters={filters}
        onApplyFilters={handleApplyFilters}
        onClose={() => setFilterModalVisible(false)}
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
    paddingVertical: 12,
    borderBottomWidth: 1
  },
  heading: {
    fontSize: 20,
    fontWeight: 'bold'
  },
  subheading: {
    fontSize: 13
  },
  refreshIcon: {
    padding: 8,
    borderRadius: 20
  },
  filterBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10
  },
  filterTriggerBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
    position: 'relative'
  },
  activeFilterDot: {
    position: 'absolute',
    top: 2,
    right: 2,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ff4d6d',
    borderWidth: 1.5,
    borderColor: '#ffffff'
  },
  filtersWrapper: {
    paddingVertical: 10
  },
  filterScroll: {
    paddingHorizontal: 15
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1
  },
  filterChipText: {
    fontSize: 13,
    fontWeight: '600'
  },
  listContent: {
    padding: 12,
    paddingBottom: 30
  },
  row: {
    justifyContent: 'space-between',
    marginBottom: 14
  },
  card: {
    width: '48%',
    borderRadius: 20,
    borderWidth: 1,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3
  },
  imageContainer: {
    width: '100%',
    height: 195,
    position: 'relative'
  },
  cardImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover'
  },
  cardIntentionBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 7,
    paddingVertical: 3.5,
    borderRadius: 10,
    zIndex: 2
  },
  cardIntentionText: {
    color: '#ffffff',
    fontSize: 9.5,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 0.3
  },
  distanceBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.55)',
    paddingHorizontal: 7,
    paddingVertical: 3.5,
    borderRadius: 10,
    zIndex: 2
  },
  distanceText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '600'
  },
  onlineDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#10b981',
    marginLeft: 6
  },
  cardInfo: {
    padding: 10
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  cardName: {
    fontSize: 14.5,
    fontWeight: 'bold'
  },
  cardAge: {
    fontWeight: 'normal'
  },
  cardPronouns: {
    fontSize: 10.5,
    fontWeight: '600',
    marginTop: 1
  },
  cardAnthemPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 0.8,
    marginTop: 5
  },
  cardAnthemText: {
    fontSize: 9.5,
    fontWeight: '600',
    flex: 1
  },
  cardTagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 5,
    gap: 4
  },
  cardMiniTag: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6
  },
  cardMiniTagText: {
    fontSize: 9.5,
    fontWeight: '600'
  },
  cardBio: {
    fontSize: 11,
    marginTop: 5,
    lineHeight: 15
  },
  centerBox: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  loadingMsg: {
    marginTop: 12,
    fontSize: 14,
    fontWeight: '600'
  },
  emptyBox: {
    alignItems: 'center',
    marginTop: 80,
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
    textAlign: 'center'
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'flex-end'
  },
  detailCard: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: '90%',
    overflow: 'hidden'
  },
  reportHeaderBtn: {
    position: 'absolute',
    top: 15,
    left: 15,
    zIndex: 10,
    backgroundColor: 'rgba(0,0,0,0.5)',
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center'
  },
  closeModalBtn: {
    position: 'absolute',
    top: 15,
    right: 15,
    zIndex: 10,
    backgroundColor: 'rgba(0,0,0,0.5)',
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center'
  },
  detailImage: {
    width: '100%',
    height: 280,
    resizeMode: 'cover'
  },
  detailBody: {
    padding: 24
  },
  detailHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12
  },
  detailName: {
    fontSize: 24,
    fontWeight: 'bold'
  },
  detailAge: {
    fontWeight: 'normal'
  },
  detailPronouns: {
    fontSize: 13,
    fontWeight: '600',
    marginTop: 2
  },
  distanceBadgeDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15
  },
  distanceBadgeDetailText: {
    fontWeight: 'bold',
    fontSize: 13
  },
  userAnthemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 14
  },
  userAnthemCover: {
    width: 46,
    height: 46,
    borderRadius: 10
  },
  anthemTitle: {
    fontSize: 14,
    fontWeight: 'bold'
  },
  anthemArtist: {
    fontSize: 12,
    marginTop: 2
  },
  detailPlayBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8
  },
  userSpotifyCard: {
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 14
  },
  artistMiniItem: {
    alignItems: 'center',
    marginRight: 12,
    width: 58
  },
  artistMiniImage: {
    width: 46,
    height: 46,
    borderRadius: 23,
    borderWidth: 1.5,
    borderColor: '#1db954',
    marginBottom: 4
  },
  artistMiniName: {
    fontSize: 10,
    fontWeight: 'bold',
    textAlign: 'center'
  },
  intentionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 14,
    marginBottom: 16,
    borderWidth: 1
  },
  intentionLabel: {
    fontSize: 13,
    fontWeight: 'bold'
  },
  tagsSection: {
    marginBottom: 16
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 6
  },
  tagChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
    marginBottom: 8
  },
  tagChipText: {
    fontSize: 12,
    fontWeight: '600'
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 6
  },
  detailBio: {
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 25
  },
  actionButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between'
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 25,
    marginHorizontal: 5
  },
  likeBtn: {
    borderWidth: 2
  },
  likeBtnText: {
    fontSize: 16,
    fontWeight: 'bold'
  },
  chatBtnText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold'
  }
});
