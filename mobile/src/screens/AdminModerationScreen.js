import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Image,
  Modal,
  ActivityIndicator,
  Alert,
  TextInput,
  RefreshControl,
  Platform
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as WebBrowser from 'expo-web-browser';
import { useTheme } from '../theme';
import { apiRequest, getApiBaseUrl } from '../api';
import { getAvatarSource } from '../utils/avatar';

const REASON_METAS = {
  harassment: {
    label: 'Acoso o intimidación',
    icon: 'hand-left',
    color: '#d90429',
    bgLight: '#ffe5ea',
    bgDark: '#3b0c16'
  },
  fake_profile: {
    label: 'Perfil falso / Suplantación',
    icon: 'person-remove',
    color: '#f77f00',
    bgLight: '#fff2e5',
    bgDark: '#382206'
  },
  hate_speech: {
    label: 'Discurso de odio / Intolerancia',
    icon: 'warning',
    color: '#c9184a',
    bgLight: '#ffccd5',
    bgDark: '#360918'
  },
  inappropriate_content: {
    label: 'Contenido no consentido',
    icon: 'eye-off',
    color: '#7209b7',
    bgLight: '#f3e8ff',
    bgDark: '#290b3b'
  },
  spam: {
    label: 'Spam o Publicidad',
    icon: 'megaphone',
    color: '#0077b6',
    bgLight: '#e0f2fe',
    bgDark: '#082538'
  },
  other: {
    label: 'Otro motivo',
    icon: 'alert-circle',
    color: '#495057',
    bgLight: '#f1f3f5',
    bgDark: '#212529'
  }
};

export default function AdminModerationScreen({ visible, onClose }) {
  const { theme, isDarkMode } = useTheme();

  // Estados de datos
  const [stats, setStats] = useState({
    totalReports: 0,
    pendingReports: 0,
    resolvedReports: 0,
    dismissedReports: 0,
    bannedUsers: 0
  });
  const [reports, setReports] = useState([]);
  const [bannedUsers, setBannedUsers] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [userSearch, setUserSearch] = useState('');
  const [activeTab, setActiveTab] = useState('pending'); // 'pending' | 'users' | 'resolved' | 'banned'
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Estados del Inspector de Chat
  const [inspectModalVisible, setInspectModalVisible] = useState(false);
  const [inspectLoading, setInspectLoading] = useState(false);
  const [chatInspectionData, setChatInspectionData] = useState(null);

  // Estados del Dictamen de Acción
  const [actionModalVisible, setActionModalVisible] = useState(false);
  const [actionReport, setActionReport] = useState(null);
  const [selectedAction, setSelectedAction] = useState('banned'); // 'banned' | 'warning' | 'dismissed'
  const [actionNotes, setActionNotes] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    if (visible) {
      loadAllData();
    }
  }, [visible, activeTab]);

  const loadAllData = async () => {
    setLoading(true);
    try {
      await Promise.all([fetchStats(), fetchCurrentTabContent()]);
    } catch (err) {
      console.error('Error loading admin data:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchStats = async () => {
    try {
      const data = await apiRequest('/api/admin/stats');
      if (data?.stats) {
        setStats(data.stats);
      }
    } catch (err) {
      console.error('Error fetching admin stats:', err);
    }
  };

  const fetchCurrentTabContent = async () => {
    try {
      if (activeTab === 'banned') {
        const data = await apiRequest('/api/admin/users/banned');
        setBannedUsers(data.bannedUsers || []);
      } else if (activeTab === 'users') {
        const queryParam = userSearch ? `?q=${encodeURIComponent(userSearch)}` : '';
        const data = await apiRequest(`/api/admin/users${queryParam}`);
        setAllUsers(data.users || []);
      } else {
        const statusParam = activeTab === 'all' ? 'all' : activeTab;
        const data = await apiRequest(`/api/admin/reports?status=${statusParam}`);
        setReports(data.reports || []);
      }
    } catch (err) {
      console.error('Error fetching reports:', err);
    }
  };

  const handleToggleUserVerify = async (userId, currentVerified) => {
    try {
      const res = await apiRequest(`/api/admin/users/${userId}/verify`, {
        method: 'PUT',
        body: JSON.stringify({ isVerified: !currentVerified })
      });
      Alert.alert('Verificación', res.message);
      fetchCurrentTabContent();
    } catch (err) {
      Alert.alert('Error', err.message);
    }
  };

  const handleDirectBanUser = (userId, userName, currentBanned) => {
    Alert.alert(
      currentBanned ? '¿Reactivar Cuenta?' : '¿Suspender Cuenta?',
      currentBanned
        ? `¿Deseas reactivar la cuenta de ${userName}?`
        : `¿Deseas suspender permanentemente a ${userName}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: currentBanned ? 'Reactivar' : 'Suspender',
          style: currentBanned ? 'default' : 'destructive',
          onPress: async () => {
            try {
              const endpoint = currentBanned
                ? `/api/admin/users/${userId}/unban`
                : `/api/admin/users/${userId}/ban`;
              const res = await apiRequest(endpoint, {
                method: 'POST',
                body: JSON.stringify({ reason: 'Sanción aplicada desde panel móvil' })
              });
              Alert.alert('Operación completada', res.message);
              fetchCurrentTabContent();
              fetchStats();
            } catch (err) {
              Alert.alert('Error', err.message);
            }
          }
        }
      ]
    );
  };

  // Abrir inspector de chat para un reporte
  const handleOpenChatInspector = async (reportId) => {
    setInspectModalVisible(true);
    setInspectLoading(true);
    setChatInspectionData(null);
    try {
      const data = await apiRequest(`/api/admin/reports/${reportId}/chat`);
      setChatInspectionData(data);
    } catch (err) {
      Alert.alert('Error', 'No se pudo cargar el historial del chat: ' + err.message);
      setInspectModalVisible(false);
    } finally {
      setInspectLoading(false);
    }
  };

  // Abrir modal de dictamen
  const handleOpenActionModal = (report, defaultAction = 'banned') => {
    setActionReport(report);
    setSelectedAction(defaultAction);
    setActionNotes(
      defaultAction === 'banned'
        ? 'Infracción grave de las normas de convivencia tras inspección del chat.'
        : defaultAction === 'warning'
        ? 'Aviso disciplinario: comportamiento inadecuado detectado.'
        : 'Desestimado: no se aprecian conductas contrarias a las normas.'
    );
    setActionModalVisible(true);
  };

  // Confirmar y dictaminar la acción
  const handleConfirmAction = async () => {
    if (!actionReport) return;
    setActionLoading(true);
    try {
      const res = await apiRequest(`/api/admin/reports/${actionReport.id}/action`, {
        method: 'POST',
        body: JSON.stringify({
          action: selectedAction,
          notes: actionNotes.trim()
        })
      });

      Alert.alert('Dictamen Registrado', res.message);
      setActionModalVisible(false);
      setInspectModalVisible(false);
      setActionReport(null);
      loadAllData();
    } catch (err) {
      Alert.alert('Error al dictaminar', err.message);
    } finally {
      setActionLoading(false);
    }
  };

  // Levantar suspensión de una usuaria
  const handleUnbanUser = (userId, userName) => {
    Alert.alert(
      '¿Levantar Suspensión?',
      `¿Deseas reactivar la cuenta de ${userName}? Podrá volver a iniciar sesión y utilizar la aplicación.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Reactivar Cuenta',
          onPress: async () => {
            try {
              const res = await apiRequest(`/api/admin/users/${userId}/unban`, {
                method: 'POST'
              });
              Alert.alert('Cuenta Reactivada', res.message);
              loadAllData();
            } catch (err) {
              Alert.alert('Error', err.message);
            }
          }
        }
      ]
    );
  };

  if (!visible) return null;

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="fullScreen" onRequestClose={onClose}>
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
        {/* ================= BARRA SUPERIOR DE MODERADORA ================= */}
        <View style={[styles.topHeader, { backgroundColor: isDarkMode ? '#1a050d' : theme.colors.primaryDark }]}>
          <View style={styles.topHeaderLeft}>
            <View style={styles.shieldFlameBadge}>
              <Ionicons name="shield-checkmark" size={18} color="#ffffff" />
            </View>
            <View style={{ marginLeft: 10 }}>
              <Text style={styles.topHeaderTitle}>Panel de Moderación</Text>
              <View style={styles.adminRoleRow}>
                <View style={styles.adminLiveDot} />
                <Text style={styles.topHeaderSubtitle}>MODERADORA OFICIAL • SPARKS TRUST & SAFETY</Text>
              </View>
            </View>
          </View>

          <TouchableOpacity style={styles.closeHeaderBtn} onPress={onClose}>
            <Ionicons name="close" size={22} color="#ffffff" />
          </TouchableOpacity>
        </View>

        {/* ================= CONTENIDO PRINCIPAL ================= */}
        <ScrollView
          style={styles.scrollArea}
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                loadAllData();
              }}
              colors={[theme.colors.primaryDark]}
              tintColor={theme.colors.primaryDark}
            />
          }
        >
          {/* BANNER ACCESO PANEL WEB PRO */}
          <TouchableOpacity
            style={[
              styles.webAdminPromoBanner,
              { backgroundColor: isDarkMode ? '#220412' : '#ffe5ec', borderColor: '#ff2a6d' }
            ]}
            onPress={async () => {
              try {
                const url = `${getApiBaseUrl()}/admin`;
                await WebBrowser.openBrowserAsync(url);
              } catch (e) {
                Alert.alert('Panel Web de Sparks', `Accede desde tu navegador en:\n${getApiBaseUrl()}/admin`);
              }
            }}
            activeOpacity={0.85}
          >
            <View style={styles.webAdminPromoLeft}>
              <View style={[styles.webAdminIconBadge, { backgroundColor: '#ff2a6d' }]}>
                <Ionicons name="desktop" size={20} color="#ffffff" />
              </View>
              <View style={{ marginLeft: 12, flex: 1 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Text style={[styles.webAdminPromoTitle, { color: theme.colors.textPrimary }]}>
                    Panel Web de Administración Pro
                  </Text>
                  <View style={styles.proPill}>
                    <Text style={styles.proPillText}>WEB</Text>
                  </View>
                </View>
                <Text style={[styles.webAdminPromoSub, { color: theme.colors.textMuted }]}>
                  Métricas en vivo, gráficos, auditoría e inspector forense de chat en tu navegador.
                </Text>
              </View>
            </View>
            <View style={[styles.webAdminPromoBtn, { backgroundColor: '#ff2a6d' }]}>
              <Text style={styles.webAdminPromoBtnText}>Abrir Web</Text>
              <Ionicons name="open-outline" size={13} color="#ffffff" style={{ marginLeft: 3 }} />
            </View>
          </TouchableOpacity>

          {/* Tarjetas Métricas de Moderación */}
          <View style={styles.statsGrid}>
            <View style={[styles.statCard, { backgroundColor: theme.colors.surface, borderColor: '#f77f00' }]}>
              <View style={[styles.statIconBadge, { backgroundColor: isDarkMode ? '#382206' : '#fff2e5' }]}>
                <Ionicons name="hourglass-outline" size={18} color="#f77f00" />
              </View>
              <Text style={[styles.statNumber, { color: '#f77f00' }]}>{stats.pendingReports}</Text>
              <Text style={[styles.statLabel, { color: theme.colors.textMuted }]}>Pendientes</Text>
            </View>

            <View style={[styles.statCard, { backgroundColor: theme.colors.surface, borderColor: '#10b981' }]}>
              <View style={[styles.statIconBadge, { backgroundColor: isDarkMode ? '#064e3b' : '#ecfdf5' }]}>
                <Ionicons name="checkmark-done-circle-outline" size={18} color="#10b981" />
              </View>
              <Text style={[styles.statNumber, { color: '#10b981' }]}>{stats.resolvedReports}</Text>
              <Text style={[styles.statLabel, { color: theme.colors.textMuted }]}>Resueltos</Text>
            </View>

            <View style={[styles.statCard, { backgroundColor: theme.colors.surface, borderColor: '#d90429' }]}>
              <View style={[styles.statIconBadge, { backgroundColor: isDarkMode ? '#3b0c16' : '#ffe5ea' }]}>
                <Ionicons name="ban-outline" size={18} color="#d90429" />
              </View>
              <Text style={[styles.statNumber, { color: '#d90429' }]}>{stats.bannedUsers}</Text>
              <Text style={[styles.statLabel, { color: theme.colors.textMuted }]}>Suspendidas</Text>
            </View>
          </View>

          {/* Selector de Pestañas de Estado */}
          <View style={[styles.tabsRow, { backgroundColor: isDarkMode ? '#280814' : '#ffe5ec' }]}>
            <TouchableOpacity
              style={[styles.tabBtn, activeTab === 'pending' && { backgroundColor: theme.colors.primaryDark }]}
              onPress={() => setActiveTab('pending')}
            >
              <Text
                style={[
                  styles.tabBtnText,
                  { color: activeTab === 'pending' ? '#ffffff' : theme.colors.textSecondary },
                  activeTab === 'pending' && { fontWeight: 'bold' }
                ]}
              >
                Pendientes ({stats.pendingReports})
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.tabBtn, activeTab === 'users' && { backgroundColor: theme.colors.primaryDark }]}
              onPress={() => setActiveTab('users')}
            >
              <Text
                style={[
                  styles.tabBtnText,
                  { color: activeTab === 'users' ? '#ffffff' : theme.colors.textSecondary },
                  activeTab === 'users' && { fontWeight: 'bold' }
                ]}
              >
                Usuarias
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.tabBtn, activeTab === 'resolved' && { backgroundColor: theme.colors.primaryDark }]}
              onPress={() => setActiveTab('resolved')}
            >
              <Text
                style={[
                  styles.tabBtnText,
                  { color: activeTab === 'resolved' ? '#ffffff' : theme.colors.textSecondary },
                  activeTab === 'resolved' && { fontWeight: 'bold' }
                ]}
              >
                Resueltos ({stats.resolvedReports})
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.tabBtn, activeTab === 'banned' && { backgroundColor: theme.colors.primaryDark }]}
              onPress={() => setActiveTab('banned')}
            >
              <Text
                style={[
                  styles.tabBtnText,
                  { color: activeTab === 'banned' ? '#ffffff' : theme.colors.textSecondary },
                  activeTab === 'banned' && { fontWeight: 'bold' }
                ]}
              >
                Suspendidas ({stats.bannedUsers})
              </Text>
            </TouchableOpacity>
          </View>

          {/* ================= LISTADO DE REPORTES, USUARIAS O SUSPENDIDAS ================= */}
          {loading ? (
            <View style={styles.loadingBox}>
              <ActivityIndicator size="large" color={theme.colors.primaryDark} />
              <Text style={[styles.loadingText, { color: theme.colors.textMuted }]}>
                Cargando datos de administración...
              </Text>
            </View>
          ) : activeTab === 'users' ? (
            /* Vista de Directorio de Usuarias */
            <View>
              <View style={[styles.searchBoxContainer, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
                <Ionicons name="search-outline" size={18} color={theme.colors.textMuted} style={{ marginRight: 8 }} />
                <TextInput
                  style={[styles.searchBoxInput, { color: theme.colors.textPrimary }]}
                  placeholder="Buscar usuaria por nombre o email..."
                  placeholderTextColor={theme.colors.textMuted}
                  value={userSearch}
                  onChangeText={(text) => setUserSearch(text)}
                  onSubmitEditing={() => fetchCurrentTabContent()}
                />
                {userSearch.length > 0 && (
                  <TouchableOpacity onPress={() => { setUserSearch(''); fetchCurrentTabContent(); }}>
                    <Ionicons name="close-circle" size={18} color={theme.colors.textMuted} />
                  </TouchableOpacity>
                )}
              </View>

              {allUsers.length === 0 ? (
                <View style={styles.emptyCard}>
                  <Ionicons name="people-outline" size={48} color={theme.colors.textMuted} style={{ marginBottom: 10 }} />
                  <Text style={[styles.emptyTitle, { color: theme.colors.textPrimary }]}>No se encontraron usuarias</Text>
                </View>
              ) : (
                allUsers.map((u) => (
                  <View
                    key={u.id}
                    style={[styles.reportCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}
                  >
                    <View style={styles.userProfileRow}>
                      <Image source={getAvatarSource(u.avatarUrl)} style={styles.userAvatarSquare} />
                      <View style={{ flex: 1, marginLeft: 12 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                          <Text style={[styles.userNameTitle, { color: theme.colors.textPrimary }]}>
                            {u.name}, {u.age}
                          </Text>
                          {u.isVerified && (
                            <Ionicons name="checkmark-circle" size={16} color="#00f2fe" style={{ marginLeft: 4 }} />
                          )}
                          {u.isAdmin && (
                            <View style={[styles.bannedPillBadge, { backgroundColor: '#ffe5ec', marginLeft: 6 }]}>
                              <Text style={{ color: '#ff2a6d', fontSize: 10, fontWeight: 'bold' }}>ADMIN</Text>
                            </View>
                          )}
                        </View>
                        <Text style={[styles.userEmailText, { color: theme.colors.textMuted }]}>{u.email}</Text>
                        <Text style={{ fontSize: 12, color: theme.colors.textSecondary, marginTop: 4 }}>
                          {u.bio ? (u.bio.length > 60 ? u.bio.slice(0, 60) + '...' : u.bio) : 'Sin biografía'}
                        </Text>
                      </View>
                    </View>

                    <View style={{ flexDirection: 'row', gap: 8, marginTop: 12 }}>
                      <TouchableOpacity
                        style={[styles.unbanBtn, { flex: 1, borderColor: '#00f2fe' }]}
                        onPress={() => handleToggleUserVerify(u.id, u.isVerified)}
                      >
                        <Ionicons name={u.isVerified ? 'close-circle-outline' : 'checkmark-circle-outline'} size={15} color="#00f2fe" style={{ marginRight: 4 }} />
                        <Text style={{ color: '#00f2fe', fontWeight: 'bold', fontSize: 12 }}>
                          {u.isVerified ? 'Desverificar' : 'Verificar'}
                        </Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={[styles.unbanBtn, { flex: 1, borderColor: u.isBanned ? '#10b981' : '#d90429' }]}
                        onPress={() => handleDirectBanUser(u.id, u.name, u.isBanned)}
                      >
                        <Ionicons name={u.isBanned ? 'refresh-circle-outline' : 'ban-outline'} size={15} color={u.isBanned ? '#10b981' : '#d90429'} style={{ marginRight: 4 }} />
                        <Text style={{ color: u.isBanned ? '#10b981' : '#d90429', fontWeight: 'bold', fontSize: 12 }}>
                          {u.isBanned ? 'Reactivar' : 'Suspender'}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ))
              )}
            </View>
          ) : activeTab === 'banned' ? (
            /* Vista de Usuarias Suspendidas */
            <View>
              {bannedUsers.length === 0 ? (
                <View style={styles.emptyCard}>
                  <Ionicons name="checkmark-circle-outline" size={48} color="#10b981" style={{ marginBottom: 10 }} />
                  <Text style={[styles.emptyTitle, { color: theme.colors.textPrimary }]}>No hay usuarias suspendidas</Text>
                  <Text style={[styles.emptySubtitle, { color: theme.colors.textMuted }]}>
                    Todas las cuentas activas cumplen con las políticas de Sparks.
                  </Text>
                </View>
              ) : (
                bannedUsers.map((bUser) => (
                  <View
                    key={bUser.id}
                    style={[styles.reportCard, { backgroundColor: theme.colors.surface, borderColor: '#d90429' }]}
                  >
                    <View style={styles.reportCardHeader}>
                      <View style={[styles.bannedPillBadge, { backgroundColor: '#ffe5ea' }]}>
                        <Ionicons name="ban" size={13} color="#d90429" style={{ marginRight: 4 }} />
                        <Text style={{ color: '#d90429', fontWeight: 'bold', fontSize: 11 }}>CUENTA SUSPENDIDA</Text>
                      </View>
                      <Text style={[styles.reportDate, { color: theme.colors.textMuted }]}>
                        {bUser.bannedAt ? new Date(bUser.bannedAt).toLocaleDateString() : 'Fecha no registrada'}
                      </Text>
                    </View>

                    <View style={styles.userProfileRow}>
                      <Image source={getAvatarSource(bUser.avatarUrl)} style={styles.userAvatarSquare} />
                      <View style={{ flex: 1, marginLeft: 12 }}>
                        <Text style={[styles.userNameTitle, { color: theme.colors.textPrimary }]}>
                          {bUser.name} • {bUser.age} años
                        </Text>
                        <Text style={[styles.userEmailText, { color: theme.colors.textMuted }]}>{bUser.email}</Text>
                        <Text style={[styles.banReasonText, { color: '#d90429' }]}>
                          Motivo: {bUser.bannedReason || 'Infracción grave de normas'}
                        </Text>
                      </View>
                    </View>

                    <TouchableOpacity
                      style={[styles.unbanBtn, { borderColor: theme.colors.border }]}
                      onPress={() => handleUnbanUser(bUser.id, bUser.name)}
                    >
                      <Ionicons name="refresh-circle-outline" size={16} color={theme.colors.primary} style={{ marginRight: 6 }} />
                      <Text style={[styles.unbanBtnText, { color: theme.colors.primary }]}>
                        Levantar Suspensión / Reactivar
                      </Text>
                    </TouchableOpacity>
                  </View>
                ))
              )}
            </View>
          ) : (
            /* Vista de Reportes */
            <View>
              {reports.length === 0 ? (
                <View style={styles.emptyCard}>
                  <Ionicons name="shield-checkmark-outline" size={48} color={theme.colors.primary} style={{ marginBottom: 10 }} />
                  <Text style={[styles.emptyTitle, { color: theme.colors.textPrimary }]}>No hay reportes en esta sección</Text>
                  <Text style={[styles.emptySubtitle, { color: theme.colors.textMuted }]}>
                    No hay casos {activeTab} pendientes de revisión en este momento.
                  </Text>
                </View>
              ) : (
                reports.map((report) => {
                  const reasonMeta = REASON_METAS[report.reason] || REASON_METAS.other;
                  const isPending = report.status === 'pending';

                  return (
                    <View
                      key={report.id}
                      style={[
                        styles.reportCard,
                        {
                          backgroundColor: theme.colors.surface,
                          borderColor: isPending ? reasonMeta.color : theme.colors.border
                        }
                      ]}
                    >
                      {/* Cabecera del Reporte: Motivo y Estado */}
                      <View style={styles.reportCardHeader}>
                        <View
                          style={[
                            styles.reasonBadge,
                            {
                              backgroundColor: isDarkMode ? reasonMeta.bgDark : reasonMeta.bgLight,
                              borderColor: reasonMeta.color
                            }
                          ]}
                        >
                          <Ionicons name={reasonMeta.icon} size={14} color={reasonMeta.color} style={{ marginRight: 5 }} />
                          <Text style={[styles.reasonBadgeText, { color: reasonMeta.color }]}>
                            {reasonMeta.label}
                          </Text>
                        </View>

                        <View
                          style={[
                            styles.statusBadge,
                            {
                              backgroundColor:
                                report.status === 'pending'
                                  ? isDarkMode ? '#382206' : '#fff2e5'
                                  : report.status === 'resolved'
                                  ? isDarkMode ? '#064e3b' : '#ecfdf5'
                                  : isDarkMode ? '#212529' : '#f1f3f5'
                            }
                          ]}
                        >
                          <Text
                            style={[
                              styles.statusBadgeText,
                              {
                                color:
                                  report.status === 'pending'
                                    ? '#f77f00'
                                    : report.status === 'resolved'
                                    ? '#10b981'
                                    : '#6c757d'
                              }
                            ]}
                          >
                            {report.status === 'pending'
                              ? 'Pendiente'
                              : report.status === 'resolved'
                              ? `Resuelto (${report.actionTaken})`
                              : 'Descartado'}
                          </Text>
                        </View>
                      </View>

                      {/* Comparativa: Demandante vs Denunciada */}
                      <View style={[styles.partiesBox, { backgroundColor: theme.colors.surfaceSubtle, borderColor: theme.colors.border }]}>
                        {/* Demandante */}
                        <View style={styles.partyItem}>
                          <View style={styles.partyRoleRow}>
                            <Ionicons name="person-circle-outline" size={14} color="#0077b6" style={{ marginRight: 3 }} />
                            <Text style={[styles.partyRoleLabel, { color: '#0077b6' }]}>Demandante</Text>
                          </View>
                          <View style={styles.partyDetails}>
                            <Image
                              source={getAvatarSource(report.reporter?.avatarUrl)}
                              style={styles.partyMiniAvatar}
                            />
                            <View style={{ marginLeft: 8, flex: 1 }}>
                              <Text style={[styles.partyName, { color: theme.colors.textPrimary }]} numberOfLines={1}>
                                {report.reporter?.name || 'Usuaria'}
                              </Text>
                              <Text style={[styles.partyEmail, { color: theme.colors.textMuted }]} numberOfLines={1}>
                                {report.reporter?.email || ''}
                              </Text>
                            </View>
                          </View>
                        </View>

                        <View style={[styles.partiesDivider, { backgroundColor: theme.colors.border }]} />

                        {/* Denunciada */}
                        <View style={styles.partyItem}>
                          <View style={styles.partyRoleRow}>
                            <Ionicons name="alert-circle-outline" size={14} color="#d90429" style={{ marginRight: 3 }} />
                            <Text style={[styles.partyRoleLabel, { color: '#d90429' }]}>Denunciada</Text>
                            {report.reportedUser?.isBanned && (
                              <Text style={styles.bannedMiniTag}>• SUSPENDIDA</Text>
                            )}
                          </View>
                          <View style={styles.partyDetails}>
                            <Image
                              source={getAvatarSource(report.reportedUser?.avatarUrl)}
                              style={[
                                styles.partyMiniAvatar,
                                report.reportedUser?.isBanned && { borderWidth: 1.5, borderColor: '#d90429' }
                              ]}
                            />
                            <View style={{ marginLeft: 8, flex: 1 }}>
                              <Text style={[styles.partyName, { color: theme.colors.textPrimary }]} numberOfLines={1}>
                                {report.reportedUser?.name || 'Usuaria'}
                              </Text>
                              <Text style={[styles.partyEmail, { color: theme.colors.textMuted }]} numberOfLines={1}>
                                {report.reportedUser?.email || ''}
                              </Text>
                            </View>
                          </View>
                        </View>
                      </View>

                      {/* Declaración de la usuaria que reporta */}
                      {report.description ? (
                        <View style={styles.descBox}>
                          <Text style={[styles.descTitle, { color: theme.colors.textMuted }]}>
                            Motivo aportado por la demandante:
                          </Text>
                          <Text style={[styles.descContent, { color: theme.colors.textPrimary }]}>
                            "{report.description}"
                          </Text>
                        </View>
                      ) : null}

                      {/* Indicador de Chat */}
                      <View style={styles.chatContextRow}>
                        <Ionicons
                          name={report.hasChat ? 'chatbubbles' : 'document-text-outline'}
                          size={14}
                          color={report.hasChat ? theme.colors.primary : theme.colors.textMuted}
                          style={{ marginRight: 6 }}
                        />
                        <Text
                          style={[
                            styles.chatContextText,
                            { color: report.hasChat ? theme.colors.primary : theme.colors.textMuted },
                            report.hasChat && { fontWeight: '600' }
                          ]}
                        >
                          {report.hasChat
                            ? 'Historial de conversación disponible para inspección en vivo'
                            : 'Reportado desde perfil / feed público (sin mensajes directos)'}
                        </Text>
                      </View>

                      {/* Notas de resolución previas si ya está resuelto */}
                      {report.resolutionNotes ? (
                        <View style={[styles.resolutionCard, { backgroundColor: isDarkMode ? '#1e1b2e' : '#f0f3ff' }]}>
                          <Text style={[styles.resolutionTitle, { color: '#6366f1' }]}>
                            Resolución de moderación:
                          </Text>
                          <Text style={[styles.resolutionText, { color: theme.colors.textPrimary }]}>
                            {report.resolutionNotes}
                          </Text>
                        </View>
                      ) : null}

                      {/* Botonera de Acción para la Moderadora */}
                      <View style={styles.reportActionsRow}>
                        {report.hasChat && (
                          <TouchableOpacity
                            style={[
                              styles.inspectChatPrimaryBtn,
                              { backgroundColor: theme.colors.primaryDark }
                            ]}
                            onPress={() => handleOpenChatInspector(report.id)}
                            activeOpacity={0.8}
                          >
                            <Ionicons name="search" size={16} color="#ffffff" style={{ marginRight: 6 }} />
                            <Text style={styles.inspectChatBtnText}>Inspeccionar Chat</Text>
                          </TouchableOpacity>
                        )}

                        <TouchableOpacity
                          style={[
                            styles.dictateActionBtn,
                            !report.hasChat && { flex: 1 },
                            { borderColor: theme.colors.border, backgroundColor: isDarkMode ? '#280814' : '#fff0f3' }
                          ]}
                          onPress={() => handleOpenActionModal(report, report.reportedUser?.isBanned ? 'dismissed' : 'banned')}
                          activeOpacity={0.8}
                        >
                          <Ionicons name="scale-outline" size={16} color={theme.colors.primary} style={{ marginRight: 6 }} />
                          <Text style={[styles.dictateActionBtnText, { color: theme.colors.primary }]}>
                            {isPending ? 'Dictaminar Acción' : 'Modificar Resolución'}
                          </Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  );
                })
              )}
            </View>
          )}
        </ScrollView>

        {/* ================= MODAL DE INSPECCIÓN EN VIVO DEL CHAT ================= */}
        <Modal
          visible={inspectModalVisible}
          transparent
          animationType="slide"
          onRequestClose={() => setInspectModalVisible(false)}
        >
          <SafeAreaView style={[styles.inspectOverlay, { backgroundColor: theme.colors.background }]}>
            {/* Header del Inspector */}
            <View style={[styles.inspectHeader, { backgroundColor: isDarkMode ? '#1a050d' : theme.colors.primaryDark }]}>
              <TouchableOpacity
                style={styles.inspectBackBtn}
                onPress={() => setInspectModalVisible(false)}
              >
                <Ionicons name="arrow-back" size={20} color="#ffffff" style={{ marginRight: 4 }} />
                <Text style={styles.inspectBackBtnText}>Volver</Text>
              </TouchableOpacity>

              <View style={{ flex: 1, alignItems: 'center' }}>
                <Text style={styles.inspectHeaderTitle}>
                  Inspección Oficial del Chat
                </Text>
                <Text style={styles.inspectHeaderSubtitle}>
                  Caso #{chatInspectionData?.report?.id || '...'} • Registro de Auditoría
                </Text>
              </View>

              <View style={{ width: 60 }} />
            </View>

            {/* Banner de Contexto del Inspector */}
            {chatInspectionData && (
              <View style={[styles.inspectorContextBanner, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
                <View style={styles.inspectorPartiesRow}>
                  <View style={styles.inspectMiniProfile}>
                    <Text style={[styles.inspectRolePill, { color: '#0077b6', backgroundColor: isDarkMode ? '#082538' : '#e0f2fe' }]}>
                      Demandante
                    </Text>
                    <Text style={[styles.inspectPartyName, { color: theme.colors.textPrimary }]}>
                      {chatInspectionData.reporter?.name}
                    </Text>
                  </View>

                  <Ionicons name="arrow-forward" size={16} color={theme.colors.textMuted} />

                  <View style={styles.inspectMiniProfile}>
                    <Text style={[styles.inspectRolePill, { color: '#d90429', backgroundColor: isDarkMode ? '#3b0c16' : '#ffe5ea' }]}>
                      Denunciada
                    </Text>
                    <Text style={[styles.inspectPartyName, { color: theme.colors.textPrimary }]}>
                      {chatInspectionData.reportedUser?.name}
                    </Text>
                  </View>
                </View>

                {chatInspectionData.report?.description ? (
                  <Text style={[styles.inspectReportMotif, { color: theme.colors.textSecondary }]} numberOfLines={2}>
                    Denuncia: "{chatInspectionData.report.description}"
                  </Text>
                ) : null}
              </View>
            )}

            {/* Lista de Mensajes del Chat */}
            {inspectLoading ? (
              <View style={styles.loadingBox}>
                <ActivityIndicator size="large" color={theme.colors.primaryDark} />
                <Text style={[styles.loadingText, { color: theme.colors.textMuted }]}>
                  Cargando transcripción íntegra del chat...
                </Text>
              </View>
            ) : !chatInspectionData || chatInspectionData.messages.length === 0 ? (
              <View style={styles.emptyCard}>
                <Ionicons name="chatbubble-ellipses-outline" size={48} color={theme.colors.textMuted} style={{ marginBottom: 10 }} />
                <Text style={[styles.emptyTitle, { color: theme.colors.textPrimary }]}>Sin mensajes directos</Text>
                <Text style={[styles.emptySubtitle, { color: theme.colors.textMuted }]}>
                  No hay mensajes intercambiados entre estas usuarias. El reporte se originó desde el perfil público.
                </Text>
              </View>
            ) : (
              <ScrollView style={styles.inspectMessagesScroll} contentContainerStyle={{ padding: 14, paddingBottom: 100 }}>
                {chatInspectionData.messages.map((msg) => {
                  const isReporterMsg = msg.isReporter;
                  const isReportedMsg = msg.isReported;

                  return (
                    <View
                      key={msg.id}
                      style={[
                        styles.inspectMsgBubbleWrap,
                        isReportedMsg
                          ? styles.reportedMsgAlign
                          : isReporterMsg
                          ? styles.reporterMsgAlign
                          : styles.neutralMsgAlign
                      ]}
                    >
                      {/* Distintivo de Remitente */}
                      <View style={styles.inspectSenderHeader}>
                        <Text
                          style={[
                            styles.inspectSenderLabel,
                            {
                              color: isReportedMsg
                                ? '#d90429'
                                : isReporterMsg
                                ? '#0077b6'
                                : theme.colors.textSecondary
                            }
                          ]}
                        >
                          {msg.senderName}{' '}
                          {isReportedMsg ? '(DENUNCIADA)' : isReporterMsg ? '(DEMANDANTE)' : ''}
                        </Text>
                        <Text style={[styles.inspectMsgTime, { color: theme.colors.textMuted }]}>
                          {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </Text>
                      </View>

                      {/* Burbuja del Mensaje */}
                      <View
                        style={[
                          styles.inspectBubble,
                          {
                            backgroundColor: isReportedMsg
                              ? isDarkMode ? '#380c16' : '#ffe8ed'
                              : isReporterMsg
                              ? isDarkMode ? '#082538' : '#e0f2fe'
                              : theme.colors.surfaceSubtle,
                            borderColor: isReportedMsg
                              ? '#d90429'
                              : isReporterMsg
                              ? '#0077b6'
                              : theme.colors.border
                          }
                        ]}
                      >
                        <Text
                          style={[
                            styles.inspectBubbleText,
                            {
                              color: theme.colors.textPrimary
                            }
                          ]}
                        >
                          {msg.text}
                        </Text>

                        {msg.imageUrl ? (
                          <Image source={{ uri: msg.imageUrl }} style={styles.inspectMsgImage} />
                        ) : null}
                      </View>
                    </View>
                  );
                })}
              </ScrollView>
            )}

            {/* Barra Inferior del Inspector: Dictaminar In Situ */}
            {chatInspectionData && (
              <View style={[styles.inspectBottomBar, { backgroundColor: theme.colors.surface, borderTopColor: theme.colors.border }]}>
                <TouchableOpacity
                  style={[styles.inspectActionQuickBtn, { backgroundColor: '#d90429' }]}
                  onPress={() => {
                    handleOpenActionModal(chatInspectionData.report, 'banned');
                  }}
                >
                  <Ionicons name="ban" size={15} color="#ffffff" style={{ marginRight: 4 }} />
                  <Text style={styles.inspectActionQuickText}>Suspender Cuenta</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.inspectActionQuickBtn, { backgroundColor: '#f77f00' }]}
                  onPress={() => {
                    handleOpenActionModal(chatInspectionData.report, 'warning');
                  }}
                >
                  <Ionicons name="warning" size={15} color="#ffffff" style={{ marginRight: 4 }} />
                  <Text style={styles.inspectActionQuickText}>Advertir</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.inspectActionQuickBtn, { backgroundColor: isDarkMode ? '#343a40' : '#6c757d' }]}
                  onPress={() => {
                    handleOpenActionModal(chatInspectionData.report, 'dismissed');
                  }}
                >
                  <Ionicons name="close-circle" size={15} color="#ffffff" style={{ marginRight: 4 }} />
                  <Text style={styles.inspectActionQuickText}>Desestimar</Text>
                </TouchableOpacity>
              </View>
            )}
          </SafeAreaView>
        </Modal>

        {/* ================= MODAL PARA DICTAMINAR ACCIÓN ================= */}
        <Modal
          visible={actionModalVisible}
          transparent
          animationType="fade"
          onRequestClose={() => setActionModalVisible(false)}
        >
          <View style={styles.actionModalBackdrop}>
            <View style={[styles.actionModalCard, { backgroundColor: theme.colors.surface }]}>
              <View style={styles.actionModalTop}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Ionicons name="shield-checkmark" size={20} color={theme.colors.primary} style={{ marginRight: 8 }} />
                  <Text style={[styles.actionModalTitle, { color: theme.colors.textPrimary }]}>Dictamen de Moderación</Text>
                </View>
                <TouchableOpacity onPress={() => setActionModalVisible(false)}>
                  <Ionicons name="close" size={22} color={theme.colors.textMuted} />
                </TouchableOpacity>
              </View>

              <Text style={[styles.actionModalSubtitle, { color: theme.colors.textSecondary }]}>
                Selecciona la medida que deseas aplicar a la usuaria denunciada en este caso:
              </Text>

              {/* Selector de Acciones */}
              <View style={styles.actionOptionsCol}>
                <TouchableOpacity
                  style={[
                    styles.actionOptionCard,
                    selectedAction === 'banned' && { borderColor: '#d90429', backgroundColor: isDarkMode ? '#3b0c16' : '#ffe5ea' }
                  ]}
                  onPress={() => setSelectedAction('banned')}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                    <Ionicons name="ban" size={20} color="#d90429" style={{ marginRight: 10 }} />
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.actionOptionTitle, { color: '#d90429' }]}>Suspender Cuenta (Baneo)</Text>
                      <Text style={[styles.actionOptionDesc, { color: theme.colors.textMuted }]}>
                        Expulsa a la usuaria inmediatamente y bloquea su inicio de sesión de por vida.
                      </Text>
                    </View>
                  </View>
                  <Ionicons
                    name={selectedAction === 'banned' ? 'radio-button-on' : 'radio-button-off'}
                    size={20}
                    color="#d90429"
                  />
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.actionOptionCard,
                    selectedAction === 'warning' && { borderColor: '#f77f00', backgroundColor: isDarkMode ? '#382206' : '#fff2e5' }
                  ]}
                  onPress={() => setSelectedAction('warning')}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                    <Ionicons name="warning" size={20} color="#f77f00" style={{ marginRight: 10 }} />
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.actionOptionTitle, { color: '#f77f00' }]}>Enviar Advertencia Formal</Text>
                      <Text style={[styles.actionOptionDesc, { color: theme.colors.textMuted }]}>
                        Registra una falta en el historial de la usuaria sin bloquear su cuenta.
                      </Text>
                    </View>
                  </View>
                  <Ionicons
                    name={selectedAction === 'warning' ? 'radio-button-on' : 'radio-button-off'}
                    size={20}
                    color="#f77f00"
                  />
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.actionOptionCard,
                    selectedAction === 'dismissed' && { borderColor: '#6c757d', backgroundColor: isDarkMode ? '#212529' : '#f1f3f5' }
                  ]}
                  onPress={() => setSelectedAction('dismissed')}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                    <Ionicons name="close-circle-outline" size={20} color="#6c757d" style={{ marginRight: 10 }} />
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.actionOptionTitle, { color: '#6c757d' }]}>Desestimar Reporte</Text>
                      <Text style={[styles.actionOptionDesc, { color: theme.colors.textMuted }]}>
                        Concluye el caso como falsa alarma o sin evidencia de infracción.
                      </Text>
                    </View>
                  </View>
                  <Ionicons
                    name={selectedAction === 'dismissed' ? 'radio-button-on' : 'radio-button-off'}
                    size={20}
                    color="#6c757d"
                  />
                </TouchableOpacity>
              </View>

              {/* Justificación de la Moderadora */}
              <Text style={[styles.notesLabel, { color: theme.colors.textPrimary }]}>
                Notas de resolución / Justificación oficial:
              </Text>
              <TextInput
                style={[styles.notesInput, { backgroundColor: theme.colors.surfaceSubtle, borderColor: theme.colors.border, color: theme.colors.textPrimary }]}
                placeholder="Añade los detalles de la resolución..."
                placeholderTextColor={theme.colors.textMuted}
                multiline
                numberOfLines={3}
                value={actionNotes}
                onChangeText={setActionNotes}
              />

              {/* Botones del Modal */}
              <View style={styles.actionModalFooter}>
                <TouchableOpacity
                  style={[styles.cancelActionBtn, { borderColor: theme.colors.border }]}
                  onPress={() => setActionModalVisible(false)}
                >
                  <Text style={[styles.cancelActionText, { color: theme.colors.textSecondary }]}>Cancelar</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.confirmActionBtn,
                    {
                      backgroundColor:
                        selectedAction === 'banned'
                          ? '#d90429'
                          : selectedAction === 'warning'
                          ? '#f77f00'
                          : theme.colors.primaryDark
                    }
                  ]}
                  onPress={handleConfirmAction}
                  disabled={actionLoading}
                >
                  {actionLoading ? (
                    <ActivityIndicator color="#ffffff" />
                  ) : (
                    <Text style={styles.confirmActionText}>Aplicar Dictamen</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1
  },
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14
  },
  topHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1
  },
  shieldFlameBadge: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center'
  },
  topHeaderTitle: {
    color: '#ffffff',
    fontSize: 17,
    fontWeight: 'bold'
  },
  adminRoleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2
  },
  adminLiveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10b981',
    marginRight: 5
  },
  topHeaderSubtitle: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 10,
    fontWeight: 'bold',
    letterSpacing: 0.5
  },
  closeHeaderBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center'
  },
  scrollArea: {
    flex: 1
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40
  },
  // Métricas
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16
  },
  statCard: {
    flex: 0.31,
    borderRadius: 18,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1.5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2
  },
  statIconBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6
  },
  statNumber: {
    fontSize: 18,
    fontWeight: 'bold'
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2
  },
  // Tabs
  tabsRow: {
    flexDirection: 'row',
    borderRadius: 22,
    padding: 3,
    marginBottom: 16
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center'
  },
  tabBtnText: {
    fontSize: 11,
    fontWeight: '600'
  },
  loadingBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40
  },
  loadingText: {
    fontSize: 13,
    marginTop: 10
  },
  emptyCard: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 6
  },
  emptySubtitle: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18
  },
  // Tarjeta de Reporte
  reportCard: {
    borderRadius: 20,
    padding: 16,
    borderWidth: 1.5,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3
  },
  reportCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12
  },
  reasonBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    borderWidth: 1
  },
  reasonBadgeText: {
    fontSize: 12,
    fontWeight: 'bold'
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: 'bold'
  },
  partiesBox: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 10,
    marginBottom: 10
  },
  partyItem: {
    paddingVertical: 2
  },
  partyRoleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4
  },
  partyRoleLabel: {
    fontSize: 11,
    fontWeight: 'bold',
    textTransform: 'uppercase'
  },
  bannedMiniTag: {
    color: '#d90429',
    fontSize: 10,
    fontWeight: 'bold',
    marginLeft: 6
  },
  partyDetails: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  partyMiniAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14
  },
  partyName: {
    fontSize: 13,
    fontWeight: 'bold'
  },
  partyEmail: {
    fontSize: 11
  },
  partiesDivider: {
    height: 1,
    marginVertical: 8
  },
  descBox: {
    marginBottom: 10
  },
  descTitle: {
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 3
  },
  descContent: {
    fontSize: 13,
    fontStyle: 'italic',
    lineHeight: 18
  },
  chatContextRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12
  },
  chatContextText: {
    fontSize: 12
  },
  resolutionCard: {
    padding: 10,
    borderRadius: 12,
    marginBottom: 12
  },
  resolutionTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    marginBottom: 2
  },
  resolutionText: {
    fontSize: 12
  },
  reportActionsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4
  },
  inspectChatPrimaryBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 14,
    shadowColor: '#ff2a6d',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2
  },
  inspectChatBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: 'bold'
  },
  dictateActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 14,
    borderWidth: 1
  },
  dictateActionBtnText: {
    fontSize: 13,
    fontWeight: 'bold'
  },
  // Banned user
  userProfileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 8
  },
  userAvatarSquare: {
    width: 46,
    height: 46,
    borderRadius: 23
  },
  userNameTitle: {
    fontSize: 14,
    fontWeight: 'bold'
  },
  userEmailText: {
    fontSize: 12
  },
  banReasonText: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2
  },
  bannedPillBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10
  },
  reportDate: {
    fontSize: 11
  },
  unbanBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 9,
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 8
  },
  unbanBtnText: {
    fontSize: 12,
    fontWeight: 'bold'
  },
  // Inspector
  inspectOverlay: {
    flex: 1
  },
  inspectHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12
  },
  inspectBackBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 6
  },
  inspectBackBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: 'bold'
  },
  inspectHeaderTitle: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold'
  },
  inspectHeaderSubtitle: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 11
  },
  inspectorContextBanner: {
    padding: 12,
    borderBottomWidth: 1
  },
  inspectorPartiesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    marginBottom: 6
  },
  inspectMiniProfile: {
    alignItems: 'center'
  },
  inspectRolePill: {
    fontSize: 10,
    fontWeight: 'bold',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    marginBottom: 3
  },
  inspectPartyName: {
    fontSize: 13,
    fontWeight: 'bold'
  },
  inspectReportMotif: {
    fontSize: 12,
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: 4
  },
  inspectMessagesScroll: {
    flex: 1
  },
  inspectMsgBubbleWrap: {
    marginVertical: 6,
    maxWidth: '85%'
  },
  reporterMsgAlign: {
    alignSelf: 'flex-start'
  },
  reportedMsgAlign: {
    alignSelf: 'flex-end'
  },
  neutralMsgAlign: {
    alignSelf: 'center'
  },
  inspectSenderHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 3,
    paddingHorizontal: 4
  },
  inspectSenderLabel: {
    fontSize: 10,
    fontWeight: 'bold'
  },
  inspectMsgTime: {
    fontSize: 9,
    marginLeft: 6
  },
  inspectBubble: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 16,
    borderWidth: 1.5
  },
  inspectBubbleText: {
    fontSize: 14,
    lineHeight: 20
  },
  inspectMsgImage: {
    width: 200,
    height: 140,
    borderRadius: 10,
    marginTop: 8
  },
  inspectBottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderTopWidth: 1,
    gap: 8
  },
  inspectActionQuickBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 11,
    borderRadius: 14
  },
  inspectActionQuickText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: 'bold'
  },
  // Modal de Dictamen
  actionModalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16
  },
  actionModalCard: {
    width: '100%',
    maxWidth: 440,
    borderRadius: 24,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 15,
    elevation: 8
  },
  actionModalTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8
  },
  actionModalTitle: {
    fontSize: 17,
    fontWeight: 'bold'
  },
  actionModalSubtitle: {
    fontSize: 12,
    marginBottom: 16,
    lineHeight: 17
  },
  actionOptionsCol: {
    gap: 10,
    marginBottom: 14
  },
  actionOptionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#e5e7eb'
  },
  actionOptionTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    marginBottom: 2
  },
  actionOptionDesc: {
    fontSize: 11,
    lineHeight: 15
  },
  notesLabel: {
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 6
  },
  notesInput: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 10,
    fontSize: 13,
    textAlignVertical: 'top',
    height: 70,
    marginBottom: 16
  },
  actionModalFooter: {
    flexDirection: 'row',
    gap: 10
  },
  cancelActionBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1
  },
  cancelActionText: {
    fontSize: 13,
    fontWeight: '600'
  },
  confirmActionBtn: {
    flex: 1.3,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 14
  },
  confirmActionText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: 'bold'
  },
  webAdminPromoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    borderRadius: 18,
    borderWidth: 1.5,
    marginBottom: 16
  },
  webAdminPromoLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1
  },
  webAdminIconBadge: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center'
  },
  webAdminPromoTitle: {
    fontSize: 13,
    fontWeight: 'bold'
  },
  webAdminPromoSub: {
    fontSize: 11,
    marginTop: 2,
    lineHeight: 15
  },
  webAdminPromoBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 12,
    marginLeft: 8
  },
  webAdminPromoBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold'
  },
  proPill: {
    backgroundColor: '#ff2a6d',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 6,
    marginLeft: 6
  },
  proPillText: {
    color: '#ffffff',
    fontSize: 9,
    fontWeight: '900'
  },
  searchBoxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 14
  },
  searchBoxInput: {
    flex: 1,
    fontSize: 13,
    paddingVertical: 2
  }
});
