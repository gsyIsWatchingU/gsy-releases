import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const REPOSITORY = 'gsyIsWatchingU/gsy-releases';
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

export function parseStableTag(tagName) {
  const match = String(tagName || '').match(/^([a-z0-9]+(?:-[a-z0-9]+)*)-v(\d+\.\d+\.\d+)$/);
  if (!match) throw new Error(`标签不符合 <product>-v<semver>：${tagName}`);
  return { product: match[1], version: match[2] };
}

function matchedAsset(assets, pattern, role) {
  const expression = new RegExp(pattern);
  const matches = assets.filter((asset) => expression.test(asset.name));
  if (matches.length !== 1) {
    throw new Error(`${role} 资产数量应为 1，实际为 ${matches.length}`);
  }
  const asset = matches[0];
  return {
    name: asset.name,
    url: asset.browser_download_url,
    size: Number(asset.size || 0),
    digest: asset.digest || null
  };
}

export function buildManifest(release, productConfig) {
  if (!release || release.draft || release.prerelease) throw new Error('只接受已发布的稳定 Release');
  const { product, version } = parseStableTag(release.tag_name);
  if (product !== productConfig.id) throw new Error('标签产品 ID 与产品配置不一致');
  if (release.tag_name !== `${productConfig.tagPrefix}${version}`) throw new Error('标签前缀与产品配置不一致');

  const assets = Array.isArray(release.assets) ? release.assets : [];
  const resolvedAssets = {};
  for (const [role, pattern] of Object.entries(productConfig.requiredAssets || {})) {
    resolvedAssets[role] = matchedAsset(assets, pattern, role);
  }

  return {
    schema: 1,
    product,
    name: productConfig.name,
    channel: 'stable',
    version,
    tag: release.tag_name,
    releaseUrl: release.html_url,
    feedUrl: `https://github.com/${REPOSITORY}/releases/download/${release.tag_name}/`,
    publishedAt: release.published_at,
    assets: resolvedAssets
  };
}

export function syncRelease(event, root = ROOT) {
  const release = event?.release;
  const { product } = parseStableTag(release?.tag_name);
  const productDirectory = path.join(root, 'products', product);
  const configPath = path.join(productDirectory, 'product.json');
  if (!fs.existsSync(configPath)) throw new Error(`未登记产品：${product}`);

  const productConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  const manifest = buildManifest(release, productConfig);
  fs.writeFileSync(path.join(productDirectory, 'latest.json'), `${JSON.stringify(manifest, null, 2)}\n`);
  return manifest;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const eventPath = process.argv[2] || process.env.GITHUB_EVENT_PATH;
  if (!eventPath) throw new Error('缺少 Release 事件文件路径');
  const event = JSON.parse(fs.readFileSync(eventPath, 'utf8'));
  const manifest = syncRelease(event);
  process.stdout.write(`${manifest.product} v${manifest.version}\n`);
}
