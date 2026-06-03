#!/usr/bin/env python3
"""
将 FreeMind / Freeplane 风格 `.mm`（XML）转为 Markdown，并把英文节点译为简体中文。

默认使用 Google 翻译（deep-translator），结果写入本地 JSON 缓存，便于断点续跑与复用。
餐饮语境：整句翻译后再做少量术语后处理（不改变品牌名 Square 等）。
"""

from __future__ import annotations

import argparse
import html
import json
import re
import time
import xml.etree.ElementTree as ET
from dataclasses import dataclass
from pathlib import Path

from square_pre_glossary import (
    PRE_GLOSSARY,
    ZH_VALUE_PATCHES,
    apply_exact_overrides,
)

try:
    from deep_translator import GoogleTranslator
except ImportError as e:  # pragma: no cover
    raise SystemExit(
        "缺少依赖：请先执行 `pip install deep-translator` 后重试。\n"
        f"原始错误：{e}",
    ) from e


def _collapse_ws(s: str) -> str:
    return re.sub(r"\s+", " ", s).strip()


def _has_latin(s: str) -> bool:
    return re.search(r"[A-Za-z]", s) is not None


def _has_cjk(s: str) -> bool:
    return re.search(r"[\u4e00-\u9fff]", s) is not None


def _is_url_or_domain(s: str) -> bool:
    t = s.strip()
    if re.match(r"^https?://", t, re.I):
        return True
    # bare host / site path without spaces
    if re.fullmatch(r"[\w.-]+\.(com|site|io|org|net|co)(/\S*)?", t, re.I):
        return True
    return False


def needs_machine_translate(s: str) -> bool:
    """含拉丁字母且不是纯 URL/域名时，走机器翻译。"""
    if not s.strip():
        return False
    if _is_url_or_domain(s):
        return False
    return _has_latin(s)


# 机器翻译后再做轻量替换（避免个别词义偏离餐饮后台习惯）
_POST_FIXES: list[tuple[str, str]] = [
    (r"销售点", "收银端"),
    (r"销售时点", "收银端"),
    (r"礼品卡", "礼品卡"),  # no-op anchor for future tweaks
]


def post_fix_zh(zh: str) -> str:
    out = zh
    for pat, rep in _POST_FIXES:
        if pat != rep:
            out = re.sub(pat, rep, out)
    return out


@dataclass
class Node:
    text: str
    children: list["Node"]


def parse_node(el: ET.Element) -> Node:
    raw = el.attrib.get("TEXT", "") or ""
    txt = _collapse_ws(html.unescape(raw))
    children = [parse_node(c) for c in list(el) if c.tag == "node"]
    return Node(text=txt, children=children)


def parse_mm(mm_path: Path) -> Node:
    tree = ET.parse(mm_path)
    root = tree.getroot()
    node_el = root.find("node")
    if node_el is None:
        raise ValueError("无效的 .mm：未找到根 <node>")
    return parse_node(node_el)


def collect_texts(n: Node, out: list[str]) -> None:
    if n.text:
        out.append(n.text)
    for c in n.children:
        collect_texts(c, out)


def load_cache(path: Path) -> dict[str, str]:
    if not path.exists():
        return {}
    try:
        data = json.loads(path.read_text(encoding="utf-8"))
        if isinstance(data, dict):
            return {str(k): str(v) for k, v in data.items()}
    except (json.JSONDecodeError, OSError):
        pass
    return {}


def save_cache(path: Path, cache: dict[str, str]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(cache, ensure_ascii=False, indent=2), encoding="utf-8")


def apply_pre_glossary(cache: dict[str, str]) -> None:
    """用餐饮后台常用词条覆盖缓存（英文 key → 指定中文）。"""
    for k, v in PRE_GLOSSARY.items():
        cache[k] = v


def apply_zh_value_patches(cache: dict[str, str]) -> None:
    """修正机翻译文中常见误译子串（仅替换长度≥3 的片段，降低误伤）。"""
    for k, v in list(cache.items()):
        if not isinstance(v, str):
            continue
        nv = v
        for old, new in ZH_VALUE_PATCHES:
            if len(old) < 3:
                continue
            nv = nv.replace(old, new)
        if nv != v:
            cache[k] = nv


def translate_with_cache(
    texts: list[str],
    cache: dict[str, str],
    *,
    delay_s: float,
    save_every: int,
    cache_path: Path,
) -> None:
    tr_en = GoogleTranslator(source="en", target="zh-CN")
    tr_auto = GoogleTranslator(source="auto", target="zh-CN")
    pending = []
    for t in texts:
        if t not in cache and needs_machine_translate(t):
            pending.append(t)
    total = len(pending)
    if total == 0:
        return

    done = 0
    for i, src in enumerate(pending, start=1):
        zh = None
        translator = tr_auto if _has_cjk(src) else tr_en
        for attempt in range(5):
            try:
                zh = translator.translate(src)
                break
            except Exception:
                time.sleep(min(8.0, 1.5 * (2**attempt)))
        if zh is None:
            zh = src  # 失败则保留原文，避免丢信息
        zh = post_fix_zh(_collapse_ws(zh))
        cache[src] = zh
        done += 1
        if done % save_every == 0 or i == total:
            save_cache(cache_path, cache)
        if delay_s > 0:
            time.sleep(delay_s)
        if i % 50 == 0 or i == total:
            print(f"[translate] {i}/{total}", flush=True)


def translate_node_text(s: str, cache: dict[str, str]) -> str:
    s = _collapse_ws(html.unescape(s))
    if not s:
        return s
    if s in cache:
        return cache[s]
    if not needs_machine_translate(s):
        cache[s] = s
        return s
    # 理论上已在 translate_with_cache 填充
    return cache.get(s, s)


def to_markdown(root: Node, cache: dict[str, str]) -> str:
    lines: list[str] = []
    root_title = translate_node_text(root.text, cache)
    if root_title == root.text and "英文" in root_title:
        root_title = root_title.replace("英文", "中文")
    lines.append(f"## {root_title}")
    lines.append("")

    def walk(n: Node, depth: int) -> None:
        if n.text:
            label = translate_node_text(n.text, cache)
            indent = "  " * depth
            lines.append(f"{indent}- {label}")
        for ch in n.children:
            walk(ch, depth + 1)

    for c in root.children:
        walk(c, 0)

    lines.append("")
    lines.append("## 说明")
    lines.append("")
    lines.append("- 本文由 `.mm` 思维导图自动转换为 Markdown。")
    lines.append("- 英文节点：机器翻译为简体中文；`scripts/square_pre_glossary.py` 中的常用词条会覆盖修正。")
    lines.append("- URL/域名、品牌名（如 Square、Apple）等通常保留原文。")
    lines.append("- 翻译缓存见同目录下的 `square_mm_translation_cache.json`；使用 `--regen-only` 可仅重生成 Markdown。")
    lines.append("")
    return "\n".join(lines)


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--input", required=True, help="输入 .mm 路径")
    ap.add_argument("--output", required=True, help="输出 .md 路径")
    ap.add_argument(
        "--cache",
        default="",
        help="翻译缓存 JSON（默认：输出文件同目录 square_mm_translation_cache.json）",
    )
    ap.add_argument("--delay", type=float, default=0.12, help="每次请求后的节流秒数，防限流")
    ap.add_argument("--save-every", type=int, default=25, help="每翻译多少条写入缓存")
    ap.add_argument(
        "--regen-only",
        action="store_true",
        help="不调用翻译 API：仅合并术语表与译文补丁后，根据缓存重新生成 Markdown",
    )
    args = ap.parse_args()

    in_path = Path(args.input)
    out_path = Path(args.output)
    cache_path = Path(args.cache) if args.cache else (out_path.parent / "square_mm_translation_cache.json")

    root = parse_mm(in_path)
    all_texts: list[str] = []
    collect_texts(root, all_texts)
    uniq = sorted(set(all_texts))

    cache = load_cache(cache_path)
    apply_pre_glossary(cache)
    apply_zh_value_patches(cache)
    apply_exact_overrides(cache)
    if not args.regen_only:
        translate_with_cache(
            uniq,
            cache,
            delay_s=args.delay,
            save_every=args.save_every,
            cache_path=cache_path,
        )
    apply_pre_glossary(cache)
    apply_zh_value_patches(cache)
    apply_exact_overrides(cache)
    save_cache(cache_path, cache)

    md = to_markdown(root, cache)
    out_path.parent.mkdir(parents=True, exist_ok=True)
    out_path.write_text(md, encoding="utf-8")
    print(f"Wrote: {out_path}", flush=True)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
