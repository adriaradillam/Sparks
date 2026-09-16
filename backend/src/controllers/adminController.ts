import { Request, Response } from 'express';
import { AuthRequest, generateToken } from '../middleware/auth';
import { memoryStore } from '../store/memoryStore';

// Middleware / helper para verificar si el usuario es admin
export const verifyIsAdmin = (req: AuthRequest, res: Response): boolean => {
  const currentUserId = req.userId;
  if (!currentUserId) {
    res.status(401).json({ error: 'No autorizado. Se requiere token de sesión.' });
    return false;
  }
  const user = memoryStore.users.find((u) => u.id === currentUserId);
  if (!user || (!user.isAdmin && user.role !== 'admin')) {
    res.status(403).json({ error: 'Acceso restringido: se requieren permisos de Administradora de Sparks.' });
    return false;
  }
  return true;
};

// ==================== LOGIN RÁPIDO PARA EL PANEL WEB ====================
export const adminQuickLoginController = async (req: Request, res: Response) => {
  try {
    // Buscar la cuenta administradora por defecto (Ana)
    let adminUser = memoryStore.users.find((u) => u.isAdmin || u.role === 'admin');
    if (!adminUser) {
      adminUser = memoryStore.users[0];
      adminUser.isAdmin = true;
      adminUser.role = 'admin';
    }

    const token = generateToken(adminUser.id, adminUser.email);

    res.json({
      success: true,
      token,
      user: {
        id: adminUser.id,
        name: adminUser.name,
        email: adminUser.email,
        avatarUrl: adminUser.avatarUrl,
        role: adminUser.role,
        isAdmin: true
      }
    });
  } catch (error) {
    console.error('Error en adminQuickLoginController:', error);
    res.status(500).json({ error: 'Error al generar acceso rápido de administración.' });
  }
};

// ==================== RESUMEN EJECUTIVO & KPIS ====================
export const adminGetOverviewStatsController = async (req: AuthRequest, res: Response) => {
  try {
    if (!verifyIsAdmin(req, res)) return;
    const overview = memoryStore.getAdminOverview();
    res.json(overview);
  } catch (error) {
    console.error('Error en adminGetOverviewStatsController:', error);
    res.status(500).json({ error: 'Error al obtener resumen de administración.' });
  }
};

// ==================== GESTIÓN DE USUARIAS ====================
export const adminGetUsersController = async (req: AuthRequest, res: Response) => {
  try {
    if (!verifyIsAdmin(req, res)) return;
    const query = req.query.q as string | undefined;
    const filter = req.query.filter as string | undefined;
    const users = memoryStore.getAllUsers(query, filter);
    res.json({ users, count: users.length });
  } catch (error) {
    console.error('Error en adminGetUsersController:', error);
    res.status(500).json({ error: 'Error al listar usuarias.' });
  }
};

export const adminGetUserDetailsController = async (req: AuthRequest, res: Response) => {
  try {
    if (!verifyIsAdmin(req, res)) return;
    const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const userId = parseInt(rawId);
    if (isNaN(userId)) {
      return res.status(400).json({ error: 'ID de usuaria inválido.' });
    }

    const details = memoryStore.getUserAdminDetails(userId);
    if (!details) {
      return res.status(404).json({ error: 'Usuaria no encontrada.' });
    }

    res.json(details);
  } catch (error) {
    console.error('Error en adminGetUserDetailsController:', error);
    res.status(500).json({ error: 'Error al obtener ficha de usuaria.' });
  }
};

export const adminUpdateUserRoleController = async (req: AuthRequest, res: Response) => {
  try {
    if (!verifyIsAdmin(req, res)) return;
    const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const userId = parseInt(rawId);
    const { role, isAdmin } = req.body;

    if (isNaN(userId)) {
      return res.status(400).json({ error: 'ID de usuaria inválido.' });
    }

    const success = memoryStore.setUserRole(userId, role || 'user', Boolean(isAdmin));
    if (!success) {
      return res.status(404).json({ error: 'Usuaria no encontrada.' });
    }

    res.json({
      success: true,
      message: `Rol de usuaria actualizado con éxito (${role || (isAdmin ? 'admin' : 'user')}).`
    });
  } catch (error) {
    console.error('Error en adminUpdateUserRoleController:', error);
    res.status(500).json({ error: 'Error al modificar rol de usuaria.' });
  }
};

export const adminVerifyUserController = async (req: AuthRequest, res: Response) => {
  try {
    if (!verifyIsAdmin(req, res)) return;
    const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const userId = parseInt(rawId);
    const { isVerified, method } = req.body;

    if (isNaN(userId)) {
      return res.status(400).json({ error: 'ID de usuaria inválido.' });
    }

    const verifyState = isVerified !== undefined ? Boolean(isVerified) : true;
    const success = memoryStore.setUserVerification(userId, verifyState, method || 'panel_admin_manual');
    if (!success) {
      return res.status(404).json({ error: 'Usuaria no encontrada.' });
    }

    res.json({
      success: true,
      message: verifyState
        ? 'Insignia de verificación oficial concedida a la usuaria.'
        : 'Insignia de verificación retirada.',
      isVerified: verifyState
    });
  } catch (error) {
    console.error('Error en adminVerifyUserController:', error);
    res.status(500).json({ error: 'Error al cambiar verificación de usuaria.' });
  }
};

export const adminWarnUserController = async (req: AuthRequest, res: Response) => {
  try {
    if (!verifyIsAdmin(req, res)) return;
    const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const userId = parseInt(rawId);
    const { reason } = req.body;

    if (isNaN(userId)) {
      return res.status(400).json({ error: 'ID de usuaria inválido.' });
    }

    const newCount = memoryStore.warnUser(userId, reason || 'Infracción de normas');
    if (newCount === null) {
      return res.status(404).json({ error: 'Usuaria no encontrada.' });
    }

    res.json({
      success: true,
      message: `Advertencia disciplinaria registrada. Total advertencias: ${newCount}`,
      warningCount: newCount
    });
  } catch (error) {
    console.error('Error en adminWarnUserController:', error);
    res.status(500).json({ error: 'Error al registrar advertencia.' });
  }
};

export const adminDeleteUserController = async (req: AuthRequest, res: Response) => {
  try {
    if (!verifyIsAdmin(req, res)) return;
    const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const userId = parseInt(rawId);

    if (isNaN(userId)) {
      return res.status(400).json({ error: 'ID de usuaria inválido.' });
    }

    if (req.userId === userId) {
      return res.status(400).json({ error: 'No puedes eliminar tu propia cuenta de administradora activa.' });
    }

    const success = memoryStore.deleteUserByAdmin(userId);
    if (!success) {
      return res.status(404).json({ error: 'Usuaria no encontrada.' });
    }

    res.json({
      success: true,
      message: 'Cuenta de usuaria y sus interacciones eliminadas definitivamente del sistema.'
    });
  } catch (error) {
    console.error('Error en adminDeleteUserController:', error);
    res.status(500).json({ error: 'Error al eliminar usuaria.' });
  }
};

// ==================== GESTIÓN DE PLANES / EVENTOS ====================
export const adminGetPlansController = async (req: AuthRequest, res: Response) => {
  try {
    if (!verifyIsAdmin(req, res)) return;
    const plans = memoryStore.getAllPlans();
    res.json({ plans, count: plans.length });
  } catch (error) {
    console.error('Error en adminGetPlansController:', error);
    res.status(500).json({ error: 'Error al obtener listado de planes.' });
  }
};

export const adminDeletePlanController = async (req: AuthRequest, res: Response) => {
  try {
    if (!verifyIsAdmin(req, res)) return;
    const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const planId = parseInt(rawId);

    if (isNaN(planId)) {
      return res.status(400).json({ error: 'ID de plan inválido.' });
    }

    const success = memoryStore.deletePlanByAdmin(planId);
    if (!success) {
      return res.status(404).json({ error: 'Plan no encontrado.' });
    }

    res.json({
      success: true,
      message: 'El plan comunitario ha sido eliminado por moderación.'
    });
  } catch (error) {
    console.error('Error en adminDeletePlanController:', error);
    res.status(500).json({ error: 'Error al eliminar plan.' });
  }
};

// ==================== AVISOS GLOBALES DEL SISTEMA ====================
export const adminGetAnnouncementsController = async (req: AuthRequest, res: Response) => {
  try {
    // Público para que las usuarias también puedan recibirlos si se requiere
    const announcements = memoryStore.getAnnouncements();
    res.json({ announcements });
  } catch (error) {
    console.error('Error en adminGetAnnouncementsController:', error);
    res.status(500).json({ error: 'Error al obtener avisos globales.' });
  }
};

export const adminCreateAnnouncementController = async (req: AuthRequest, res: Response) => {
  try {
    if (!verifyIsAdmin(req, res)) return;
    const { title, message, type } = req.body;

    if (!title || !message) {
      return res.status(400).json({ error: 'El título y el mensaje del aviso son obligatorios.' });
    }

    const adminUser = memoryStore.users.find((u) => u.id === req.userId);
    const announcement = memoryStore.createAnnouncement(
      title.trim(),
      message.trim(),
      type || 'info',
      adminUser?.name || 'Administración Sparks'
    );

    res.json({
      success: true,
      message: 'Aviso global del sistema publicado exitosamente.',
      announcement
    });
  } catch (error) {
    console.error('Error en adminCreateAnnouncementController:', error);
    res.status(500).json({ error: 'Error al crear aviso global.' });
  }
};

export const adminDeleteAnnouncementController = async (req: AuthRequest, res: Response) => {
  try {
    if (!verifyIsAdmin(req, res)) return;
    const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const announcementId = parseInt(rawId);

    if (isNaN(announcementId)) {
      return res.status(400).json({ error: 'ID de aviso inválido.' });
    }

    const success = memoryStore.deleteAnnouncement(announcementId);
    if (!success) {
      return res.status(404).json({ error: 'Aviso no encontrado.' });
    }

    res.json({
      success: true,
      message: 'Aviso eliminado correctamente.'
    });
  } catch (error) {
    console.error('Error en adminDeleteAnnouncementController:', error);
    res.status(500).json({ error: 'Error al eliminar aviso.' });
  }
};
