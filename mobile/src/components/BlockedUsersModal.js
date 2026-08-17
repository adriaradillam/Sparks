import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  Modal,
  TouchableOpacity,
  FlatList,
  Image,
  ActivityIndicator,
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme';
import { apiRequest } from '../api';
import { getAvatarSource } from '../screens/ProfileScreen';

export default function BlockedUsersModal({ visible, onClose }) {
  const { theme, isDarkMode } = useTheme();
  const [blockedUsers, setBlockedUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [unblockingId, setUnblockingId] = useState(null);

  useEffect(() => {
    if (visible) {
      fetchBlockedUsers();
    }
  }, [visible]);

  const fetchBlockedUsers = async () => {
    setLoading(true);
    try {
      const data = await apiRequest('/api/users/blocked');
      setBlockedUsers(data.blockedUsers || []);
    } catch (err) {
      console.error('Error fetching blocked users:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUnblock = async (user) => {
    Alert.alert(
      '¿Desbloquear a ' + user.name + '?',
      'Esta usuaria volverá a aparecer en tus recomendaciones y podrá ver tu perfil.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Desbloquear',
          onPress: async () => {
            setUnblockingId(user.id);
            try {
              await apiRequest(`/api/users/${user.id}/unblock`, { method: 'DELETE' });
              setBlockedUsers(blockedUsers.filter((u) => u.id !== user.id));
              Alert.alert('Desbloqueada', `${user.name} ha sido desbloqueada.`);
            } catch (err) {
              Alert.alert('Error', err.message);
            } finally {
              setUnblockingId(null);
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
          {/* Header */}
          <View style={styles.header}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <View style={[styles.iconCircle, { backgroundColor: isDarkMode ? '#2d0c1b' : '#ffe5ec' }]}>
                <Ionicons name="ban" size={18} color={theme.colors.primaryDark} />
              </View>
              <View style={{ marginLeft: 10 }}>
                <Text style={[styles.title, { color: theme.colors.textPrimary }]}>
                  Usuarias Bloqueadas
                </Text>
                <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
                  {blockedUsers.length} {blockedUsers.length === 1 ? 'perfil bloqueado' : 'perfiles bloqueados'}
                </Text>
              </View>
            </View>
            <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
              <Ionicons name="close" size={20} color={theme.colors.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* Body */}
          {loading ? (
            <View style={styles.centerBox}>
              <ActivityIndicator color={theme.colors.primaryDark} size="large" />
              <Text style={[styles.loadingText, { color: theme.colors.textSecondary }]}>
                Cargando lista de bloqueadas...
              </Text>
            </View>
          ) : blockedUsers.length === 0 ? (
            <View style={styles.emptyBox}>
              <Ionicons name="checkmark-circle-outline" size={48} color="#10b981" style={{ marginBottom: 8 }} />
              <Text style={[styles.emptyTitle, { color: theme.colors.textPrimary }]}>
                Tu lista está limpia
              </Text>
              <Text style={[styles.emptySubtitle, { color: theme.colors.textMuted }]}>
                No tienes a ninguna usuaria bloqueada actualmente.
              </Text>
            </View>
          ) : (
            <FlatList
              data={blockedUsers}
              keyExtractor={(item) => item.id.toString()}
              contentContainerStyle={{ paddingVertical: 10 }}
              renderItem={({ item }) => (
                <View style={[styles.userRow, { backgroundColor: theme.colors.surfaceSubtle, borderColor: theme.colors.border }]}>
                  <Image source={getAvatarSource(item.avatarUrl)} style={styles.avatar} />
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={[styles.userName, { color: theme.colors.textPrimary }]}>
                      {item.name}, <Text style={{ fontWeight: 'normal', color: theme.colors.textSecondary }}>{item.age}</Text>
                    </Text>
                    <Text style={[styles.userStatus, { color: theme.colors.textMuted }]}>
                      Bloqueada
                    </Text>
                  </View>

                  <TouchableOpacity
                    style={[styles.unblockBtn, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}
                    onPress={() => handleUnblock(item)}
                    disabled={unblockingId === item.id}
                  >
                    {unblockingId === item.id ? (
                      <ActivityIndicator size="small" color={theme.colors.primaryDark} />
                    ) : (
                      <Text style={[styles.unblockBtnText, { color: theme.colors.primaryDark }]}>
                        Desbloquear
                      </Text>
                    )}
                  </TouchableOpacity>
                </View>
              )}
            />
          )}
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
    minHeight: 350,
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
  centerBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 50
  },
  loadingText: {
    marginTop: 10,
    fontSize: 13
  },
  emptyBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center'
  },
  emptySubtitle: {
    fontSize: 13,
    marginTop: 4,
    textAlign: 'center'
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 10
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22
  },
  userName: {
    fontSize: 14.5,
    fontWeight: 'bold'
  },
  userStatus: {
    fontSize: 11.5,
    marginTop: 2
  },
  unblockBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    borderWidth: 1
  },
  unblockBtnText: {
    fontSize: 12,
    fontWeight: 'bold'
  }
});
