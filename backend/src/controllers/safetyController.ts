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
    const { reason, description, conversationId, planId } = req.body;

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

    const convIdNum = conversationId ? parseInt(conversationId) : undefined;
    const planIdNum = planId ? parseInt(planId) : undefined;

    const report = memoryStore.reportUser(
      currentUserId,
      targetUserId,
      reason,
      description ? String(description).trim() : undefined,
      convIdNum,
      planIdNum
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

// ==================== CONTROLADORES DEL PANEL DE ADMINISTRACIÓN / MODERACIÓN ====================

export const getAdminReportsController = async (req: AuthRequest, res: Response) => {
  try {
    const status = req.query.status as string | undefined;
    const reports = memoryStore.getReports(status);

    const populated = reports.map((r) => {
      const reporter = memoryStore.users.find((u) => u.id === r.reporterId);
      const reportedUser = memoryStore.users.find((u) => u.id === r.reportedUserId);
      const resolver = r.resolvedBy ? memoryStore.users.find((u) => u.id === r.resolvedBy) : null;

      // Verificar si hay historial de chat
      let hasChat = false;
      if (r.conversationId) {
        hasChat = memoryStore.messages.some((m) => m.conversationId === r.conversationId);
      } else {
        const conv = memoryStore.conversations.find(
          (c) =>
            c.participantIds.includes(r.reporterId) &&
            c.participantIds.includes(r.reportedUserId)
        );
        if (conv) {
          hasChat = memoryStore.messages.some((m) => m.conversationId === conv.id);
        }
      }
      if (r.planId) {
        hasChat = true;
      }

      return {
        id: r.id,
        reason: r.reason,
        description: r.description,
        status: r.status,
        actionTaken: r.actionTaken,
        resolutionNotes: r.resolutionNotes,
        resolvedAt: r.resolvedAt,
        resolvedByName: resolver?.name,
        createdAt: r.createdAt,
        hasChat,
        conversationId: r.conversationId,
        planId: r.planId,
        reporter: reporter
          ? {
              id: reporter.id,
              name: reporter.name,
              email: reporter.email,
              avatarUrl: reporter.avatarUrl,
              age: reporter.age
            }
          : null,
        reportedUser: reportedUser
          ? {
              id: reportedUser.id,
              name: reportedUser.name,
              email: reportedUser.email,
              avatarUrl: reportedUser.avatarUrl,
              age: reportedUser.age,
              isBanned: reportedUser.isBanned || false,
              bannedReason: reportedUser.bannedReason,
              warningCount: reportedUser.warningCount || 0
            }
          : null
      };
    });

    res.json({ reports: populated });
  } catch (error) {
    console.error('Error en getAdminReportsController:', error);
    res.status(500).json({ error: 'Error al obtener la lista de reportes.' });
  }
};

export const getAdminReportChatController = async (req: AuthRequest, res: Response) => {
  try {
    const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const reportId = parseInt(rawId);

    if (isNaN(reportId)) {
      return res.status(400).json({ error: 'ID de reporte no válido.' });
    }

    const chatData = memoryStore.getChatForReport(reportId);
    if (!chatData) {
      return res.status(404).json({ error: 'Reporte no encontrado.' });
    }

    res.json(chatData);
  } catch (error) {
    console.error('Error en getAdminReportChatController:', error);
    res.status(500).json({ error: 'Error al inspeccionar el chat del reporte.' });
  }
};

export const adminActionReportController = async (req: AuthRequest, res: Response) => {
  try {
    const adminId = req.userId!;
    const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const reportId = parseInt(rawId);
    const { action, notes } = req.body;

    if (isNaN(reportId)) {
      return res.status(400).json({ error: 'ID de reporte no válido.' });
    }

    const validActions = ['warning', 'banned', 'dismissed'];
    if (!action || !validActions.includes(action)) {
      return res.status(400).json({ error: 'Acción no válida. Opciones: warning, banned, dismissed.' });
    }

    const updatedReport = memoryStore.resolveReport(reportId, adminId, action, notes);
    if (!updatedReport) {
      return res.status(404).json({ error: 'Reporte no encontrado.' });
    }

    let actionMessage = '';
    if (action === 'banned') {
      actionMessage = 'La usuaria ha sido suspendida permanentemente de Sparks y el reporte ha sido resuelto.';
    } else if (action === 'warning') {
      actionMessage = 'Se ha registrado una advertencia disciplinaria a la usuaria y el reporte ha sido resuelto.';
    } else {
      actionMessage = 'El reporte ha sido desestimado.';
    }

    res.json({
      success: true,
      message: actionMessage,
      report: updatedReport
    });
  } catch (error) {
    console.error('Error en adminActionReportController:', error);
    res.status(500).json({ error: 'Error al dictaminar la acción sobre el reporte.' });
  }
};

export const adminGetStatsController = async (req: AuthRequest, res: Response) => {
  try {
    const totalReports = memoryStore.reports.length;
    const pendingReports = memoryStore.reports.filter((r) => r.status === 'pending').length;
    const resolvedReports = memoryStore.reports.filter((r) => r.status === 'resolved').length;
    const dismissedReports = memoryStore.reports.filter((r) => r.status === 'dismissed').length;
    const bannedUsers = memoryStore.getBannedUsers().length;

    res.json({
      stats: {
        totalReports,
        pendingReports,
        resolvedReports,
        dismissedReports,
        bannedUsers
      }
    });
  } catch (error) {
    console.error('Error en adminGetStatsController:', error);
    res.status(500).json({ error: 'Error al obtener estadísticas de moderación.' });
  }
};

export const adminGetBannedUsersController = async (req: AuthRequest, res: Response) => {
  try {
    const banned = memoryStore.getBannedUsers().map((u) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      avatarUrl: u.avatarUrl,
      age: u.age,
      bannedReason: u.bannedReason,
      bannedAt: u.bannedAt,
      warningCount: u.warningCount || 0
    }));
    res.json({ bannedUsers: banned });
  } catch (error) {
    console.error('Error en adminGetBannedUsersController:', error);
    res.status(500).json({ error: 'Error al obtener usuarias suspendidas.' });
  }
};

export const adminBanUserController = async (req: AuthRequest, res: Response) => {
  try {
    const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const targetUserId = parseInt(rawId);
    const { reason } = req.body;

    if (isNaN(targetUserId)) {
      return res.status(400).json({ error: 'ID de usuaria no válido.' });
    }

    const success = memoryStore.banUser(targetUserId, reason);
    if (!success) {
      return res.status(404).json({ error: 'Usuaria no encontrada.' });
    }

    res.json({
      success: true,
      message: 'La usuaria ha sido suspendida correctamente.'
    });
  } catch (error) {
    console.error('Error en adminBanUserController:', error);
    res.status(500).json({ error: 'Error al suspender usuaria.' });
  }
};

export const adminUnbanUserController = async (req: AuthRequest, res: Response) => {
  try {
    const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const targetUserId = parseInt(rawId);

    if (isNaN(targetUserId)) {
      return res.status(400).json({ error: 'ID de usuaria no válido.' });
    }

    const success = memoryStore.unbanUser(targetUserId);
    if (!success) {
      return res.status(404).json({ error: 'Usuaria no encontrada.' });
    }

    res.json({
      success: true,
      message: 'La suspensión de la usuaria ha sido levantada con éxito.'
    });
  } catch (error) {
    console.error('Error en adminUnbanUserController:', error);
    res.status(500).json({ error: 'Error al levantar suspensión.' });
  }
};
