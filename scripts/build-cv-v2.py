from pathlib import Path

from pypdf import PdfReader
from reportlab.lib import colors
from reportlab.lib.enums import TA_RIGHT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import mm
from reportlab.platypus import (
    HRFlowable,
    KeepTogether,
    ListFlowable,
    ListItem,
    PageBreak,
    Paragraph,
    SimpleDocTemplate,
    Spacer,
    Table,
    TableStyle,
)


ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "assets" / "Jamie-Wilson-CV-v2.pdf"

INK = colors.HexColor("#171717")
MUTED = colors.HexColor("#5D5D5D")
ACCENT = colors.HexColor("#D8491E")
LINE = colors.HexColor("#D8D8D5")
SOFT = colors.HexColor("#F3F3F1")
WHITE = colors.white

styles = getSampleStyleSheet()
body = ParagraphStyle(
    "Body",
    parent=styles["BodyText"],
    fontName="Helvetica",
    fontSize=8.6,
    leading=11.2,
    textColor=INK,
    spaceAfter=0,
)
muted = ParagraphStyle(
    "Muted",
    parent=body,
    fontSize=7.6,
    leading=9.6,
    textColor=MUTED,
)
small = ParagraphStyle(
    "Small",
    parent=body,
    fontSize=7.2,
    leading=9.2,
)
name_style = ParagraphStyle(
    "Name",
    parent=body,
    fontName="Helvetica-Bold",
    fontSize=25,
    leading=27,
    textColor=INK,
    spaceAfter=3,
)
title_style = ParagraphStyle(
    "Title",
    parent=body,
    fontName="Helvetica-Bold",
    fontSize=10.8,
    leading=13,
    textColor=ACCENT,
)
contact_style = ParagraphStyle(
    "Contact",
    parent=small,
    textColor=MUTED,
    alignment=TA_RIGHT,
)
section_style = ParagraphStyle(
    "Section",
    parent=body,
    fontName="Helvetica-Bold",
    fontSize=10.5,
    leading=12,
    textColor=INK,
    spaceAfter=0,
)
role_style = ParagraphStyle(
    "Role",
    parent=body,
    fontName="Helvetica-Bold",
    fontSize=9.4,
    leading=11.5,
)
company_style = ParagraphStyle(
    "Company",
    parent=small,
    fontName="Helvetica-Bold",
    textColor=ACCENT,
)
date_style = ParagraphStyle(
    "Date",
    parent=small,
    alignment=TA_RIGHT,
    textColor=MUTED,
)
skill_title_style = ParagraphStyle(
    "SkillTitle",
    parent=small,
    fontName="Helvetica-Bold",
    textColor=INK,
    spaceAfter=3,
)
project_title_style = ParagraphStyle(
    "ProjectTitle",
    parent=body,
    fontName="Helvetica-Bold",
    fontSize=9.1,
    leading=11,
)


def section(title):
    return [
        Spacer(1, 5 * mm),
        Paragraph(title.upper(), section_style),
        Spacer(1, 1.5 * mm),
        HRFlowable(width="100%", thickness=0.65, color=LINE),
        Spacer(1, 2.5 * mm),
    ]


def bullet_list(items):
    return ListFlowable(
        [
            ListItem(
                Paragraph(item, body),
                leftIndent=8,
                bulletColor=ACCENT,
            )
            for item in items
        ],
        bulletType="bullet",
        bulletChar="-",
        bulletFontName="Helvetica-Bold",
        bulletFontSize=8,
        bulletColor=ACCENT,
        leftIndent=11,
        bulletOffsetY=1,
        spaceBefore=2,
        spaceAfter=0,
    )


def role(company, title, dates, items):
    heading = Table(
        [
            [Paragraph(company, company_style), Paragraph(dates, date_style)],
            [Paragraph(title, role_style), ""],
        ],
        colWidths=[126 * mm, 39 * mm],
    )
    heading.setStyle(
        TableStyle(
            [
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ("LEFTPADDING", (0, 0), (-1, -1), 0),
                ("RIGHTPADDING", (0, 0), (-1, -1), 0),
                ("TOPPADDING", (0, 0), (-1, -1), 0),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 1),
            ]
        )
    )
    return KeepTogether([heading, Spacer(1, 1.2 * mm), bullet_list(items)])


def skill_cell(title, description):
    return [
        Paragraph(title, skill_title_style),
        Paragraph(description, muted),
    ]


def project(title, links, description, proof):
    return KeepTogether(
        [
            Table(
                [[Paragraph(title, project_title_style), Paragraph(links, date_style)]],
                colWidths=[106 * mm, 59 * mm],
                style=TableStyle(
                    [
                        ("VALIGN", (0, 0), (-1, -1), "TOP"),
                        ("LEFTPADDING", (0, 0), (-1, -1), 0),
                        ("RIGHTPADDING", (0, 0), (-1, -1), 0),
                        ("TOPPADDING", (0, 0), (-1, -1), 0),
                        ("BOTTOMPADDING", (0, 0), (-1, -1), 0),
                    ]
                ),
            ),
            Spacer(1, 1.2 * mm),
            Paragraph(description, body),
            Spacer(1, 0.8 * mm),
            Paragraph(f"<b>Evidence:</b> {proof}", muted),
        ]
    )


def draw_page(canvas, doc):
    canvas.saveState()
    canvas.setTitle("Jamie Wilson - Web Developer CV - Review Draft")
    canvas.setAuthor("Jamie Wilson")
    canvas.setSubject("Two-page A4 web developer CV")
    canvas.setStrokeColor(LINE)
    canvas.setLineWidth(0.5)
    canvas.line(doc.leftMargin, 11 * mm, A4[0] - doc.rightMargin, 11 * mm)
    canvas.setFont("Helvetica", 7)
    canvas.setFillColor(MUTED)
    canvas.drawString(doc.leftMargin, 7.2 * mm, "Jamie Wilson | Web Developer | Christchurch, New Zealand")
    canvas.drawRightString(A4[0] - doc.rightMargin, 7.2 * mm, f"{doc.page} / 2")
    canvas.restoreState()


doc = SimpleDocTemplate(
    str(OUTPUT),
    pagesize=A4,
    leftMargin=15 * mm,
    rightMargin=15 * mm,
    topMargin=13 * mm,
    bottomMargin=16 * mm,
    title="Jamie Wilson - Web Developer CV - Review Draft",
    author="Jamie Wilson",
)

story = []

header = Table(
    [
        [
            [
                Paragraph("Jamie Wilson", name_style),
                Paragraph("WEB DEVELOPER | FRONT-END, WORDPRESS AND CMS", title_style),
            ],
            Paragraph(
                "Christchurch, New Zealand<br/>"
                "+64 21 084 65072 | <link href='mailto:howemanning@gmail.com' color='#5D5D5D'>howemanning@gmail.com</link><br/>"
                "<link href='https://dottereldesign.github.io/portfolio/' color='#5D5D5D'>Portfolio</link> | "
                "<link href='https://www.linkedin.com/in/jamie-wilson-b1b8351b0' color='#5D5D5D'>LinkedIn</link> | "
                "<link href='https://github.com/dottereldesign' color='#5D5D5D'>GitHub</link><br/>"
                "Seeking full-time Christchurch or NZ-remote work",
                contact_style,
            ),
        ]
    ],
    colWidths=[103 * mm, 62 * mm],
)
header.setStyle(
    TableStyle(
        [
            ("VALIGN", (0, 0), (-1, -1), "TOP"),
            ("LEFTPADDING", (0, 0), (-1, -1), 0),
            ("RIGHTPADDING", (0, 0), (-1, -1), 0),
            ("TOPPADDING", (0, 0), (-1, -1), 0),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 0),
        ]
    )
)
story.extend([header, Spacer(1, 4 * mm), HRFlowable(width="100%", thickness=1.2, color=INK)])

story.extend(section("Profile"))
story.append(
    Paragraph(
        "Christchurch-based web developer with commercial experience delivering WordPress and CMS websites for education-sector clients across New Zealand and Australia. I work across UI implementation, responsive front-end development, CMS integrations, QA, migrations, launch support and live-site troubleshooting. My progression from student intern to technical support and website development has built a practical mix of design judgement, implementation skill and clear client-facing communication.",
        body,
    )
)

story.extend(section("Core skills"))
skills_table = Table(
    [
        [
            skill_cell("Front-end implementation", "HTML, CSS, JavaScript, PHP, React and TypeScript; responsive layouts, reusable patterns and accessibility."),
            skill_cell("WordPress and CMS", "WordPress, Gutenberg, Divi, Elementor, Avada, Hail CMS, content feeds and maintainable publishing workflows."),
        ],
        [
            skill_cell("UI and design", "Figma, responsive systems, information architecture, interaction quality and translating brand requirements into interfaces."),
            skill_cell("Delivery and support", "Git, QA, Cloudways, LocalWP, WP-CLI, DNS, migrations, launch support, debugging and technical documentation."),
        ],
    ],
    colWidths=[82.5 * mm, 82.5 * mm],
)
skills_table.setStyle(
    TableStyle(
        [
            ("BACKGROUND", (0, 0), (-1, -1), SOFT),
            ("BOX", (0, 0), (-1, -1), 0.5, LINE),
            ("INNERGRID", (0, 0), (-1, -1), 0.5, LINE),
            ("VALIGN", (0, 0), (-1, -1), "TOP"),
            ("LEFTPADDING", (0, 0), (-1, -1), 8),
            ("RIGHTPADDING", (0, 0), (-1, -1), 8),
            ("TOPPADDING", (0, 0), (-1, -1), 7),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 7),
        ]
    )
)
story.append(skills_table)

story.extend(section("Experience"))
story.append(
    role(
        "HAIL - YOUR COMMUNICATIONS PARTNER",
        "Website Developer",
        "Sep 2025 - Present | Full-time",
        [
            "Deliver responsive WordPress and CMS websites for schools across New Zealand and Australia, carrying work from layout direction through implementation, QA and launch support.",
            "Translate brand, content and UX requirements into reusable Gutenberg, Divi, Elementor and Avada layouts that remain practical for client content teams.",
            "Integrate Hail CMS articles, publications and feeds into WordPress, creating maintainable display patterns for ongoing publishing.",
            "Manage staging, Cloudways migrations, DNS checks, caching and post-launch fixes to reduce launch risk and keep live sites dependable.",
            "Diagnose plugin, form, SMTP, SEO, browser and device issues, then document repeatable fixes and QA checks for future delivery.",
        ],
    )
)
story.append(Spacer(1, 4 * mm))
story.append(
    role(
        "HAIL - YOUR COMMUNICATIONS PARTNER",
        "Technical Support",
        "Feb 2025 - Aug 2025 | Full-time",
        [
            "Managed frontline support for Hail CMS and WordPress clients, turning reported issues into clear reproduction steps and development follow-up.",
            "Identified root causes across content, plugins, domains, email, CMS configuration and publishing workflows in live client environments.",
            "Converted recurring support problems into documented fixes, QA checks and stronger implementation practices.",
        ],
    )
)

story.append(PageBreak())

story.extend(section("Experience continued"))
story.append(
    role(
        "HAIL - YOUR COMMUNICATIONS PARTNER",
        "Student Intern",
        "Aug 2024 - Jan 2025 | Internship",
        [
            "Researched international school apps and built a competitor matrix to identify product gaps and opportunities.",
            "Evaluated mobile frameworks, selected React Native with Expo and built a functional prototype.",
            "Worked with stakeholders to refine concepts and present findings that helped shape the direction of Hail's mobile app.",
        ],
    )
)

story.extend(section("Selected projects"))
story.append(
    project(
        "BeWriteBack - privacy-first clipboard PWA",
        "<link href='https://dottereldesign.github.io/portfolio/projects/bewriteback/' color='#D8491E'>Case study</link> | <link href='https://github.com/dottereldesign/be_write_back' color='#D8491E'>Source</link>",
        "Designed and developed a responsive React and TypeScript application for saving and recalling reusable text without accounts, analytics or a back end.",
        "Local persistence, folders, favourites, search, sorting, drag-and-drop, keyboard interaction, installation and offline PWA support.",
    )
)
story.append(Spacer(1, 4 * mm))
story.append(
    project(
        "Jamie Wilson portfolio",
        "<link href='https://dottereldesign.github.io/portfolio/' color='#D8491E'>Live</link> | <link href='https://github.com/dottereldesign/portfolio' color='#D8491E'>Source</link>",
        "Built a responsive personal portfolio that combines recruiter-focused content with custom motion and a progressively enhanced Three.js laptop experience.",
        "Semantic HTML, modular JavaScript and CSS, theme persistence, reduced-motion support, structured data, Playwright tests, axe accessibility checks and GitHub Actions CI.",
    )
)

story.extend(section("Education"))
education = Table(
    [
        [Paragraph("Bachelor of Information and Communication Technologies", role_style), Paragraph("Completed 2025", date_style)],
        [Paragraph("Software Development | Ara Institute of Canterbury", muted), ""],
        [Spacer(1, 2 * mm), ""],
        [Paragraph("Diploma in Web Development and Design", role_style), Paragraph("Completed 2022", date_style)],
        [Paragraph("Ara Institute of Canterbury", muted), ""],
        [Spacer(1, 2 * mm), ""],
        [Paragraph("Certificate in Information Technology Essentials", role_style), Paragraph("Completed 2020", date_style)],
        [Paragraph("Ara Institute of Canterbury", muted), ""],
    ],
    colWidths=[126 * mm, 39 * mm],
)
education.setStyle(
    TableStyle(
        [
            ("VALIGN", (0, 0), (-1, -1), "TOP"),
            ("LEFTPADDING", (0, 0), (-1, -1), 0),
            ("RIGHTPADDING", (0, 0), (-1, -1), 0),
            ("TOPPADDING", (0, 0), (-1, -1), 0),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 0),
        ]
    )
)
story.append(education)

story.extend(section("Technical toolkit"))
toolkit = Table(
    [
        [Paragraph("Front-end", skill_title_style), Paragraph("HTML, CSS, JavaScript, TypeScript, PHP, React", muted)],
        [Paragraph("CMS", skill_title_style), Paragraph("WordPress, Hail CMS, Gutenberg, Divi, Elementor, Avada", muted)],
        [Paragraph("Delivery", skill_title_style), Paragraph("Git, GitHub, VS Code, LocalWP, WP-CLI, Cloudways, WPStaq, DNS", muted)],
        [Paragraph("Workflow", skill_title_style), Paragraph("Figma, Notion, HelpScout, Codex and validated AI-assisted development", muted)],
    ],
    colWidths=[31 * mm, 134 * mm],
)
toolkit.setStyle(
    TableStyle(
        [
            ("VALIGN", (0, 0), (-1, -1), "TOP"),
            ("LINEBELOW", (0, 0), (-1, -2), 0.5, LINE),
            ("LEFTPADDING", (0, 0), (-1, -1), 0),
            ("RIGHTPADDING", (0, 0), (-1, -1), 0),
            ("TOPPADDING", (0, 0), (-1, -1), 4),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
        ]
    )
)
story.append(toolkit)
story.append(Spacer(1, 5 * mm))
story.append(Paragraph("References available on request.", muted))

doc.build(story, onFirstPage=draw_page, onLaterPages=draw_page)

reader = PdfReader(OUTPUT)
if len(reader.pages) != 2:
    raise RuntimeError(f"Expected two pages, generated {len(reader.pages)}")

for page_number, page in enumerate(reader.pages, 1):
    width = float(page.mediabox.width)
    height = float(page.mediabox.height)
    if abs(width - A4[0]) > 1 or abs(height - A4[1]) > 1:
        raise RuntimeError(f"Page {page_number} is not A4: {width} x {height}")

print(f"Created {OUTPUT} ({OUTPUT.stat().st_size} bytes, {len(reader.pages)} A4 pages)")
