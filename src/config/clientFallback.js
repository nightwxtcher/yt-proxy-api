const YoutubeAPI = require("../core/youtube_api");

const CLIENTS = [
  YoutubeAPI.ClientType.WebEmbeddedPlayer,
  YoutubeAPI.ClientType.TvHtml5,
  YoutubeAPI.ClientType.IOS,
  YoutubeAPI.ClientType.Android,
  YoutubeAPI.ClientType.AndroidMusic,
  YoutubeAPI.ClientType.IOSMusic,
  YoutubeAPI.ClientType.AndroidTestSuite,
  YoutubeAPI.ClientType.Web,
  YoutubeAPI.ClientType.WebMobile,
  YoutubeAPI.ClientType.WebScreenEmbed,
  YoutubeAPI.ClientType.WebCreator,
  YoutubeAPI.ClientType.TvHtml5,
  YoutubeAPI.ClientType.TvSimply,
];

async function getWorkingPlayer(videoId) {
  for (const type of CLIENTS) {
    try {
      const config = new YoutubeAPI.ClientConfig({ client_type: type });
      const res = await YoutubeAPI.player(videoId, config);
      const status = res?.playabilityStatus?.status;

      if (status === "OK") {
        return { player: res, clientType: type };
      }
    } catch (e) {
      console.log(`[YoutubeAPI] ❌ ${type}:`, e.message);
    }
  }

  throw new Error("All clients failed");
}

module.exports = {
  getWorkingPlayer,
};
