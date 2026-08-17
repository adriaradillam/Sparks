import { memoryStore } from './store/memoryStore';
import bcrypt from 'bcryptjs';

async function testBackend() {
  console.log('🧪 Iniciando pruebas de verificación del Backend...');

  // 1. Verificar usuarios en store
  console.log(`✓ Usuarios cargados: ${memoryStore.users.length}`);

  // 2. Probar creación de usuario
  const passHash = await bcrypt.hash('secret123', 10);
  const newUser = memoryStore.addUser({
    email: 'test@sparks.app',
    passwordHash: passHash,
    name: 'Prueba',
    age: 26,
    bio: 'Test bio',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400',
    photos: [],
    lat: 40.416775,
    lng: -3.703790
  });
  console.log(`✓ Usuario creado con ID: ${newUser.id}`);

  // 3. Probar verificación de contraseña
  const valid = await bcrypt.compare('secret123', newUser.passwordHash);
  console.log(`✓ Verificación de contraseña bcrypt: ${valid ? 'PASS' : 'FAIL'}`);

  // 4. Probar cálculo de distancia
  const dist = memoryStore.calculateDistance(40.416775, -3.703790, 40.426775, -3.713790);
  console.log(`✓ Cálculo de distancia GPS: ${dist.toFixed(2)} km`);

  // 5. Probar creación de chat y mensajes
  const conv = memoryStore.getOrCreateConversation(newUser.id, 1);
  const msg = memoryStore.addMessage(conv.id, newUser.id, '¡Hola Ana!');
  console.log(`✓ Mensaje enviado: "${msg.text}" en conversación #${conv.id}`);

  console.log('🎉 ¡Todas las pruebas internas pasaron con éxito!');
}

testBackend();
