import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { memoryStore, ReportReason } from '../store/memoryStore';

export const blockUserController = async (req: AuthRequest, res: Response) => {
  try {
    const currentUserId = req.userId!;
    const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const targetUserId = parseInt(rawId);

    if (isNaN(targetUserId)) {
      return res.status(400).json({ error: 'ID de usuaria no válido.' });
    }

    if (currentUserId === targetUserId) {
      return res.status(400).json({ error: 'No puedes bloquearte a ti misma.' });
    }

    const targetUser = memoryStore.users.find((u) => u.id === targetUserId);
    if (!targetUser) {
      return res.status(404).json({ error: 'Usuaria no encontrada.' });
    }

    memoryStore.blockUser(currentUserId, targetUserId);

    res.json({
      success: true,
      message: `Has bloqueado a ${targetUser.name}. No volverás a ver su perfil ni recibir sus mensajes.`
    });
  } catch (error) {
    console.error('Error en blockUserController:', error);
    res.status(500).json({ error: 'Error al bloquear a la usuaria.' });
  }
};

export const unblockUserController = async (req: AuthRequest, res: Response) => {
  try {
    const currentUserId = req.userId!;
    const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const targetUserId = parseInt(rawId);

    if (isNaN(targetUserId)) {
      return res.status(400).json({ error: 'ID de usuaria no válido.' });
    }

    const unblocked = memoryStore.unblockUser(currentUserId, targetUserId);

    if (!unblocked) {
      return res.status(404).json({ error: 'Esta usuaria no estaba en tu lista de bloqueadas.' });
    }

    res.json({
      success: true,
      message: 'Usuaria desbloqueada con éxito.'
    });
  } catch (error) {
    console.error('Error en unblockUserController:', error);
    res.status(500).json({ error: 'Error al desbloquear a la usuaria.' });
  }
};

export const getBlockedUsersController = async (req: AuthRequest, res: Response) => {
  try {
    const currentUserId = req.userId!;
    const blockedList = memoryStore.getBlockedUsers(currentUserId).map((u) => ({
      id: u.id,
      name: u.name,
      age: u.age,
      avatarUrl: u.avatarUrl
    }));

    res.json({ blockedUsers: blockedList });
  } catch (error) {
    console.error('Error en getBlockedUsersController:', error);
    res.status(500).json({ error: 'Error al obtener usuarias bloqueadas.' });
  }
};

export const reportUserController = async (req: AuthRequest, res: Response) => {
  try {
    const currentUserId = req.userId!;
    const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const targetUserId = parseInt(rawId);
    const { reason, description } = req.body;

    if (isNaN(targetUserId)) {
      return res.status(400).json({ error: 'ID de usuaria no válido.' });
    }

    if (currentUserId === targetUserId) {
      return res.status(400).json({ error: 'No puedes reportarte a ti misma.' });
    }

    const validReasons: ReportReason[] = [
      'harassment',
      'fake_profile',
      'hate_speech',
      'inappropriate_content',
      'spam',
      'other'
    ];

    if (!reason || !validReasons.includes(reason)) {
      return res.status(400).json({ error: 'Motivo de reporte no válido.' });
    }

    const targetUser = memoryStore.users.find((u) => u.id === targetUserId);
    if (!targetUser) {
      return res.status(404).json({ error: 'Usuaria no encontrada.' });
    }

    const report = memoryStore.reportUser(
      currentUserId,
      targetUserId,
      reason,
      description ? String(description).trim() : undefined
    );

    res.json({
      success: true,
      message: 'Gracias por tu reporte. Nuestro equipo de moderación lo revisará de inmediato y la usuaria ha sido bloqueada automáticamente.',
      reportId: report.id
    });
  } catch (error) {
    console.error('Error en reportUserController:', error);
    res.status(500).json({ error: 'Error al procesar el reporte.' });
  }
};
