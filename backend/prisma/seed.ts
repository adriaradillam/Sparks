import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { memoryStore } from '../src/store/memoryStore';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Sembrando base de datos con perfiles sáficos...');

  // Limpiar datos previos
  await prisma.userReport.deleteMany({});
  await prisma.blockRelationship.deleteMany({});
  await prisma.eventPlan.deleteMany({});
  await prisma.matchInteraction.deleteMany({});
  await prisma.message.deleteMany({});
  await prisma.conversation.deleteMany({});
  await prisma.user.deleteMany({});

  // Insertar Usuarios
  for (const user of memoryStore.users) {
    await prisma.user.create({
      data: {
        id: user.id,
        email: user.email,
        passwordHash: user.passwordHash,
        name: user.name,
        age: user.age,
        bio: user.bio,
        avatarUrl: user.avatarUrl,
        photos: JSON.stringify(user.photos || []),
        lat: user.lat,
        lng: user.lng,
        pronouns: user.pronouns || 'Ella / She',
        intention: user.intention || 'dating',
        tags: JSON.stringify(user.tags || []),
        anthem: user.anthem ? JSON.stringify(user.anthem) : null,
        spotify: user.spotify ? JSON.stringify(user.spotify) : null,
        isVerified: user.isVerified ?? false,
        ghostMode: user.ghostMode ?? false,
        approxDistanceOnly: user.approxDistanceOnly ?? false,
        createdAt: user.createdAt || new Date()
      }
    });
  }

  // Insertar Conversaciones y Mensajes
  for (const conv of memoryStore.conversations) {
    await prisma.conversation.create({
      data: {
        id: conv.id,
        participant1Id: conv.participantIds[0],
        participant2Id: conv.participantIds[1],
        lastMessage: conv.lastMessage,
        updatedAt: conv.updatedAt
      }
    });
  }

  for (const msg of memoryStore.messages) {
    await prisma.message.create({
      data: {
        id: msg.id,
        conversationId: msg.conversationId,
        senderId: msg.senderId,
        text: msg.text,
        type: msg.type || 'text',
        imageUrl: msg.imageUrl || null,
        viewed: msg.viewed || false,
        isRead: msg.isRead || false,
        createdAt: msg.createdAt
      }
    });
  }

  // Insertar Planes
  for (const plan of memoryStore.plans) {
    await prisma.eventPlan.create({
      data: {
        id: plan.id,
        creatorId: plan.creatorId,
        title: plan.title,
        category: plan.category,
        description: plan.description,
        locationName: plan.locationName,
        dateTimeText: plan.dateTimeText,
        attendeeIds: JSON.stringify(plan.attendeeIds || []),
        createdAt: plan.createdAt
      }
    });
  }

  console.log(`✅ Base de datos sembrada con éxito: ${memoryStore.users.length} usuarias.`);
}

main()
  .catch((e) => {
    console.error('Error al sembrar base de datos:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
