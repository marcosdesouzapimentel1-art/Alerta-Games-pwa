"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.normalizeTitle = normalizeTitle;
exports.normalizeUrl = normalizeUrl;
exports.generateArticleId = generateArticleId;
exports.deduplicateArticles = deduplicateArticles;
function normalizeTitle(title) {
    if (!title)
        return '';
    return title
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9\s]/gi, ' ')
        .replace(/\s+/g, ' ')
        .trim();
}
function normalizeUrl(url) {
    if (!url)
        return '';
    try {
        const parsed = new URL(url.trim());
        let cleanPath = parsed.pathname.replace(/\/+$/, '');
        if (!cleanPath)
            cleanPath = '/';
        return `${parsed.protocol}//${parsed.hostname}${cleanPath}`;
    }
    catch {
        return url.trim().toLowerCase().replace(/\/+$/, '');
    }
}
function generateArticleId(title, source) {
    const normTitle = normalizeTitle(title).replace(/\s+/g, '-').slice(0, 50);
    const normSource = source.toLowerCase().replace(/[^a-z0-9]/g, '');
    return `${normSource}-${normTitle}`;
}
function deduplicateArticles(newArticles, existingItems) {
    const seenIds = new Set();
    const seenUrls = new Set();
    const seenTitles = new Set();
    for (const item of existingItems) {
        if (item.id)
            seenIds.add(item.id);
        if (item.url)
            seenUrls.add(normalizeUrl(item.url));
        if (item.title)
            seenTitles.add(normalizeTitle(item.title));
    }
    const uniqueArticles = [];
    let duplicatesCount = 0;
    for (const article of newArticles) {
        const normUrl = normalizeUrl(article.url);
        const normTitle = normalizeTitle(article.title);
        const articleId = article.id || generateArticleId(article.title, article.source || 'news');
        if (seenIds.has(articleId) || seenUrls.has(normUrl) || seenTitles.has(normTitle)) {
            duplicatesCount++;
            continue;
        }
        seenIds.add(articleId);
        seenUrls.add(normUrl);
        seenTitles.add(normTitle);
        uniqueArticles.push({
            ...article,
            id: articleId
        });
    }
    return { uniqueArticles, duplicatesCount };
}
//# sourceMappingURL=deduplicate.js.map