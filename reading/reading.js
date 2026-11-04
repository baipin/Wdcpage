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
    function parsePaper(input) {
        const item = typeof input === 'string' ? { url: input } : input;
        if (!item || typeof item.url !== 'string') return null;
        try {
            const url = new URL(item.url);
            if (url.protocol !== 'https:' || !['arxiv.org', 'www.arxiv.org', 'export.arxiv.org'].includes(url.hostname)) return null;
            const match = url.pathname.match(/^\/(?:abs|pdf)\/((?:\d{4}\.\d{4,5}|[a-z-]+(?:\.[A-Z]{2})?\/\d{7})(?:v\d+)?)(?:\.pdf)?\/?$/);
            if (!match) return null;
            return { ...item, id: match[1], url: `https://arxiv.org/abs/${match[1]}` };
        } catch (_) { return null; }
    }
    function link(text, url) {
        const a = element('a', '', text);
        a.href = url; a.target = '_blank'; a.rel = 'noopener noreferrer';
        return a;
    }
    function render() {
        list.replaceChildren();
        const query = (search.value || '').trim().toLowerCase();
        const visible = papers.filter(p => [p.title, p.authors, p.id, p.note, ...(p.tags || [])].join(' ').toLowerCase().includes(query));
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
            meta.append(documentIcon, element('span', '', `arXiv:${paper.id}`));
            if (paper.date) meta.append(element('span', '', paper.date));
            const heading = element('h2');
            heading.append(link(paper.title || `arXiv:${paper.id}`, paper.url));
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
                ['Abstract', paper.url, 'open_in_new', 'filled'],
                ['PDF', `https://arxiv.org/pdf/${paper.id}`, 'picture_as_pdf', 'outlined']
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
            const response = await fetch(`https://export.arxiv.org/api/query?id_list=${encodeURIComponent(paper.id)}`, { signal: AbortSignal.timeout(6000) });
            if (!response.ok) return;
            const xml = new DOMParser().parseFromString(await response.text(), 'application/xml');
            const entry = xml.querySelector('entry');
            if (!entry || entry.querySelector('id')?.textContent.includes('/errors')) return;
            paper.title ||= entry.querySelector('title')?.textContent.trim().replace(/\s+/g, ' ');
            paper.authors ||= [...entry.querySelectorAll('author > name')].map(n => n.textContent).join(', ');
            paper.date ||= entry.querySelector('published')?.textContent.slice(0, 10);
            render();
        } catch (_) { /* URL-only cards remain usable when arXiv is unavailable. */ }
    }
    async function init() {
        let metadata = {};
        try {
            const response = await fetch('/reading/metadata.json', { signal: AbortSignal.timeout(4000) });
            if (response.ok) metadata = await response.json();
        } catch (_) {}
        for (const input of window.READING_PAPERS || []) {
            const paper = parsePaper(input);
            if (!paper) { console.warn('Skipping invalid arXiv reading entry', input); continue; }
            papers.push({ ...metadata[paper.id.replace(/v\d+$/, '')], ...paper });
        }
        render();
        papers.filter(p => !p.title).forEach(enrich);
    }
    search.addEventListener('input', render);
    init();
})();
