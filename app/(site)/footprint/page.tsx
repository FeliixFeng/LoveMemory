import dynamic from 'next/dynamic';
import { PageWrapper } from '../../../components/PageWrapper';

const MapPage = dynamic(() => import('../../../components/MapPage').then(m => m.MapPage), {
  loading: () => <div className="space-y-4"><div className="h-64 bg-[#efd8c3]/20 rounded-2xl animate-pulse" /><div className="h-32 bg-[#efd8c3]/20 rounded-2xl animate-pulse" /></div>
});

export default function Footprint() {
  return (
    <PageWrapper>
      <MapPage />
    </PageWrapper>
  );
}
