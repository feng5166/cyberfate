'use client';

import { Fragment, type ReactNode } from 'react';

/**
 * 轻量零依赖 Markdown 渲染器。
 * 覆盖 AI 输出常见语法：标题(#/##/###)、粗体(**)、行内代码(`)、
 * 有序/无序列表、GFM 表格、引用(>)、分隔线(---)、段落与软换行。
 * 不追求完整 CommonMark，只稳妥渲染问答场景的结构化输出。
 */

// —— 行内：**粗体**、`代码` ——
function renderInline(text: string, keyPrefix: string): ReactNode[] {
  const nodes: ReactNode[] = [];
  // 先按行内代码切，再在非代码段里处理粗体
  const codeParts = text.split(/(`[^`]+`)/g);
  codeParts.forEach((part, ci) => {
    if (!part) return;
    if (part.startsWith('`') && part.endsWith('`') && part.length >= 2) {
      nodes.push(
        <code key={`${keyPrefix}-c${ci}`} className="px-1 py-0.5 rounded bg-[#1C1A16]/8 text-[13px] font-mono">
          {part.slice(1, -1)}
        </code>,
      );
      return;
    }
    const boldParts = part.split(/(\*\*[^*]+\*\*)/g);
    boldParts.forEach((bp, bi) => {
      if (!bp) return;
      if (bp.startsWith('**') && bp.endsWith('**') && bp.length >= 4) {
        nodes.push(
          <strong key={`${keyPrefix}-c${ci}-b${bi}`} className="font-semibold text-[#1C1A16]">
            {bp.slice(2, -2)}
          </strong>,
        );
      } else {
        nodes.push(<Fragment key={`${keyPrefix}-c${ci}-t${bi}`}>{bp}</Fragment>);
      }
    });
  });
  return nodes;
}

function isTableSeparator(line: string): boolean {
  return /^\s*\|?\s*:?-{2,}:?\s*(\|\s*:?-{2,}:?\s*)+\|?\s*$/.test(line);
}

function splitRow(line: string): string[] {
  let s = line.trim();
  if (s.startsWith('|')) s = s.slice(1);
  if (s.endsWith('|')) s = s.slice(0, -1);
  return s.split('|').map(c => c.trim());
}

export function MiniMarkdown({ text, className }: { text: string; className?: string }) {
  const lines = text.replace(/\r\n/g, '\n').split('\n');
  const blocks: ReactNode[] = [];
  let i = 0;
  let key = 0;

  const pushParagraph = (buf: string[]) => {
    if (!buf.length) return;
    blocks.push(
      <p key={`p${key++}`} className="leading-relaxed">
        {buf.map((ln, idx) => (
          <Fragment key={idx}>
            {idx > 0 && <br />}
            {renderInline(ln, `p${key}-${idx}`)}
          </Fragment>
        ))}
      </p>,
    );
    buf.length = 0;
  };

  const paraBuf: string[] = [];

  while (i < lines.length) {
    const line = lines[i];
    const trimmed = line.trim();

    // 空行 → 段落分隔
    if (!trimmed) { pushParagraph(paraBuf); i++; continue; }

    // 分隔线
    if (/^(-{3,}|\*{3,}|_{3,})$/.test(trimmed)) {
      pushParagraph(paraBuf);
      blocks.push(<hr key={`hr${key++}`} className="my-3 border-[#1C1A16]/10" />);
      i++; continue;
    }

    // 标题
    const h = trimmed.match(/^(#{1,4})\s+(.*)$/);
    if (h) {
      pushParagraph(paraBuf);
      const level = h[1].length;
      const cls = level <= 1 ? 'text-base font-bold mt-3 mb-1.5 text-[#1C1A16]'
        : level === 2 ? 'text-[15px] font-semibold mt-3 mb-1.5 text-[#1C1A16]'
        : 'text-sm font-semibold mt-2 mb-1 text-[#1C1A16]/90';
      blocks.push(<div key={`h${key++}`} className={cls}>{renderInline(h[2], `h${key}`)}</div>);
      i++; continue;
    }

    // 引用
    if (/^>\s?/.test(trimmed)) {
      pushParagraph(paraBuf);
      const quote: string[] = [];
      while (i < lines.length && /^>\s?/.test(lines[i].trim())) {
        quote.push(lines[i].trim().replace(/^>\s?/, ''));
        i++;
      }
      blocks.push(
        <blockquote key={`q${key++}`} className="border-l-2 border-[#C2762B]/40 pl-3 my-2 text-[#1C1A16]/70">
          {quote.map((q, qi) => <p key={qi}>{renderInline(q, `q${key}-${qi}`)}</p>)}
        </blockquote>,
      );
      continue;
    }

    // 表格：当前行含 | 且下一行是分隔行
    if (trimmed.includes('|') && i + 1 < lines.length && isTableSeparator(lines[i + 1])) {
      pushParagraph(paraBuf);
      const header = splitRow(lines[i]);
      i += 2; // 跳过表头 + 分隔
      const rows: string[][] = [];
      while (i < lines.length && lines[i].trim().includes('|') && lines[i].trim()) {
        if (isTableSeparator(lines[i])) { i++; continue; }
        rows.push(splitRow(lines[i]));
        i++;
      }
      blocks.push(
        <div key={`tbl${key++}`} className="my-2 overflow-x-auto">
          <table className="w-full text-[13px] border-collapse">
            <thead>
              <tr className="border-b border-[#1C1A16]/15">
                {header.map((c, ci) => (
                  <th key={ci} className="px-2 py-1.5 text-left font-semibold text-[#1C1A16] whitespace-nowrap">
                    {renderInline(c, `th${key}-${ci}`)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((r, ri) => (
                <tr key={ri} className="border-b border-[#1C1A16]/8 align-top">
                  {r.map((c, ci) => (
                    <td key={ci} className="px-2 py-1.5 text-[#1C1A16]/80">
                      {renderInline(c, `td${key}-${ri}-${ci}`)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>,
      );
      continue;
    }

    // 列表（连续的 - / * / 数字.）
    if (/^([-*]|\d+\.)\s+/.test(trimmed)) {
      pushParagraph(paraBuf);
      const ordered = /^\d+\.\s+/.test(trimmed);
      const items: string[] = [];
      while (i < lines.length) {
        const t = lines[i].trim();
        const m = t.match(/^(?:[-*]|\d+\.)\s+(.*)$/);
        if (!m) break;
        items.push(m[1]);
        i++;
      }
      const ListTag = ordered ? 'ol' : 'ul';
      blocks.push(
        <ListTag key={`l${key++}`} className={`my-1.5 space-y-1 ${ordered ? 'list-decimal' : 'list-disc'} pl-5`}>
          {items.map((it, ii) => (
            <li key={ii} className="leading-relaxed">{renderInline(it, `li${key}-${ii}`)}</li>
          ))}
        </ListTag>,
      );
      continue;
    }

    // 普通段落行
    paraBuf.push(trimmed);
    i++;
  }
  pushParagraph(paraBuf);

  return <div className={`space-y-2 ${className ?? ''}`}>{blocks}</div>;
}
