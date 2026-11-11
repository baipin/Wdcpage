"""Refresh Reading metadata outside the browser, avoiding publisher CORS restrictions.

Run: python scripts/update_reading_metadata.py
Requires Python 3.10+ and Node.js (to evaluate the editable papers.js configuration).
"""
import argparse
import json
import re
import subprocess
import sys
import time
from html import unescape
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import quote, unquote, urlsplit, urlunsplit, parse_qs
from urllib.request import Request, urlopen

ROOT = Path(__file__).resolve().parents[1]
CACHE = ROOT / 'reading/metadata.json'


class CitationParser(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.meta = {}

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if tag == 'meta':
            name = (attrs.get('name') or attrs.get('property') or '').lower()
            self.meta.setdefault(name, []).append(attrs.get('content', '').strip())

    def result(self):
        def first(*names):
            return next((v for n in names for v in self.meta.get(n, []) if v), '')
        return {
            'title': first('citation_title', 'dc.title', 'og:title'),
            'authors': ', '.join(self.meta.get('citation_author', []) or self.meta.get('dc.creator', [])),
            'date': first('citation_publication_date', 'citation_date', 'dc.date', 'article:published_time'),
        }


def fetch(url):
    for attempt in range(3):
        try:
            request = Request(url, headers={'User-Agent': 'Wdcpage-Reading/1.0 (public scholarly metadata)', 'Accept': 'text/html, application/json'})
            with urlopen(request, timeout=30) as response:
                return response.read().decode('utf-8', errors='replace')
        except Exception:
            if attempt == 2:
                raise
            time.sleep(2 * (attempt + 1))


def identify(item):
    url = item['url']
    parts = urlsplit(url)
    if parts.scheme != 'https' or parts.username or parts.password:
        raise ValueError('Expected an HTTPS paper URL without credentials')
    host = parts.hostname.removeprefix('www.')
    path = parts.path
    doi = item.get('doi', '')
    if host in ('arxiv.org', 'export.arxiv.org'):
        match = re.fullmatch(r'/(?:abs|pdf)/((?:\d{4}\.\d{4,5}|[a-z-]+(?:\.[A-Z]{2})?/\d{7})(?:v\d+)?)(?:\.pdf)?/?', path)
        if not match:
            raise ValueError('Invalid arXiv URL')
        paper_id = match[1]
        return re.sub(r'v\d+$', '', paper_id), f'https://arxiv.org/abs/{paper_id}', ''
    if host == 'nature.com' and path.startswith('/articles/'):
        paper_id = path.split('/')[2].removesuffix('.pdf')
        url = f'https://www.nature.com/articles/{paper_id}'
        doi = doi or f'10.1038/{paper_id}'
    elif host in ('doi.org', 'dx.doi.org'):
        doi = doi or unquote(path.lstrip('/'))
    elif host == 'openreview.net' and parse_qs(parts.query).get('id'):
        url = 'https://openreview.net/forum?id=' + quote(parse_qs(parts.query)['id'][0], safe='')
    elif host == 'aclanthology.org':
        paper_id = path.rstrip('/').split('/')[-1].removesuffix('.pdf')
        url = f'https://aclanthology.org/{paper_id}/'
    elif host in ('biorxiv.org', 'medrxiv.org') and path.startswith('/content/10.'):
        path = re.sub(r'\.(full\.pdf|full|abstract)$', '', path)
        url = urlunsplit((parts.scheme, parts.netloc, path, parts.query, parts.fragment))
        doi = doi or re.sub(r'v\d+$', '', path[len('/content/'):])
    match = re.search(r'10\.\d{4,9}/.+', unquote(urlsplit(url).path))
    doi = doi or (match[0].removesuffix('.pdf') if match else '')
    return url, url, doi


def crossref(doi):
    message = json.loads(fetch('https://api.crossref.org/works/' + quote(doi, safe='')))['message']
    return {
        'title': unescape((message.get('title') or [''])[0]),
        'authors': ', '.join(' '.join(filter(None, (a.get('given'), a.get('family')))) for a in message.get('author', [])),
        'date': '-'.join(map(str, message.get('published', {}).get('date-parts', [[]])[0])),
    }


def metadata(url, doi):
    if doi:
        try:
            result = crossref(doi)
            if result.get('title'):
                return result
        except Exception:
            pass  # Publisher citation tags remain a fallback.
    if urlsplit(url).hostname == 'openreview.net':
        paper_id = parse_qs(urlsplit(url).query)['id'][0]
        for endpoint in ('https://api2.openreview.net', 'https://api.openreview.net'):
            try:
                note = json.loads(fetch(endpoint + '/notes?id=' + quote(paper_id, safe='')))['notes'][0]
                def value(name):
                    v = note['content'].get(name, '')
                    return v.get('value', '') if isinstance(v, dict) else v
                authors = value('authors')
                return {'title': value('title'), 'authors': ', '.join(authors) if isinstance(authors, list) else authors}
            except Exception:
                pass
    parser = CitationParser()
    parser.feed(fetch(url))
    return parser.result()


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--refresh', action='store_true', help='Also refresh already complete cached entries')
    args = parser.parse_args()
    # Evaluate the existing JavaScript array instead of maintaining a second list.
    loader = "const fs=require('node:fs'),vm=require('node:vm');const ctx={window:{}};vm.runInNewContext(fs.readFileSync(process.argv[1],'utf8'),ctx,{timeout:1000});process.stdout.write(JSON.stringify(ctx.window.READING_PAPERS));"
    entries = json.loads(subprocess.check_output(['node', '-e', loader, str(ROOT / 'reading/papers.js')], text=True, encoding='utf-8'))
    cache = json.loads(CACHE.read_text(encoding='utf-8')) if CACHE.exists() else {}
    failures = []
    for entry in entries:
        item = {'url': entry} if isinstance(entry, str) else entry
        try:
            key, url, doi = identify(item)
            existing = cache.get(key, {})
            if not args.refresh and all(item.get(field) or existing.get(field) for field in ('title', 'authors', 'date')):
                continue
            result = {k: v for k, v in metadata(url, doi).items() if v}
            if not result.get('title'):
                raise ValueError('No paper title returned')
            cache[key] = {**existing, **result}
            print('Updated:', url)
        except Exception as exc:
            failures.append(item.get('url', repr(item)))
            print(f"Could not update {failures[-1]}: {exc}", file=sys.stderr)
    # Preserve previous metadata on failure, and save successful entries even if others fail.
    CACHE.write_text(json.dumps(cache, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    if failures:
        return 1
    return 0


if __name__ == '__main__':
    sys.exit(main())
