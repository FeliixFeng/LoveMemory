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

export type AppData = {
  startDate: string;
  heroImage: string;
  events: Event[];
  photos: Photo[];
  expenses: Expense[];
  loveQuotes: LoveQuote[];
};

export type Milestone = Event;
