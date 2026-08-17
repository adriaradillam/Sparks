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
  RefreshControl,
  SafeAreaView,
  Modal,
  ScrollView,
  Alert
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme';
import { apiRequest } from '../api';
import { getAvatarSource } from './ProfileScreen';
import ReportBlockModal from '../components/ReportBlockModal';

const SAMPLE_EPHEMERAL_PHOTOS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600',
  'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=600',
  'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=600',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=600'
];

export default function ChatsScreen({ initialActiveChat, onClearActiveChat }) {
  const { theme, isDarkMode } = useTheme();
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Estado del chat abierto
  const [activeChat, setActiveChat] = useState(initialActiveChat || null);
  const [messages, setMessages] = useState([]);
  const [messageText, setMessageText] = useState('');
  const [sending, setSending] = useState(false);

  // Modales interactivos
  const [icebreakerModal, setIcebreakerModal] = useState(false);
  const [icebreakersList, setIcebreakersList] = useState([]);
  const [ephemeralPhotoModal, setEphemeralPhotoModal] = useState(false);
  const [viewingPhoto, setViewingPhoto] = useState(null);
  const [reportModalVisible, setReportModalVisible] = useState(false);

  const flatListRef = useRef(null);

  useEffect(() => {
    fetchConversations();
    fetchIcebreakers();
  }, []);

  useEffect(() => {
    if (initialActiveChat) {
      setActiveChat(initialActiveChat);
    }
  }, [initialActiveChat]);

  useEffect(() => {
    let interval;
    if (activeChat) {
      fetchMessages(activeChat.conversationId);
      interval = setInterval(() => {
        fetchMessages(activeChat.conversationId, true);
      }, 3000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [activeChat]);

  const fetchIcebreakers = async () => {
    try {
      const data = await apiRequest('/api/chats/icebreakers');
      setIcebreakersList(data.icebreakers || []);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchConversations = async () => {
    try {
      const data = await apiRequest('/api/chats');
      setConversations(data.conversations || []);
    } catch (err) {
      console.error('Error fetching conversations:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchMessages = async (convId, silent = false) => {
    try {
      const data = await apiRequest(`/api/chats/${convId}/messages`);
      setMessages(data.messages || []);
    } catch (err) {
      if (!silent) console.error('Error fetching messages:', err);
    }
  };

  const handleSendMessage = async (customText = null, customType = 'text', customImageUrl = null) => {
    const textToSend = (customText !== null ? customText : messageText).trim();
    if (!textToSend && !customImageUrl) return;
    if (!activeChat) return;

    if (customText === null) setMessageText('');
    setSending(true);

    const tempMsg = {
      id: Date.now(),
      text: textToSend,
      type: customType,
      imageUrl: customImageUrl,
      viewed: false,
      isMine: true,
      createdAt: new Date()
    };
    setMessages((prev) => [...prev, tempMsg]);

    try {
      await apiRequest(`/api/chats/${activeChat.conversationId}/messages`, {
        method: 'POST',
        body: JSON.stringify({
          text: textToSend,
          type: customType,
          imageUrl: customImageUrl
        })
      });
      fetchMessages(activeChat.conversationId, true);
      fetchConversations();
    } catch (err) {
      console.error('Error sending message:', err);
    } finally {
      setSending(false);
    }
  };

  const handleSendIcebreaker = (question) => {
    setIcebreakerModal(false);
    handleSendMessage(question, 'icebreaker');
  };

  const handleSendEphemeralPhoto = (photoUrl) => {
    setEphemeralPhotoModal(false);
    handleSendMessage('Foto temporal', 'ephemeral_image', photoUrl);
  };

  const handleOpenEphemeralPhoto = async (msg) => {
    if (msg.viewed && !msg.isMine) {
      Alert.alert('Foto caducada', 'Esta foto era de visualización única y ya ha caducado.');
      return;
    }

    setViewingPhoto({ id: msg.id, url: msg.imageUrl });

    if (!msg.isMine) {
      try {
        await apiRequest(`/api/chats/${activeChat.conversationId}/messages/${msg.id}/view`, {
          method: 'POST'
        });
        setMessages((prev) =>
          prev.map((m) => (m.id === msg.id ? { ...m, viewed: true } : m))
        );
      } catch (err) {
        console.error(err);
      }
    }
  };

  const renderConversationItem = ({ item }) => (
    <TouchableOpacity
      style={[styles.convCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}
      activeOpacity={0.7}
      onPress={() =>
        setActiveChat({
          conversationId: item.id,
          partner: item.partner
        })
      }
    >
      <View style={styles.convAvatarContainer}>
        <Image
          source={getAvatarSource(item.partner?.avatarUrl)}
          style={styles.convAvatar}
        />
        <View style={styles.onlineBadge} />
      </View>

      <View style={styles.convBody}>
        <View style={styles.convHeaderRow}>
          <Text style={[styles.convName, { color: theme.colors.textPrimary }]}>{item.partner.name}</Text>
          <Text style={[styles.convTime, { color: theme.colors.textMuted }]}>
            {new Date(item.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </Text>
        </View>
        <Text style={[styles.convLastMessage, { color: theme.colors.textSecondary }]} numberOfLines={1}>
          {item.lastMessage || 'Empieza a hablar con ella'}
        </Text>
      </View>

      {item.unreadCount > 0 && (
        <View style={[styles.unreadBadge, { backgroundColor: theme.colors.primaryDark }]}>
          <Text style={styles.unreadCountText}>{item.unreadCount}</Text>
        </View>
      )}
    </TouchableOpacity>
  );

  const renderMessageBubble = ({ item }) => {
    if (item.type === 'icebreaker') {
      return (
        <View style={styles.icebreakerContainer}>
          <View style={[styles.icebreakerCard, { backgroundColor: isDarkMode ? '#2d0c1b' : '#fff0f3', borderColor: theme.colors.primaryDark }]}>
            <View style={styles.icebreakerHeader}>
              <View style={[styles.icebreakerBadge, { backgroundColor: isDarkMode ? '#3d0c1e' : '#ffccd5' }]}>
                <Ionicons name="sparkles" size={11} color={theme.colors.primary} style={{ marginRight: 4 }} />
                <Text style={[styles.icebreakerBadgeText, { color: theme.colors.primary }]}>
                  Pregunta Rompehielos
                </Text>
              </View>
            </View>
            <Text style={[styles.icebreakerText, { color: theme.colors.textPrimary }]}>{item.text}</Text>
            <Text style={[styles.icebreakerTime, { color: theme.colors.textMuted }]}>
              {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </Text>
          </View>
        </View>
      );
    }

    if (item.type === 'ephemeral_image') {
      const isExpired = item.viewed && !item.isMine;
      return (
        <View
          style={[
            styles.bubbleContainer,
            item.isMine ? styles.myBubbleContainer : styles.theirBubbleContainer
          ]}
        >
          <TouchableOpacity
            style={[
              styles.ephemeralBubble,
              item.isMine
                ? { backgroundColor: theme.colors.primaryDark, borderBottomRightRadius: 4 }
                : { backgroundColor: theme.colors.surface, borderColor: theme.colors.border, borderBottomLeftRadius: 4 },
              isExpired && styles.ephemeralBubbleExpired
            ]}
            onPress={() => handleOpenEphemeralPhoto(item)}
            activeOpacity={0.8}
          >
            <Ionicons
              name={isExpired ? 'eye-off' : 'lock-closed'}
              size={20}
              color={item.isMine ? '#ffffff' : theme.colors.primary}
              style={{ marginRight: 10 }}
            />
            <View style={styles.ephemeralTextContainer}>
              <Text
                style={[
                  styles.ephemeralTitle,
                  { color: item.isMine ? '#ffffff' : theme.colors.textPrimary }
                ]}
              >
                {isExpired ? 'Foto caducada' : 'Foto temporal (1 uso)'}
              </Text>
              <Text
                style={[
                  styles.ephemeralSubtitle,
                  { color: item.isMine ? 'rgba(255,255,255,0.7)' : theme.colors.textMuted }
                ]}
              >
                {isExpired ? 'Ya vista' : 'Toca para abrir'}
              </Text>
            </View>
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <View
        style={[
          styles.bubbleContainer,
          item.isMine ? styles.myBubbleContainer : styles.theirBubbleContainer
        ]}
      >
        <View
          style={[
            styles.bubble,
            item.isMine
              ? { backgroundColor: theme.colors.primaryDark, borderBottomRightRadius: 4 }
              : { backgroundColor: theme.colors.surface, borderColor: theme.colors.border, borderBottomLeftRadius: 4 }
          ]}
        >
          <Text style={[styles.bubbleText, { color: item.isMine ? '#ffffff' : theme.colors.textPrimary }]}>
            {item.text}
          </Text>
          <Text style={[styles.bubbleTime, { color: item.isMine ? 'rgba(255,255,255,0.7)' : theme.colors.textMuted }]}>
            {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </Text>
        </View>
        <ReportBlockModal
          visible={reportModalVisible}
          targetUser={activeChat?.partner}
          onClose={() => setReportModalVisible(false)}
          onSuccessBlockOrReport={() => {
            setActiveChat(null);
            fetchConversations();
          }}
        />
      </View>
    );
  };

  if (activeChat) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.keyboardContainer}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
        >
          {/* Header del Chat */}
          <View style={[styles.chatHeader, { backgroundColor: theme.colors.surface, borderBottomColor: theme.colors.border }]}>
            <TouchableOpacity
              style={[styles.backBtn, { backgroundColor: isDarkMode ? '#3d0c1e' : '#ffe5ec' }]}
              onPress={() => {
                setActiveChat(null);
                if (onClearActiveChat) onClearActiveChat();
                fetchConversations();
              }}
            >
              <Ionicons name="arrow-back" size={16} color={theme.colors.primary} style={{ marginRight: 2 }} />
              <Text style={[styles.backBtnText, { color: theme.colors.primary }]}>Volver</Text>
            </TouchableOpacity>

            <View style={styles.chatHeaderUser}>
              <Image
                source={getAvatarSource(activeChat.partner?.avatarUrl)}
                style={styles.chatHeaderAvatar}
              />
              <View style={{ flex: 1 }}>
                <Text style={[styles.chatHeaderName, { color: theme.colors.textPrimary }]}>{activeChat.partner.name}</Text>
                <Text style={styles.chatHeaderStatus}>En línea</Text>
              </View>

              {/* Botón de Seguridad / Reporte */}
              <TouchableOpacity
                style={[styles.reportChatBtn, { backgroundColor: isDarkMode ? '#2d0c1b' : '#fff0f3' }]}
                onPress={() => setReportModalVisible(true)}
                activeOpacity={0.7}
              >
                <Ionicons name="shield-outline" size={17} color="#d90429" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Lista de Mensajes */}
          <FlatList
            ref={flatListRef}
            data={messages}
            keyExtractor={(item) => item.id.toString()}
            renderItem={renderMessageBubble}
            contentContainerStyle={styles.messagesList}
            onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
            ListEmptyComponent={
              <View style={styles.emptyMessagesBox}>
                <Ionicons name="chatbubbles-outline" size={40} color={theme.colors.textMuted} style={{ marginBottom: 8 }} />
                <Text style={[styles.emptyMsgText, { color: theme.colors.textSecondary }]}>
                  Saluda a {activeChat.partner.name} y rompe el hielo
                </Text>
                <TouchableOpacity
                  style={[styles.icebreakerPromptBtn, { backgroundColor: isDarkMode ? '#3d0c1e' : '#ffe5ec', borderColor: theme.colors.primaryDark }]}
                  onPress={() => setIcebreakerModal(true)}
                >
                  <Ionicons name="sparkles" size={15} color={theme.colors.primary} style={{ marginRight: 6 }} />
                  <Text style={[styles.icebreakerPromptBtnText, { color: theme.colors.primary }]}>
                    Lanzar Pregunta Rompehielos
                  </Text>
                </TouchableOpacity>
              </View>
            }
          />

          {/* Barra de entrada de texto */}
          <View style={[styles.inputBar, { backgroundColor: theme.colors.surface, borderTopColor: theme.colors.border }]}>
            <TouchableOpacity
              style={[styles.toolBtn, { backgroundColor: theme.colors.surfaceSubtle }]}
              onPress={() => setIcebreakerModal(true)}
            >
              <Ionicons name="help-circle-outline" size={22} color={theme.colors.primary} />
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.toolBtn, { backgroundColor: theme.colors.surfaceSubtle }]}
              onPress={() => setEphemeralPhotoModal(true)}
            >
              <Ionicons name="camera-outline" size={22} color={theme.colors.primary} />
            </TouchableOpacity>

            <TextInput
              style={[styles.chatInput, { backgroundColor: theme.colors.surfaceSubtle, borderColor: theme.colors.border, color: theme.colors.textPrimary }]}
              placeholder="Escribe un mensaje..."
              placeholderTextColor={theme.colors.textMuted}
              value={messageText}
              onChangeText={setMessageText}
              multiline
            />
            <TouchableOpacity
              style={[styles.sendBtn, { backgroundColor: theme.colors.primaryDark }, !messageText.trim() && styles.sendBtnDisabled]}
              onPress={() => handleSendMessage()}
              disabled={!messageText.trim() || sending}
            >
              {sending ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Ionicons name="send" size={16} color="#ffffff" />
              )}
            </TouchableOpacity>
          </View>

          {/* Modal de Rompehielos */}
          <Modal
            visible={icebreakerModal}
            transparent
            animationType="slide"
            onRequestClose={() => setIcebreakerModal(false)}
          >
            <View style={styles.modalOverlay}>
              <View style={[styles.modalSheet, { backgroundColor: theme.colors.surface }]}>
                <View style={styles.modalSheetHeader}>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Ionicons name="sparkles" size={18} color={theme.colors.primary} style={{ marginRight: 6 }} />
                    <Text style={[styles.modalSheetTitle, { color: theme.colors.textPrimary }]}>Preguntas Rompehielos</Text>
                  </View>
                  <TouchableOpacity onPress={() => setIcebreakerModal(false)}>
                    <Ionicons name="close" size={20} color={theme.colors.textMuted} />
                  </TouchableOpacity>
                </View>
                <Text style={[styles.modalSheetSubtitle, { color: theme.colors.textSecondary }]}>
                  Toca una pregunta para enviarla directamente al chat:
                </Text>

                <ScrollView showsVerticalScrollIndicator={false} style={styles.icebreakerList}>
                  {icebreakersList.map((q, idx) => (
                    <TouchableOpacity
                      key={idx}
                      style={[styles.icebreakerOption, { backgroundColor: isDarkMode ? '#2d0c1b' : '#fff0f3', borderColor: theme.colors.border }]}
                      onPress={() => handleSendIcebreaker(q)}
                    >
                      <Text style={[styles.icebreakerOptionText, { color: theme.colors.primary }]}>{q}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            </View>
          </Modal>

          {/* Modal de Enviar Foto Efímera */}
          <Modal
            visible={ephemeralPhotoModal}
            transparent
            animationType="slide"
            onRequestClose={() => setEphemeralPhotoModal(false)}
          >
            <View style={styles.modalOverlay}>
              <View style={[styles.modalSheet, { backgroundColor: theme.colors.surface }]}>
                <View style={styles.modalSheetHeader}>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Ionicons name="camera" size={18} color={theme.colors.primary} style={{ marginRight: 6 }} />
                    <Text style={[styles.modalSheetTitle, { color: theme.colors.textPrimary }]}>Enviar Foto Temporal</Text>
                  </View>
                  <TouchableOpacity onPress={() => setEphemeralPhotoModal(false)}>
                    <Ionicons name="close" size={20} color={theme.colors.textMuted} />
                  </TouchableOpacity>
                </View>
                <Text style={[styles.modalSheetSubtitle, { color: theme.colors.textSecondary }]}>
                  Esta foto solo podrá verse una vez y luego caducará:
                </Text>

                <View style={styles.photoGrid}>
                  {SAMPLE_EPHEMERAL_PHOTOS.map((url, idx) => (
                    <TouchableOpacity
                      key={idx}
                      style={styles.photoChoice}
                      onPress={() => handleSendEphemeralPhoto(url)}
                    >
                      <Image source={{ uri: url }} style={styles.photoChoiceImg} />
                      <View style={styles.lockOverlay}>
                        <Ionicons name="lock-closed" size={13} color="#ffffff" style={{ marginRight: 4 }} />
                        <Text style={styles.lockIcon}>Enviar</Text>
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </View>
          </Modal>

          {/* Modal de Visualización de Foto Efímera */}
          <Modal
            visible={!!viewingPhoto}
            transparent
            animationType="fade"
            onRequestClose={() => setViewingPhoto(null)}
          >
            <View style={styles.fullscreenOverlay}>
              <View style={styles.photoTimerBar}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Ionicons name="lock-closed" size={16} color="#ff4d6d" style={{ marginRight: 6 }} />
                  <Text style={styles.timerText}>Foto Temporal (Un solo uso)</Text>
                </View>
                <TouchableOpacity
                  style={styles.closePhotoBtn}
                  onPress={() => setViewingPhoto(null)}
                >
                  <Text style={styles.closePhotoText}>Cerrar ✕</Text>
                </TouchableOpacity>
              </View>

              {viewingPhoto && (
                <Image
                  source={{ uri: viewingPhoto.url }}
                  style={styles.fullscreenPhoto}
                  resizeMode="contain"
                />
              )}
            </View>
          </Modal>
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={[styles.topBar, { backgroundColor: theme.colors.surface, borderBottomColor: theme.colors.border }]}>
        <Text style={[styles.heading, { color: isDarkMode ? theme.colors.primary : theme.colors.primaryDark }]}>
          Mensajes
        </Text>
        <Text style={[styles.subheading, { color: theme.colors.textSecondary }]}>
          Tus conversaciones activas
        </Text>
      </View>

      {loading ? (
        <View style={styles.centerBox}>
          <ActivityIndicator size="large" color={theme.colors.primaryDark} />
        </View>
      ) : (
        <FlatList
          data={conversations}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderConversationItem}
          contentContainerStyle={styles.convListContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                fetchConversations();
              }}
              colors={[theme.colors.primaryDark]}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyBox}>
              <Ionicons name="chatbubbles-outline" size={44} color={theme.colors.textMuted} style={{ marginBottom: 10 }} />
              <Text style={[styles.emptyTitle, { color: theme.colors.textPrimary }]}>Aún no tienes conversaciones</Text>
              <Text style={[styles.emptySubtitle, { color: theme.colors.textMuted }]}>
                Explora la cuadrícula de chicas cercanas y envíales un flechazo para chatear.
              </Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1
  },
  keyboardContainer: {
    flex: 1
  },
  topBar: {
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
  convListContent: {
    padding: 12
  },
  convCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 18,
    marginBottom: 10,
    borderWidth: 1,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 5,
    elevation: 2
  },
  convAvatarContainer: {
    position: 'relative'
  },
  convAvatar: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: '#ffe5ec'
  },
  onlineBadge: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#2ec4b6',
    borderWidth: 2,
    borderColor: '#ffffff'
  },
  convBody: {
    flex: 1,
    marginLeft: 14
  },
  convHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4
  },
  convName: {
    fontSize: 16,
    fontWeight: 'bold'
  },
  convTime: {
    fontSize: 12
  },
  convLastMessage: {
    fontSize: 13
  },
  unreadBadge: {
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginLeft: 8
  },
  unreadCountText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: 'bold'
  },
  centerBox: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  emptyBox: {
    alignItems: 'center',
    marginTop: 80,
    paddingHorizontal: 40
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: 'bold',
    textAlign: 'center'
  },
  emptySubtitle: {
    fontSize: 13,
    marginTop: 6,
    textAlign: 'center',
    lineHeight: 18
  },
  chatHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 10,
    marginRight: 10,
    borderRadius: 15
  },
  backBtnText: {
    fontWeight: 'bold',
    fontSize: 13
  },
  chatHeaderUser: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  chatHeaderAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginRight: 10
  },
  reportChatBtn: {
    padding: 7,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 6
  },
  chatHeaderName: {
    fontSize: 16,
    fontWeight: 'bold'
  },
  chatHeaderStatus: {
    fontSize: 11,
    color: '#2ec4b6'
  },
  messagesList: {
    padding: 16,
    paddingBottom: 20
  },
  bubbleContainer: {
    marginVertical: 4,
    flexDirection: 'row'
  },
  myBubbleContainer: {
    justifyContent: 'flex-end'
  },
  theirBubbleContainer: {
    justifyContent: 'flex-start'
  },
  bubble: {
    maxWidth: '80%',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1
  },
  bubbleText: {
    fontSize: 15,
    lineHeight: 20
  },
  bubbleTime: {
    fontSize: 10,
    marginTop: 4,
    alignSelf: 'flex-end'
  },
  icebreakerContainer: {
    alignItems: 'center',
    marginVertical: 10
  },
  icebreakerCard: {
    borderWidth: 1.5,
    borderRadius: 18,
    padding: 16,
    width: '90%',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 2
  },
  icebreakerHeader: {
    flexDirection: 'row',
    marginBottom: 6
  },
  icebreakerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10
  },
  icebreakerBadgeText: {
    fontSize: 11,
    fontWeight: 'bold'
  },
  icebreakerText: {
    fontSize: 15,
    fontWeight: '600',
    lineHeight: 21
  },
  icebreakerTime: {
    fontSize: 10,
    marginTop: 6,
    alignSelf: 'flex-end'
  },
  ephemeralBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
    maxWidth: '80%',
    borderWidth: 1
  },
  ephemeralBubbleExpired: {
    opacity: 0.6
  },
  ephemeralTextContainer: {
    flex: 1
  },
  ephemeralTitle: {
    fontSize: 14,
    fontWeight: 'bold'
  },
  ephemeralSubtitle: {
    fontSize: 11,
    marginTop: 2
  },
  emptyMessagesBox: {
    alignItems: 'center',
    marginTop: 50
  },
  emptyMsgText: {
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
    marginBottom: 16
  },
  icebreakerPromptBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1
  },
  icebreakerPromptBtnText: {
    fontWeight: 'bold',
    fontSize: 13
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    borderTopWidth: 1
  },
  toolBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 6
  },
  chatInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    fontSize: 14,
    maxHeight: 90
  },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 6
  },
  sendBtnDisabled: {
    opacity: 0.5
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'flex-end'
  },
  modalSheet: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 20,
    maxHeight: '80%'
  },
  modalSheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6
  },
  modalSheetTitle: {
    fontSize: 18,
    fontWeight: 'bold'
  },
  modalSheetSubtitle: {
    fontSize: 13,
    marginBottom: 16
  },
  icebreakerList: {
    maxHeight: 350
  },
  icebreakerOption: {
    padding: 14,
    borderRadius: 16,
    marginBottom: 10,
    borderWidth: 1
  },
  icebreakerOptionText: {
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 20
  },
  photoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between'
  },
  photoChoice: {
    width: '48%',
    height: 140,
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 12,
    position: 'relative'
  },
  photoChoiceImg: {
    width: '100%',
    height: '100%'
  },
  lockOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(201, 24, 74, 0.85)',
    paddingVertical: 6,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center'
  },
  lockIcon: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold'
  },
  fullscreenOverlay: {
    flex: 1,
    backgroundColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center'
  },
  photoTimerBar: {
    position: 'absolute',
    top: 50,
    left: 20,
    right: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    zIndex: 10
  },
  timerText: {
    color: '#ff4d6d',
    fontWeight: 'bold',
    fontSize: 14
  },
  closePhotoBtn: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20
  },
  closePhotoText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 14
  },
  fullscreenPhoto: {
    width: '100%',
    height: '80%'
  }
});
