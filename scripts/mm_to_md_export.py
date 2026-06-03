#!/usr/bin/env python3
"""将 FreeMind / Freeplane 风格 `.mm`（XML）导出为 Markdown，保留节点 TEXT 原文（不翻译）。"""

from __future__ import annotations

import argparse
import html
import re
import xml.etree.ElementTree as ET
from dataclasses import dataclass
from pathlib import Path


def _collapse_ws(s: str) -> str:
    return re.sub(r"\s+", " ", s).strip()


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


def to_markdown(root: Node) -> str:
    lines: list[str] = []
    lines.append(f"## {root.text}")
    lines.append("")

    def walk(n: Node, depth: int) -> None:
        if n.text:
            label = n.text.replace("|", "\\|")
            indent = "  " * depth
            lines.append(f"{indent}- {label}")
        for ch in n.children:
            walk(ch, depth + 1)

    for c in root.children:
        walk(c, 0)

    lines.append("")
    lines.append("## 说明")
    lines.append("")
    lines.append("- 本文件由 `.mm` 思维导图导出，节点文案为导图内原文。")
    lines.append("")
    return "\n".join(lines)


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--input", required=True, help="输入 .mm 路径")
    ap.add_argument("--output", required=True, help="输出 .md 路径")
    args = ap.parse_args()
    in_path = Path(args.input)
    out_path = Path(args.output)
    root = parse_mm(in_path)
    out_path.parent.mkdir(parents=True, exist_ok=True)
    out_path.write_text(to_markdown(root), encoding="utf-8")
    print(f"Wrote: {out_path}", flush=True)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
