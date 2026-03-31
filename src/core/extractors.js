const { extractText, hasVerifiedBadge, extractSelectedTab } = require('./extractors_utils');

function getBrowseId(container) {
    try {
        return container.navigationEndpoint.browseEndpoint.browseId || "";
    } catch(e) { return ""; }
}

function getThumbnails(container) {
    try {
        return container.thumbnail.thumbnails[0].url;
    } catch(e) { return null; }
}

function getThumbnailsPlural(container) {
    try {
        return container.thumbnails[0].thumbnails[0].url;
    } catch(e) { return null; }
}

function getVideoCount(container) {
    try {
        let box = container.videoCountText;
        if (box) {
            let txt = extractText(box);
            if (txt && !txt.includes(" subscriber")) {
                return parseInt(txt.replace(/\D/g, ""), 10) || 0;
            }
            return 0;
        }
        if (container.videoCount) {
            return parseInt(container.videoCount, 10) || 0;
        }
    } catch(e) {}
    return 0;
}

function decodeDate(str) {
    return str || new Date().toISOString(); 
}

function decodeLengthSeconds(str) {
    if (!str) return 0;
    const parts = str.split(':').map(Number);
    let seconds = 0;
    if (parts.length === 3) {
        seconds = parts[0] * 3600 + parts[1] * 60 + parts[2];
    } else if (parts.length === 2) {
        seconds = parts[0] * 60 + parts[1];
    } else {
        seconds = parts[0];
    }
    return seconds || 0;
}

function shortTextToNumber(str) {
    if (!str) return 0;
    str = str.replace(/,/g, '');
    let mult = 1;
    if (str.includes('K')) { mult = 1000; str = str.replace('K',''); }
    if (str.includes('M')) { mult = 1000000; str = str.replace('M',''); }
    if (str.includes('B')) { mult = 1000000000; str = str.replace('B',''); }
    return Math.floor(parseFloat(str) * mult) || 0;
}

const PARSERS = {
    VideoRendererParser: (item, authorFallback) => {
        const content = item.videoRenderer || item.gridVideoRenderer;
        if (!content) return null;
        
        let author = authorFallback.name;
        let author_id = authorFallback.id;
        try {
            if (content.ownerText?.runs?.[0]) {
                author = content.ownerText.runs[0].text;
                author_id = getBrowseId(content.ownerText.runs[0]);
            } else if (content.shortBylineText?.runs?.[0]) {
                author = content.shortBylineText.runs[0].text;
                author_id = getBrowseId(content.shortBylineText.runs[0]);
            }
        } catch(e) {}

        let lengthSeconds = 0;
        if (content.lengthText) {
            lengthSeconds = decodeLengthSeconds(content.lengthText.simpleText);
        } else if (content.thumbnailOverlays) {
            const overlay = content.thumbnailOverlays.find(o => o.thumbnailOverlayTimeStatusRenderer);
            if (overlay) {
                const text = extractText(overlay.thumbnailOverlayTimeStatusRenderer.text);
                if (text === "SHORTS") lengthSeconds = 60;
                else lengthSeconds = decodeLengthSeconds(text);
            }
        }

        let viewCount = 0;
        if (content.viewCountText?.simpleText) {
            viewCount = parseInt(content.viewCountText.simpleText.replace(/\D/g, ""), 10) || 0;
        }

        return {
            type: "SearchVideo",
            title: extractText(content.title) || "",
            id: content.videoId || "",
            author: author,
            ucid: author_id,
            published: content.publishedTimeText?.simpleText || "",
            views: viewCount,
            description_html: content.descriptionSnippet ? extractText(content.descriptionSnippet) : "",
            length_seconds: lengthSeconds,
            author_verified: hasVerifiedBadge(content.ownerBadges),
            author_thumbnail: content.channelThumbnailSupportedRenderers?.channelThumbnailWithLinkRenderer?.thumbnail?.thumbnails?.[0]?.url || null
        };
    },
    ChannelRendererParser: (item, authorFallback) => {
        const content = item.channelRenderer || item.gridChannelRenderer;
        if (!content) return null;

        let subscriberCountRaw = content.subscriberCountText?.simpleText || "";
        let subscriberCount = 0;
        let channelHandle = null;

        if (subscriberCountRaw.startsWith("@")) {
            channelHandle = subscriberCountRaw;
        }
        
        if (!subscriberCountRaw || !subscriberCountRaw.includes(" subscriber")) {
            subscriberCountRaw = content.videoCountText?.simpleText || "";
        }
        subscriberCount = shortTextToNumber(subscriberCountRaw.split(" ")[0]);

        return {
            type: "SearchChannel",
            author: extractText(content.title) || authorFallback.name,
            ucid: content.channelId || authorFallback.id,
            author_thumbnail: getThumbnails(content),
            subscriber_count: subscriberCount,
            video_count: getVideoCount(content),
            channel_handle: channelHandle,
            description_html: extractText(content.descriptionSnippet) || "",
            auto_generated: !content.videoCountText,
            author_verified: hasVerifiedBadge(content.ownerBadges)
        };
    },
    PlaylistRendererParser: (item, authorFallback) => {
        const content = item.playlistRenderer;
        if (!content) return null;

        let authorInfo = content.shortBylineText?.runs?.[0];
        let videos = (content.videos || []).map(v => {
            const cv = v.childVideoRenderer;
            return {
                title: cv?.title?.simpleText || "",
                id: cv?.videoId || "",
                length_seconds: decodeLengthSeconds(cv?.lengthText?.simpleText)
            };
        });

        return {
            type: "SearchPlaylist",
            title: extractText(content.title) || "",
            id: content.playlistId || "",
            author: authorInfo?.text || authorFallback.name,
            ucid: authorInfo ? getBrowseId(authorInfo) : authorFallback.id,
            video_count: getVideoCount(content),
            videos: videos,
            thumbnail: getThumbnailsPlural(content),
            author_verified: hasVerifiedBadge(content.ownerBadges)
        };
    },
    RichItemRendererParser: (item, authorFallback) => {
        if (!item.richItemRenderer || !item.richItemRenderer.content) return null;
        const inner = item.richItemRenderer.content;
        return PARSERS.VideoRendererParser(inner, authorFallback) || 
               PARSERS.PlaylistRendererParser(inner, authorFallback);
    },
    ContinuationItemRendererParser: (item, authorFallback) => {
        if (!item.continuationItemRenderer) return null;
        try {
            const token = item.continuationItemRenderer.continuationEndpoint.continuationCommand.token;
            if (token) return { type: "Continuation", token };
        } catch(e) {}
        return null;
    }
};

const EXTRACTORS = {
    YouTubeTabs: (data) => {
        if (data.twoColumnBrowseResultsRenderer) {
            try {
                const target = data.twoColumnBrowseResultsRenderer;
                const tab = extractSelectedTab(target.tabs);
                let content = tab.content;
                let raw_items = [];
                if (content.sectionListRenderer?.contents) {
                    content.sectionListRenderer.contents.forEach(sec => {
                        if (sec.itemSectionRenderer?.contents) {
                            sec.itemSectionRenderer.contents.forEach(item => {
                                if (item.gridRenderer?.items) {
                                    raw_items.push(...item.gridRenderer.items);
                                } else {
                                    raw_items.push(item);
                                }
                            });
                        } else {
                            raw_items.push(sec);
                        }
                    });
                    return raw_items;
                } else if (content.richGridRenderer?.contents) {
                    return content.richGridRenderer.contents;
                }
            } catch(e) {}
        }
        return null;
    },
    SearchResults: (data) => {
        if (data.twoColumnSearchResultsRenderer) {
            try {
                let items = [];
                const contents = data.twoColumnSearchResultsRenderer.primaryContents.sectionListRenderer.contents;
                contents.forEach(node => {
                    if (node.itemSectionRenderer) {
                        items.push(...node.itemSectionRenderer.contents);
                    }
                });
                return items;
            } catch(e) {}
        }
        return null;
    },
    ContinuationContent: (data) => {
        const target = data.continuationContents || data.appendContinuationItemsAction || data.reloadContinuationItemsCommand;
        if (!target) return null;
        return target.continuationItems || target.gridContinuation?.items || target.richGridContinuation?.contents || [];
    }
};

function parseItem(item, authorFallbackName = "", authorFallbackId = "") {
    const fallback = { name: authorFallbackName, id: authorFallbackId };
    for (const parserKey in PARSERS) {
        const result = PARSERS[parserKey](item, fallback);
        if (result) return result;
    }
    return null;
}

function extractItems(initialData, authorFallbackName = "", authorFallbackId = "") {
    let unpackaged = initialData;
    if (initialData.contents) unpackaged = initialData.contents;
    else if (initialData.response) unpackaged = initialData.response;
    else if (initialData.onResponseReceivedActions) {
        unpackaged = initialData.onResponseReceivedActions[1] || initialData.onResponseReceivedActions[0];
    }

    let rawContainer = null;
    for (const extKey in EXTRACTORS) {
        rawContainer = EXTRACTORS[extKey](unpackaged);
        if (rawContainer) break;
    }

    if (!rawContainer) {
        rawContainer = Array.isArray(unpackaged) ? unpackaged : [];
    }

    const items = [];
    let continuation = null;

    rawContainer.forEach(rawItem => {
        const parsed = parseItem(rawItem, authorFallbackName, authorFallbackId);
        if (parsed) {
            if (parsed.type === "Continuation") {
                continuation = parsed.token;
            } else {
                items.push(parsed);
            }
        }
    });

    return { items, continuation };
}

module.exports = {
    parseItem,
    extractItems
};
