export type Milestone = {
  id: number | string;
  date: string;
  title: string;
  desc: string;
  icon: string;
};

export type Photo = {
  url: string;
  displayUrl?: string;
  thumbUrl?: string;
  filename?: string;
  mimeType?: string;
  size?: number;
  uploadedAt: string;
};

export type LoveQuote = {
  id: number;
  content: string;
};

export type AppData = {
  startDate: string;
  heroImage: string;
  milestones: Milestone[];
  photos: Photo[];
  loveQuotes: LoveQuote[];
};
