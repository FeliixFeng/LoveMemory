import dynamic from 'next/dynamic';
import { PageWrapper } from '../../../components/PageWrapper';

const SettingsPage = dynamic(() => import('../../../components/SettingsPage').then(m => m.SettingsPage), {
  loading: () => <div className="space-y-4"><div className="h-10 bg-[#efd8c3]/20 rounded-xl animate-pulse" /><div className="h-40 bg-[#efd8c3]/20 rounded-2xl animate-pulse" /></div>
});

export default function More() {
  return (
    <PageWrapper>
      <SettingsPage />
    </PageWrapper>
  );
}
