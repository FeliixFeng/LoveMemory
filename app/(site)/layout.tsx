import { SiteLayoutClient } from '../../components/SiteLayoutClient';
import { readAppData } from '../lib/app-data.ts';

export const dynamic = 'force-dynamic';

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const data = await readAppData();
  return (
    <SiteLayoutClient initialData={data}>
      {children}
    </SiteLayoutClient>
  );
}
