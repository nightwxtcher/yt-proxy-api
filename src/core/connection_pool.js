
function getYtHeaders(existingHeaders = {}, extraCookies = []) {
    const headers = { ...existingHeaders };
    
    if (!headers["User-Agent"] || headers["User-Agent"] === "node") {
        headers["User-Agent"] = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36";
    }

    headers["Accept-Charset"] = headers["Accept-Charset"] || "ISO-8859-1,utf-8;q=0.7,*;q=0.7";
    headers["Accept"] = headers["Accept"] || "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8";
    headers["Accept-Language"] = headers["Accept-Language"] || "en-us,en;q=0.5";

    let cookieStr = headers["Cookie"] || headers["cookie"] || "";
    
    const consentValue = Math.floor(Math.random() * (999 - 100 + 1) + 100);
    cookieStr += `; CONSENT=PENDING+${consentValue}`;

    if (extraCookies && extraCookies.length > 0) {
        const extraStr = extraCookies.map(c => `${c.name}=${c.value}`).join("; ");
        cookieStr = `${extraStr}; ${cookieStr}`;
    }

    cookieStr = cookieStr.replace(/^;?\s*/, '');
    headers["Cookie"] = cookieStr;
    delete headers["cookie"];

    return headers;
}

module.exports = {
    getYtHeaders
};
