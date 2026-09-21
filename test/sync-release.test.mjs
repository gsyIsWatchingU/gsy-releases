import assert from 'node:assert/strict';
import test from 'node:test';
import { buildManifest, parseStableTag } from '../scripts/sync-release.mjs';

const product = {
  id: 'tool-desk',
  name: 'Tool Desk',
  tagPrefix: 'tool-desk-v',
  requiredAssets: {
    installer: '^tool-desk-[0-9]+\\.[0-9]+\\.[0-9]+-setup-x64\\.exe$',
    portable: '^tool-desk-[0-9]+\\.[0-9]+\\.[0-9]+-portable-x64\\.exe$',
    metadata: '^latest\\.yml$',
    blockmap: '^tool-desk-[0-9]+\\.[0-9]+\\.[0-9]+-setup-x64\\.exe\\.blockmap$'
  }
};

function asset(name) {
  return {
    name,
    size: 123,
    digest: 'sha256:abc',
    browser_download_url: `https://example.invalid/${name}`
  };
}

test('解析带产品命名空间的稳定版标签', () => {
  assert.deepEqual(parseStableTag('tool-desk-v0.3.1'), { product: 'tool-desk', version: '0.3.1' });
  assert.throws(() => parseStableTag('v0.3.1'));
});

test('生成产品级 latest 清单并校验必需资产', () => {
  const manifest = buildManifest({
    tag_name: 'tool-desk-v0.3.1',
    draft: false,
    prerelease: false,
    html_url: 'https://github.com/gsyIsWatchingU/gsy-releases/releases/tag/tool-desk-v0.3.1',
    published_at: '2026-09-21T00:00:00Z',
    assets: [
      asset('tool-desk-0.3.1-setup-x64.exe'),
      asset('tool-desk-0.3.1-portable-x64.exe'),
      asset('tool-desk-0.3.1-setup-x64.exe.blockmap'),
      asset('latest.yml')
    ]
  }, product);

  assert.equal(manifest.version, '0.3.1');
  assert.equal(manifest.feedUrl, 'https://github.com/gsyIsWatchingU/gsy-releases/releases/download/tool-desk-v0.3.1/');
  assert.equal(manifest.assets.installer.name, 'tool-desk-0.3.1-setup-x64.exe');
});

test('缺少或重复必需资产时拒绝生成索引', () => {
  const release = {
    tag_name: 'tool-desk-v0.3.1',
    draft: false,
    prerelease: false,
    assets: []
  };
  assert.throws(() => buildManifest(release, product), /installer/);
});
