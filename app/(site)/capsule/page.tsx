import dynamic from 'next/dynamic';
import { PageWrapper } from '../../../components/PageWrapper';

const CapsulePage = dynamic(() => import('../../../components/CapsulePage').then(m => m.CapsulePage), {
  loading: () => <div className="grid grid-cols-2 gap-3"><div className="h-40 bg-[#efd8c3]/20 rounded-2xl animate-pulse" /><div className="h-40 bg-[#efd8c3]/20 rounded-2xl animate-pulse" /></div>
});

export default function Capsule() {
  return (
    <PageWrapper>
      <CapsulePage />
    </PageWrapper>
  );
}
