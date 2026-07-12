import dynamic from 'next/dynamic';
import { PageWrapper } from '../../../components/PageWrapper';

const WishesCapsulesPage = dynamic(() => import('../../../components/WishesCapsulesPage').then(m => m.WishesCapsulesPage), {
  loading: () => <div className="grid grid-cols-2 gap-3"><div className="h-40 bg-[#efd8c3]/20 rounded-2xl animate-pulse" /><div className="h-40 bg-[#efd8c3]/20 rounded-2xl animate-pulse" /></div>
});

export default function Capsule() {
  return (
    <PageWrapper>
      <WishesCapsulesPage />
    </PageWrapper>
  );
}
