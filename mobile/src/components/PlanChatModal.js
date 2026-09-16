import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  TouchableOpacity,
  Image,
  TextInput,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Modal,
  ScrollView,
  Alert,
  Share,
  Linking
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme';
import { apiRequest } from '../api';
import { getAvatarSource } from '../utils/avatar';
import ReportBlockModal from './ReportBlockModal';

// Colores para diferenciar los nombres de los participantes en el grupo estilo WhatsApp
const PARTICIPANT_COLORS = [
  '#e63946',
  '#2a9d8f',
  '#9d4edd',
  '#e76f51',
  '#3a86ff',
  '#f72585',
  '#06d6a0',
  '#ffb703'
];

const CATEGORY_META = {
  coffee: { label: 'Café & Tapas', icon: 'cafe', bg: '#ffe8d6', color: '#b08968' },
  outdoor: { label: 'Aire Libre', icon: 'leaf', bg: '#d8f3dc', color: '#2d6a4f' },
  party: { label: 'Fiesta & Juegos', icon: 'musical-notes', bg: '#ffccd5', color: '#c9184a' },
  culture: { label: 'Cultura & Libros', icon: 'book', bg: '#e0aaff', color: '#5a189a' },
  sports: { label: 'Deporte & Salud', icon: 'fitness', bg: '#caf0f8', color: '#0077b6' }
};

const QUICK_SUGGESTIONS = [
  '¡Hola a todas!',
  '¿A qué hora quedamos exactamente?',
  '¡Qué ganas de este plan!',
  '¿Llevo algo para compartir?'
];

export default function PlanChatModal({
  visible,
  planId,
  onClose,
  onOpenDirectChat,
  onPlanUpdated,
  onEditPlan
}) {
  const { theme, isDarkMode } = useTheme();
  const [loading, setLoading] = useState(true);
  const [plan, setPlan] = useState(null);
  const [messages, setMessages] = useState([]);
  const [messageText, setMessageText] = useState('');
  const [sending, setSending] = useState(false);
  const [showGroupInfo, setShowGroupInfo] = useState(false);
  const [reportModalVisible, setReportModalVisible] = useState(false);
  const [targetUserToReport, setTargetUserToReport] = useState(null);

  const flatListRef = useRef(null);

  useEffect(() => {
    if (visible && planId) {
      loadChat();
      const interval = setInterval(() => {
        loadChat(true);
      }, 3500);
      return () => clearInterval(interval);
    }
  }, [visible, planId]);

  const loadChat = async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      const data = await apiRequest(`/api/plans/${planId}/chat`);
      setPlan(data.plan);
      setMessages(data.messages || []);
    } catch (err) {
      if (!silent) {
        console.error('Error al cargar chat del plan:', err);
        Alert.alert('Acceso al chat', err.message || 'No se pudo cargar el chat del plan.');
        onClose();
      }
    } finally {
      if (!silent) setLoading(false);
    }
  };

  const handleSendMessage = async (textToSend = null) => {
    const text = (textToSend !== null ? textToSend : messageText).trim();
    if (!text || sending) return;

    if (textToSend === null) setMessageText('');
    setSending(true);

    const tempMsg = {
      id: Date.now(),
      senderId: 999999, // ID temporal
      senderName: 'Tú',
      senderAvatar: null,
      text,
      createdAt: new Date(),
      isMine: true
    };
    setMessages((prev) => [...prev, tempMsg]);

    try {
      await apiRequest(`/api/plans/${planId}/chat/messages`, {
        method: 'POST',
        body: JSON.stringify({ text })
      });
      loadChat(true);
      if (onPlanUpdated) onPlanUpdated();
    } catch (err) {
      console.error('Error enviando mensaje al plan:', err);
      Alert.alert('Error', 'No se pudo enviar el mensaje.');
    } finally {
      setSending(false);
    }
  };

  const handleToggleJoin = async () => {
    try {
      const data = await apiRequest(`/api/plans/${planId}/join`, { method: 'POST' });
      if (!data.isJoined) {
        Alert.alert('Has salido del plan', 'Ya no formas parte de este plan.');
        setShowGroupInfo(false);
        onClose();
        if (onPlanUpdated) onPlanUpdated();
      } else {
        loadChat(true);
        if (onPlanUpdated) onPlanUpdated();
      }
    } catch (err) {
      Alert.alert('Error', err.message);
    }
  };

  const handleSharePlan = async () => {
    if (!plan) return;
    try {
      await Share.share({
        message: `¡Únete a mi plan en Sparks!\n"${plan.title}"\nFecha: ${plan.dateTimeText}\nLugar: ${plan.locationName}\n¡Nos vemos allí!`
      });
    } catch (err) {
      console.error(err);
    }
  };

  const handleLikeAttendee = (attendee) => {
    Alert.alert(
      `Conectar con ${attendee.name}`,
      `Solo puedes hablar en privado si ambas hacéis Match mutuo. El chat de este plan es para hablar con todo el grupo.\n\n¿Quieres enviarle un Flechazo para intentar hacer match?`,
      [
        { text: 'Ahora no', style: 'cancel' },
        {
          text: 'Enviar Flechazo',
          onPress: async () => {
            try {
              const data = await apiRequest(`/api/users/${attendee.id}/like`, { method: 'POST' });
              if (data.isMatch) {
                Alert.alert(
                  '¡Es un Spark!',
                  `¡Tú y ${attendee.name} habéis hecho match! Ya podéis hablar en privado.`,
                  [
                    { text: 'Seguir en el plan', style: 'cancel', onPress: () => loadChat(true) },
                    {
                      text: 'Ir al Chat Privado',
                      onPress: () => {
                        setShowGroupInfo(false);
                        onClose();
                        if (onOpenDirectChat) onOpenDirectChat(attendee);
                      }
                    }
                  ]
                );
              } else {
                Alert.alert(
                  '¡Flechazo enviado!',
                  `Le hemos enviado tu flechazo a ${attendee.name}. Si ella también te da like, podréis hablar en privado.`
                );
              }
            } catch (err) {
              Alert.alert('Aviso', err.message);
            }
          }
        }
      ]
    );
  };

  const getParticipantColor = (id) => {
    return PARTICIPANT_COLORS[id % PARTICIPANT_COLORS.length];
  };

  if (!visible) return null;

  const catMeta = plan
    ? CATEGORY_META[plan.category] || CATEGORY_META.coffee
    : CATEGORY_META.coffee;

  const attendeesSummary = plan?.attendees
    ? plan.attendees.map((a) => (a.isMe ? 'Tú' : a.name.split(' ')[0])).join(', ')
    : '';

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={onClose}
    >
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.keyboardContainer}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
        >
          {/* ================= HEADER ESTILO WHATSAPP ================= */}
          <View
            style={[
              styles.waHeader,
              {
                backgroundColor: isDarkMode ? '#1a050d' : theme.colors.primaryDark,
                borderBottomColor: isDarkMode ? '#3d0c1e' : 'transparent'
              }
            ]}
          >
            {/* Botón Volver */}
            <TouchableOpacity
              style={styles.waBackBtn}
              onPress={onClose}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            >
              <Ionicons name="arrow-back" size={24} color="#ffffff" />
            </TouchableOpacity>

            {/* Grupo Clickeable para abrir Detalles del Grupo */}
            <TouchableOpacity
              style={styles.waHeaderTouch}
              activeOpacity={0.7}
              onPress={() => setShowGroupInfo(true)}
            >
              {/* Avatar circular con icono del plan */}
              <View style={[styles.waGroupAvatar, { backgroundColor: catMeta.bg }]}>
                <Ionicons name={catMeta.icon} size={20} color={catMeta.color} />
              </View>

              {/* Título y Subtítulo de Participantes */}
              <View style={styles.waHeaderTextWrap}>
                <Text style={styles.waGroupTitle} numberOfLines={1}>
                  {plan?.title || 'Cargando plan...'}
                </Text>
                <Text style={styles.waGroupSubtitle} numberOfLines={1}>
                  {attendeesSummary
                    ? `${attendeesSummary} • Toca para info`
                    : 'Toca aquí para ver los detalles del grupo'}
                </Text>
              </View>
            </TouchableOpacity>

            {/* Botón Info / Opciones */}
            <TouchableOpacity
              style={styles.waInfoBtn}
              onPress={() => setShowGroupInfo(true)}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            >
              <Ionicons name="information-circle-outline" size={25} color="#ffffff" />
            </TouchableOpacity>
          </View>

          {/* ================= BANNER FIJO CON DETALLES DEL EVENTO ================= */}
          {plan && (
            <TouchableOpacity
              style={[
                styles.eventPinnedBanner,
                { backgroundColor: isDarkMode ? '#280814' : '#ffe8ed', borderColor: theme.colors.border }
              ]}
              onPress={() => setShowGroupInfo(true)}
              activeOpacity={0.8}
            >
              <View style={styles.eventBannerLeft}>
                <Ionicons name="calendar-outline" size={15} color={theme.colors.primary} style={{ marginRight: 5 }} />
                <Text style={[styles.eventBannerText, { color: theme.colors.primary }]}>{plan.dateTimeText}</Text>
                <Text style={[styles.eventBannerDivider, { color: theme.colors.textMuted }]}>•</Text>
                <Ionicons name="location-outline" size={15} color={theme.colors.textSecondary} style={{ marginRight: 4 }} />
                <Text style={[styles.eventBannerText, { color: theme.colors.textSecondary }]} numberOfLines={1}>
                  {plan.locationName}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={theme.colors.textMuted} />
            </TouchableOpacity>
          )}

          {/* ================= LISTA DE MENSAJES ================= */}
          {loading && !plan ? (
            <View style={styles.centerLoading}>
              <ActivityIndicator size="large" color={theme.colors.primaryDark} />
            </View>
          ) : (
            <FlatList
              ref={flatListRef}
              data={messages}
              keyExtractor={(item) => item.id.toString()}
              contentContainerStyle={styles.messagesList}
              onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
              ListHeaderComponent={
                <View style={styles.systemPillBox}>
                  <View style={[styles.systemPill, { backgroundColor: isDarkMode ? '#2d0c1b' : '#fff0f3', borderColor: theme.colors.border }]}>
                    <Ionicons name="sparkles" size={12} color={theme.colors.primary} style={{ marginRight: 6 }} />
                    <Text style={[styles.systemPillText, { color: theme.colors.primary }]}>
                      Chat del grupo • Respeta las normas de la comunidad sáfica
                    </Text>
                  </View>
                </View>
              }
              renderItem={({ item }) => {
                if (item.isMine) {
                  return (
                    <View style={[styles.msgRow, styles.myMsgRow]}>
                      <View
                        style={[
                          styles.waBubble,
                          styles.myWaBubble,
                          { backgroundColor: theme.colors.primaryDark }
                        ]}
                      >
                        <Text style={styles.myMsgText}>{item.text}</Text>
                        <View style={styles.myMsgFooter}>
                          <Text style={styles.myMsgTime}>
                            {new Date(item.createdAt).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </Text>
                          <Ionicons name="checkmark-done" size={14} color="#ffb3c1" style={{ marginLeft: 3 }} />
                        </View>
                      </View>
                    </View>
                  );
                }

                const senderColor = getParticipantColor(item.senderId);

                return (
                  <View style={[styles.msgRow, styles.theirMsgRow]}>
                    <Image
                      source={getAvatarSource(item.senderAvatar)}
                      style={styles.msgSenderAvatar}
                    />
                    <View
                      style={[
                        styles.waBubble,
                        styles.theirWaBubble,
                        {
                          backgroundColor: theme.colors.surface,
                          borderColor: theme.colors.border
                        }
                      ]}
                    >
                      {/* Nombre de la remitente estilo WhatsApp */}
                      <View style={styles.senderHeaderRow}>
                        <Text style={[styles.senderNameText, { color: senderColor }]}>
                          {item.senderName}
                        </Text>
                        {item.isCreator && (
                          <View style={styles.adminBadgeSmall}>
                            <Text style={styles.adminBadgeSmallText}>Organizadora</Text>
                          </View>
                        )}
                      </View>

                      <Text style={[styles.theirMsgText, { color: theme.colors.textPrimary }]}>
                        {item.text}
                      </Text>

                      <Text style={[styles.theirMsgTime, { color: theme.colors.textMuted }]}>
                        {new Date(item.createdAt).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </Text>
                    </View>
                  </View>
                );
              }}
              ListEmptyComponent={
                <View style={styles.emptyChatBox}>
                  <Ionicons name="chatbubbles-outline" size={44} color={theme.colors.textMuted} style={{ marginBottom: 10 }} />
                  <Text style={[styles.emptyChatTitle, { color: theme.colors.textPrimary }]}>
                    Aún no hay mensajes en este plan
                  </Text>
                  <Text style={[styles.emptyChatSub, { color: theme.colors.textSecondary }]}>
                    ¡Sé la primera en escribir y romper el hielo con el grupo!
                  </Text>
                </View>
              }
            />
          )}

          {/* ================= SUGERENCIAS RÁPIDAS ================= */}
          <View style={[styles.suggestionsBar, { backgroundColor: theme.colors.surface, borderTopColor: theme.colors.border }]}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.suggScroll}>
              {QUICK_SUGGESTIONS.map((sugg, idx) => (
                <TouchableOpacity
                  key={idx}
                  style={[styles.suggChip, { backgroundColor: theme.colors.surfaceSubtle, borderColor: theme.colors.border }]}
                  onPress={() => handleSendMessage(sugg)}
                >
                  <Text style={[styles.suggChipText, { color: theme.colors.primary }]}>{sugg}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* ================= BARRA DE ENTRADA ================= */}
          <View style={[styles.waInputBar, { backgroundColor: theme.colors.surface, borderTopColor: theme.colors.border }]}>
            <TextInput
              style={[
                styles.waTextInput,
                {
                  backgroundColor: theme.colors.surfaceSubtle,
                  borderColor: theme.colors.border,
                  color: theme.colors.textPrimary
                }
              ]}
              placeholder="Escribe un mensaje al grupo..."
              placeholderTextColor={theme.colors.textMuted}
              value={messageText}
              onChangeText={setMessageText}
              multiline
            />

            <TouchableOpacity
              style={[
                styles.waSendBtn,
                { backgroundColor: theme.colors.primaryDark },
                !messageText.trim() && styles.waSendBtnDisabled
              ]}
              onPress={() => handleSendMessage()}
              disabled={!messageText.trim() || sending}
            >
              {sending ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                <Ionicons name="send" size={17} color="#ffffff" />
              )}
            </TouchableOpacity>
          </View>

          {/* ================= MODAL / DETALLES DEL GRUPO (ESTILO WHATSAPP) ================= */}
          <Modal
            visible={showGroupInfo}
            animationType="slide"
            presentationStyle="pageSheet"
            onRequestClose={() => setShowGroupInfo(false)}
          >
            <SafeAreaView style={[styles.infoContainer, { backgroundColor: theme.colors.background }]}>
              {/* Header de Info */}
              <View style={[styles.infoHeader, { borderBottomColor: theme.colors.border }]}>
                <TouchableOpacity onPress={() => setShowGroupInfo(false)} style={styles.infoBackBtn}>
                  <Ionicons name="close" size={24} color={theme.colors.textPrimary} />
                </TouchableOpacity>
                <Text style={[styles.infoHeading, { color: theme.colors.textPrimary }]}>Info. del grupo</Text>
                <TouchableOpacity onPress={handleSharePlan} style={styles.infoShareBtn}>
                  <Ionicons name="share-outline" size={22} color={theme.colors.primary} />
                </TouchableOpacity>
              </View>

              <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.infoScrollContent}>
                {/* Hero del Grupo */}
                <View style={[styles.infoHero, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
                  <View style={[styles.infoLargeAvatar, { backgroundColor: catMeta.bg }]}>
                    <Ionicons name={catMeta.icon} size={48} color={catMeta.color} />
                  </View>
                  <Text style={[styles.infoTitle, { color: theme.colors.textPrimary }]}>{plan?.title}</Text>
                  <View style={[styles.infoCatBadge, { backgroundColor: isDarkMode ? '#2d0c1b' : catMeta.bg }]}>
                    <Text style={[styles.infoCatBadgeText, { color: catMeta.color }]}>{catMeta.label.toUpperCase()}</Text>
                  </View>

                  <Text style={[styles.infoSubText, { color: theme.colors.textMuted }]}>
                    Creado el {plan ? new Date(plan.createdAt).toLocaleDateString() : ''}
                  </Text>
                </View>

                {/* Tarjeta de Fecha & Lugar */}
                <View style={[styles.infoCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
                  <View style={styles.infoDetailRow}>
                    <View style={[styles.infoDetailIconBox, { backgroundColor: isDarkMode ? '#2d0c1b' : '#ffe8ed' }]}>
                      <Ionicons name="calendar" size={18} color={theme.colors.primary} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.infoDetailLabel, { color: theme.colors.textMuted }]}>Fecha y Hora</Text>
                      <Text style={[styles.infoDetailValue, { color: theme.colors.textPrimary }]}>{plan?.dateTimeText}</Text>
                    </View>
                  </View>

                  <View style={[styles.infoDivider, { backgroundColor: theme.colors.border }]} />

                  <View style={styles.infoDetailRow}>
                    <View style={[styles.infoDetailIconBox, { backgroundColor: isDarkMode ? '#2d0c1b' : '#ffe8ed' }]}>
                      <Ionicons name="location" size={18} color={theme.colors.primary} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.infoDetailLabel, { color: theme.colors.textMuted }]}>Lugar de encuentro</Text>
                      <Text style={[styles.infoDetailValue, { color: theme.colors.textPrimary }]}>{plan?.locationName}</Text>
                    </View>
                    <View
                      style={[styles.mapsInfoBtn, { backgroundColor: isDarkMode ? '#3d0c1e' : '#ffe5ec', borderColor: theme.colors.border }]}
                    >
                      <Ionicons name="location-sharp" size={13} color={theme.colors.primary} style={{ marginRight: 4 }} />
                      <Text style={[styles.mapsInfoBtnText, { color: theme.colors.primary }]}>Punto fijado</Text>
                    </View>
                  </View>
                </View>

                {/* Descripción del Plan */}
                <View style={[styles.infoCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
                  <Text style={[styles.infoCardTitle, { color: theme.colors.textPrimary }]}>Descripción del plan</Text>
                  <Text style={[styles.infoDescText, { color: theme.colors.textSecondary }]}>{plan?.description}</Text>
                </View>

                {/* Botón de Edición para la Creadora del Plan */}
                {plan?.isMine && onEditPlan && (
                  <TouchableOpacity
                    style={[
                      styles.editPlanBtnInInfo,
                      { backgroundColor: isDarkMode ? '#3d0c1e' : '#ffe5ec', borderColor: theme.colors.primaryDark }
                    ]}
                    onPress={() => {
                      setShowGroupInfo(false);
                      onClose();
                      onEditPlan(plan);
                    }}
                  >
                    <Ionicons name="pencil" size={16} color={theme.colors.primary} style={{ marginRight: 8 }} />
                    <Text style={[styles.editPlanBtnInInfoText, { color: theme.colors.primary }]}>
                      Editar este Plan
                    </Text>
                  </TouchableOpacity>
                )}

                {/* Lista de Asistentes / Participantes */}
                <View style={[styles.infoCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
                  <View style={styles.infoCardHeaderRow}>
                    <Text style={[styles.infoCardTitle, { color: theme.colors.textPrimary }]}>
                      Participantes ({plan?.attendees?.length || 0})
                    </Text>
                    <Ionicons name="people" size={18} color={theme.colors.primary} />
                  </View>

                  {plan?.attendees?.map((attendee) => (
                    <View key={attendee.id} style={styles.attendeeItemRow}>
                      <Image source={getAvatarSource(attendee.avatarUrl)} style={styles.attendeeAvatar} />

                      <View style={{ flex: 1, marginLeft: 12 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                          <Text style={[styles.attendeeName, { color: theme.colors.textPrimary }]}>
                            {attendee.name}
                          </Text>
                          {attendee.isVerified && (
                            <Ionicons name="checkmark-circle" size={14} color="#0077b6" style={{ marginLeft: 4 }} />
                          )}
                          {attendee.isMe && (
                            <View style={[styles.isMeBadge, { backgroundColor: isDarkMode ? '#3d0c1e' : '#ffe5ec' }]}>
                              <Text style={[styles.isMeBadgeText, { color: theme.colors.primary }]}>Tú</Text>
                            </View>
                          )}
                          {attendee.isCreator && (
                            <View style={[styles.adminBadge, { backgroundColor: isDarkMode ? '#2a4436' : '#d8f3dc' }]}>
                              <Text style={[styles.adminBadgeText, { color: '#2d6a4f' }]}>Organizadora</Text>
                            </View>
                          )}
                        </View>
                        <Text style={[styles.attendeePronouns, { color: theme.colors.textMuted }]}>
                          {attendee.pronouns} {attendee.age ? `• ${attendee.age} años` : ''}
                        </Text>
                      </View>

                      {!attendee.isMe && (
                        attendee.hasMatch ? (
                          <TouchableOpacity
                            style={[
                              styles.directChatBtn,
                              { backgroundColor: isDarkMode ? '#3d0c1e' : '#ffe5ec', borderColor: theme.colors.primaryDark }
                            ]}
                            onPress={() => {
                              setShowGroupInfo(false);
                              onClose();
                              if (onOpenDirectChat) onOpenDirectChat(attendee);
                            }}
                            title="Hablar en privado (Match mutuo)"
                          >
                            <Ionicons name="chatbubble-ellipses" size={16} color={theme.colors.primary} />
                          </TouchableOpacity>
                        ) : (
                          <TouchableOpacity
                            style={[
                              styles.likeAttendeeBtn,
                              { backgroundColor: isDarkMode ? '#250813' : '#fff0f3', borderColor: theme.colors.border }
                            ]}
                            onPress={() => handleLikeAttendee(attendee)}
                            title="Enviar flechazo para hacer match"
                          >
                            <Ionicons name="heart-outline" size={16} color={theme.colors.primary} />
                          </TouchableOpacity>
                        )
                      )}

                      {!attendee.isMe && (
                        <TouchableOpacity
                          style={[styles.reportAttendeeSmallBtn, { borderColor: theme.colors.border }]}
                          onPress={() => {
                            setTargetUserToReport(attendee);
                            setReportModalVisible(true);
                          }}
                        >
                          <Ionicons name="shield-outline" size={13} color={theme.colors.textMuted} />
                        </TouchableOpacity>
                      )}
                    </View>
                  ))}
                </View>

                {/* Acciones de Seguridad y Abandono */}
                <View style={styles.infoActionsBox}>
                  {!plan?.isMine && (
                    <TouchableOpacity
                      style={[styles.leaveGroupBtn, { backgroundColor: isDarkMode ? '#330810' : '#ffe5ea', borderColor: '#d90429' }]}
                      onPress={() => {
                        Alert.alert(
                          'Salir del plan',
                          '¿Seguro que quieres desapuntarte de este plan y dejar el chat de grupo?',
                          [
                            { text: 'Cancelar', style: 'cancel' },
                            { text: 'Salir del Grupo', style: 'destructive', onPress: handleToggleJoin }
                          ]
                        );
                      }}
                    >
                      <Ionicons name="exit-outline" size={18} color="#d90429" style={{ marginRight: 8 }} />
                      <Text style={styles.leaveGroupBtnText}>Salir del Grupo / Desapuntarme</Text>
                    </TouchableOpacity>
                  )}

                  <TouchableOpacity
                    style={[styles.reportGroupBtn, { borderColor: theme.colors.border }]}
                    onPress={() => setReportModalVisible(true)}
                  >
                    <Ionicons name="shield-outline" size={18} color={theme.colors.textMuted} style={{ marginRight: 8 }} />
                    <Text style={[styles.reportGroupBtnText, { color: theme.colors.textMuted }]}>
                      Reportar contenido o usuario del plan
                    </Text>
                  </TouchableOpacity>
                </View>
              </ScrollView>
            </SafeAreaView>
          </Modal>

          {/* Modal de Reporte */}
          <ReportBlockModal
            visible={reportModalVisible}
            targetUser={plan?.creator}
            onClose={() => setReportModalVisible(false)}
            onSuccessBlockOrReport={() => {
              setReportModalVisible(false);
              setShowGroupInfo(false);
              onClose();
            }}
          />
        </KeyboardAvoidingView>
        {/* Modal de Reporte y Bloqueo en Chat de Plan */}
        <ReportBlockModal
          visible={reportModalVisible}
          targetUser={
            targetUserToReport ||
            (plan?.creatorId
              ? { id: plan.creatorId, name: 'Organizadora del Plan' }
              : null)
          }
          planId={plan?.id}
          onClose={() => {
            setReportModalVisible(false);
            setTargetUserToReport(null);
          }}
          onSuccessBlockOrReport={() => {
            setReportModalVisible(false);
            setTargetUserToReport(null);
            setShowGroupInfo(false);
            onClose();
            if (onPlanUpdated) onPlanUpdated();
          }}
        />
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1
  },
  keyboardContainer: {
    flex: 1
  },
  centerLoading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  // WhatsApp Header
  waHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1
  },
  waBackBtn: {
    padding: 6,
    marginRight: 4
  },
  waHeaderTouch: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center'
  },
  waGroupAvatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10
  },
  waHeaderTextWrap: {
    flex: 1
  },
  waGroupTitle: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
    letterSpacing: 0.2
  },
  waGroupSubtitle: {
    color: 'rgba(255,255,255,0.75)',
    fontSize: 11,
    marginTop: 2
  },
  waInfoBtn: {
    padding: 6,
    marginLeft: 6
  },
  // Event Pinned Banner
  eventPinnedBanner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderBottomWidth: 1
  },
  eventBannerLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center'
  },
  eventBannerText: {
    fontSize: 11,
    fontWeight: '600'
  },
  eventBannerDivider: {
    marginHorizontal: 6
  },
  // Messages List
  messagesList: {
    padding: 14,
    paddingBottom: 16
  },
  systemPillBox: {
    alignItems: 'center',
    marginVertical: 10
  },
  systemPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    borderWidth: 1
  },
  systemPillText: {
    fontSize: 11,
    fontWeight: '600'
  },
  msgRow: {
    marginVertical: 4,
    flexDirection: 'row',
    alignItems: 'flex-end'
  },
  myMsgRow: {
    justifyContent: 'flex-end'
  },
  theirMsgRow: {
    justifyContent: 'flex-start'
  },
  msgSenderAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 8,
    marginBottom: 4
  },
  waBubble: {
    maxWidth: '78%',
    paddingHorizontal: 13,
    paddingVertical: 8,
    borderRadius: 18
  },
  myWaBubble: {
    borderBottomRightRadius: 4
  },
  theirWaBubble: {
    borderBottomLeftRadius: 4,
    borderWidth: 1
  },
  senderHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 3
  },
  senderNameText: {
    fontSize: 12,
    fontWeight: 'bold',
    marginRight: 6
  },
  adminBadgeSmall: {
    backgroundColor: '#d8f3dc',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 6
  },
  adminBadgeSmallText: {
    color: '#2d6a4f',
    fontSize: 9,
    fontWeight: 'bold'
  },
  theirMsgText: {
    fontSize: 14,
    lineHeight: 19
  },
  theirMsgTime: {
    fontSize: 10,
    marginTop: 3,
    alignSelf: 'flex-end'
  },
  myMsgText: {
    color: '#ffffff',
    fontSize: 14,
    lineHeight: 19
  },
  myMsgFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-end',
    marginTop: 3
  },
  myMsgTime: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 10
  },
  emptyChatBox: {
    alignItems: 'center',
    marginTop: 60,
    paddingHorizontal: 30
  },
  emptyChatTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center'
  },
  emptyChatSub: {
    fontSize: 13,
    marginTop: 6,
    textAlign: 'center',
    lineHeight: 18
  },
  // Suggestions
  suggestionsBar: {
    paddingVertical: 6,
    borderTopWidth: 1
  },
  suggScroll: {
    paddingHorizontal: 10
  },
  suggChip: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 14,
    borderWidth: 1,
    marginRight: 6
  },
  suggChipText: {
    fontSize: 12,
    fontWeight: '600'
  },
  // WhatsApp Input Bar
  waInputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderTopWidth: 1
  },
  waTextInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 22,
    paddingHorizontal: 14,
    paddingVertical: 8,
    fontSize: 14,
    maxHeight: 90
  },
  waSendBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8
  },
  waSendBtnDisabled: {
    opacity: 0.5
  },
  // Info Modal (Detalles del Grupo)
  infoContainer: {
    flex: 1
  },
  infoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1
  },
  infoBackBtn: {
    padding: 4
  },
  infoHeading: {
    fontSize: 17,
    fontWeight: 'bold'
  },
  infoShareBtn: {
    padding: 4
  },
  infoScrollContent: {
    padding: 16,
    paddingBottom: 40
  },
  infoHero: {
    alignItems: 'center',
    borderRadius: 22,
    padding: 22,
    borderWidth: 1,
    marginBottom: 14
  },
  infoLargeAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12
  },
  infoTitle: {
    fontSize: 19,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8
  },
  infoCatBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 6
  },
  infoCatBadgeText: {
    fontSize: 11,
    fontWeight: 'bold'
  },
  infoSubText: {
    fontSize: 11
  },
  infoCard: {
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    marginBottom: 14
  },
  infoCardTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    marginBottom: 8
  },
  infoCardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10
  },
  infoDetailRow: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  infoDetailIconBox: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12
  },
  infoDetailLabel: {
    fontSize: 11,
    fontWeight: '600'
  },
  infoDetailValue: {
    fontSize: 14,
    fontWeight: 'bold',
    marginTop: 2
  },
  infoDivider: {
    height: 1,
    marginVertical: 12
  },
  infoDescText: {
    fontSize: 14,
    lineHeight: 20
  },
  attendeeItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(150,150,150,0.1)'
  },
  attendeeAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22
  },
  attendeeName: {
    fontSize: 14,
    fontWeight: 'bold'
  },
  attendeePronouns: {
    fontSize: 11,
    marginTop: 2
  },
  isMeBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    marginLeft: 6
  },
  isMeBadgeText: {
    fontSize: 10,
    fontWeight: 'bold'
  },
  adminBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    marginLeft: 6
  },
  adminBadgeText: {
    fontSize: 10,
    fontWeight: 'bold'
  },
  directChatBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1
  },
  likeAttendeeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1
  },
  infoActionsBox: {
    marginTop: 10
  },
  editPlanBtnInInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 18,
    borderWidth: 1.5,
    marginBottom: 14
  },
  editPlanBtnInInfoText: {
    fontSize: 14,
    fontWeight: 'bold'
  },
  leaveGroupBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 13,
    borderRadius: 18,
    borderWidth: 1,
    marginBottom: 12
  },
  leaveGroupBtnText: {
    color: '#d90429',
    fontSize: 14,
    fontWeight: 'bold'
  },
  reportAttendeeSmallBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 6
  },
  reportGroupBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 18,
    borderWidth: 1
  },
  reportGroupBtnText: {
    fontSize: 13,
    fontWeight: '600'
  },
  mapsInfoBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    borderWidth: 1,
    marginLeft: 8
  },
  mapsInfoBtnText: {
    fontSize: 11,
    fontWeight: 'bold'
  }
});
