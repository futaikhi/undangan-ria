export interface Guest {
  id: number;
  code: string;
  name: string;
  category: string;
  whatsapp: string;
  status: 'hadir' | 'tidak_hadir' | 'belum_respon';
  guest_count: number;
  opened_count: number;
  last_opened_at: string | null;
  status_active: number; // 1 for active, 0 for disabled
}

export interface Comment {
  id: number;
  guest_id?: number;
  name: string;
  comment: string;
  is_approved?: number;
  created_at: string;
  code?: string;
}

export interface BrideGroom {
  nickname: string;
  fullname: string;
  father: string;
  mother: string;
  photo: string;
  instagram: string;
}

export interface Quote {
  text: string;
  translation: string;
  source: string;
}

export interface EventDetails {
  title: string;
  date: string;
  isoDate: string;
  time: string;
  location: string;
  address: string;
  mapsUrl: string;
}

export interface Events {
  akad: EventDetails;
  resepsi: EventDetails;
}

export interface StoryItem {
  id: number;
  year: string;
  title: string;
  content: string;
}

export interface GiftItem {
  provider: string;
  accountNumber: string;
  holder: string;
  icon: string;
}

export interface GalleryItem {
  id: string;
  url: string;
  caption: string;
}

export interface Content {
  bride: BrideGroom;
  groom: BrideGroom;
  quote: Quote;
  events: Events;
  story: StoryItem[];
  gifts: GiftItem[];
  gallery: GalleryItem[];
}

export interface ThemeColors {
  primaryColor: string;
  accentColor: string;
  backgroundColor: string;
  darkColor: string;
}

export interface GeneralOptions {
  enableCommentsApproval: boolean;
  enableMusicAutoplay: boolean;
  whatsappGreetingTemplate: string;
}

export interface Settings {
  musicUrl: string;
  youtubeLiveUrl: string;
  theme: ThemeColors;
  generalOptions: GeneralOptions;
}

export interface AuditLog {
  timestamp: string;
  action: string;
  details: string;
}

export interface AdminStats {
  totalInvited: number;
  openedCount: number;
  countHadir: number;
  totalHadirTamu: number;
  countTidakHadir: number;
  countBelumRespon: number;
  totalComments: number;
  auditLogs: AuditLog[];
}
