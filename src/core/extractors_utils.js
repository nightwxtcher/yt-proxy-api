function extractText(item) {
    if (!item) return null;
    
    if (item.simpleText) {
        return item.simpleText;
    } else if (item.runs && Array.isArray(item.runs)) {
        return item.runs.map(r => r.text || "").join("");
    }
    return null;
}

function hasVerifiedBadge(badges) {
    if (!badges || !Array.isArray(badges)) return false;

    for (const badge of badges) {
        try {
            const style = badge?.metadataBadgeRenderer?.style;
            if (style === "BADGE_STYLE_TYPE_VERIFIED" || style === "BADGE_STYLE_TYPE_VERIFIED_ARTIST") {
                return true;
            }
        } catch (e) {
        }
    }
    return false;
}

function extractSelectedTab(tabs) {
    if (!tabs || !Array.isArray(tabs)) return null;
    const selected = tabs.find(t => t?.tabRenderer?.selected === true);
    return selected ? selected.tabRenderer : null;
}

module.exports = {
    extractText,
    hasVerifiedBadge,
    extractSelectedTab
};
