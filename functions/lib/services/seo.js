"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateSeoData = generateSeoData;
function generateSeoData(titlePt, summaryPt, analysis) {
    if (analysis?.seoTitle && analysis?.seoDescription) {
        return {
            seoTitle: analysis.seoTitle.slice(0, 70),
            seoDescription: analysis.seoDescription.slice(0, 160)
        };
    }
    const cleanTitle = titlePt.trim();
    const cleanSummary = summaryPt.trim();
    const seoTitle = cleanTitle.length > 60 ? `${cleanTitle.slice(0, 57)}...` : cleanTitle;
    const seoDescription = cleanSummary.length > 155 ? `${cleanSummary.slice(0, 152)}...` : cleanSummary;
    return {
        seoTitle,
        seoDescription
    };
}
//# sourceMappingURL=seo.js.map