import { PageWrapper } from '../../../components/PageWrapper';

export default function AlbumPage() {
  return (
    <PageWrapper>
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center space-y-2">
          <span className="text-4xl">📷</span>
          <h1 className="text-lg font-bold text-[#3d281c]" style={{ fontFamily: 'Noto Serif SC, serif' }}>相册</h1>
          <p className="text-sm text-[#5c3d2a]/50">按事件整理的美好瞬间</p>
        </div>
      </div>
    </PageWrapper>
  );
}
