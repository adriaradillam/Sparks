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

export function calculateAge(birthDate: string | Date): number {
  const birth = new Date(birthDate);
  if (Number.isNaN(birth.getTime())) return 18;
  const now = new Date();
  let age = now.getFullYear() - birth.getFullYear();
  const monthDiff = now.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < birth.getDate())) {
    age--;
  }
  return age;
}

export interface User {
  id: number;
  email: string;
  passwordHash: string;
  name: string;
  age: number;
  birthDate?: string;
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
  verifiedAt?: string;
  verificationMethod?: string;
  isAdmin?: boolean;
  role?: string;
  isBanned?: boolean;
  bannedReason?: string;
  bannedAt?: Date;
  warningCount?: number;
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
  locationLat?: number;
  locationLng?: number;
  dateTimeText: string;
  attendeeIds: number[];
  createdAt: Date;
}

export interface PlanMessage {
  id: number;
  planId: number;
  senderId: number;
  text: string;
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
  conversationId?: number;
  planId?: number;
  reason: ReportReason;
  description?: string;
  status: 'pending' | 'resolved' | 'dismissed';
  actionTaken?: 'none' | 'warning' | 'banned' | 'dismissed';
  resolutionNotes?: string;
  resolvedAt?: Date;
  resolvedBy?: number;
  createdAt: Date;
}

export interface SystemAnnouncement {
  id: number;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'celebration' | 'maintenance';
  active: boolean;
  createdAt: Date;
  createdBy?: string;
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
  public planMessages: PlanMessage[] = [];
  public blocks: BlockRelationship[] = [];
  public reports: UserReport[] = [];
  public announcements: SystemAnnouncement[] = [];
  private nextUserId = 15;
  private nextConvId = 3;
  private nextMsgId = 10;
  private nextPlanId = 4;
  private nextPlanMsgId = 7;
  private nextBlockId = 1;
  private nextReportId = 3;
  private nextAnnouncementId = 3;

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
        birthDate: '1998-05-14',
        bio: 'Amante de los gatos, la música indie y el buen café de especialidad.',
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
        isAdmin: true,
        role: 'admin',
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
        bio: 'Escaladora en bloque, fotógrafa de analógicas y compradora compulsiva de plantas.',
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
        bio: 'Arquitecta de interiores. Si nos tomamos un vino acabaremos debatiendo de astrología y Bauhaus.',
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
        bio: 'Gamer de Nintendo Switch, lectora de fantasía sáfica y cocinera de domingo.',
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
        bio: 'Dramaturga y adicta al té matcha. Busco a alguien para ir a obras de teatro alternativo y perdernos por Malasaña.',
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
        bio: 'Veterinaria de fauna. Paso el 80% de mi tiempo libre en el monte con mis dos perras adoptadas.',
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
        bio: 'Tatuadora e ilustradora freelance. Te diseño un flash si me enseñas tus canciones favoritas de bedroom pop.',
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
        bio: 'Psicóloga y runner aficionada. El domingo perfecto: brunch largo, prensa cultural y charlas infinitas.',
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
        bio: 'Chef de repostería vegana. Te horneo unos cinnamon rolls si vienes a ver Studio Ghibli conmigo.',
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
        bio: 'Ingeniera de sonido y coleccionista de sintetizadores analógicos. Fanática de los conciertos íntimos.',
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
        bio: 'Historiadora del arte y librera. Siempre tengo 4 libros empezados a la vez y una taza de café fría.',
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
        bio: 'Entrenadora de fuerza y fan del cine de terror noventero. Dulce por dentro, cañera por fuera.',
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
        bio: 'Ceramista y botánica frustrada. Mi casa es una jungla y mi torno de cerámica mi mejor terapia.',
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
        bio: 'Desarrolladora frontend y organizadora de eventos queer tech. ¿Cerveza artesana y debate de IA?',
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
      },
      {
        id: 99,
        email: 'admin1@gmail.com',
        passwordHash: bcrypt.hashSync('admin1', 10),
        name: 'Administradora Sparks',
        age: 30,
        birthDate: '1996-03-20',
        bio: 'Cuenta de Administradora de la plataforma Sparks.',
        avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=500',
        photos: [
          'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=500'
        ],
        lat: 40.416775,
        lng: -3.703790,
        pronouns: 'Ella / She',
        intention: 'networking',
        tags: ['Admin', 'Seguridad', 'Soporte'],
        isVerified: true,
        verifiedAt: new Date().toISOString(),
        verificationMethod: 'Credencial de Administradora',
        isAdmin: true,
        role: 'admin',
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
        updatedAt: new Date(Date.now() - 1800000)
      },
      {
        id: 2,
        participantIds: [3, 4],
        lastMessage: 'Si estás aquí es para quedar ya, no me hagas perder el tiempo.',
        updatedAt: new Date(Date.now() - 3600000)
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
      },
      {
        id: 3,
        conversationId: 2,
        senderId: 3,
        text: '¡Hola Carmen! Veo que te gusta el cine clásico y la arquitectura',
        type: 'text',
        createdAt: new Date(Date.now() - 7200000),
        isRead: true
      },
      {
        id: 4,
        conversationId: 2,
        senderId: 4,
        text: 'Hola. Mira, no me gusta perder el tiempo chateando aquí, dame tu WhatsApp o tu Instagram privado ahora mismo.',
        type: 'text',
        createdAt: new Date(Date.now() - 5400000),
        isRead: true
      },
      {
        id: 5,
        conversationId: 2,
        senderId: 3,
        text: 'Prefiero charlar un poco por la app antes de dar mi número personal, gracias.',
        type: 'text',
        createdAt: new Date(Date.now() - 4800000),
        isRead: true
      },
      {
        id: 6,
        conversationId: 2,
        senderId: 4,
        text: 'Si estás aquí es para quedar ya, no me hagas perder el tiempo. Eres una estirada.',
        type: 'text',
        createdAt: new Date(Date.now() - 3600000),
        isRead: true
      }
    ];

    this.reports = [
      {
        id: 1,
        reporterId: 3,
        reportedUserId: 4,
        conversationId: 2,
        reason: 'harassment',
        description: 'Me ha exigido mi número personal de forma agresiva y me ha insultado cuando le dije que prefería esperar.',
        status: 'pending',
        actionTaken: 'none',
        createdAt: new Date(Date.now() - 3500000)
      },
      {
        id: 2,
        reporterId: 2,
        reportedUserId: 5,
        reason: 'fake_profile',
        description: 'Usa fotos que parecen de stock y su biografía tiene un enlace extraño de publicidad.',
        status: 'resolved',
        actionTaken: 'banned',
        resolutionNotes: 'Cuenta suspendida definitivamente por bot/spam.',
        resolvedAt: new Date(Date.now() - 86400000),
        resolvedBy: 1,
        createdAt: new Date(Date.now() - 90000000)
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
        locationLat: 40.7300,
        locationLng: -3.8800,
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
        locationLat: 40.4262,
        locationLng: -3.7042,
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
        locationLat: 40.4180,
        locationLng: -3.7010,
        dateTimeText: 'Viernes • 20:00 PM',
        attendeeIds: [4, 2],
        createdAt: new Date(Date.now() - 1800000)
      }
    ];

    this.planMessages = [
      {
        id: 1,
        planId: 1,
        senderId: 2,
        text: '¡Hola a todas! Qué ganas de la ruta del sábado en la montaña',
        createdAt: new Date(Date.now() - 3600000)
      },
      {
        id: 2,
        planId: 1,
        senderId: 4,
        text: '¡Hola! Yo me llevo termo de café y fruta para compartir',
        createdAt: new Date(Date.now() - 3000000)
      },
      {
        id: 3,
        planId: 1,
        senderId: 1,
        text: '¡Genial! ¿Quedamos directamente en el parking de Canto Cochino?',
        createdAt: new Date(Date.now() - 1800000)
      },
      {
        id: 4,
        planId: 2,
        senderId: 1,
        text: '¡Hola! Si llegáis antes, decid que vais a la mesa del fondo con sofás',
        createdAt: new Date(Date.now() - 2500000)
      },
      {
        id: 5,
        planId: 2,
        senderId: 3,
        text: '¡Voy de camino! Llego en 10 minutos con mi libro',
        createdAt: new Date(Date.now() - 1200000)
      },
      {
        id: 6,
        planId: 3,
        senderId: 4,
        text: '¡He reservado mesa para juegos en el bar! Traeré el Dixit y el Exploding Kittens',
        createdAt: new Date(Date.now() - 900000)
      }
    ];

    this.announcements = [
      {
        id: 1,
        title: '¡Bienvenidas al Panel de Sparks!',
        message: 'Espacio seguro y exclusivo para mujeres y personas no binarias sáficas. Respeto, empatía y autenticidad.',
        type: 'info',
        active: true,
        createdAt: new Date(),
        createdBy: 'Admin Ana'
      },
      {
        id: 2,
        title: 'Verificación Biométrica Activa',
        message: 'El sistema de detección gestual y selfie biométrico está operativo para la prevención de perfiles falsos.',
        type: 'celebration',
        active: true,
        createdAt: new Date(),
        createdBy: 'Trust & Safety'
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
      let lastMsgText = text;
      if (type === 'ephemeral_image') {
        lastMsgText = '[Foto temporal]';
      } else if (type === 'icebreaker') {
        lastMsgText = `${text}`;
      }
      conv.lastMessage = lastMsgText;
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

  public getPlanMessages(planId: number): PlanMessage[] {
    return this.planMessages.filter((pm) => pm.planId === planId);
  }

  public addPlanMessage(planId: number, senderId: number, text: string): PlanMessage {
    const newMsg: PlanMessage = {
      id: this.nextPlanMsgId++,
      planId,
      senderId,
      text: text.trim(),
      createdAt: new Date()
    };
    this.planMessages.push(newMsg);
    return newMsg;
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
    const blockedIds = new Set(
      this.blocks
        .filter((b) => b.blockerId === blockerId)
        .map((b) => b.blockedId)
    );
    return this.users.filter((u) => blockedIds.has(u.id));
  }

  public reportUser(
    reporterId: number,
    reportedUserId: number,
    reason: ReportReason,
    description?: string,
    conversationId?: number,
    planId?: number
  ): UserReport {
    // Si no se pasó conversationId, intentamos vincularlo automáticamente
    let autoConvId = conversationId;
    if (!autoConvId) {
      const existingConv = this.conversations.find(
        (c) =>
          c.participantIds.includes(reporterId) &&
          c.participantIds.includes(reportedUserId)
      );
      if (existingConv) {
        autoConvId = existingConv.id;
      }
    }

    const report: UserReport = {
      id: this.nextReportId++,
      reporterId,
      reportedUserId,
      conversationId: autoConvId,
      planId,
      reason,
      description,
      status: 'pending',
      actionTaken: 'none',
      createdAt: new Date()
    };
    this.reports.unshift(report);

    // Auto-bloqueo preventivo al reportar
    this.blockUser(reporterId, reportedUserId);

    return report;
  }

  // ==================== MÉTODOS DE ADMINISTRACIÓN Y MODERACIÓN ====================
  public getReports(status?: string): UserReport[] {
    if (!status || status === 'all') {
      return [...this.reports].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    }
    return this.reports
      .filter((r) => r.status === status)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  public getReportById(reportId: number): UserReport | undefined {
    return this.reports.find((r) => r.id === reportId);
  }

  public resolveReport(
    reportId: number,
    adminId: number,
    action: 'warning' | 'banned' | 'dismissed',
    notes?: string
  ): UserReport | null {
    const report = this.reports.find((r) => r.id === reportId);
    if (!report) return null;

    report.status = action === 'dismissed' ? 'dismissed' : 'resolved';
    report.actionTaken = action;
    report.resolutionNotes = notes || '';
    report.resolvedAt = new Date();
    report.resolvedBy = adminId;

    if (action === 'banned') {
      this.banUser(report.reportedUserId, notes || `Reporte #${report.id}: Infracción de normas`);
    } else if (action === 'warning') {
      const target = this.users.find((u) => u.id === report.reportedUserId);
      if (target) {
        target.warningCount = (target.warningCount || 0) + 1;
      }
    }

    return report;
  }

  public banUser(userId: number, reason?: string): boolean {
    const user = this.users.find((u) => u.id === userId);
    if (!user) return false;
    user.isBanned = true;
    user.bannedReason = reason || 'Infracción grave de las normas de convivencia de Sparks.';
    user.bannedAt = new Date();
    return true;
  }

  public unbanUser(userId: number): boolean {
    const user = this.users.find((u) => u.id === userId);
    if (!user) return false;
    user.isBanned = false;
    user.bannedReason = undefined;
    user.bannedAt = undefined;
    return true;
  }

  public getBannedUsers(): User[] {
    return this.users.filter((u) => u.isBanned);
  }

  public getChatForReport(reportId: number) {
    const report = this.reports.find((r) => r.id === reportId);
    if (!report) return null;

    const reporter = this.users.find((u) => u.id === report.reporterId);
    const reported = this.users.find((u) => u.id === report.reportedUserId);

    // 1. Si hay un conversationId explícito o implícito
    let conv = report.conversationId
      ? this.conversations.find((c) => c.id === report.conversationId)
      : undefined;

    conv ??= this.conversations.find(
      (c) =>
        c.participantIds.includes(report.reporterId) &&
        c.participantIds.includes(report.reportedUserId)
    );

    let chatMessages: any[] = [];
    if (conv) {
      chatMessages = this.messages
        .filter((m) => m.conversationId === conv!.id)
        .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())
        .map((m) => {
          const sender = this.users.find((u) => u.id === m.senderId);
          return {
            id: m.id,
            conversationId: m.conversationId,
            senderId: m.senderId,
            senderName: sender?.name || 'Desconocida',
            senderAvatar: sender?.avatarUrl || '',
            isReporter: m.senderId === report.reporterId,
            isReported: m.senderId === report.reportedUserId,
            text: m.text,
            type: m.type,
            imageUrl: m.imageUrl,
            createdAt: m.createdAt
          };
        });
    }

    // Si es de un plan
    let planData: any = null;
    let planMsgs: any[] = [];
    if (report.planId) {
      const p = this.plans.find((pl) => pl.id === report.planId);
      if (p) {
        planData = {
          id: p.id,
          title: p.title,
          category: p.category,
          locationName: p.locationName,
          dateTimeText: p.dateTimeText
        };
        planMsgs = this.planMessages
          .filter((pm) => pm.planId === p.id)
          .map((pm) => {
            const sender = this.users.find((u) => u.id === pm.senderId);
            return {
              id: pm.id,
              senderId: pm.senderId,
              senderName: sender?.name || 'Participante',
              senderAvatar: sender?.avatarUrl || '',
              isReporter: pm.senderId === report.reporterId,
              isReported: pm.senderId === report.reportedUserId,
              text: pm.text,
              createdAt: pm.createdAt
            };
          });
      }
    }

    return {
      report: {
        id: report.id,
        reason: report.reason,
        description: report.description,
        status: report.status,
        actionTaken: report.actionTaken,
        resolutionNotes: report.resolutionNotes,
        createdAt: report.createdAt
      },
      reporter: reporter
        ? {
            id: reporter.id,
            name: reporter.name,
            email: reporter.email,
            avatarUrl: reporter.avatarUrl,
            age: reporter.age
          }
        : null,
      reportedUser: reported
        ? {
            id: reported.id,
            name: reported.name,
            email: reported.email,
            avatarUrl: reported.avatarUrl,
            age: reported.age,
            isBanned: reported.isBanned || false,
            warningCount: reported.warningCount || 0
          }
        : null,
      conversationId: conv?.id,
      messages: chatMessages,
      plan: planData,
      planMessages: planMsgs,
      hasChatHistory: chatMessages.length > 0 || planMsgs.length > 0
    };
  }

  // ==========================================
  // MÉTODOS DE ADMINISTRACIÓN GENERAL
  // ==========================================

  public getAdminOverview() {
    const totalUsers = this.users.length;
    const verifiedUsers = this.users.filter((u) => u.isVerified).length;
    const bannedUsers = this.users.filter((u) => u.isBanned).length;
    const adminUsers = this.users.filter((u) => u.isAdmin || u.role === 'admin').length;
    const totalMatches = this.matches.filter((m) => m.type === 'like').length;
    const totalConversations = this.conversations.length;
    const totalMessages = this.messages.length;
    const totalPlans = this.plans.length;
    const totalReports = this.reports.length;
    const pendingReports = this.reports.filter((r) => r.status === 'pending').length;
    const resolvedReports = this.reports.filter((r) => r.status === 'resolved').length;
    const dismissedReports = this.reports.filter((r) => r.status === 'dismissed').length;

    // Desglose de intenciones
    const intentionsMap: Record<string, number> = {
      dating: 0,
      friendship: 0,
      plans: 0,
      community: 0
    };
    for (const u of this.users) {
      const intent = u.intention || 'dating';
      intentionsMap[intent] = (intentionsMap[intent] || 0) + 1;
    }

    // Actividad reciente (reportes recientes, planes creados)
    const recentActivity: any[] = [];
    for (const r of this.reports.slice(-6).reverse()) {
      const reporter = this.users.find((u) => u.id === r.reporterId);
      const reported = this.users.find((u) => u.id === r.reportedUserId);
      recentActivity.push({
        id: `rep-${r.id}`,
        type: 'report',
        title: `Reporte: ${r.reason}`,
        desc: `${reporter?.name || 'Usuaria'} reportó a ${reported?.name || 'Usuaria'}`,
        timestamp: r.createdAt,
        status: r.status
      });
    }
    for (const p of this.plans.slice(-4).reverse()) {
      const creator = this.users.find((u) => u.id === p.creatorId);
      recentActivity.push({
        id: `plan-${p.id}`,
        type: 'plan',
        title: `Plan: "${p.title}"`,
        desc: `Creado por ${creator?.name || 'Usuaria'} en ${p.locationName}`,
        timestamp: p.createdAt,
        category: p.category
      });
    }

    recentActivity.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    return {
      kpis: {
        totalUsers,
        verifiedUsers,
        verifiedPercentage: totalUsers > 0 ? Math.round((verifiedUsers / totalUsers) * 100) : 0,
        bannedUsers,
        adminUsers,
        totalMatches,
        totalConversations,
        totalMessages,
        totalPlans,
        totalReports,
        pendingReports,
        resolvedReports,
        dismissedReports
      },
      intentions: intentionsMap,
      recentActivity: recentActivity.slice(0, 8)
    };
  }

  public getAllUsers(query?: string, filter?: string) {
    let result = [...this.users];

    if (filter) {
      if (filter === 'verified') result = result.filter((u) => u.isVerified);
      else if (filter === 'pending_verification') result = result.filter((u) => !u.isVerified && !u.isBanned);
      else if (filter === 'banned') result = result.filter((u) => u.isBanned);
      else if (filter === 'admin') result = result.filter((u) => u.isAdmin || u.role === 'admin');
      else if (filter === 'ghost') result = result.filter((u) => u.ghostMode);
    }

    if (query && query.trim()) {
      const q = query.toLowerCase().trim();
      result = result.filter(
        (u) =>
          u.name.toLowerCase().includes(q) ||
          u.email.toLowerCase().includes(q) ||
          (u.bio && u.bio.toLowerCase().includes(q)) ||
          (u.pronouns && u.pronouns.toLowerCase().includes(q))
      );
    }

    return result.map((u) => ({
      id: u.id,
      email: u.email,
      name: u.name,
      age: u.age,
      birthDate: u.birthDate,
      bio: u.bio,
      avatarUrl: u.avatarUrl,
      photos: u.photos || [],
      pronouns: u.pronouns,
      intention: u.intention,
      tags: u.tags || [],
      isVerified: u.isVerified || false,
      verifiedAt: u.verifiedAt,
      verificationMethod: u.verificationMethod,
      isAdmin: u.isAdmin || false,
      role: u.role || 'user',
      isBanned: u.isBanned || false,
      bannedReason: u.bannedReason,
      bannedAt: u.bannedAt,
      warningCount: u.warningCount || 0,
      ghostMode: u.ghostMode || false,
      approxDistanceOnly: u.approxDistanceOnly || false,
      createdAt: u.createdAt,
      totalLikesReceived: this.matches.filter((m) => m.toUserId === u.id && m.type === 'like').length,
      reportsReceived: this.reports.filter((r) => r.reportedUserId === u.id).length
    }));
  }

  public getUserAdminDetails(id: number) {
    const u = this.users.find((user) => user.id === id);
    if (!u) return null;

    const reportsAgainst = this.reports.filter((r) => r.reportedUserId === id);
    const reportsMade = this.reports.filter((r) => r.reporterId === id);
    const plansCreated = this.plans.filter((p) => p.creatorId === id);

    return {
      user: {
        id: u.id,
        email: u.email,
        name: u.name,
        age: u.age,
        birthDate: u.birthDate,
        bio: u.bio,
        avatarUrl: u.avatarUrl,
        photos: u.photos || [],
        pronouns: u.pronouns,
        intention: u.intention,
        tags: u.tags || [],
        anthem: u.anthem,
        spotify: u.spotify,
        isVerified: u.isVerified || false,
        verifiedAt: u.verifiedAt,
        verificationMethod: u.verificationMethod,
        isAdmin: u.isAdmin || false,
        role: u.role || 'user',
        isBanned: u.isBanned || false,
        bannedReason: u.bannedReason,
        bannedAt: u.bannedAt,
        warningCount: u.warningCount || 0,
        ghostMode: u.ghostMode || false,
        approxDistanceOnly: u.approxDistanceOnly || false,
        createdAt: u.createdAt
      },
      stats: {
        totalLikesReceived: this.matches.filter((m) => m.toUserId === u.id && m.type === 'like').length,
        totalLikesGiven: this.matches.filter((m) => m.fromUserId === u.id && m.type === 'like').length,
        reportsAgainstCount: reportsAgainst.length,
        reportsMadeCount: reportsMade.length,
        plansCreatedCount: plansCreated.length
      },
      reportsAgainst: reportsAgainst.map((r) => ({
        id: r.id,
        reason: r.reason,
        description: r.description,
        status: r.status,
        actionTaken: r.actionTaken,
        createdAt: r.createdAt
      })),
      plansCreated: plansCreated.map((p) => ({
        id: p.id,
        title: p.title,
        category: p.category,
        locationName: p.locationName,
        dateTimeText: p.dateTimeText,
        attendeeCount: (p.attendeeIds || []).length,
        createdAt: p.createdAt
      }))
    };
  }

  public setUserRole(id: number, role: string, isAdmin: boolean): boolean {
    const user = this.users.find((u) => u.id === id);
    if (!user) return false;
    user.role = role;
    user.isAdmin = isAdmin;
    return true;
  }

  public setUserVerification(id: number, isVerified: boolean, method = 'manual_admin'): boolean {
    const user = this.users.find((u) => u.id === id);
    if (!user) return false;
    user.isVerified = isVerified;
    if (isVerified) {
      user.verifiedAt = new Date().toISOString();
      user.verificationMethod = method;
    } else {
      user.verifiedAt = undefined;
      user.verificationMethod = undefined;
    }
    return true;
  }

  public warnUser(id: number, reason: string): number | null {
    const user = this.users.find((u) => u.id === id);
    if (!user) return null;
    user.warningCount = (user.warningCount || 0) + 1;
    return user.warningCount;
  }

  public deleteUserByAdmin(id: number): boolean {
    const index = this.users.findIndex((u) => u.id === id);
    if (index === -1) return false;
    this.users.splice(index, 1);
    // Limpiar relaciones
    this.matches = this.matches.filter((m) => m.fromUserId !== id && m.toUserId !== id);
    this.conversations = this.conversations.filter((c) => !c.participantIds.includes(id));
    this.plans = this.plans.filter((p) => p.creatorId !== id);
    return true;
  }

  public getAllPlans() {
    return this.plans.map((p) => {
      const creator = this.users.find((u) => u.id === p.creatorId);
      const attendees = (p.attendeeIds || []).map((attId) => {
        const attUser = this.users.find((u) => u.id === attId);
        return {
          id: attId,
          name: attUser?.name || 'Usuaria',
          avatarUrl: attUser?.avatarUrl || ''
        };
      });

      return {
        id: p.id,
        creatorId: p.creatorId,
        creatorName: creator?.name || 'Usuaria',
        creatorEmail: creator?.email || '',
        creatorAvatar: creator?.avatarUrl || '',
        title: p.title,
        category: p.category,
        description: p.description,
        locationName: p.locationName,
        dateTimeText: p.dateTimeText,
        attendeeCount: (p.attendeeIds || []).length,
        attendees,
        createdAt: p.createdAt
      };
    });
  }

  public deletePlanByAdmin(id: number): boolean {
    const index = this.plans.findIndex((p) => p.id === id);
    if (index === -1) return false;
    this.plans.splice(index, 1);
    this.planMessages = this.planMessages.filter((pm) => pm.planId !== id);
    return true;
  }

  public getAnnouncements() {
    return this.announcements.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  public createAnnouncement(
    title: string,
    message: string,
    type: 'info' | 'warning' | 'celebration' | 'maintenance' = 'info',
    createdBy = 'Administradora'
  ): SystemAnnouncement {
    const announcement: SystemAnnouncement = {
      id: this.nextAnnouncementId++,
      title,
      message,
      type,
      active: true,
      createdAt: new Date(),
      createdBy
    };
    this.announcements.unshift(announcement);
    return announcement;
  }

  public deleteAnnouncement(id: number): boolean {
    const index = this.announcements.findIndex((a) => a.id === id);
    if (index === -1) return false;
    this.announcements.splice(index, 1);
    return true;
  }
}

export const memoryStore = new MemoryStore();

