const { getYtHeaders } = require("./connection_pool");

const ANDROID_APP_VERSION = "19.35.36";
const ANDROID_VERSION = "13";
const ANDROID_USER_AGENT = `com.google.android.youtube/${ANDROID_APP_VERSION} (Linux; U; Android ${ANDROID_VERSION}; en_US; SM-S908E Build/TP1A.220624.014) gzip`;
const ANDROID_SDK_VERSION = 33;

const ANDROID_TS_APP_VERSION = "1.9";
const ANDROID_TS_USER_AGENT = "com.google.android.youtube/1.9 (Linux; U; Android 12; US) gzip";

const IOS_APP_VERSION = "20.11.6";
const IOS_USER_AGENT = `com.google.ios.youtube/${IOS_APP_VERSION} (iPhone14,5; U; CPU iOS 18_5 like Mac OS X;)`;
const IOS_VERSION = "18.5.0.22F76";

const WINDOWS_VERSION = "10.0";

const ClientType = {
  Web: "Web",
  WebEmbeddedPlayer: "WebEmbeddedPlayer",
  WebMobile: "WebMobile",
  WebScreenEmbed: "WebScreenEmbed",
  WebCreator: "WebCreator",

  Android: "Android",
  AndroidEmbeddedPlayer: "AndroidEmbeddedPlayer",
  AndroidScreenEmbed: "AndroidScreenEmbed",
  AndroidTestSuite: "AndroidTestSuite",

  IOS: "IOS",
  IOSEmbedded: "IOSEmbedded",
  IOSMusic: "IOSMusic",

  TvHtml5: "TvHtml5",
  TvHtml5ScreenEmbed: "TvHtml5ScreenEmbed",
  TvSimply: "TvSimply",
};

const HARDCODED_CLIENTS = {
  [ClientType.Web]: {
    name: "WEB",
    name_proto: "1",
    version: "2.20250222.10.00",
    screen: "WATCH_FULL_SCREEN",
    os_name: "Windows",
    os_version: WINDOWS_VERSION,
    platform: "DESKTOP",
  },
  [ClientType.WebEmbeddedPlayer]: {
    name: "WEB_EMBEDDED_PLAYER",
    name_proto: "56",
    version: "1.20250219.01.00",
    screen: "EMBED",
    os_name: "Windows",
    os_version: WINDOWS_VERSION,
    platform: "DESKTOP",
  },
  [ClientType.WebMobile]: {
    name: "MWEB",
    name_proto: "2",
    version: "2.20250224.01.00",
    os_name: "Android",
    os_version: ANDROID_VERSION,
    platform: "MOBILE",
  },
  [ClientType.WebScreenEmbed]: {
    name: "WEB",
    name_proto: "1",
    version: "2.20250222.10.00",
    screen: "EMBED",
    os_name: "Windows",
    os_version: WINDOWS_VERSION,
    platform: "DESKTOP",
  },
  [ClientType.WebCreator]: {
    name: "WEB_CREATOR",
    name_proto: "62",
    version: "1.20241203.01.00",
    os_name: "Windows",
    os_version: WINDOWS_VERSION,
    platform: "DESKTOP",
  },

  [ClientType.AndroidEmbeddedPlayer]: {
    name: "ANDROID_EMBEDDED_PLAYER",
    name_proto: "55",
    version: ANDROID_APP_VERSION,
  },
  [ClientType.AndroidScreenEmbed]: {
    name: "ANDROID",
    name_proto: "3",
    version: ANDROID_APP_VERSION,
    screen: "EMBED",
    android_sdk_version: ANDROID_SDK_VERSION,
    user_agent: ANDROID_USER_AGENT,
    os_name: "Android",
    os_version: ANDROID_VERSION,
    platform: "MOBILE",
  },
  [ClientType.AndroidTestSuite]: {
    name: "ANDROID_TESTSUITE",
    name_proto: "30",
    version: ANDROID_TS_APP_VERSION,
    android_sdk_version: ANDROID_SDK_VERSION,
    user_agent: ANDROID_TS_USER_AGENT,
    os_name: "Android",
    os_version: ANDROID_VERSION,
    platform: "MOBILE",
  },

  [ClientType.IOSEmbedded]: {
    name: "IOS_MESSAGES_EXTENSION",
    name_proto: "66",
    version: IOS_APP_VERSION,
    user_agent: IOS_USER_AGENT,
    device_make: "Apple",
    device_model: "iPhone14,5",
    os_name: "iPhone",
    os_version: IOS_VERSION,
    platform: "MOBILE",
  },
  [ClientType.IOSMusic]: {
    name: "IOS_MUSIC",
    name_proto: "26",
    version: "7.14",
    user_agent: "com.google.ios.youtubemusic/7.14 (iPhone14,5; U; CPU iOS 17_6 like Mac OS X;)",
    device_make: "Apple",
    device_model: "iPhone14,5",
    os_name: "iPhone",
    os_version: IOS_VERSION,
    platform: "MOBILE",
  },

  [ClientType.TvHtml5]: {
    name: "TVHTML5",
    name_proto: "7",
    version: "7.20250219.14.00",
  },
  [ClientType.TvHtml5ScreenEmbed]: {
    name: "TVHTML5_SIMPLY_EMBEDDED_PLAYER",
    name_proto: "85",
    version: "2.0",
    screen: "EMBED",
  },
  [ClientType.TvSimply]: {
    name: "TVHTML5_SIMPLY",
    name_proto: "74",
    version: "1.0",
  },
};

class ClientConfig {
  constructor(options = {}) {
    this.client_type = options.client_type || ClientType.Web;
    this.region = options.region || "US";
  }

  get name() {
    return HARDCODED_CLIENTS[this.client_type].name;
  }
  get name_proto() {
    return HARDCODED_CLIENTS[this.client_type].name_proto;
  }
  get version() {
    return HARDCODED_CLIENTS[this.client_type].version;
  }
  get screen() {
    return HARDCODED_CLIENTS[this.client_type].screen || "";
  }
  get android_sdk_version() {
    return HARDCODED_CLIENTS[this.client_type].android_sdk_version;
  }
  get user_agent() {
    return HARDCODED_CLIENTS[this.client_type].user_agent;
  }
  get os_name() {
    return HARDCODED_CLIENTS[this.client_type].os_name;
  }
  get device_make() {
    return HARDCODED_CLIENTS[this.client_type].device_make;
  }
  get device_model() {
    return HARDCODED_CLIENTS[this.client_type].device_model;
  }
  get os_version() {
    return HARDCODED_CLIENTS[this.client_type].os_version;
  }
  get platform() {
    return HARDCODED_CLIENTS[this.client_type].platform;
  }

  toString() {
    return JSON.stringify({
      client_type: this.name,
      region: this.region,
    });
  }
}

const DEFAULT_CLIENT_CONFIG = new ClientConfig();

function makeContext(clientConfig = null, videoId = "dQw4w9WgXcQ") {
  clientConfig = clientConfig || DEFAULT_CLIENT_CONFIG;

  const clientContext = {
    client: {
      hl: "en",
      gl: clientConfig.region || "US",
      clientName: clientConfig.name,
      clientVersion: clientConfig.version,
    },
  };

  if (clientConfig.screen) {
    clientContext.client.clientScreen = clientConfig.screen;
  }

  if (clientConfig.screen === "EMBED") {
    clientContext.thirdParty = {
      embedUrl: `https://www.youtube.com/embed/${videoId}`,
    };
  }

  if (clientConfig.android_sdk_version) {
    clientContext.client.androidSdkVersion = clientConfig.android_sdk_version;
  }

  if (clientConfig.device_make) {
    clientContext.client.deviceMake = clientConfig.device_make;
  }

  if (clientConfig.device_model) {
    clientContext.client.deviceModel = clientConfig.device_model;
  }

  if (clientConfig.os_name) {
    clientContext.client.osName = clientConfig.os_name;
  }

  if (clientConfig.os_version) {
    clientContext.client.osVersion = clientConfig.os_version;
  }

  if (clientConfig.platform) {
    clientContext.client.platform = clientConfig.platform;
  }

  return clientContext;
}

async function _postJson(endpoint, data, clientConfig = null) {
  clientConfig = clientConfig || DEFAULT_CLIENT_CONFIG;

  const url = `https://www.youtube.com${endpoint}?prettyPrint=false`;

  const baseHeaders = {
    "Content-Type": "application/json; charset=UTF-8",
    "Accept-Encoding": "gzip, deflate",
    "x-goog-api-format-version": "2",
    "x-youtube-client-name": clientConfig.name_proto,
    "x-youtube-client-version": clientConfig.version,
  };

  if (clientConfig.user_agent) {
    baseHeaders["User-Agent"] = clientConfig.user_agent;
  }

  const headers = getYtHeaders(baseHeaders);

  const init = {
    method: "POST",
    headers: headers,
    body: JSON.stringify(data),
  };

  const response = await fetch(url, init);

  if (!response.ok) {
    throw new Error(
      `Error: non 200 status code. Youtube API returned status code ${response.status}. See https://docs.invidious.io/youtube-errors-explained/ for troubleshooting.`,
    );
  }

  const jsonData = await response.json();

  if (jsonData.error) {
    const code = jsonData.error.code;
    const message = String(jsonData.error.message).replace(/(\n)+\^$/, "");
    throw new Error(`Could not extract JSON. Youtube API returned error ${code} with message:\n"${message}"`);
  }

  return jsonData;
}

const YoutubeAPI = {
  ClientType,
  ClientConfig,

  async browse(continuationOrBrowseId, options = {}) {
    const { params, clientConfig } = options;

    const data = {
      context: makeContext(clientConfig),
    };

    if (params !== undefined || (arguments.length >= 2 && typeof options === "string")) {
      data.browseId = continuationOrBrowseId;
      if (options && typeof options === "string") {
        data.params = options;
      } else if (params !== undefined && params !== "") {
        data.params = params;
      }
    } else {
      data.continuation = continuationOrBrowseId;
    }

    return await _postJson("/youtubei/v1/browse", data, clientConfig);
  },

  async next(dataOrContinuation, clientConfig = null) {
    let data = {
      context: makeContext(clientConfig),
    };

    if (typeof dataOrContinuation === "string") {
      data.continuation = dataOrContinuation;
    } else if (typeof dataOrContinuation === "object") {
      data = { ...dataOrContinuation, ...data };
    }

    return await _postJson("/youtubei/v1/next", data, clientConfig);
  },

  async player(videoId, clientConfig = null) {
    const data = {
      videoId: videoId,
      context: makeContext(clientConfig, videoId),
    };
    return await _postJson("/youtubei/v1/player", data, clientConfig);
  },

  async resolve_url(url, clientConfig = null) {
    const data = {
      context: makeContext(clientConfig),
      url: url,
    };
    return await _postJson("/youtubei/v1/navigation/resolve_url", data, clientConfig);
  },

  async search(searchQuery, params = "", clientConfig = null) {
    const data = {
      query: searchQuery,
      context: makeContext(clientConfig),
      params: params,
    };
    return await _postJson("/youtubei/v1/search", data, clientConfig);
  },

  async get_transcript(params, clientConfig = null) {
    const data = {
      context: makeContext(clientConfig),
      params: params,
    };
    return await _postJson("/youtubei/v1/get_transcript", data, clientConfig);
  },
};

module.exports = YoutubeAPI;
