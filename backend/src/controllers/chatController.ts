import { Request, Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { memoryStore, MessageType } from '../store/memoryStore';

const ICEBREAKERS_LIST = [
  '¿Cuál es tu canción sáfica favorita de todos los tiempos? 🎵✨',
  '¿Eres más de primera cita con café tranquilo o plan improvisado? ☕🍷',
  '¿Cuál es la película o serie queer que más te ha marcado? 🎬🍿',
  'Si pudieras teletransportarte a cualquier ciudad ahora mismo, ¿a cuál irías? ✈️🌍',
  '¿Cuál es tu placer culpable inconfesable? 🙈🍕',
  '¿Gatos, perros o jungla de plantas en casa? 🐾🌿',
  '¿Cuál es el mejor concierto al que has ido en tu vida? 🎸🔥',
  'Si tuviéramos una cita perfecta este finde, ¿qué plan haríamos? 💖'
];

export const getIcebreakers = async (req: Request, res: Response) => {
  res.json({ icebreakers: ICEBREAKERS_LIST });
};

export const getConversations = async (req: AuthRequest, res: Response) => {
  try {
    const currentUserId = req.userId!;

    const userConversations = memoryStore.conversations.filter((c) => {
      if (!c.participantIds.includes(currentUserId)) return false;
      const partnerId = c.participantIds.find((id) => id !== currentUserId)!;
      return !memoryStore.isBlocked(currentUserId, partnerId);
    });

    const formatted = userConversations.map((c) => {
      const partnerId = c.participantIds.find((id) => id !== currentUserId)!;
      const partner = memoryStore.users.find((u) => u.id === partnerId);

      const unreadCount = memoryStore.messages.filter(
        (m) => m.conversationId === c.id && m.senderId !== currentUserId && !m.isRead
      ).length;

      return {
        id: c.id,
        partner: {
          id: partner?.id || partnerId,
          name: partner?.name || 'Usuaria de Sparks',
          avatarUrl: partner?.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400',
          age: partner?.age || 25,
          bio: partner?.bio || '',
          pronouns: partner?.pronouns || 'Ella'
        },
        lastMessage: c.lastMessage,
        updatedAt: c.updatedAt,
        unreadCount
      };
    });

    formatted.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

    res.json({ conversations: formatted });
  } catch (error) {
    console.error('Error en getConversations:', error);
    res.status(500).json({ error: 'Error interno en el servidor.' });
  }
};

export const startChatWithUser = async (req: AuthRequest, res: Response) => {
  try {
    const currentUserId = req.userId!;
    const rawTarget = Array.isArray(req.params.targetUserId) ? req.params.targetUserId[0] : req.params.targetUserId;
    const targetUserId = parseInt(rawTarget as string);

    if (isNaN(targetUserId) || currentUserId === targetUserId) {
      return res.status(400).json({ error: 'ID de usuaria no válido.' });
    }

    if (memoryStore.isBlocked(currentUserId, targetUserId)) {
      return res.status(403).json({ error: 'No es posible iniciar un chat con esta usuaria debido a un bloqueo.' });
    }

    const partner = memoryStore.users.find((u) => u.id === targetUserId);
    if (!partner) {
      return res.status(404).json({ error: 'Usuaria no encontrada.' });
    }

    const conv = memoryStore.getOrCreateConversation(currentUserId, targetUserId);

    res.json({
      conversationId: conv.id,
      partner: {
        id: partner.id,
        name: partner.name,
        avatarUrl: partner.avatarUrl,
        age: partner.age,
        bio: partner.bio,
        pronouns: partner.pronouns || 'Ella'
      }
    });
  } catch (error) {
    console.error('Error en startChatWithUser:', error);
    res.status(500).json({ error: 'Error interno en el servidor.' });
  }
};

export const getMessages = async (req: AuthRequest, res: Response) => {
  try {
    const currentUserId = req.userId!;
    const rawConvId = Array.isArray(req.params.conversationId) ? req.params.conversationId[0] : req.params.conversationId;
    const conversationId = parseInt(rawConvId as string);

    const conv = memoryStore.conversations.find((c) => c.id === conversationId);
    if (!conv || !conv.participantIds.includes(currentUserId)) {
      return res.status(403).json({ error: 'No tienes acceso a esta conversación.' });
    }

    memoryStore.messages.forEach((m) => {
      if (m.conversationId === conversationId && m.senderId !== currentUserId) {
        m.isRead = true;
      }
    });

    const messages = memoryStore.messages
      .filter((m) => m.conversationId === conversationId)
      .map((m) => ({
        id: m.id,
        senderId: m.senderId,
        text: m.text,
        type: m.type || 'text',
        imageUrl: m.imageUrl,
        viewed: m.viewed,
        createdAt: m.createdAt,
        isMine: m.senderId === currentUserId
      }));

    res.json({ messages });
  } catch (error) {
    console.error('Error en getMessages:', error);
    res.status(500).json({ error: 'Error interno en el servidor.' });
  }
};

export const sendMessage = async (req: AuthRequest, res: Response) => {
  try {
    const currentUserId = req.userId!;
    const rawConvId = Array.isArray(req.params.conversationId) ? req.params.conversationId[0] : req.params.conversationId;
    const conversationId = parseInt(rawConvId as string);
    const { text, type, imageUrl } = req.body;

    const messageType: MessageType = type || 'text';
    const messageText = text ? text.trim() : messageType === 'ephemeral_image' ? 'Foto temporal' : '';

    if (!messageText && !imageUrl) {
      return res.status(400).json({ error: 'El mensaje no puede estar vacío.' });
    }

    const conv = memoryStore.conversations.find((c) => c.id === conversationId);
    if (!conv || !conv.participantIds.includes(currentUserId)) {
      return res.status(403).json({ error: 'No tienes acceso a esta conversación.' });
    }

    const partnerId = conv.participantIds.find((id) => id !== currentUserId)!;
    if (memoryStore.isBlocked(currentUserId, partnerId)) {
      return res.status(403).json({ error: 'No puedes enviar mensajes a esta usuaria porque existe un bloqueo activo.' });
    }

    const newMsg = memoryStore.addMessage(
      conversationId,
      currentUserId,
      messageText,
      messageType,
      imageUrl
    );

    // Respuestas automáticas dinámicas según tipo
    if (partnerId <= 4) {
      setTimeout(() => {
        if (messageType === 'icebreaker') {
          const icebreakerReplies = [
            '¡Uff qué buena pregunta! Definitivamente café con paseo improvisado ☕✨ ¿Y tú?',
            '¡Girl in Red y boygenius sin duda alguna! 🎸 ¿Las escuchas?',
            '¡Plan perfecto: cervecita al atardecer y luego lo que surja! 🌅🍻'
          ];
          const reply = icebreakerReplies[Math.floor(Math.random() * icebreakerReplies.length)];
          memoryStore.addMessage(conversationId, partnerId, reply);
        } else if (messageType === 'ephemeral_image') {
          memoryStore.addMessage(conversationId, partnerId, '¡Qué foto tan bonita! Me encanta 🥰🔥');
        } else {
          const automatedReplies = [
            '¡Hola bonita! Qué bueno coincidir por aquí ✨',
            '¡Qué guay tu perfil! ¿De qué zona eres? 😊',
            'Me encantó que me hablaras 💖',
            '¿Te apetece tomar un café esta semana? ☕'
          ];
          const reply = automatedReplies[Math.floor(Math.random() * automatedReplies.length)];
          memoryStore.addMessage(conversationId, partnerId, reply);
        }
      }, 2500);
    }

    res.status(201).json({
      message: {
        id: newMsg.id,
        senderId: newMsg.senderId,
        text: newMsg.text,
        type: newMsg.type,
        imageUrl: newMsg.imageUrl,
        viewed: newMsg.viewed,
        createdAt: newMsg.createdAt,
        isMine: true
      }
    });
  } catch (error) {
    console.error('Error en sendMessage:', error);
    res.status(500).json({ error: 'Error interno en el servidor.' });
  }
};

export const viewEphemeralMessage = async (req: AuthRequest, res: Response) => {
  try {
    const rawConvId = Array.isArray(req.params.conversationId) ? req.params.conversationId[0] : req.params.conversationId;
    const rawMsgId = Array.isArray(req.params.messageId) ? req.params.messageId[0] : req.params.messageId;
    const messageId = parseInt(rawMsgId as string);

    const msg = memoryStore.messages.find((m) => m.id === messageId);
    if (msg) {
      msg.viewed = true;
    }

    res.json({ success: true, messageId });
  } catch (error) {
    console.error('Error en viewEphemeralMessage:', error);
    res.status(500).json({ error: 'Error interno en el servidor.' });
  }
};
