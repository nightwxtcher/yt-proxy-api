const { getWorkingPlayer } = require("../config/clientFallback");

async function resolveVideo(req, res) {
  try {
    const videoId = req.params.id;
    const { player, clientType } = await getWorkingPlayer(videoId);

    if (!player.streamingData?.hlsManifestUrl) {
      return res.status(500).json({ error: "No HLS available" });
    }

    const formats = player.streamingData?.adaptiveFormats
      ? player.streamingData.adaptiveFormats
          .filter(f => f.qualityLabel && f.mimeType.startsWith('video/'))
          .map(f => ({
            itag: f.itag,
            quality: f.qualityLabel,
            height: f.height
          }))
      : [];

    res.json({
      title: player.videoDetails.title,
      author: player.videoDetails.author,
      hls: `/proxy?url=${encodeURIComponent(player.streamingData.hlsManifestUrl)}&client=${clientType}`,
      formats
    });
  } catch (e) {
    console.error("[Video Controller] Resolve error:", e);
    res.status(500).json({ error: "Resolve error" });
  }
}

async function resolveAudio(req, res) {
  try {
    const videoId = req.params.id;
    const { player, clientType } = await getWorkingPlayer(videoId);

    if (!player.streamingData?.hlsManifestUrl) {
      return res.status(404).json({ error: "No HLS available" });
    }

    const hlsUrl = player.streamingData.hlsManifestUrl;

    let userAgent = "Mozilla/5.0";
    if (clientType === "IOS") userAgent = "com.google.ios.youtube/20.11.6 (iPhone14,5; U; CPU iOS 18_5 like Mac OS X;)";
    else if (clientType === "Android") userAgent = "com.google.android.youtube/19.35.36 (Linux; U; Android 13; en_US; SM-S908E Build/TP1A.220624.014) gzip";

    const m3u8Res = await fetch(hlsUrl, { headers: { "User-Agent": userAgent } });
    const m3u8Text = await m3u8Res.text();

    const audioLine = m3u8Text.split("\n").find((l) => l.startsWith("#EXT-X-MEDIA:") && l.includes("TYPE=AUDIO"));
    let audioPlaylistUrl = null;

    if (audioLine) {
      const uriMatch = audioLine.match(/URI="([^"]+)"/);
      if (uriMatch) audioPlaylistUrl = uriMatch[1];
    }

    if (!audioPlaylistUrl) {
      const streamLines = m3u8Text.split("\n").filter((l) => l && !l.startsWith("#"));
      if (streamLines.length > 0) audioPlaylistUrl = streamLines[streamLines.length - 1];
    }

    if (!audioPlaylistUrl) return res.status(404).json({ error: "Playlist parsing failed" });

    const baseMasterUrl = new URL(hlsUrl);
    if (!audioPlaylistUrl.startsWith("http")) {
      if (audioPlaylistUrl.startsWith("/")) audioPlaylistUrl = `${baseMasterUrl.origin}${audioPlaylistUrl}`;
      else audioPlaylistUrl = `${baseMasterUrl.origin}${baseMasterUrl.pathname.replace(/\/[^/]*$/, "/")}${audioPlaylistUrl}`;
    }

    res.json({
      title: player.videoDetails?.title,
      author: player.videoDetails?.author,
      mimeType: "application/vnd.apple.mpegurl",
      audioUrl: `/proxy?url=${encodeURIComponent(audioPlaylistUrl)}&client=${clientType}`,
    });
  } catch (e) {
    console.error("[Video Controller] Resolve audio error:", e);
    res.status(500).json({ error: "Resolve audio error" });
  }
}

async function downloadAudio(req, res) {
  try {
    const videoId = req.params.id;
    const { player, clientType } = await getWorkingPlayer(videoId);

    if (!player.streamingData?.hlsManifestUrl) {
      return res.status(404).json({ error: "No HLS available" });
    }

    const hlsUrl = player.streamingData.hlsManifestUrl;

    let userAgent = "Mozilla/5.0";
    if (clientType === "IOS") userAgent = "com.google.ios.youtube/20.11.6 (iPhone14,5; U; CPU iOS 18_5 like Mac OS X;)";
    else if (clientType === "Android") userAgent = "com.google.android.youtube/19.35.36 (Linux; U; Android 13; en_US; SM-S908E Build/TP1A.220624.014) gzip";

    const m3u8Res = await fetch(hlsUrl, { headers: { "User-Agent": userAgent } });
    const m3u8Text = await m3u8Res.text();

    const audioLine = m3u8Text.split("\n").find((l) => l.startsWith("#EXT-X-MEDIA:") && l.includes("TYPE=AUDIO"));
    let audioPlaylistUrl = null;
    if (audioLine) {
      const uriMatch = audioLine.match(/URI="([^"]+)"/);
      if (uriMatch) audioPlaylistUrl = uriMatch[1];
    }

    if (!audioPlaylistUrl) {
      const streamLines = m3u8Text.split("\n").filter((l) => l && !l.startsWith("#"));
      if (streamLines.length > 0) audioPlaylistUrl = streamLines[streamLines.length - 1];
    }

    if (!audioPlaylistUrl) return res.status(404).json({ error: "Playlist parsing failed" });

    const baseMasterUrl = new URL(hlsUrl);
    if (!audioPlaylistUrl.startsWith("http")) {
      if (audioPlaylistUrl.startsWith("/")) audioPlaylistUrl = `${baseMasterUrl.origin}${audioPlaylistUrl}`;
      else audioPlaylistUrl = `${baseMasterUrl.origin}${baseMasterUrl.pathname.replace(/\/[^/]*$/, "/")}${audioPlaylistUrl}`;
    }

    const playlistRes = await fetch(audioPlaylistUrl, { headers: { "User-Agent": userAgent } });
    const playlistText = await playlistRes.text();

    const baseUrl = new URL(audioPlaylistUrl);
    const hostMatch = audioPlaylistUrl.match(/https:\/\/([^/]+)/);
    const host = hostMatch ? `https://${hostMatch[1]}` : baseUrl.origin;

    const segments = [];
    playlistText.split("\n").forEach((line) => {
      if (!line) return;

      let extractedUri = null;
      if (line.startsWith("#EXT-X-MAP:")) {
        const match = line.match(/URI="([^"]+)"/);
        if (match) extractedUri = match[1];
      } else if (!line.startsWith("#")) {
        extractedUri = line;
      }

      if (extractedUri) {
        let finalUrl = extractedUri;
        if (!extractedUri.startsWith("http")) {
          if (extractedUri.startsWith("/")) finalUrl = `${host}${extractedUri}`;
          else {
            const basePath = baseUrl.pathname.replace(/\/[^/]*$/, "/");
            finalUrl = `${host}${basePath}${extractedUri}`;
          }
        }
        segments.push(finalUrl);
      }
    });

    if (segments.length === 0) return res.status(404).json({ error: "No segments found" });

    const safeTitle = (player.videoDetails?.title || videoId).replace(/[^a-zA-Z0-9 ]/g, "_");
    res.setHeader("Content-Disposition", `attachment; filename="${safeTitle}.m4a"`);
    res.setHeader("Content-Type", "audio/mp4");

    for (const segmentUrl of segments) {
      const segRes = await fetch(segmentUrl, { headers: { "User-Agent": userAgent } });
      if (!segRes.ok) continue;

      if (segRes.body) {
        for await (const chunk of segRes.body) {
          res.write(chunk);
        }
      }
    }

    res.end();
  } catch (e) {
    console.error("[Video Controller] Download error:", e);
    if (!res.headersSent) res.status(500).json({ error: "Download error" });
    else res.end();
  }
}

module.exports = {
  resolveVideo,
  resolveAudio,
  downloadAudio,
};
