import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  Modal,
  TextInput,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Platform
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme';

const POPULAR_VENUES = [
  {
    id: 'pop-1',
    name: 'Toma Café (Malasaña)',
    address: 'Calle de la Palma, 49, Madrid',
    category: 'Cafetería & Brunch',
    icon: 'cafe',
    lat: 40.4262,
    lng: -3.7042
  },
  {
    id: 'pop-2',
    name: 'Parque de El Retiro (Estanque)',
    address: 'Paseo de Fernán Núñez, Retiro, Madrid',
    category: 'Parque & Aire Libre',
    icon: 'leaf',
    lat: 40.4153,
    lng: -3.6844
  },
  {
    id: 'pop-3',
    name: 'Círculo de Bellas Artes (Azotea)',
    address: 'Calle de Alcalá, 42, Centro, Madrid',
    category: 'Cultura & Vistas',
    icon: 'sparkles',
    lat: 40.4187,
    lng: -3.6967
  },
  {
    id: 'pop-4',
    name: 'Epic Board Game Café',
    address: 'Calle de los Piamonteses, 4, Chueca, Madrid',
    category: 'Juegos & Cervezas',
    icon: 'game-controller',
    lat: 40.4215,
    lng: -3.6980
  },
  {
    id: 'pop-5',
    name: 'Café Federal',
    address: 'Plaza de las Comendadoras, 9, Madrid',
    category: 'Café & Charla',
    icon: 'cafe',
    lat: 40.4285,
    lng: -3.7088
  },
  {
    id: 'pop-6',
    name: 'Templo de Debod',
    address: 'Calle de Ferraz, 1, Moncloa, Madrid',
    category: 'Atardeceres & Picnic',
    icon: 'sunny',
    lat: 40.4240,
    lng: -3.7178
  },
  {
    id: 'pop-7',
    name: 'Librería Ocho y Medio',
    address: 'Calle de Martín de los Heros, 11, Argüelles, Madrid',
    category: 'Libros & Café',
    icon: 'book',
    lat: 40.4255,
    lng: -3.7145
  },
  {
    id: 'pop-8',
    name: 'Terraza El Viajero (La Latina)',
    address: 'Plaza de la Cebada, 11, La Latina, Madrid',
    category: 'Tapas & Terraza',
    icon: 'wine',
    lat: 40.4116,
    lng: -3.7095
  }
];

export default function PlacePickerModal({
  visible,
  initialLocation = '',
  onClose,
  onSelectLocation
}) {
  const { theme, isDarkMode } = useTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const debounceTimer = useRef(null);

  useEffect(() => {
    if (visible) {
      setSearchQuery(initialLocation || '');
      setResults([]);
    }
  }, [visible, initialLocation]);

  useEffect(() => {
    if (debounceTimer.current) clearTimeout(debounceTimer.current);

    const q = searchQuery.trim();
    if (q.length < 2) {
      setResults([]);
      setSearching(false);
      return;
    }

    setSearching(true);
    debounceTimer.current = setTimeout(async () => {
      try {
        const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q)}&limit=7&countrycodes=es&addressdetails=1`;
        const res = await fetch(url, {
          headers: {
            'User-Agent': 'SparksApp/1.0 (contacto@sparks.app)'
          }
        });
        const data = await res.json();

        if (Array.isArray(data) && data.length > 0) {
          const mapped = data.map((item, idx) => {
            const displayName = item.display_name || '';
            const parts = displayName.split(',');
            const title = parts[0] ? parts[0].trim() : item.name || q;
            const subtitle = parts.slice(1, 3).join(',').trim();
            return {
              id: `geo-${item.place_id || idx}`,
              name: title,
              address: subtitle || parts.slice(1, 4).join(',').trim(),
              category: 'Lugar encontrado',
              icon: 'location-sharp',
              lat: parseFloat(item.lat),
              lng: parseFloat(item.lon)
            };
          });
          setResults(mapped);
        } else {
          // Filtrado local de sitios populares si la API externa no devuelve resultados
          const filteredPopular = POPULAR_VENUES.filter(v =>
            v.name.toLowerCase().includes(q.toLowerCase()) ||
            v.address.toLowerCase().includes(q.toLowerCase()) ||
            v.category.toLowerCase().includes(q.toLowerCase())
          );
          setResults(filteredPopular);
        }
      } catch (err) {
        console.warn('Búsqueda de lugar en buscador:', err);
        // Fallback local
        const filteredPopular = POPULAR_VENUES.filter(v =>
          v.name.toLowerCase().includes(q.toLowerCase()) ||
          v.address.toLowerCase().includes(q.toLowerCase())
        );
        setResults(filteredPopular);
      } finally {
        setSearching(false);
      }
    }, 350);

    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
    };
  }, [searchQuery]);

  const handleSelect = (place) => {
    const cleanAddress = place.address ? ` (${place.address.split(',')[0].trim()})` : '';
    const finalName = place.name.includes('(') ? place.name : `${place.name}${cleanAddress}`;
    onSelectLocation({
      name: finalName,
      lat: place.lat,
      lng: place.lng
    });
    onClose();
  };

  const handleSelectCustomText = () => {
    if (!searchQuery.trim()) return;
    onSelectLocation({
      name: searchQuery.trim(),
      lat: undefined,
      lng: undefined
    });
    onClose();
  };

  if (!visible) return null;

  const showResults = searchQuery.trim().length >= 2;
  const displayData = showResults ? results : POPULAR_VENUES;

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <SafeAreaView style={[styles.modalSheet, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
          {/* Header */}
          <View style={[styles.sheetHeader, { borderBottomColor: theme.colors.border }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <View style={[styles.headerIconCircle, { backgroundColor: isDarkMode ? '#3d0c1e' : '#ffe5ec' }]}>
                <Ionicons name="search" size={18} color={theme.colors.primary} />
              </View>
              <View style={{ marginLeft: 10 }}>
                <Text style={[styles.sheetTitle, { color: theme.colors.textPrimary }]}>
                  Buscador de Lugares
                </Text>
                <Text style={[styles.sheetSubtitle, { color: theme.colors.textMuted }]}>
                  Elige dónde quedar para tu plan
                </Text>
              </View>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close-circle" size={26} color={theme.colors.textMuted} />
            </TouchableOpacity>
          </View>

          {/* Barra de Búsqueda Integrada */}
          <View style={styles.searchBarWrapper}>
            <View style={[styles.searchBar, { backgroundColor: theme.colors.surfaceSubtle, borderColor: theme.colors.border }]}>
              <Ionicons name="search" size={18} color={theme.colors.primary} style={{ marginRight: 8 }} />
              <TextInput
                style={[styles.searchInput, { color: theme.colors.textPrimary }]}
                placeholder="Buscar cafetería, parque, calle o plaza..."
                placeholderTextColor={theme.colors.textMuted}
                value={searchQuery}
                onChangeText={setSearchQuery}
                autoFocus
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setSearchQuery('')} style={{ padding: 4 }}>
                  <Ionicons name="close-circle" size={18} color={theme.colors.textMuted} />
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* Sugerencia Rápida para Usar el Texto Personalizado */}
          {searchQuery.trim().length > 0 && (
            <TouchableOpacity
              style={[styles.customChoiceBanner, { backgroundColor: isDarkMode ? '#280814' : '#ffe5ec', borderColor: theme.colors.border }]}
              onPress={handleSelectCustomText}
              activeOpacity={0.7}
            >
              <Ionicons name="add-circle" size={18} color={theme.colors.primary} style={{ marginRight: 8 }} />
              <Text style={[styles.customChoiceText, { color: theme.colors.primaryDark }]} numberOfLines={1}>
                Usar "<Text style={{ fontWeight: 'bold' }}>{searchQuery.trim()}</Text>" como lugar
              </Text>
            </TouchableOpacity>
          )}

          {/* Lista de Lugares */}
          <FlatList
            data={displayData}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContainer}
            keyboardShouldPersistTaps="handled"
            ListHeaderComponent={
              <View style={styles.sectionHeader}>
                <Text style={[styles.sectionTitle, { color: theme.colors.textSecondary }]}>
                  {showResults
                    ? searching
                      ? 'Buscando sitios...'
                      : `Resultados encontrados (${results.length})`
                    : 'Lugares recomendados para quedar'}
                </Text>
                {searching && <ActivityIndicator size="small" color={theme.colors.primary} style={{ marginLeft: 8 }} />}
              </View>
            }
            ListEmptyComponent={
              !searching && showResults ? (
                <View style={styles.emptyState}>
                  <Ionicons name="location-outline" size={40} color={theme.colors.textMuted} />
                  <Text style={[styles.emptyStateText, { color: theme.colors.textSecondary }]}>
                    No encontramos lugares con ese nombre en la base de datos.
                  </Text>
                  <TouchableOpacity
                    style={[styles.useCustomBtn, { backgroundColor: theme.colors.primaryDark }]}
                    onPress={handleSelectCustomText}
                  >
                    <Ionicons name="checkmark-circle" size={18} color="#ffffff" style={{ marginRight: 6 }} />
                    <Text style={styles.useCustomBtnText}>Usar "{searchQuery.trim()}"</Text>
                  </TouchableOpacity>
                </View>
              ) : null
            }
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[styles.venueCard, { backgroundColor: theme.colors.surfaceSubtle, borderColor: theme.colors.border }]}
                onPress={() => handleSelect(item)}
                activeOpacity={0.7}
              >
                <View style={[styles.venueIconBadge, { backgroundColor: isDarkMode ? '#3d0c1e' : '#ffe5ec' }]}>
                  <Ionicons name={item.icon || 'location-sharp'} size={18} color={theme.colors.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.venueName, { color: theme.colors.textPrimary }]}>
                    {item.name}
                  </Text>
                  {item.address ? (
                    <Text style={[styles.venueAddress, { color: theme.colors.textMuted }]} numberOfLines={1}>
                      {item.address}
                    </Text>
                  ) : null}
                  <Text style={[styles.venueCategory, { color: theme.colors.primary }]}>
                    {item.category}
                  </Text>
                </View>
                <View style={[styles.selectBadge, { backgroundColor: isDarkMode ? '#1e382b' : '#d8f3dc' }]}>
                  <Ionicons name="chevron-forward" size={16} color="#2d6a4f" />
                </View>
              </TouchableOpacity>
            )}
          />
        </SafeAreaView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    justifyContent: 'flex-end'
  },
  modalSheet: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderTopWidth: 1,
    maxHeight: '90%',
    paddingBottom: Platform.OS === 'ios' ? 10 : 20
  },
  sheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth
  },
  headerIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center'
  },
  sheetTitle: {
    fontSize: 17,
    fontWeight: 'bold'
  },
  sheetSubtitle: {
    fontSize: 12
  },
  closeBtn: {
    padding: 2
  },
  searchBarWrapper: {
    paddingHorizontal: 18,
    paddingTop: 12,
    paddingBottom: 6
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: Platform.OS === 'ios' ? 10 : 6
  },
  searchInput: {
    flex: 1,
    fontSize: 15
  },
  customChoiceBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 18,
    marginBottom: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 1
  },
  customChoiceText: {
    fontSize: 13,
    flex: 1
  },
  listContainer: {
    paddingHorizontal: 18,
    paddingBottom: 24
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 0.5
  },
  venueCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 16,
    borderWidth: 1,
    padding: 12,
    marginBottom: 10
  },
  venueIconBadge: {
    width: 38,
    height: 38,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12
  },
  venueName: {
    fontSize: 15,
    fontWeight: 'bold'
  },
  venueAddress: {
    fontSize: 12,
    marginTop: 2
  },
  venueCategory: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 4
  },
  selectBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 10
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 30
  },
  emptyStateText: {
    fontSize: 14,
    textAlign: 'center',
    marginVertical: 12
  },
  useCustomBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 16
  },
  useCustomBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: 'bold'
  }
});
