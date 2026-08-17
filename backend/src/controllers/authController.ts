import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { memoryStore } from '../store/memoryStore';
import { generateToken } from '../middleware/auth';

export const register = async (req: Request, res: Response) => {
  try {
    const { email, password, name, age, bio, avatarUrl, lat, lng } = req.body;

    if (!email || !password || !name || !age) {
      return res.status(400).json({ error: 'Email, contraseña, nombre y edad son obligatorios.' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'La contraseña debe tener al menos 6 caracteres.' });
    }

    if (parseInt(age) < 18) {
      return res.status(400).json({ error: 'Debes ser mayor de 18 años para utilizar esta aplicación.' });
    }

    // Comprobar si ya existe
    const existing = memoryStore.users.find((u) => u.email.toLowerCase() === email.toLowerCase());
    if (existing) {
      return res.status(400).json({ error: 'Este correo electrónico ya está registrado.' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const defaultAvatar = avatarUrl || `https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400`;

    const newUser = memoryStore.addUser({
      email: email.toLowerCase(),
      passwordHash,
      name,
      age: parseInt(age),
      bio: bio || '',
      avatarUrl: defaultAvatar,
      photos: [defaultAvatar],
      lat: lat ? parseFloat(lat) : 40.416775,
      lng: lng ? parseFloat(lng) : -3.703790
    });

    const token = generateToken(newUser.id, newUser.email);

    res.status(201).json({
      message: '¡Registro completado con éxito!',
      token,
      user: {
        id: newUser.id,
        email: newUser.email,
        name: newUser.name,
        age: newUser.age,
        bio: newUser.bio,
        avatarUrl: newUser.avatarUrl,
        photos: newUser.photos
      }
    });
  } catch (error) {
    console.error('Error en register:', error);
    res.status(500).json({ error: 'Error interno en el servidor.' });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Por favor, ingresa tu email y contraseña.' });
    }

    const user = memoryStore.users.find((u) => u.email.toLowerCase() === email.toLowerCase());
    if (!user) {
      return res.status(401).json({ error: 'Credenciales inválidas. Comprueba tu correo y contraseña.' });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Credenciales inválidas. Comprueba tu correo y contraseña.' });
    }

    const token = generateToken(user.id, user.email);

    res.json({
      message: 'Inicio de sesión exitoso',
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        age: user.age,
        bio: user.bio,
        avatarUrl: user.avatarUrl,
        photos: user.photos
      }
    });
  } catch (error) {
    console.error('Error en login:', error);
    res.status(500).json({ error: 'Error interno en el servidor.' });
  }
};

export const forgotPassword = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Por favor proporciona tu correo electrónico.' });
    }

    const user = memoryStore.users.find((u) => u.email.toLowerCase() === email.toLowerCase());
    if (!user) {
      // Por seguridad estándar, no revelar si el correo existe o no
      return res.json({
        message: 'Si el correo está registrado, recibirás un enlace de recuperación en unos minutos.'
      });
    }

    // Generar token aleatorio
    const resetToken = crypto.randomBytes(20).toString('hex');
    user.resetToken = resetToken;
    user.resetTokenExpires = Date.now() + 3600000; // 1 hora de validez

    console.log(`\n🔑 [RECUPERACIÓN DE CONTRASEÑA] Token generado para ${user.email}: ${resetToken}`);
    console.log(`🔗 Código de reseteo: ${resetToken}\n`);

    res.json({
      message: 'Si el correo está registrado, recibirás un enlace de recuperación en unos minutos.',
      // Devolvemos el token en la respuesta de desarrollo para facilitar la prueba desde la app
      devResetToken: resetToken
    });
  } catch (error) {
    console.error('Error en forgotPassword:', error);
    res.status(500).json({ error: 'Error interno en el servidor.' });
  }
};

export const resetPassword = async (req: Request, res: Response) => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return res.status(400).json({ error: 'Token y nueva contraseña son obligatorios.' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'La nueva contraseña debe tener al menos 6 caracteres.' });
    }

    const user = memoryStore.users.find(
      (u) => u.resetToken === token && u.resetTokenExpires && u.resetTokenExpires > Date.now()
    );

    if (!user) {
      return res.status(400).json({ error: 'El código de recuperación es inválido o ha expirado.' });
    }

    user.passwordHash = await bcrypt.hash(newPassword, 10);
    user.resetToken = undefined;
    user.resetTokenExpires = undefined;

    res.json({ message: '¡Tu contraseña ha sido restablecida con éxito! Ya puedes iniciar sesión.' });
  } catch (error) {
    console.error('Error en resetPassword:', error);
    res.status(500).json({ error: 'Error interno en el servidor.' });
  }
};
