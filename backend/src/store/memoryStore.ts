import bcrypt from 'bcryptjs';

export interface SongAnthem {
  id: string;
  title: string;
  artist: string;
  coverUrl: string;
  previewUrl?: string;
}

export interface SpotifyArtist {
  name: string;
  image: string;
  genres?: string[];
}

export interface SpotifyProfile {
  connected: boolean;
  username: string;
  topArtists: SpotifyArtist[];
  // Campos del OAuth real (Authorization Code Flow)
  accessToken?: string;
  refreshToken?: string;
  spotifyId?: string;
  spotifyProfileUrl?: string;
  spotifyAvatar?: string;
}

export interface User {
  id: number;
  email: string;
  passwordHash: string;
  name: string;
  age: number;
  bio: string;
  avatarUrl: string;
  photos: string[];
  lat: number;
  lng: number;
  pronouns?: string;
  intention?: string;
  tags?: string[];
  anthem?: SongAnthem;
  spotify?: SpotifyProfile;
  isVerified?: boolean;
  ghostMode?: boolean;
  approxDistanceOnly?: boolean;
  resetToken?: string;
  resetTokenExpires?: number;
  createdAt: Date;
}

export interface Conversation {
  id: number;
  participantIds: [number, number];
  lastMessage: string;
  updatedAt: Date;
}

export type MessageType = 'text' | 'icebreaker' | 'ephemeral_image';

export interface Message {
  id: number;
  conversationId: number;
  senderId: number;
  text: string;
  type?: MessageType;
  imageUrl?: string;
  viewed?: boolean;
  createdAt: Date;
  isRead: boolean;
}

export interface MatchInteraction {
  id: number;
  fromUserId: number;
  toUserId: number;
  type: 'like' | 'pass';
  createdAt: Date;
}

export interface EventPlan {
  id: number;
  creatorId: number;
  title: string;
  category: 'coffee' | 'party' | 'culture' | 'outdoor' | 'sports';
  description: string;
  locationName: string;
  dateTimeText: string;
  attendeeIds: number[];
  createdAt: Date;
}

export interface BlockRelationship {
  id: number;
  blockerId: number;
  blockedId: number;
  createdAt: Date;
}

export type ReportReason =
  | 'harassment'
  | 'fake_profile'
  | 'hate_speech'
  | 'inappropriate_content'
  | 'spam'
  | 'other';

export interface UserReport {
  id: number;
  reporterId: number;
  reportedUserId: number;
  reason: ReportReason;
  description?: string;
  createdAt: Date;
}

export const CURATED_ANTHEMS: SongAnthem[] = [
  {
    id: '1',
    title: 'Red Wine Supernova',
    artist: 'Chappell Roan',
    coverUrl: 'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?w=300',
    previewUrl: 'https://cdn.pixabay.com/download/audio/2022/05/27/audio_1808fbf07a.mp3?filename=lofi-study-112191.mp3'
  },
  {
    id: '2',
    title: 'Not Strong Enough',
    artist: 'boygenius',
    coverUrl: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=300',
    previewUrl: 'https://cdn.pixabay.com/download/audio/2022/01/18/audio_d0c6ff1c21.mp3?filename=beautiful-dreamer-main-7071.mp3'
  },
  {
    id: '3',
    title: 'we fell in love in october',
    artist: 'girl in red',
    coverUrl: 'https://images.unsplash.com/photo-1518609878373-06d740f60d8b?w=300',
    previewUrl: 'https://cdn.pixabay.com/download/audio/2022/08/02/audio_884fe92c21.mp3?filename=sweet-vermouth-10718.mp3'
  },
  {
    id: '4',
    title: 'Snow Angel',
    artist: 'Reneé Rapp',
    coverUrl: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=300',
    previewUrl: 'https://cdn.pixabay.com/download/audio/2021/11/25/audio_5a2cf05b11.mp3?filename=inspiring-cinematic-ambient-piano-14285.mp3'
  },
  {
    id: '5',
    title: 'Silk Chiffon',
    artist: 'MUNA ft. Phoebe Bridgers',
    coverUrl: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=300',
    previewUrl: 'https://cdn.pixabay.com/download/audio/2022/10/25/audio_946f4a6196.mp3?filename=hip-hop-background-121896.mp3'
  },
  {
    id: '6',
    title: 'Girls Like Girls',
    artist: 'Hayley Kiyoko',
    coverUrl: 'https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=300',
    previewUrl: 'https://cdn.pixabay.com/download/audio/2022/03/15/audio_1a609a5c72.mp3?filename=electronic-future-beats-117997.mp3'
  },
  {
    id: '7',
    title: 'Sofia',
    artist: 'Clairo',
    coverUrl: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=300',
    previewUrl: 'https://cdn.pixabay.com/download/audio/2021/08/09/audio_88447e769d.mp3?filename=summer-walk-152722.mp3'
  }
];

export const DEMO_SPOTIFY_ARTISTS: SpotifyArtist[] = [
  {
    name: 'Chappell Roan',
    image: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=300',
    genres: ['Pop', 'Queer Pop', 'Indie']
  },
  {
    name: 'boygenius',
    image: 'https://images.unsplash.com/photo-1465847899084-d164df4dedc6?w=300',
    genres: ['Indie Rock', 'Folk']
  },
  {
    name: 'girl in red',
    image: 'https://images.unsplash.com/photo-1520523839898-507127054976?w=300',
    genres: ['Bedroom Pop', 'Indie']
  },
  {
    name: 'Reneé Rapp',
    image: 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=300',
    genres: ['Pop', 'Broadway']
  },
  {
    name: 'Phoebe Bridgers',
    image: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=300',
    genres: ['Indie Folk', 'Emo']
  },
  {
    name: 'MUNA',
    image: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=300',
    genres: ['Synthpop', 'Queer Pop']
  },
  {
    name: 'Clairo',
    image: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=300',
    genres: ['Indie Pop', 'Lo-fi']
  },
  {
    name: 'Hayley Kiyoko',
    image: 'https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=300',
    genres: ['Pop', 'Dance']
  },
  {
    name: 'FLETCHER',
    image: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=300',
    genres: ['Pop', 'Alt Pop']
  },
  {
    name: 'King Princess',
    image: 'https://images.unsplash.com/photo-1518609878373-06d740f60d8b?w=300',
    genres: ['Indie Pop', 'Queer Pop']
  }
];

class MemoryStore {
  public users: User[] = [];
  public conversations: Conversation[] = [];
  public messages: Message[] = [];
  public matches: MatchInteraction[] = [];
  public plans: EventPlan[] = [];
  public blocks: BlockRelationship[] = [];
  public reports: UserReport[] = [];
  private nextUserId = 15;
  private nextConvId = 2;
  private nextMsgId = 4;
  private nextPlanId = 4;
  private nextBlockId = 1;
  private nextReportId = 1;

  constructor() {
    this.seed();
  }

  private seed() {
    const defaultPass = bcrypt.hashSync('123456', 10);

    this.users = [
      {
        id: 1,
        email: 'ana@sparks.app',
        passwordHash: defaultPass,
        name: 'Ana',
        age: 28,
        bio: 'Amante de los gatos, la música indie y el buen café de especialidad ☕🐾',
        avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500',
        photos: [
          'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500',
          'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=500'
        ],
        lat: 40.416775,
        lng: -3.703790,
        pronouns: 'Ella / She',
        intention: 'dating',
        tags: ['Música indie', 'Café lover', 'Mascotas', 'Femme'],
        anthem: CURATED_ANTHEMS[0],
        spotify: {
          connected: true,
          username: 'ana_music',
          topArtists: [DEMO_SPOTIFY_ARTISTS[0], DEMO_SPOTIFY_ARTISTS[1], DEMO_SPOTIFY_ARTISTS[2]]
        },
        isVerified: true,
        ghostMode: false,
        approxDistanceOnly: false,
        createdAt: new Date()
      },
      {
        id: 2,
        email: 'laura@sparks.app',
        passwordHash: defaultPass,
        name: 'Laura',
        age: 32,
        bio: 'Escaladora en bloque, fotógrafa de analógicas y compradora compulsiva de plantas 🧗‍♀️🪴',
        avatarUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=500',
        photos: [
          'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=500'
        ],
        lat: 40.426775,
        lng: -3.713790,
        pronouns: 'Ella / Elle',
        intention: 'events',
        tags: ['Senderismo', 'Masc / Butch', 'Plant Lover', 'Fotografía'],
        anthem: CURATED_ANTHEMS[1],
        spotify: {
          connected: true,
          username: 'laura_climbs',
          topArtists: [DEMO_SPOTIFY_ARTISTS[1], DEMO_SPOTIFY_ARTISTS[4], DEMO_SPOTIFY_ARTISTS[2]]
        },
        isVerified: true,
        ghostMode: false,
        approxDistanceOnly: true,
        createdAt: new Date()
      },
      {
        id: 3,
        email: 'elena@sparks.app',
        passwordHash: defaultPass,
        name: 'Elena',
        age: 25,
        bio: 'Arquitecta de interiores. Si nos tomamos un vino acabaremos debatiendo de astrología y Bauhaus 🍷🎨',
        avatarUrl: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=500',
        photos: [
          'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=500'
        ],
        lat: 40.418775,
        lng: -3.693790,
        pronouns: 'Ella',
        intention: 'dating',
        tags: ['Arte & Diseño', 'Vino & Tapas', 'Astrología', 'Femme'],
        anthem: CURATED_ANTHEMS[2],
        spotify: {
          connected: true,
          username: 'elena_design',
          topArtists: [DEMO_SPOTIFY_ARTISTS[2], DEMO_SPOTIFY_ARTISTS[3], DEMO_SPOTIFY_ARTISTS[0]]
        },
        isVerified: true,
        ghostMode: false,
        approxDistanceOnly: false,
        createdAt: new Date()
      },
      {
        id: 4,
        email: 'sofia@sparks.app',
        passwordHash: defaultPass,
        name: 'Sofía',
        age: 29,
        bio: 'Gamer de Nintendo Switch, lectora de fantasía sáfica y cocinera de domingo 📚🎮',
        avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=500',
        photos: [
          'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=500'
        ],
        lat: 40.420000,
        lng: -3.700000,
        pronouns: 'Elle / They',
        intention: 'friends',
        tags: ['Gamer', 'Cine & Libros', 'Plant Lover', 'Queer'],
        anthem: CURATED_ANTHEMS[3],
        spotify: {
          connected: true,
          username: 'sofia_reads',
          topArtists: [DEMO_SPOTIFY_ARTISTS[5], DEMO_SPOTIFY_ARTISTS[2], DEMO_SPOTIFY_ARTISTS[6]]
        },
        isVerified: true,
        ghostMode: false,
        approxDistanceOnly: false,
        createdAt: new Date()
      },
      {
        id: 5,
        email: 'carmen@sparks.app',
        passwordHash: defaultPass,
        name: 'Carmen',
        age: 27,
        bio: 'Dramaturga y adicta al té matcha. Busco a alguien para ir a obras de teatro alternativo y perdernos por Malasaña 🎭🍵',
        avatarUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=500',
        photos: [
          'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=500'
        ],
        lat: 40.425000,
        lng: -3.705000,
        pronouns: 'Ella / She',
        intention: 'dating',
        tags: ['Cine & Libros', 'Femme', 'Música indie', 'Café lover'],
        anthem: CURATED_ANTHEMS[4],
        spotify: {
          connected: true,
          username: 'carmen_theatre',
          topArtists: [DEMO_SPOTIFY_ARTISTS[0], DEMO_SPOTIFY_ARTISTS[5], DEMO_SPOTIFY_ARTISTS[7]]
        },
        isVerified: true,
        ghostMode: false,
        approxDistanceOnly: false,
        createdAt: new Date()
      },
      {
        id: 6,
        email: 'valeria@sparks.app',
        passwordHash: defaultPass,
        name: 'Valeria',
        age: 30,
        bio: 'Veterinaria de fauna. Paso el 80% de mi tiempo libre en el monte con mis dos perras adoptadas 🐕🌲',
        avatarUrl: 'https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?w=500',
        photos: [
          'https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?w=500'
        ],
        lat: 40.435000,
        lng: -3.715000,
        pronouns: 'Ella / She',
        intention: 'dating',
        tags: ['Mascotas', 'Senderismo', 'Masc / Butch', 'Plant Lover'],
        anthem: CURATED_ANTHEMS[1],
        spotify: {
          connected: true,
          username: 'vale_vet',
          topArtists: [DEMO_SPOTIFY_ARTISTS[1], DEMO_SPOTIFY_ARTISTS[4], DEMO_SPOTIFY_ARTISTS[0]]
        },
        isVerified: true,
        ghostMode: false,
        approxDistanceOnly: false,
        createdAt: new Date()
      },
      {
        id: 7,
        email: 'lucia@sparks.app',
        passwordHash: defaultPass,
        name: 'Lucía',
        age: 24,
        bio: 'Tatuadora e ilustradora freelance. Te diseño un flash si me enseñas tus canciones favoritas de bedroom pop ✨🪡',
        avatarUrl: 'https://images.unsplash.com/photo-1519699047748-de8e457a634e?w=500',
        photos: [
          'https://images.unsplash.com/photo-1519699047748-de8e457a634e?w=500'
        ],
        lat: 40.412000,
        lng: -3.708000,
        pronouns: 'She / They',
        intention: 'chat',
        tags: ['Arte & Diseño', 'Andrógina', 'Música indie', 'Queer'],
        anthem: CURATED_ANTHEMS[6],
        spotify: {
          connected: true,
          username: 'lucia_ink',
          topArtists: [DEMO_SPOTIFY_ARTISTS[6], DEMO_SPOTIFY_ARTISTS[2], DEMO_SPOTIFY_ARTISTS[9]]
        },
        isVerified: true,
        ghostMode: false,
        approxDistanceOnly: false,
        createdAt: new Date()
      },
      {
        id: 8,
        email: 'marta@sparks.app',
        passwordHash: defaultPass,
        name: 'Marta',
        age: 31,
        bio: 'Psicóloga y runner aficionada. El domingo perfecto: brunch largo, prensa cultural y charlas infinitas 🥑🥐',
        avatarUrl: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=500',
        photos: [
          'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=500'
        ],
        lat: 40.428000,
        lng: -3.690000,
        pronouns: 'Ella / She',
        intention: 'dating',
        tags: ['Femme', 'Café lover', 'Vino & Tapas', 'Astrología'],
        anthem: CURATED_ANTHEMS[3],
        spotify: {
          connected: true,
          username: 'marta_psy',
          topArtists: [DEMO_SPOTIFY_ARTISTS[3], DEMO_SPOTIFY_ARTISTS[8], DEMO_SPOTIFY_ARTISTS[0]]
        },
        isVerified: false,
        ghostMode: false,
        approxDistanceOnly: false,
        createdAt: new Date()
      },
      {
        id: 9,
        email: 'nuria@sparks.app',
        passwordHash: defaultPass,
        name: 'Nuria',
        age: 26,
        bio: 'Chef de repostería vegana. Te horneo unos cinnamon rolls si vienes a ver Studio Ghibli conmigo 🥐🎬',
        avatarUrl: 'https://images.unsplash.com/photo-1502823403499-6ccfcf4fb453?w=500',
        photos: [
          'https://images.unsplash.com/photo-1502823403499-6ccfcf4fb453?w=500'
        ],
        lat: 40.405000,
        lng: -3.698000,
        pronouns: 'Ella / Elle',
        intention: 'friends',
        tags: ['Plant Lover', 'Cine & Libros', 'Femme', 'Café lover'],
        anthem: CURATED_ANTHEMS[2],
        spotify: {
          connected: true,
          username: 'nuria_bakery',
          topArtists: [DEMO_SPOTIFY_ARTISTS[2], DEMO_SPOTIFY_ARTISTS[6], DEMO_SPOTIFY_ARTISTS[4]]
        },
        isVerified: true,
        ghostMode: false,
        approxDistanceOnly: false,
        createdAt: new Date()
      },
      {
        id: 10,
        email: 'ainhoa@sparks.app',
        passwordHash: defaultPass,
        name: 'Ainhoa',
        age: 33,
        bio: 'Ingeniera de sonido y coleccionista de sintetizadores analógicos. Fanática de los conciertos íntimos 🎛️⚡',
        avatarUrl: 'https://images.unsplash.com/photo-1521146764736-56c929d59c83?w=500',
        photos: [
          'https://images.unsplash.com/photo-1521146764736-56c929d59c83?w=500'
        ],
        lat: 40.440000,
        lng: -3.702000,
        pronouns: 'Ella / She',
        intention: 'events',
        tags: ['Música indie', 'Masc / Butch', 'Vino & Tapas', 'Queer'],
        anthem: CURATED_ANTHEMS[5],
        spotify: {
          connected: true,
          username: 'ainhoa_sound',
          topArtists: [DEMO_SPOTIFY_ARTISTS[7], DEMO_SPOTIFY_ARTISTS[9], DEMO_SPOTIFY_ARTISTS[5]]
        },
        isVerified: true,
        ghostMode: false,
        approxDistanceOnly: true,
        createdAt: new Date()
      },
      {
        id: 11,
        email: 'clara@sparks.app',
        passwordHash: defaultPass,
        name: 'Clara',
        age: 27,
        bio: 'Historiadora del arte y librera. Siempre tengo 4 libros empezados a la vez y una taza de café fría 📖🏛️',
        avatarUrl: 'https://images.unsplash.com/photo-1517365830460-955ce3ccd263?w=500',
        photos: [
          'https://images.unsplash.com/photo-1517365830460-955ce3ccd263?w=500'
        ],
        lat: 40.415000,
        lng: -3.712000,
        pronouns: 'Ella / She',
        intention: 'dating',
        tags: ['Cine & Libros', 'Arte & Diseño', 'Queer', 'Café lover'],
        anthem: CURATED_ANTHEMS[1],
        spotify: {
          connected: true,
          username: 'clara_books',
          topArtists: [DEMO_SPOTIFY_ARTISTS[1], DEMO_SPOTIFY_ARTISTS[4], DEMO_SPOTIFY_ARTISTS[6]]
        },
        isVerified: true,
        ghostMode: false,
        approxDistanceOnly: false,
        createdAt: new Date()
      },
      {
        id: 12,
        email: 'sara@sparks.app',
        passwordHash: defaultPass,
        name: 'Sara',
        age: 29,
        bio: 'Entrenadora de fuerza y fan del cine de terror noventero. Dulce por dentro, cañera por fuera 🏋️‍♀️🍿',
        avatarUrl: 'https://images.unsplash.com/photo-1509967419530-da38b4704bc6?w=500',
        photos: [
          'https://images.unsplash.com/photo-1509967419530-da38b4704bc6?w=500'
        ],
        lat: 40.422000,
        lng: -3.685000,
        pronouns: 'Ella / She',
        intention: 'dating',
        tags: ['Masc / Butch', 'Senderismo', 'Cine & Libros', 'Mascotas'],
        anthem: CURATED_ANTHEMS[3],
        spotify: {
          connected: true,
          username: 'sara_lift',
          topArtists: [DEMO_SPOTIFY_ARTISTS[3], DEMO_SPOTIFY_ARTISTS[5], DEMO_SPOTIFY_ARTISTS[8]]
        },
        isVerified: true,
        ghostMode: false,
        approxDistanceOnly: false,
        createdAt: new Date()
      },
      {
        id: 13,
        email: 'marina@sparks.app',
        passwordHash: defaultPass,
        name: 'Marina',
        age: 26,
        bio: 'Ceramista y botánica frustrada. Mi casa es una jungla y mi torno de cerámica mi mejor terapia 🏺🪴',
        avatarUrl: 'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=500',
        photos: [
          'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=500'
        ],
        lat: 40.408000,
        lng: -3.702000,
        pronouns: 'Ella / Elle',
        intention: 'friends',
        tags: ['Plant Lover', 'Arte & Diseño', 'Femme', 'Astrología'],
        anthem: CURATED_ANTHEMS[0],
        spotify: {
          connected: true,
          username: 'marina_clay',
          topArtists: [DEMO_SPOTIFY_ARTISTS[0], DEMO_SPOTIFY_ARTISTS[6], DEMO_SPOTIFY_ARTISTS[2]]
        },
        isVerified: true,
        ghostMode: false,
        approxDistanceOnly: false,
        createdAt: new Date()
      },
      {
        id: 14,
        email: 'ines@sparks.app',
        passwordHash: defaultPass,
        name: 'Inés',
        age: 28,
        bio: 'Desarrolladora frontend y organizadora de eventos queer tech. ¿Cerveza artesana y debate de IA? 💻🍻',
        avatarUrl: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=500',
        photos: [
          'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=500'
        ],
        lat: 40.419000,
        lng: -3.707000,
        pronouns: 'She / They',
        intention: 'chat',
        tags: ['Gamer', 'Queer', 'Vino & Tapas', 'Andrógina'],
        anthem: CURATED_ANTHEMS[5],
        spotify: {
          connected: true,
          username: 'ines_code',
          topArtists: [DEMO_SPOTIFY_ARTISTS[2], DEMO_SPOTIFY_ARTISTS[7], DEMO_SPOTIFY_ARTISTS[9]]
        },
        isVerified: true,
        ghostMode: false,
        approxDistanceOnly: false,
        createdAt: new Date()
      }
    ];

    this.conversations = [
      {
        id: 1,
        participantIds: [1, 2],
        lastMessage: '¡Hola! Me encantó tu foto en la montaña',
        updatedAt: new Date()
      }
    ];

    this.messages = [
      {
        id: 1,
        conversationId: 1,
        senderId: 2,
        text: '¡Hola! ¿Cómo estás?',
        type: 'text',
        createdAt: new Date(Date.now() - 3600000),
        isRead: true
      },
      {
        id: 2,
        conversationId: 1,
        senderId: 1,
        text: '¡Hola! Me encantó tu foto en la montaña',
        type: 'text',
        createdAt: new Date(Date.now() - 1800000),
        isRead: true
      }
    ];

    this.plans = [
      {
        id: 1,
        creatorId: 2,
        title: 'Ruta de senderismo y picnic en La Pedriza',
        category: 'outdoor',
        description: '¿Alguien se anima este sábado por la mañana a una ruta suave por la montaña y después comer algo rico al aire libre? ¡Llevo cámara para hacer fotos chulas!',
        locationName: 'La Pedriza / Manzanares',
        dateTimeText: 'Este Sábado • 10:30 AM',
        attendeeIds: [2, 1, 4],
        createdAt: new Date(Date.now() - 7200000)
      },
      {
        id: 2,
        creatorId: 1,
        title: 'Café de especialidad & lectura tranquila en Malasaña',
        category: 'coffee',
        description: 'Plan relajado para la tarde de hoy: ir a una cafetería bonita con luz natural a leer, charlar y merendar tarta casera.',
        locationName: 'Toma Café (Malasaña)',
        dateTimeText: 'Hoy • 17:30 PM',
        attendeeIds: [1, 3],
        createdAt: new Date(Date.now() - 3600000)
      },
      {
        id: 3,
        creatorId: 4,
        title: 'Tarde de juegos de mesa y cañas',
        category: 'party',
        description: '¡Noche de Catan, Dixit y risas en un bar de juegos! No importa si no has jugado nunca, te explicamos todo.',
        locationName: 'Epic Board Game Café',
        dateTimeText: 'Viernes • 20:00 PM',
        attendeeIds: [4, 2],
        createdAt: new Date(Date.now() - 1800000)
      }
    ];
  }

  public calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371;
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * (Math.PI / 180)) *
        Math.cos(lat2 * (Math.PI / 180)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  public addUser(userData: Omit<User, 'id' | 'createdAt'>): User {
    const newUser: User = {
      ...userData,
      id: this.nextUserId++,
      anthem: CURATED_ANTHEMS[0],
      spotify: {
        connected: false,
        username: '',
        topArtists: []
      },
      isVerified: false,
      ghostMode: false,
      approxDistanceOnly: false,
      createdAt: new Date()
    };
    this.users.push(newUser);
    return newUser;
  }

  public getOrCreateConversation(userA: number, userB: number): Conversation {
    let conv = this.conversations.find(
      (c) =>
        (c.participantIds[0] === userA && c.participantIds[1] === userB) ||
        (c.participantIds[0] === userB && c.participantIds[1] === userA)
    );

    if (!conv) {
      conv = {
        id: this.nextConvId++,
        participantIds: [userA, userB],
        lastMessage: '',
        updatedAt: new Date()
      };
      this.conversations.push(conv);
    }
    return conv;
  }

  public addMessage(
    conversationId: number,
    senderId: number,
    text: string,
    type: MessageType = 'text',
    imageUrl?: string
  ): Message {
    const msg: Message = {
      id: this.nextMsgId++,
      conversationId,
      senderId,
      text,
      type,
      imageUrl,
      viewed: false,
      createdAt: new Date(),
      isRead: false
    };
    this.messages.push(msg);

    const conv = this.conversations.find((c) => c.id === conversationId);
    if (conv) {
      conv.lastMessage = type === 'ephemeral_image' ? '[Foto temporal]' : type === 'icebreaker' ? `${text}` : text;
      conv.updatedAt = new Date();
    }

    return msg;
  }

  public addPlan(planData: Omit<EventPlan, 'id' | 'createdAt' | 'attendeeIds'> & { creatorId: number }): EventPlan {
    const newPlan: EventPlan = {
      ...planData,
      id: this.nextPlanId++,
      attendeeIds: [planData.creatorId],
      createdAt: new Date()
    };
    this.plans.unshift(newPlan);
    return newPlan;
  }

  // Métodos de Seguridad: Bloqueo y Reporte
  public isBlocked(userA: number, userB: number): boolean {
    return this.blocks.some(
      (b) =>
        (b.blockerId === userA && b.blockedId === userB) ||
        (b.blockerId === userB && b.blockedId === userA)
    );
  }

  public blockUser(blockerId: number, blockedId: number): BlockRelationship {
    const existing = this.blocks.find(
      (b) => b.blockerId === blockerId && b.blockedId === blockedId
    );
    if (existing) return existing;

    const block: BlockRelationship = {
      id: this.nextBlockId++,
      blockerId,
      blockedId,
      createdAt: new Date()
    };
    this.blocks.push(block);
    return block;
  }

  public unblockUser(blockerId: number, blockedId: number): boolean {
    const index = this.blocks.findIndex(
      (b) => b.blockerId === blockerId && b.blockedId === blockedId
    );
    if (index !== -1) {
      this.blocks.splice(index, 1);
      return true;
    }
    return false;
  }

  public getBlockedUsers(blockerId: number): User[] {
    const blockedIds = this.blocks
      .filter((b) => b.blockerId === blockerId)
      .map((b) => b.blockedId);
    return this.users.filter((u) => blockedIds.includes(u.id));
  }

  public reportUser(
    reporterId: number,
    reportedUserId: number,
    reason: ReportReason,
    description?: string
  ): UserReport {
    const report: UserReport = {
      id: this.nextReportId++,
      reporterId,
      reportedUserId,
      reason,
      description,
      createdAt: new Date()
    };
    this.reports.push(report);

    // Auto-bloqueo preventivo al reportar
    this.blockUser(reporterId, reportedUserId);

    return report;
  }
}

export const memoryStore = new MemoryStore();
