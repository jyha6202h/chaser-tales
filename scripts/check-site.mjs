#!/usr/bin/env node
// 정적 사이트 배포 전 검사. 사용법: node check-site.mjs <site-dir>
// 외부 패키지 없음. 차단 이슈가 있으면 종료 코드 1.
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(process.argv[2] || 'site');
if (!fs.existsSync(root)) {
  console.error(`[차단] 사이트 폴더가 없습니다: ${root}`);
  process.exit(1);
}

const issues = [];
const add = (level, file, line, msg) => issues.push({ level, file, line, msg });
const rel = (p) => path.relative(root, p).split(path.sep).join('/');

function walk(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const p = path.join(dir, e.name);
    return e.isDirectory() ? walk(p) : [p];
  });
}
const files = walk(root);

const lineOf = (text, idx) => text.slice(0, idx).split('\n').length;
const isExternal = (u) => /^(https?:|mailto:|tel:|data:|javascript:|\/\/)/i.test(u);
// 배포 단계(.github/workflows/deploy.yml)에서 site/ 밖의 원본으로 만들어 넣는 파일.
// site/ 안에는 없지만 배포 후에는 존재하므로 링크해도 된다.
const DEPLOY_EXTRA = new Set(['privacy-policy.html', 'privacy-policy']);

// 1. 파일명 규칙 + 크기
for (const f of files) {
  const r = rel(f);
  const base = path.basename(f);
  if (/[A-Z\s]|[^\x00-\x7F]/.test(r) && base !== 'README.md') {
    add('중요', r, 0, '파일 경로에 대문자·공백·비ASCII 문자가 있음 (호스팅에서 깨질 수 있음)');
  }
  const size = fs.statSync(f).size;
  if (/\.(png|jpe?g|gif|webp|avif)$/i.test(f) && size > 500 * 1024) {
    add('중요', r, 0, `이미지가 ${(size / 1024).toFixed(0)}KB — 500KB 이하로 압축 권장 (webp)`);
  }
  if (size > 5 * 1024 * 1024) add('중요', r, 0, `파일이 ${(size / 1048576).toFixed(1)}MB — 너무 큼`);
}

// 2. 필수 파일
if (!fs.existsSync(path.join(root, 'index.html'))) add('차단', 'index.html', 0, 'index.html 없음');
if (!fs.existsSync(path.join(root, '404.html'))) add('사소', '404.html', 0, '404.html 없음');
if (!fs.existsSync(path.join(root, '.nojekyll'))) add('사소', '.nojekyll', 0, '.nojekyll 없음 (GitHub Pages용)');

// 3. 참조 검사
function checkRef(file, text, url, idx) {
  const r = rel(file);
  const line = lineOf(text, idx);
  url = url.trim();
  if (!url || isExternal(url) || url.startsWith('{')) return;
  if (url === '#') {
    add('중요', r, line, 'href="#" — 실제 링크 또는 data-todo 필요');
    return;
  }
  if (url.startsWith('#')) {
    if (file.endsWith('.html') && !new RegExp(`id=["']${url.slice(1)}["']`).test(text)) {
      add('중요', r, line, `페이지 내 앵커 대상 없음: ${url}`);
    }
    return;
  }
  if (url.startsWith('/')) {
    add('차단', r, line, `루트 절대 경로 "${url}" — GitHub Pages 프로젝트 사이트에서 깨짐, 상대 경로로`);
    return;
  }
  const clean = decodeURIComponent(url.split(/[?#]/)[0]);
  if (DEPLOY_EXTRA.has(path.relative(root, path.resolve(path.dirname(file), clean)).split(path.sep).join('/'))) return;
  let target = path.resolve(path.dirname(file), clean);
  if (clean.endsWith('/')) target = path.join(target, 'index.html');
  if (!fs.existsSync(target)) add('차단', r, line, `없는 파일 참조: ${url}`);
}

for (const f of files) {
  const r = rel(f);
  if (f.endsWith('.html')) {
    const t = fs.readFileSync(f, 'utf8');
    for (const m of t.matchAll(/\b(?:href|src|poster)\s*=\s*["']([^"']*)["']/gi)) checkRef(f, t, m[1], m.index);
    for (const m of t.matchAll(/\bsrcset\s*=\s*["']([^"']*)["']/gi))
      for (const part of m[1].split(',')) checkRef(f, t, part.trim().split(/\s+/)[0], m.index);
    for (const m of t.matchAll(/url\(\s*["']?([^"')]+)["']?\s*\)/gi)) checkRef(f, t, m[1], m.index);

    if (!/<html[^>]*\blang=/i.test(t)) add('중요', r, 1, '<html lang> 없음');
    if (!/name=["']viewport["']/i.test(t)) add('차단', r, 1, 'viewport 메타 없음 (모바일 깨짐)');
    if (!/<title>[^<]+<\/title>/i.test(t)) add('중요', r, 1, '<title> 없음');
    if (r === 'index.html') {
      if (!/name=["']description["']/i.test(t)) add('중요', r, 1, 'meta description 없음');
      if (!/property=["']og:image["']/i.test(t)) add('사소', r, 1, 'og:image 없음 (SNS 공유 미리보기)');
    }
    for (const m of t.matchAll(/<img\b[^>]*>/gi)) {
      if (!/\balt\s*=/i.test(m[0])) add('중요', r, lineOf(t, m.index), 'alt 없는 <img>');
    }
    for (const m of t.matchAll(/\[TODO[^\]]*\]/g)) add('중요', r, lineOf(t, m.index), `화면에 TODO 노출: ${m[0]}`);
  } else if (f.endsWith('.css')) {
    const t = fs.readFileSync(f, 'utf8');
    for (const m of t.matchAll(/url\(\s*["']?([^"')]+)["']?\s*\)/gi)) checkRef(f, t, m[1], m.index);
  }
}

// 출력
const order = { 차단: 0, 중요: 1, 사소: 2 };
issues.sort((a, b) => order[a.level] - order[b.level]);
const counts = { 차단: 0, 중요: 0, 사소: 0 };
for (const i of issues) {
  counts[i.level]++;
  console.log(`[${i.level}] ${i.file}${i.line ? ':' + i.line : ''} — ${i.msg}`);
}
console.log(`\n검사 파일 ${files.length}개 | 차단 ${counts.차단} · 중요 ${counts.중요} · 사소 ${counts.사소}`);
process.exit(counts.차단 > 0 ? 1 : 0);
