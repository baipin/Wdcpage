"""Render pages/about.md into the homepage before deployment."""
import argparse
from pathlib import Path

from markdown_it import MarkdownIt

ROOT = Path(__file__).resolve().parents[1]
START = '<!-- ABOUT:START -->'
END = '<!-- ABOUT:END -->'


def render(page, source):
    if page.count(START) != 1 or page.count(END) != 1:
        raise ValueError('Expected exactly one pair of About generation markers')
    start = page.index(START) + len(START)
    end = page.index(END)
    if end < start:
        raise ValueError('About generation markers are in the wrong order')
    content = MarkdownIt('commonmark', {'html': True}).enable(['table', 'strikethrough']).render(source).rstrip()
    return page[:start] + '\n' + content + '\n' + page[end:]


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--check', action='store_true', help='Fail if generated HTML is out of date')
    args = parser.parse_args()
    target = ROOT / 'index.html'
    page = target.read_text(encoding='utf-8')
    generated = render(page, (ROOT / 'pages/about.md').read_text(encoding='utf-8'))
    if args.check:
        if generated != page:
            raise SystemExit('About HTML is out of date. Run python scripts/render_about.py')
    elif generated != page:
        target.write_text(generated, encoding='utf-8')


if __name__ == '__main__':
    main()
