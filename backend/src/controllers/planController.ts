import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { memoryStore, calculateAge } from '../store/memoryStore';

export const getPlans = async (req: AuthRequest, res: Response) => {
  try {
    const currentUserId = req.userId;
    const category = req.query.category as string;

    let filtered = memoryStore.plans;
    if (category && category !== 'all') {
      filtered = filtered.filter((p) => p.category === category);
    }

    const formatted = filtered.map((plan) => {
      const creator = memoryStore.users.find((u) => u.id === plan.creatorId);
      const isJoined = currentUserId ? plan.attendeeIds.includes(currentUserId) : false;

      // Obtener avatares de hasta 4 asistentes
      const attendeeAvatars = plan.attendeeIds.map((id) => {
        const u = memoryStore.users.find((user) => user.id === id);
        return u?.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400';
      });

      const planMsgs = memoryStore.getPlanMessages(plan.id);
      const lastMsg = planMsgs[planMsgs.length - 1];
      const lastMsgSender = lastMsg ? memoryStore.users.find((u) => u.id === lastMsg.senderId) : null;

      return {
        id: plan.id,
        title: plan.title,
        category: plan.category,
        description: plan.description,
        locationName: plan.locationName,
        locationLat: plan.locationLat || null,
        locationLng: plan.locationLng || null,
        dateTimeText: plan.dateTimeText,
        creator: {
          id: creator?.id || plan.creatorId,
          name: creator?.name || 'Organizadora',
          avatarUrl: creator?.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400'
        },
        attendeeCount: plan.attendeeIds.length,
        attendeeAvatars: attendeeAvatars.slice(0, 4),
        isJoined,
        isMine: creator?.id === currentUserId,
        lastMessage: lastMsg
          ? {
              text: lastMsg.text,
              senderName: lastMsgSender?.name || 'Participante',
              createdAt: lastMsg.createdAt
            }
          : null,
        createdAt: plan.createdAt
      };
    });

    res.json({ plans: formatted });
  } catch (error) {
    console.error('Error en getPlans:', error);
    res.status(500).json({ error: 'Error interno en el servidor.' });
  }
};

export const createPlan = async (req: AuthRequest, res: Response) => {
  try {
    const currentUserId = req.userId!;
    const { title, category, description, locationName, locationLat, locationLng, dateTimeText } = req.body;

    if (!title || !description || !locationName || !dateTimeText) {
      return res.status(400).json({ error: 'Todos los campos del plan son obligatorios.' });
    }

    const newPlan = memoryStore.addPlan({
      creatorId: currentUserId,
      title: title.trim(),
      category: category || 'coffee',
      description: description.trim(),
      locationName: locationName.trim(),
      locationLat: locationLat ? parseFloat(locationLat) : undefined,
      locationLng: locationLng ? parseFloat(locationLng) : undefined,
      dateTimeText: dateTimeText.trim()
    });

    const creator = memoryStore.users.find((u) => u.id === currentUserId);

    res.status(201).json({
      message: '¡Plan publicado con éxito en el tablón!',
      plan: {
        ...newPlan,
        creator: {
          id: creator?.id || currentUserId,
          name: creator?.name || 'Tú',
          avatarUrl: creator?.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400'
        },
        attendeeCount: 1,
        attendeeAvatars: [creator?.avatarUrl],
        isJoined: true,
        isMine: true
      }
    });
  } catch (error) {
    console.error('Error en createPlan:', error);
    res.status(500).json({ error: 'Error interno en el servidor.' });
  }
};

export const toggleJoinPlan = async (req: AuthRequest, res: Response) => {
  try {
    const currentUserId = req.userId!;
    const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const planId = parseInt(rawId as string);

    const plan = memoryStore.plans.find((p) => p.id === planId);
    if (!plan) {
      return res.status(404).json({ error: 'Plan no encontrado.' });
    }

    const index = plan.attendeeIds.indexOf(currentUserId);
    let isJoined = false;

    if (index === -1) {
      plan.attendeeIds.push(currentUserId);
      isJoined = true;
    } else {
      // Si no es la creadora, puede desapuntarse
      if (plan.creatorId !== currentUserId) {
        plan.attendeeIds.splice(index, 1);
        isJoined = false;
      } else {
        isJoined = true; // La creadora siempre asiste
      }
    }

    res.json({
      success: true,
      isJoined,
      attendeeCount: plan.attendeeIds.length,
      message: isJoined ? '¡Te has apuntado al plan!' : 'Te has desapuntado del plan.'
    });
  } catch (error) {
    console.error('Error en toggleJoinPlan:', error);
    res.status(500).json({ error: 'Error interno en el servidor.' });
  }
};

export const getPlanChat = async (req: AuthRequest, res: Response) => {
  try {
    const currentUserId = req.userId!;
    const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const planId = parseInt(rawId as string);

    const plan = memoryStore.plans.find((p) => p.id === planId);
    if (!plan) {
      return res.status(404).json({ error: 'Plan no encontrado.' });
    }

    const creator = memoryStore.users.find((u) => u.id === plan.creatorId);
    const isJoined = plan.attendeeIds.includes(currentUserId);

    if (!isJoined && plan.creatorId !== currentUserId) {
      return res.status(403).json({
        error: 'Debes unirte a este plan para acceder a su chat de grupo.'
      });
    }

    // Resolver lista detallada de asistentes con indicación de si existe Match mutuo con la usuaria actual
    const attendees = plan.attendeeIds.map((id) => {
      const u = memoryStore.users.find((user) => user.id === id);
      const hasConversation = memoryStore.conversations.some(
        (c) => c.participantIds.includes(currentUserId) && c.participantIds.includes(id)
      );
      const hasMutualLikes =
        memoryStore.matches.some(
          (m) => m.fromUserId === currentUserId && m.toUserId === id && m.type === 'like'
        ) &&
        memoryStore.matches.some(
          (m) => m.fromUserId === id && m.toUserId === currentUserId && m.type === 'like'
        );

      const hasMatch = hasConversation || hasMutualLikes;

      return {
        id,
        name: u?.name || 'Usuaria de Sparks',
        avatarUrl: u?.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400',
        age: u ? (u.birthDate ? calculateAge(u.birthDate) : u.age) : 25,
        bio: u?.bio || '',
        pronouns: u?.pronouns || 'Ella',
        isCreator: id === plan.creatorId,
        isMe: id === currentUserId,
        isVerified: u?.isVerified || false,
        hasMatch
      };
    });

    // Mensajes del grupo del plan
    const rawMessages = memoryStore.getPlanMessages(planId);
    const messages = rawMessages.map((m) => {
      const sender = memoryStore.users.find((u) => u.id === m.senderId);
      return {
        id: m.id,
        senderId: m.senderId,
        senderName: sender?.name || 'Participante',
        senderAvatar: sender?.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400',
        text: m.text,
        createdAt: m.createdAt,
        isMine: m.senderId === currentUserId,
        isCreator: m.senderId === plan.creatorId
      };
    });

    res.json({
      plan: {
        id: plan.id,
        title: plan.title,
        category: plan.category,
        description: plan.description,
        locationName: plan.locationName,
        locationLat: plan.locationLat || null,
        locationLng: plan.locationLng || null,
        dateTimeText: plan.dateTimeText,
        creator: {
          id: creator?.id || plan.creatorId,
          name: creator?.name || 'Organizadora',
          avatarUrl: creator?.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400',
          pronouns: creator?.pronouns || 'Ella'
        },
        attendees,
        attendeeCount: plan.attendeeIds.length,
        isJoined,
        isMine: plan.creatorId === currentUserId,
        createdAt: plan.createdAt
      },
      messages
    });
  } catch (error) {
    console.error('Error en getPlanChat:', error);
    res.status(500).json({ error: 'Error interno en el servidor.' });
  }
};

export const sendPlanMessage = async (req: AuthRequest, res: Response) => {
  try {
    const currentUserId = req.userId!;
    const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const planId = parseInt(rawId as string);
    const { text } = req.body;

    if (!text || !text.trim()) {
      return res.status(400).json({ error: 'El mensaje no puede estar vacío.' });
    }

    const plan = memoryStore.plans.find((p) => p.id === planId);
    if (!plan) {
      return res.status(404).json({ error: 'Plan no encontrado.' });
    }

    // Solo pueden enviar mensajes las personas que se hayan apuntado al plan o su creadora
    if (!plan.attendeeIds.includes(currentUserId) && plan.creatorId !== currentUserId) {
      return res.status(403).json({
        error: 'Debes unirte a este plan para poder participar en su chat de grupo.'
      });
    }

    const newMsg = memoryStore.addPlanMessage(planId, currentUserId, text);
    const sender = memoryStore.users.find((u) => u.id === currentUserId);

    // Respuesta dinámica simulada de una asistente para vivacidad
    const otherAttendees = plan.attendeeIds.filter((id) => id !== currentUserId && id <= 4);
    if (otherAttendees.length > 0) {
      setTimeout(() => {
        const randomAttendeeId = otherAttendees[Math.floor(Math.random() * otherAttendees.length)];
        const replies = [
          '¡Totalmente de acuerdo! Qué ganas del plan.',
          '¡Perfecto, allí nos vemos todas! Contando las horas.',
          '¡Genial! Me apunto a esa idea.',
          '¡Qué ilusión me hace veros a todas pronto!'
        ];
        const randomReply = replies[Math.floor(Math.random() * replies.length)];
        memoryStore.addPlanMessage(planId, randomAttendeeId, randomReply);
      }, 2500);
    }

    res.status(201).json({
      message: {
        id: newMsg.id,
        senderId: currentUserId,
        senderName: sender?.name || 'Tú',
        senderAvatar: sender?.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400',
        text: newMsg.text,
        createdAt: newMsg.createdAt,
        isMine: true,
        isCreator: currentUserId === plan.creatorId
      }
    });
  } catch (error) {
    console.error('Error en sendPlanMessage:', error);
    res.status(500).json({ error: 'Error interno en el servidor.' });
  }
};

export const updatePlan = async (req: AuthRequest, res: Response) => {
  try {
    const currentUserId = req.userId!;
    const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const planId = parseInt(rawId as string);

    const plan = memoryStore.plans.find((p) => p.id === planId);
    if (!plan) {
      return res.status(404).json({ error: 'Plan no encontrado.' });
    }

    if (plan.creatorId !== currentUserId) {
      return res.status(403).json({ error: 'Solo la organizadora creadora puede editar este plan.' });
    }

    const { title, category, description, locationName, locationLat, locationLng, dateTimeText } = req.body;

    if (title && title.trim()) plan.title = title.trim();
    if (category) plan.category = category;
    if (description && description.trim()) plan.description = description.trim();
    if (locationName && locationName.trim()) plan.locationName = locationName.trim();
    if (locationLat !== undefined) plan.locationLat = parseFloat(locationLat);
    if (locationLng !== undefined) plan.locationLng = parseFloat(locationLng);
    if (dateTimeText && dateTimeText.trim()) plan.dateTimeText = dateTimeText.trim();

    const creator = memoryStore.users.find((u) => u.id === currentUserId);

    res.json({
      success: true,
      message: '¡Plan actualizado con éxito!',
      plan: {
        ...plan,
        creator: {
          id: creator?.id || currentUserId,
          name: creator?.name || 'Tú',
          avatarUrl: creator?.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400'
        },
        attendeeCount: plan.attendeeIds.length,
        isJoined: true,
        isMine: true
      }
    });
  } catch (error) {
    console.error('Error en updatePlan:', error);
    res.status(500).json({ error: 'Error interno en el servidor.' });
  }
};
