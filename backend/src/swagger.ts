export const swaggerSpec = {
  openapi: '3.0.0',
  info: {
    title: 'Sparks API 💖✨',
    version: '1.0.0',
    description:
      'Documentación técnica y especificación oficial de la API de **Sparks**, la app de citas y comunidad sáfica/queer.\n\nIncluye autenticación JWT, integración con Spotify Web API (PKCE), geolocalización, mensajería con fotos efímeras, planes comunitarios, subida de archivos multimedia y sistema estricto de seguridad, reporte y bloqueo conforme a las directrices de Apple App Store y Google Play.',
    contact: {
      name: 'Equipo de Desarrollo Sparks',
      email: 'soporte@sparks.app'
    }
  },
  servers: [
    {
      url: 'http://localhost:5000',
      description: 'Servidor Local de Desarrollo'
    }
  ],
  components: {
    securitySchemes: {
      BearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Token JWT obtenido en el login o registro. Formato: `Bearer <token>`'
      }
    },
    schemas: {
      User: {
        type: 'object',
        properties: {
          id: { type: 'integer', example: 1 },
          email: { type: 'string', example: 'ana@sparks.app' },
          name: { type: 'string', example: 'Ana' },
          age: { type: 'integer', example: 28 },
          bio: { type: 'string', example: 'Amante de los gatos, la música indie y el buen café ☕🐾' },
          avatarUrl: { type: 'string', example: 'http://localhost:5000/uploads/photo-123.jpg' },
          pronouns: { type: 'string', example: 'Ella / She' },
          intention: { type: 'string', example: 'dating', enum: ['dating', 'friends', 'chat', 'events'] },
          tags: { type: 'array', items: { type: 'string' }, example: ['Música indie', 'Café lover', 'Femme'] },
          isVerified: { type: 'boolean', example: true },
          ghostMode: { type: 'boolean', example: false },
          approxDistanceOnly: { type: 'boolean', example: false },
          distance_km: { type: 'number', example: 1.4 }
        }
      },
      ReportRequest: {
        type: 'object',
        required: ['reason'],
        properties: {
          reason: {
            type: 'string',
            enum: ['harassment', 'fake_profile', 'hate_speech', 'inappropriate_content', 'spam', 'other'],
            example: 'fake_profile'
          },
          description: { type: 'string', example: 'Usa fotos que no son suyas.' }
        }
      },
      Message: {
        type: 'object',
        properties: {
          id: { type: 'integer', example: 1 },
          conversationId: { type: 'integer', example: 2 },
          senderId: { type: 'integer', example: 1 },
          text: { type: 'string', example: '¡Hola! ¿Qué tal tu día? ✨' },
          type: { type: 'string', enum: ['text', 'icebreaker', 'ephemeral_image'], example: 'text' },
          imageUrl: { type: 'string', nullable: true },
          viewed: { type: 'boolean', example: false },
          isRead: { type: 'boolean', example: true },
          createdAt: { type: 'string', format: 'date-time' }
        }
      }
    }
  },
  tags: [
    { name: 'Autenticación', description: 'Registro, Login y Recuperación de Contraseña' },
    { name: 'Usuarias & Exploración', description: 'Perfil propio, feed cercano con geolocalización y Likes' },
    { name: 'Seguridad & Moderación', description: 'Reporte, Bloqueo y Desbloqueo de usuarias (Normativa App Store)' },
    { name: 'Spotify & Música', description: 'Catálogo de himnos, búsqueda y sincronización con Spotify' },
    { name: 'Chats & Mensajería', description: 'Conversaciones, mensajes de texto, rompehielos y fotos efímeras' },
    { name: 'Planes & Comunidad', description: 'Eventos comunitarios sáficos y unión de asistentes' },
    { name: 'Multimedia & Uploads', description: 'Subida de imágenes desde galería con Multer' }
  ],
  paths: {
    '/api/auth/register': {
      post: {
        tags: ['Autenticación'],
        summary: 'Registrar nueva usuaria',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email', 'password', 'name', 'age'],
                properties: {
                  email: { type: 'string', example: 'nueva@sparks.app' },
                  password: { type: 'string', example: '123456' },
                  name: { type: 'string', example: 'Sofía' },
                  age: { type: 'integer', example: 24 },
                  bio: { type: 'string', example: 'Hola! Buscando planes de música y naturaleza.' },
                  avatarUrl: { type: 'string', example: 'default' }
                }
              }
            }
          }
        },
        responses: {
          201: { description: 'Usuaria registrada con éxito. Devuelve JWT y perfil.' },
          400: { description: 'Datos no válidos o correo ya registrado.' }
        }
      }
    },
    '/api/auth/login': {
      post: {
        tags: ['Autenticación'],
        summary: 'Iniciar sesión con correo y contraseña',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email', 'password'],
                properties: {
                  email: { type: 'string', example: 'ana@sparks.app' },
                  password: { type: 'string', example: '123456' }
                }
              }
            }
          }
        },
        responses: {
          200: { description: 'Login exitoso. Devuelve token JWT y perfil.' },
          401: { description: 'Credenciales incorrectas.' }
        }
      }
    },
    '/api/users/me': {
      get: {
        tags: ['Usuarias & Exploración'],
        summary: 'Obtener datos de la usuaria autenticada',
        security: [{ BearerAuth: [] }],
        responses: {
          200: { description: 'Perfil de la usuaria actual.' }
        }
      },
      put: {
        tags: ['Usuarias & Exploración'],
        summary: 'Actualizar perfil (bio, tags, foto, intención, himno musical)',
        security: [{ BearerAuth: [] }],
        responses: {
          200: { description: 'Perfil actualizado.' }
        }
      }
    },
    '/api/users/nearby': {
      get: {
        tags: ['Usuarias & Exploración'],
        summary: 'Obtener grid de perfiles cercanos con filtros',
        security: [{ BearerAuth: [] }],
        parameters: [
          { name: 'lat', in: 'query', schema: { type: 'number' }, example: 40.416775 },
          { name: 'lng', in: 'query', schema: { type: 'number' }, example: -3.703790 },
          { name: 'intention', in: 'query', schema: { type: 'string', enum: ['all', 'dating', 'friends', 'chat', 'events'] } },
          { name: 'minAge', in: 'query', schema: { type: 'integer' }, example: 18 },
          { name: 'maxAge', in: 'query', schema: { type: 'integer' }, example: 35 },
          { name: 'maxDist', in: 'query', schema: { type: 'number' }, example: 30 },
          { name: 'onlyVerified', in: 'query', schema: { type: 'boolean' }, example: true },
          { name: 'hasSpotify', in: 'query', schema: { type: 'boolean' }, example: false }
        ],
        responses: {
          200: { description: 'Lista de usuarias recomendadas ordenadas por proximidad.' }
        }
      }
    },
    '/api/users/{id}/like': {
      post: {
        tags: ['Usuarias & Exploración'],
        summary: 'Dar Like / Flechazo a una usuaria',
        security: [{ BearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        responses: {
          200: { description: 'Resultado del like con indicación de si ha surgido un Spark mutuo (isMatch).' }
        }
      }
    },
    '/api/users/blocked': {
      get: {
        tags: ['Seguridad & Moderación'],
        summary: 'Obtener lista de usuarias bloqueadas por la cuenta actual',
        security: [{ BearerAuth: [] }],
        responses: {
          200: { description: 'Lista de perfiles bloqueados.' }
        }
      }
    },
    '/api/users/{id}/block': {
      post: {
        tags: ['Seguridad & Moderación'],
        summary: 'Bloquear bidireccionalmente a una usuaria',
        security: [{ BearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        responses: {
          200: { description: 'Usuaria bloqueada con éxito.' }
        }
      }
    },
    '/api/users/{id}/unblock': {
      delete: {
        tags: ['Seguridad & Moderación'],
        summary: 'Desbloquear a una usuaria previamente bloqueada',
        security: [{ BearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        responses: {
          200: { description: 'Usuaria desbloqueada.' }
        }
      }
    },
    '/api/users/{id}/report': {
      post: {
        tags: ['Seguridad & Moderación'],
        summary: 'Reportar/Denunciar a una usuaria por infracción de normas (autobloqueo)',
        security: [{ BearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ReportRequest' }
            }
          }
        },
        responses: {
          200: { description: 'Reporte registrado y usuaria autobloqueada.' }
        }
      }
    },
    '/api/chats': {
      get: {
        tags: ['Chats & Mensajería'],
        summary: 'Obtener todas las conversaciones activas con conteo de no leídos',
        security: [{ BearerAuth: [] }],
        responses: {
          200: { description: 'Lista de conversaciones.' }
        }
      }
    },
    '/api/chats/{conversationId}/messages': {
      get: {
        tags: ['Chats & Mensajería'],
        summary: 'Obtener historial de mensajes de una conversación',
        security: [{ BearerAuth: [] }],
        parameters: [{ name: 'conversationId', in: 'path', required: true, schema: { type: 'integer' } }],
        responses: {
          200: { description: 'Lista de mensajes.' }
        }
      },
      post: {
        tags: ['Chats & Mensajería'],
        summary: 'Enviar mensaje de texto, rompehielos o foto efímera',
        security: [{ BearerAuth: [] }],
        parameters: [{ name: 'conversationId', in: 'path', required: true, schema: { type: 'integer' } }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  text: { type: 'string', example: '¿Te apetece un café este viernes? ☕' },
                  type: { type: 'string', enum: ['text', 'icebreaker', 'ephemeral_image'], default: 'text' },
                  imageUrl: { type: 'string', nullable: true }
                }
              }
            }
          }
        },
        responses: {
          200: { description: 'Mensaje enviado y respuesta simulada.' }
        }
      }
    },
    '/api/plans': {
      get: {
        tags: ['Planes & Comunidad'],
        summary: 'Obtener todos los planes y quedadas comunitarias',
        security: [{ BearerAuth: [] }],
        responses: {
          200: { description: 'Lista de planes.' }
        }
      },
      post: {
        tags: ['Planes & Comunidad'],
        summary: 'Crear un nuevo plan o quedada sáfica',
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['title', 'category', 'description', 'locationName', 'dateTimeText'],
                properties: {
                  title: { type: 'string', example: 'Picnic y juegos en el Retiro 🧺🍓' },
                  category: { type: 'string', enum: ['coffee', 'party', 'culture', 'outdoor', 'sports'] },
                  description: { type: 'string', example: 'Llevamos mantitas y picoteo para conocernos.' },
                  locationName: { type: 'string', example: 'Palacio de Cristal, Madrid' },
                  dateTimeText: { type: 'string', example: 'Sábado a las 17:30' }
                }
              }
            }
          }
        },
        responses: {
          201: { description: 'Plan creado con éxito.' }
        }
      }
    },
    '/api/upload/photo': {
      post: {
        tags: ['Multimedia & Uploads'],
        summary: 'Subir archivo de imagen (multipart/form-data) al almacenamiento del servidor',
        requestBody: {
          required: true,
          content: {
            'multipart/form-data': {
              schema: {
                type: 'object',
                properties: {
                  photo: { type: 'string', format: 'binary' }
                }
              }
            }
          }
        },
        responses: {
          200: { description: 'Foto subida con éxito. Devuelve URL pública persistente.' }
        }
      }
    }
  }
};
