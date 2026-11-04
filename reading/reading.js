(() => {
    const list = document.getElementById('paper-list');
    const search = document.getElementById('paper-search');
    const count = document.getElementById('paper-count');
    const papers = [];
    function element(tag, className, text) {
        const node = document.createElement(tag);
        if (className) node.className = className;
        if (text) node.textContent = text;
        return node;
    }
    function safeUrl(value) {
        try {
            const url = new URL(value);
            return url.protocol === 'https:' && !url.username && !url.password ? url.href : null;
        } catch (_) { return null; }
    }
    function decodePath(value) {
        try { return decodeURIComponent(value); } catch (_) { return value; }
    }
    function parsePaper(input) {
        const item = typeof input === 'string' ? { url: input } : input;
        if (!item || !safeUrl(item.url)) return null;
        const url = new URL(item.url);
        const host = url.hostname.replace(/^www\./, '');
        let id = url.pathname.replace(/\/$/, '').split('/').pop() || host;
        let source = host, doi = '', pdf = '';
        if (['arxiv.org', 'export.arxiv.org'].includes(host)) {
            const match = url.pathname.match(/^\/(?:abs|pdf)\/((?:\d{4}\.\d{4,5}|[a-z-]+(?:\.[A-Z]{2})?\/\d{7})(?:v\d+)?)(?:\.pdf)?\/?$/);
            if (!match) return null;
            id = match[1]; source = 'arXiv';
            url.href = `https://arxiv.org/abs/${id}`;
            pdf = `https://arxiv.org/pdf/${id}`;
        } else if (['doi.org', 'dx.doi.org'].includes(host)) {
            source = 'DOI'; doi = decodePath(url.pathname.slice(1)); id = doi;
        } else if (host === 'nature.com' && /^\/articles\/[^/]+/.test(url.pathname)) {
            source = 'Nature'; id = url.pathname.split('/')[2].replace(/\.pdf$/, '');
            url.href = `https://www.nature.com/articles/${id}`;
            doi = `10.1038/${id}`; pdf = `${url.href}.pdf`;
        } else if (host === 'openreview.net' && url.searchParams.has('id')) {
            source = 'OpenReview'; id = url.searchParams.get('id');
            url.href = `https://openreview.net/forum?id=${encodeURIComponent(id)}`;
            pdf = `https://openreview.net/pdf?id=${encodeURIComponent(id)}`;
        } else if (host === 'aclanthology.org') {
            source = 'ACL Anthology'; id = id.replace(/\.pdf$/, '');
            url.href = `https://aclanthology.org/${id}/`; pdf = `https://aclanthology.org/${id}.pdf`;
        } else if (host === 'proceedings.mlr.press') {
            source = 'PMLR';
        } else if (host === 'openaccess.thecvf.com') {
            source = 'CVF Open Access';
            if (url.pathname.includes('/html/') && url.pathname.endsWith('.html')) {
                pdf = url.href.replace('/html/', '/papers/').replace(/\.html$/, '.pdf');
            }
        } else if (['biorxiv.org', 'medrxiv.org'].includes(host)) {
            source = host === 'biorxiv.org' ? 'bioRxiv' : 'medRxiv';
            if (url.pathname.startsWith('/content/10.')) {
                const path = url.pathname.replace(/\.(?:full\.pdf|full|abstract)$/, '');
                url.pathname = path; pdf = `${url.origin}${path}.full.pdf`;
                doi = path.slice('/content/'.length).replace(/v\d+$/, '');
                id = doi;
            }
        } else {
            source = ({ 'link.springer.com': 'Springer', 'dl.acm.org': 'ACM Digital Library',
                'ieeexplore.ieee.org': 'IEEE Xplore', 'sciencedirect.com': 'ScienceDirect',
                'science.org': 'Science', 'cell.com': 'Cell' })[host] || host;
        }
        // Publisher URLs containing a DOI can use Crossref without scraping HTML.
        const doiMatch = decodePath(url.pathname).match(/10\.\d{4,9}\/.+/);
        doi ||= doiMatch?.[0].replace(/\.pdf$/, '') || '';
        if (item.doi && /^10\.\d{4,9}\/\S+$/.test(item.doi)) doi = item.doi;
        if (/\.pdf$/i.test(url.pathname)) pdf ||= url.href;
        return { ...item, id, source, doi, url: url.href,
            pdf: safeUrl(item.pdf || pdf), key: source === 'arXiv' ? id.replace(/v\d+$/, '') : url.href };
    }
    function link(text, url) {
        const a = element('a', '', text);
        a.href = url; a.target = '_blank'; a.rel = 'noopener noreferrer';
        return a;
    }
    function render() {
        list.replaceChildren();
        const query = (search.value || '').trim().toLowerCase();
        const visible = papers.filter(p => [p.title, p.authors, p.id, p.source, p.doi, p.note, ...(p.tags || [])].join(' ').toLowerCase().includes(query));
        count.textContent = `${visible.length} / ${papers.length} papers`;
        document.getElementById('empty-state').hidden = visible.length !== 0;
        for (const paper of visible) {
            const card = element('mdui-card', 'paper-card');
            card.setAttribute('variant', 'elevated');
            card.setAttribute('role', 'article');
            const meta = element('div', 'paper-meta');
            const documentIcon = element('mdui-icon');
            documentIcon.setAttribute('name', 'description');
            documentIcon.setAttribute('aria-hidden', 'true');
            meta.append(documentIcon, element('span', '', `${paper.source}: ${paper.id}`));
            if (paper.date) meta.append(element('span', '', paper.date));
            const heading = element('h2');
            heading.append(link(paper.title || `${paper.source}: ${paper.id}`, paper.url));
            card.append(meta, heading);
            if (paper.authors) card.append(element('p', 'authors', Array.isArray(paper.authors) ? paper.authors.join(', ') : paper.authors));
            if (paper.note) card.append(element('p', 'paper-note', paper.note));
            if (Array.isArray(paper.tags) && paper.tags.length) {
                const tags = element('div', 'tags');
                for (const tag of paper.tags) tags.append(element('span', '', tag));
                card.append(tags);
            }
            const actions = element('div', 'paper-actions');
            for (const [label, url, icon, variant] of [
                [paper.source === 'arXiv' ? 'Abstract' : 'Paper', paper.url, 'open_in_new', 'filled'],
                ...(paper.pdf ? [['PDF', paper.pdf, 'picture_as_pdf', 'outlined']] : [])
            ]) {
                const button = element('mdui-button', '', label);
                button.setAttribute('href', url);
                button.setAttribute('target', '_blank');
                button.setAttribute('rel', 'noopener noreferrer');
                button.setAttribute('variant', variant);
                button.setAttribute('icon', icon);
                button.setAttribute('aria-label', `${label}: ${paper.title || paper.id} (opens in new tab)`);
                actions.append(button);
            }
            card.append(actions); list.append(card);
        }
    }
    async function enrich(paper) {
        try {
            if (paper.source !== 'arXiv') {
                if (!paper.doi) return;
                const response = await fetch(`https://api.crossref.org/works/${encodeURIComponent(paper.doi)}`, { signal: AbortSignal.timeout(6000) });
                if (!response.ok) return;
                const { message } = await response.json();
                paper.title ||= message.title?.[0];
                paper.authors ||= message.author?.map(a => [a.given, a.family].filter(Boolean).join(' ')).join(', ');
                paper.date ||= message.published?.['date-parts']?.[0]?.join('-');
                render();
                return;
            }
            const response = await fetch(`https://export.arxiv.org/api/query?id_list=${encodeURIComponent(paper.id)}`, { signal: AbortSignal.timeout(6000) });
            if (!response.ok) return;
            const xml = new DOMParser().parseFromString(await response.text(), 'application/xml');
            const entry = xml.querySelector('entry');
            if (!entry || entry.querySelector('id')?.textContent.includes('/errors')) return;
            paper.title ||= entry.querySelector('title')?.textContent.trim().replace(/\s+/g, ' ');
            paper.authors ||= [...entry.querySelectorAll('author > name')].map(n => n.textContent).join(', ');
            paper.date ||= entry.querySelector('published')?.textContent.slice(0, 10);
            render();
        } catch (_) { /* URL-only cards remain usable when metadata services are unavailable. */ }
    }
    async function init() {
        let metadata = {};
        try {
            const response = await fetch('/reading/metadata.json', { signal: AbortSignal.timeout(4000) });
            if (response.ok) metadata = await response.json();
        } catch (_) {}
        for (const input of window.READING_PAPERS || []) {
            const paper = parsePaper(input);
            if (!paper) { console.warn('Skipping invalid reading entry', input); continue; }
            papers.push({ ...metadata[paper.key], ...paper });
        }
        render();
        papers.filter(p => !p.title).forEach(enrich);
    }
    search.addEventListener('input', render);
    init();
})();
