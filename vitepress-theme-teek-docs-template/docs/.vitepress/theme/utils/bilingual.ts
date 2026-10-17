/**
 * 中英对照（逐句内嵌）运行时增强
 *
 * 文章 md 中的 <div class="tk-trans"> 仅作为「译文数据载体」放在每个英文段落后（默认隐藏）。
 * 页面挂载后由本模块把英文段落按句切分、与译文逐句配对，重写为：
 *   <p class="tk-bi">
 *     <span class="tk-sent"><span class="tk-sent-en">English.</span><span class="tk-sent-zh">中文。</span></span>
 *     ...
 *   </p>
 * 并移除载体块。英文原文不做任何改动（仅在运行时按句包裹）。
 *
 * 显示模式由 html[data-bi-mode] 控制：en 仅英文 / bi 中英对照 / zh 仅中文。
 */

export const BI_MODE_ATTR = "data-bi-mode";
export const BI_STORAGE_KEY = "tk-bi-mode";
export const BI_MODES = ["en", "bi", "zh"] as const;
export type BiMode = (typeof BI_MODES)[number];
/** 默认「仅英文」，即译文默认隐藏 */
export const BI_DEFAULT_MODE: BiMode = "en";

export const BI_MODE_OPTIONS: { value: BiMode; label: string; hint: string }[] = [
  { value: "en", label: "仅英文", hint: "只显示英文原文" },
  { value: "bi", label: "中英对照", hint: "逐句中英对照阅读" },
  { value: "zh", label: "仅中文", hint: "只显示中文译文" },
];

export function readBiMode(): BiMode {
  try {
    const saved = localStorage.getItem(BI_STORAGE_KEY);
    if (saved && (BI_MODES as readonly string[]).includes(saved)) return saved as BiMode;
  } catch {
    /* localStorage 不可用时忽略 */
  }
  return BI_DEFAULT_MODE;
}

export function applyBiMode(mode: BiMode): void {
  if (typeof document === "undefined") return;
  document.documentElement.setAttribute(BI_MODE_ATTR, mode);
  try {
    localStorage.setItem(BI_STORAGE_KEY, mode);
  } catch {
    /* 忽略写入失败 */
  }
}

/** 省略号占位符，避免被句末标点切分 */
const ELLIPSIS = "\u0001";
const SENTENCE_RE = /[^.!?]+[.!?]+["'”’)]*\s*/g;

/** 按句切分英文（与译文逐句顺序保持一致） */
export function splitEnglishSentences(text: string): string[] {
  const trimmed = text.trim();
  if (!trimmed) return [];
  const guarded = trimmed.replace(/\.\.\.|…/g, ELLIPSIS);
  const matches = guarded.match(SENTENCE_RE);
  if (!matches) return [trimmed];
  const sentences = matches
    .map((s) => s.split(ELLIPSIS).join("...").trim())
    .filter(Boolean);
  if (!sentences.length) return [trimmed];
  // 若正则未能覆盖全部文本（例如结尾无标点），把剩余部分并入最后一句
  const consumed = sentences.join("").replace(/\s+/g, "");
  const whole = guarded.split(ELLIPSIS).join("...").replace(/\s+/g, "");
  if (consumed.length < whole.length && sentences.length) {
    const tail = whole.slice(consumed.length);
    if (tail) sentences[sentences.length - 1] += tail;
  }
  return sentences;
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (ch) => {
    switch (ch) {
      case "&":
        return "&amp;";
      case "<":
        return "&lt;";
      case ">":
        return "&gt;";
      case '"':
        return "&quot;";
      default:
        return "&#39;";
    }
  });
}

/**
 * 扫描页面中的译文载体块并完成逐句内嵌改造。
 * 幂等：已处理的段落通过 data-bi-done 标记跳过，可重复调用。
 * @returns 本次处理的段落数
 */
export function enhanceBilingual(): number {
  if (typeof document === "undefined") return 0;
  let count = 0;

  document.querySelectorAll<HTMLElement>(".tk-trans").forEach((carrier) => {
    const prev = carrier.previousElementSibling as HTMLElement | null;
    if (!prev || prev.tagName !== "P" || prev.dataset.biDone === "1") return;

    const paragraph = prev as HTMLParagraphElement;
    const english = (paragraph.textContent || "").trim();
    const zhLines = Array.from(carrier.querySelectorAll("p"))
      .map((el) => (el.textContent || "").trim())
      .filter(Boolean);
    if (!english || !zhLines.length) return;

    const enSentences = splitEnglishSentences(english);
    let html: string;

    if (enSentences.length === zhLines.length) {
      html = enSentences
        .map(
          (sentence, i) =>
            `<span class="tk-sent"><span class="tk-sent-en">${escapeHtml(
              sentence
            )}</span><span class="tk-sent-zh">${escapeHtml(zhLines[i])}</span></span>`
        )
        .join("");
    } else {
      // 句数无法一一对应时降级为「整段英文 + 逐句中文」，避免错位
      html = `<span class="tk-sent-en">${escapeHtml(english)}</span>${zhLines
        .map((line) => `<span class="tk-sent-zh">${escapeHtml(line)}</span>`)
        .join("")}`;
      if (import.meta.env.DEV) {
        console.warn(
          "[bilingual] 句数不匹配，已降级：",
          `英文 ${enSentences.length} 句 / 中文 ${zhLines.length} 句`,
          english.slice(0, 40) + "…"
        );
      }
    }

    paragraph.innerHTML = html;
    paragraph.classList.add("tk-bi");
    paragraph.dataset.biDone = "1";
    carrier.remove();
    count += 1;
  });

  return count;
}
