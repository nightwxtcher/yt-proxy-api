async function handleProxy(req, res) {
  try {
    const url = req.query.url;
    const client = req.query.client;
    if (!url) return res.status(400).json({ error: "Missing url" });

    if (url.includes('/api/v1/proxy')) return res.status(400).json({ error: "Recursive proxy detected" });

    let userAgent = "Mozilla/5.0";
    if (client === "IOS") userAgent = "com.google.ios.youtube/20.11.6 (iPhone14,5; U; CPU iOS 18_5 like Mac OS X;)";
    else if (client === "Android") userAgent = "com.google.android.youtube/19.35.36 (Linux; U; Android 13; en_US; SM-S908E Build/TP1A.220624.014) gzip";

    const fetchHeaders = {
      "User-Agent": userAgent,
    };
    
    if (req.headers.range) {
      fetchHeaders.Range = req.headers.range;
    }

    const response = await fetch(url, {
      headers: fetchHeaders,
    });

    res.status(response.status);

    response.headers.forEach((v, k) => {
      const lower = k.toLowerCase();
      if (lower === "content-length" || lower === "content-encoding") return;
      if (lower.startsWith("access-control-")) return;
      if (lower === "location") {
        return res.setHeader("Location", `/api/v1/proxy?url=${encodeURIComponent(v)}&client=${client || ""}`);
      }
      res.setHeader(k, v);
    });

    const contentType = response.headers.get("Content-Type") || "";
    const pathname = new URL(url).pathname;

    if (contentType.includes("mpegurl") || pathname.endsWith(".m3u8")) {
      let text = await response.text();
      const baseUrl = new URL(url);
      const hostMatch = url.match(/https:\/\/([^/]+)/);
      const host = hostMatch ? `https://${hostMatch[1]}` : baseUrl.origin;

      text = text
        .split("\n")
        .map((line) => {
          if (!line || line.trim() === "") return line;

          const wrapUrl = (urlStr) => {
            if (urlStr.includes('/api/v1/proxy')) return urlStr;
            let absolute;
            if (urlStr.startsWith("http")) absolute = urlStr;
            else if (urlStr.startsWith("/")) absolute = `${host}${urlStr}`;
            else {
              const basePath = baseUrl.pathname.replace(/\/[^/]*$/, "/");
              absolute = `${host}${basePath}${urlStr}`;
            }
            let finalProxy = `/api/v1/proxy?url=${encodeURIComponent(absolute)}`;
            if (client) finalProxy += `&client=${client}`;
            return finalProxy;
          };

          if (line.startsWith("#")) {
            if (line.includes('URI="')) {
              return line.replace(/URI="([^"]+)"/g, (match, p1) => `URI="${wrapUrl(p1)}"`);
            }
            return line;
          }

          return wrapUrl(line);
        })
        .join("\n");

      res.setHeader("Content-Type", "application/vnd.apple.mpegurl");
      res.setHeader("Cache-Control", "no-cache");
      return res.send(text);
    } else {
      if (response.body) {
        res.setHeader("Cache-Control", "public, max-age=3600");
        const { Readable } = require("stream");
        Readable.fromWeb(response.body).pipe(res);
      } else {
        res.end();
      }
    }
  } catch (e) {
    console.error("[Proxy Controller] Proxy error:", e);
    if (!res.headersSent) res.status(500).send("Proxy error");
  }
}

module.exports = {
  handleProxy,
};
