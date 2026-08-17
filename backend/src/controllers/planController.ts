import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { memoryStore } from '../store/memoryStore';

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

      return {
        id: plan.id,
        title: plan.title,
        category: plan.category,
        description: plan.description,
        locationName: plan.locationName,
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
    const { title, category, description, locationName, dateTimeText } = req.body;

    if (!title || !description || !locationName || !dateTimeText) {
      return res.status(400).json({ error: 'Todos los campos del plan son obligatorios.' });
    }

    const newPlan = memoryStore.addPlan({
      creatorId: currentUserId,
      title: title.trim(),
      category: category || 'coffee',
      description: description.trim(),
      locationName: locationName.trim(),
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
      message: isJoined ? '¡Te has apuntado al plan! 🎉' : 'Te has desapuntado del plan.'
    });
  } catch (error) {
    console.error('Error en toggleJoinPlan:', error);
    res.status(500).json({ error: 'Error interno en el servidor.' });
  }
};
