import test from 'node:test';
import assert from 'node:assert/strict';
import { releaseInfo } from '../src/release.js';

test('production release points to the live site and never labels it preview', () => {
  const info = releaseInfo({ VITE_RELEASE_CHANNEL: 'production', VITE_RELEASE_ID: 'test-build' });
  assert.equal(info.label, '正式版 test-build');
  assert.equal(info.home, 'https://supply-sql-lab-a8594755.netlify.app/');
  assert.equal(info.homeLabel, '正式網站');
  assert.doesNotMatch(info.notice, /預覽/);
});
test('unset or preview release channel retains the preview-first default', () => {
  for (const env of [{}, { VITE_RELEASE_CHANNEL: 'deploy-preview' }]) {
    const info = releaseInfo(env);
    assert.match(info.label, /^預覽 /);
    assert.match(info.home, /learning-preview--/);
    assert.equal(info.notice, '預覽不會更新正式站');
  }
});
