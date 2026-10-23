export type Event = {
  id: number | string;
  title: string;
  date: string;
  desc: string;
  icon: string;
  location: string;
  mood: string;
  coverPhoto: string;
  sortOrder?: number;
  /* 来源：这条回忆由一个愿望完成、或一封胶囊开启产生 */
  wishId?: number | null;
  capsuleId?: number | null;
};

export type Photo = {
  url: string;
  displayUrl?: string;
  thumbUrl?: string;
  filename?: string;
  mimeType?: string;
  size?: number;
  uploadedAt: string;
  eventId?: string | null;
};

export type Expense = {
  id: number;
  eventId: string;
  amount: number;
  category: string;
  note: string;
};

export type LoveQuote = {
  id: number;
  content: string;
};

export type Countdown = {
  id: number;
  label: string;
  date: string;
  emoji: string;
};

export type Wish = {
  id: number;
  title: string;
  description: string;
  emoji: string;
  isCompleted: boolean;
  completedAt: string | null;
  sortOrder: number;
};

export type Capsule = {
  id: number;
  title: string;
  content: string;
  emoji: string;
  unlockDate: string;
  isOpened: boolean;
  /* 服务端按解锁日判定：未解锁时 content 为空串，locked 为 true */
  locked?: boolean;
};

export type AppData = {
  startDate: string;
  heroImage: string;
  customCovers: string[];
  hiddenDefaultCovers: string[];
  events: Event[];
  photos: Photo[];
  expenses: Expense[];
  loveQuotes: LoveQuote[];
  countdowns: Countdown[];
  wishes: Wish[];
  capsules: Capsule[];
};
