import express from 'express';
import { register, login, forgotPassword, resetPassword } from './controllers/authController';
import {
  getMe,
  updateMe,
  deleteMe,
  getNearby,
  likeUser,
  verifyUser,
  compareFacesAndVerify,
  updatePrivacy,
  getAnthems
} from './controllers/userController';
import {
  blockUserController,
  unblockUserController,
  getBlockedUsersController,
  reportUserController,
  getAdminReportsController,
  getAdminReportChatController,
  adminActionReportController,
  adminGetStatsController,
  adminGetBannedUsersController,
  adminBanUserController,
  adminUnbanUserController
} from './controllers/safetyController';
import {
  adminQuickLoginController,
  adminGetOverviewStatsController,
  adminGetUsersController,
  adminGetUserDetailsController,
  adminUpdateUserRoleController,
  adminVerifyUserController,
  adminWarnUserController,
  adminDeleteUserController,
  adminGetPlansController,
  adminDeletePlanController,
  adminGetAnnouncementsController,
  adminCreateAnnouncementController,
  adminDeleteAnnouncementController
} from './controllers/adminController';
import { uploadMiddleware, uploadPhotoHandler } from './controllers/uploadController';
import {
  searchSpotifyTracks,
  searchSpotifyArtists,
  connectSpotifyAccount,
  connectSpotifyToken,
  disconnectSpotifyAccount,
  spotifyOAuthLogin,
  spotifyOAuthCallback,
  getSpotifyStatus
} from './controllers/spotifyController';
import {
  getConversations,
  startChatWithUser,
  getMessages,
  sendMessage,
  getIcebreakers,
  viewEphemeralMessage
} from './controllers/chatController';
import {
  getPlans,
  createPlan,
  toggleJoinPlan,
  getPlanChat,
  sendPlanMessage,
  updatePlan
} from './controllers/planController';
import { authenticateToken } from './middleware/auth';

const router = express.Router();

// ==================== RUTAS DE AUTENTICACIÓN ====================
router.post('/auth/register', register);
router.post('/auth/login', login);
router.post('/auth/forgot-password', forgotPassword);
router.post('/auth/reset-password', resetPassword);

// ==================== RUTAS DE SPOTIFY WEB API ====================
// Búsqueda pública (Client Credentials, sin autenticación de usuario)
router.get('/spotify/search', searchSpotifyTracks);
router.get('/spotify/artists', searchSpotifyArtists);
// Estado OAuth del usuario autenticado
router.get('/spotify/me', authenticateToken, getSpotifyStatus);
// Inicio del flujo OAuth real de Spotify -> redirige a accounts.spotify.com
// NOTA: No usa authenticateToken aquí porque el navegador del sistema no puede enviar headers.
// El JWT llega como query param ?token= 
router.get('/spotify/oauth/login', spotifyOAuthLogin);
// Callback real de Spotify (Redirect URI registrada en el dashboard)
router.get('/spotify/oauth/callback', spotifyOAuthCallback);
// Legacy / fallback manual
router.post('/spotify/connect', authenticateToken, connectSpotifyAccount);
// PKCE: el cliente ya obtuvo el token, solo guardamos los datos
router.post('/spotify/connect-token', authenticateToken, connectSpotifyToken);
router.delete('/spotify/disconnect', authenticateToken, disconnectSpotifyAccount);

// ==================== RUTAS DE MÚSICA & HIMNOS ====================
router.get('/music/anthems', getAnthems);

// ==================== RUTAS DE USUARIA Y PERFIL ====================
router.get('/users/me', authenticateToken, getMe);
router.put('/users/me', authenticateToken, updateMe);
router.put('/users/me/privacy', authenticateToken, updatePrivacy);
router.post('/users/verify', authenticateToken, verifyUser);
router.post('/users/verify-facial-match', authenticateToken, compareFacesAndVerify);
router.delete('/users/me', authenticateToken, deleteMe);
router.get('/users/nearby', authenticateToken, getNearby);
router.post('/users/:id/like', authenticateToken, likeUser);

// ==================== RUTAS DE SEGURIDAD & MODERACIÓN ====================
router.get('/users/blocked', authenticateToken, getBlockedUsersController);
router.post('/users/:id/block', authenticateToken, blockUserController);
router.delete('/users/:id/unblock', authenticateToken, unblockUserController);
router.post('/users/:id/report', authenticateToken, reportUserController);

// ==================== RUTAS DE PANEL DE ADMINISTRACIÓN / MODERACIÓN ====================
router.post('/admin/quick-login', adminQuickLoginController);
router.get('/admin/overview', authenticateToken, adminGetOverviewStatsController);
router.get('/admin/stats', authenticateToken, adminGetStatsController);
router.get('/admin/users', authenticateToken, adminGetUsersController);
router.get('/admin/users/:id', authenticateToken, adminGetUserDetailsController);
router.put('/admin/users/:id/role', authenticateToken, adminUpdateUserRoleController);
router.put('/admin/users/:id/verify', authenticateToken, adminVerifyUserController);
router.post('/admin/users/:id/warn', authenticateToken, adminWarnUserController);
router.delete('/admin/users/:id', authenticateToken, adminDeleteUserController);
router.get('/admin/reports', authenticateToken, getAdminReportsController);
router.get('/admin/reports/:id/chat', authenticateToken, getAdminReportChatController);
router.post('/admin/reports/:id/action', authenticateToken, adminActionReportController);
router.get('/admin/users/banned', authenticateToken, adminGetBannedUsersController);
router.post('/admin/users/:id/ban', authenticateToken, adminBanUserController);
router.post('/admin/users/:id/unban', authenticateToken, adminUnbanUserController);
router.get('/admin/plans', authenticateToken, adminGetPlansController);
router.delete('/admin/plans/:id', authenticateToken, adminDeletePlanController);
router.get('/admin/announcements', authenticateToken, adminGetAnnouncementsController);
router.post('/admin/announcements', authenticateToken, adminCreateAnnouncementController);
router.delete('/admin/announcements/:id', authenticateToken, adminDeleteAnnouncementController);

// ==================== RUTAS DE CHAT Y MENSAJERÍA ====================
router.get('/chats/icebreakers', getIcebreakers);
router.get('/chats', authenticateToken, getConversations);
router.post('/chats/start/:targetUserId', authenticateToken, startChatWithUser);
router.get('/chats/:conversationId/messages', authenticateToken, getMessages);
router.post('/chats/:conversationId/messages', authenticateToken, sendMessage);
router.post('/chats/:conversationId/messages/:messageId/view', authenticateToken, viewEphemeralMessage);

// ==================== RUTAS DE PLANES Y EVENTOS ====================
router.get('/plans', authenticateToken, getPlans);
router.post('/plans', authenticateToken, createPlan);
router.put('/plans/:id', authenticateToken, updatePlan);
router.post('/plans/:id/join', authenticateToken, toggleJoinPlan);
router.get('/plans/:id/chat', authenticateToken, getPlanChat);
router.post('/plans/:id/chat/messages', authenticateToken, sendPlanMessage);

// ==================== RUTAS DE SUBIDA MULTIMEDIA ====================
router.post('/upload/photo', uploadMiddleware.single('photo'), uploadPhotoHandler);

export default router;
