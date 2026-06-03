# -*- coding: utf-8 -*-
"""将 Markdown 导出为 Word (.docx)，依赖: pip install python-docx markdown htmldocx beautifulsoup4"""
import re
import sys
from pathlib import Path

import markdown
from docx import Document
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.shared import Pt, Cm
from htmldocx import HtmlToDocx


def md_to_docx(md_path: Path, docx_path: Path) -> None:
    text = md_path.read_text(encoding="utf-8")
    # 去掉仅用于 GitHub 的相对链接提示，Word 中改为纯文本说明
    text = re.sub(
        r"\[Toast-Web-后台结构深度分析\.md\]\(\./Toast-Web-后台结构深度分析\.md\)",
        "《Toast-Web-后台结构深度分析》（同目录 Markdown 文档）",
        text,
    )

    html = markdown.markdown(
        text,
        extensions=[
            "tables",
            "fenced_code",
            "nl2br",
        ],
    )
    # 包裹 body，便于解析
    html = f"<html><body>{html}</body></html>"

    doc = Document()
    section = doc.sections[0]
    section.page_height = Cm(29.7)
    section.page_width = Cm(21.0)
    section.left_margin = Cm(2.5)
    section.right_margin = Cm(2.5)
    section.top_margin = Cm(2.5)
    section.bottom_margin = Cm(2.5)

    style = doc.styles["Normal"]
    style.font.name = "Microsoft YaHei"
    style.font.size = Pt(10.5)
    style._element.rPr.rFonts.set("{http://schemas.openxmlformats.org/wordprocessingml/2006/main}eastAsia", "Microsoft YaHei")

    parser = HtmlToDocx()
    parser.add_html_to_document(html, doc)

    # 标题段落居中（首个 h1 若存在）
    for i, p in enumerate(doc.paragraphs[:5]):
        t = (p.text or "").strip()
        if t.startswith("餐饮行业商家后台"):
            p.alignment = WD_ALIGN_PARAGRAPH.CENTER
            for r in p.runs:
                r.bold = True
                r.font.size = Pt(16)
            break

    docx_path.parent.mkdir(parents=True, exist_ok=True)
    doc.save(str(docx_path))
    print(f"已生成: {docx_path}")


if __name__ == "__main__":
    root = Path(__file__).resolve().parent.parent
    md_file = root / "docs" / "餐饮商家后台-导航与目录结构建议.md"
    out_file = root / "docs" / "餐饮商家后台-导航与目录结构建议.docx"
    if len(sys.argv) >= 2:
        md_file = Path(sys.argv[1])
    if len(sys.argv) >= 3:
        out_file = Path(sys.argv[2])
    md_to_docx(md_file, out_file)
