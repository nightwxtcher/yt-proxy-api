const ALLOWED_QUERY_PARAMS = {
    channel:  ["u", "user", "lb"],
    playlist: ["list"],
    search:   ["q", "search_query", "sp"],
    watch:    [
        "list", "index",
        "playlist",
        "t", "time_continue", "start", "end",
        "lc",
    ]
};

function isAsciiWord(str) {
    return /^[\w-]+$/.test(str);
}

function determineAllowed(pathRoot) {
    if (!pathRoot) return null;
    if (["watch", "w", "v", "embed", "e", "shorts", "clip"].includes(pathRoot)) {
        return "watch";
    }
    if (pathRoot.startsWith("@") || ["c", "channel", "user", "profile", "attribution_link"].includes(pathRoot)) {
        return "channel";
    }
    if (["playlist", "mix"].includes(pathRoot)) {
        return "playlist";
    }
    if (["results", "search"].includes(pathRoot)) {
        return "search";
    }
    return null;
}

function copyParams(unsafeSearchParams, allowedType) {
    const newParams = new URLSearchParams();
    if (!allowedType || !ALLOWED_QUERY_PARAMS[allowedType]) return newParams;
    
    for (const name of ALLOWED_QUERY_PARAMS[allowedType]) {
        if (unsafeSearchParams.has(name)) {
            const values = unsafeSearchParams.getAll(name);
            newParams.set(name, values[values.length - 1]);
        }
    }
    return newParams;
}

function processUrl(str) {
    if (!str.startsWith('http://') && !str.startsWith('https://')) {
        str = 'https://' + str;
    }

    let unsafeUrl;
    try {
        unsafeUrl = new URL(str);
    } catch (e) {
        return new URL('https://www.youtube.com/');
    }

    let newUrl = new URL('https://www.youtube.com/');

    const breadcrumbs = unsafeUrl.pathname.split('/').filter(bc => {
        if (!bc || bc === '.' || bc === '..') return false;
        if (!isAsciiWord(bc)) return false;
        return true;
    });

    if (breadcrumbs.length === 0) {
        return newUrl;
    }

    if (unsafeUrl.hostname.endsWith('youtube.com')) {
        newUrl.pathname = '/' + breadcrumbs.join('/');
        const allowed = determineAllowed(breadcrumbs[0]);
        newUrl.search = copyParams(unsafeUrl.searchParams, allowed).toString();
    } else if (unsafeUrl.hostname === 'youtu.be') {
        newUrl.pathname = '/watch';
        const newParams = copyParams(unsafeUrl.searchParams, 'watch');
        if (breadcrumbs[0]) {
            newParams.set('v', breadcrumbs[0]);
        }
        newUrl.search = newParams.toString();
    }

    return newUrl;
}

module.exports = {
    ALLOWED_QUERY_PARAMS,
    isAsciiWord,
    determineAllowed,
    copyParams,
    processUrl
};
