import dynamic from 'next/dynamic';
import { PageWrapper } from '../../../components/PageWrapper';

const WishesPage = dynamic(() => import('../../../components/WishesPage').then(m => m.WishesPage), {
  loading: () => <div className="space-y-3"><div className="h-24 bg-[#efd8c3]/20 rounded-2xl animate-pulse" /><div className="h-24 bg-[#efd8c3]/20 rounded-2xl animate-pulse" /></div>
});

export default function Wishes() {
  return (
    <PageWrapper>
      <WishesPage />
    </PageWrapper>
  );
}
