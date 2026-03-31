const YoutubeAPI = require("../core/youtube_api");
const { extractItems } = require("../core/extractors");

async function search(req, res) {
  try {
    const q = req.query.q;
    if (!q) return res.status(400).json({ error: "Missing query" });

    const config = new YoutubeAPI.ClientConfig({
      client_type: YoutubeAPI.ClientType.Web,
    });

    const raw = await YoutubeAPI.search(q, "", config);
    const { items } = extractItems(raw);

    const videos = items.filter((i) => i.type === "SearchVideo").slice(0, 10);
    res.json(videos);
  } catch (e) {
    console.error("[Search Controller] Error:", e);
    res.status(500).json({ error: "Search error" });
  }
}

module.exports = {
  search,
};
