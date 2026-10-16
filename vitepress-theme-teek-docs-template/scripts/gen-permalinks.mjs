/**
 * 永久链接（permalink）静态化脚本
 *
 * Teek 默认的 permalink 由 vitepress-plugin-permalink 的 Proxy 方式实现，
 * 仅在 dev 环境通过中间件拦截请求，构建产物里仍是原文件路径（如 @pages/categoriesPage.html）。
 * 在 GitHub Pages 这类纯静态服务器上，访问 /categories.html 会因为找不到文件而 404。
 *
 * 因此构建完成后，把同名的 HTML 产物复制一份到 permalink 路径，使永久链接可以直接访问。
 */
import { copyFileSync, existsSync, mkdirSync, readdirSync, readFileSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const docsDir = join(projectRoot, "docs");
const distDir = join(docsDir, ".vitepress", "dist");

/** 递归读取目录下所有文件 */
const walk = (dir) =>
  readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = join(dir, entry.name);
    return entry.isDirectory() ? walk(full) : [full];
  });

/** 读取 Markdown frontmatter 中的 permalink */
const readPermalink = (file) => {
  const frontmatter = /^---\r?\n[\s\S]*?\r?\n---/.exec(readFileSync(file, "utf8"));
  if (!frontmatter) return "";
  const match = /^permalink:\s*["']?([^"'\s]+)["']?\s*$/m.exec(frontmatter[0]);
  return match ? match[1] : "";
};

/** 由 permalink 推导产物文件路径（本项目 cleanUrls 为 false，因此补 .html 后缀） */
const toTargetFile = (permalink) => {
  const path = permalink.replace(/^\//, "");
  if (path.endsWith(".html")) return path;
  if (path.endsWith("/")) return `${path}index.html`;
  return `${path}.html`;
};

let copied = 0;
const skipped = [];

for (const file of walk(docsDir)) {
  if (!file.endsWith(".md")) continue;
  const permalink = readPermalink(file);
  if (!permalink) continue;

  // 源产物：与 Markdown 相对路径同名的 HTML 文件
  const source = join(distDir, relative(docsDir, file).replace(/\.md$/, ".html"));
  const target = join(distDir, toTargetFile(permalink));

  if (!existsSync(source)) {
    skipped.push(relative(projectRoot, source));
    continue;
  }

  mkdirSync(dirname(target), { recursive: true });
  copyFileSync(source, target);
  copied++;
}

console.log(`[permalink] 已生成永久链接产物 ${copied} 个`);
if (skipped.length) console.log(`[permalink] 跳过 ${skipped.length} 个（缺少构建产物）：\n${skipped.join("\n")}`);
