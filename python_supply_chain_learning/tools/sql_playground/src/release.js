export function releaseInfo(env = {}) {
  const production = env.VITE_RELEASE_CHANNEL === 'production';
  return {
    label: `${production ? '正式版' : '預覽'} ${env.VITE_RELEASE_ID || '2026.09.07'}`,
    home: production ? 'https://supply-sql-lab-a8594755.netlify.app/' : 'https://learning-preview--supply-sql-lab-a8594755.netlify.app/',
    homeLabel: production ? '正式網站' : '固定預覽入口',
    notice: production ? '目前使用正式網站' : '預覽不會更新正式站',
  };
}
const release = releaseInfo(import.meta.env);
export const releaseLabel = release.label;
export const previewHome = release.home;
export const releaseHomeLabel = release.homeLabel;
export const releaseNotice = release.notice;
