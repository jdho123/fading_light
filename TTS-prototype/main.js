#!/usr/bin/env node
/* eslint-disable no-console */
(function (global) {
  const isNode = typeof process !== "undefined" && process.versions && process.versions.node;
  const isBrowser = typeof window !== "undefined" && typeof document !== "undefined";

  function normalizeVoiceMap(voiceMap) {
    const map = {};
    if (!voiceMap || typeof voiceMap !== "object") return map;
    for (const [key, value] of Object.entries(voiceMap)) {
      if (key == null || value == null) continue;
      map[String(key).trim().toLowerCase()] = String(value).trim();
    }
    return map;
  }

  function createTTSClient(options = {}) {
    let endpoint = options.endpoint || "http://127.0.0.1:8000/tts";
    let voiceMap = normalizeVoiceMap(options.voiceMap || {});
    let defaultVoiceId = options.defaultVoiceId || null;
    const queueEnabled = options.queue !== false;

    let audioQueue = [];
    let playing = false;
    const sharedAudio = queueEnabled ? new Audio() : null;

    function resolveVoiceId(sender, explicitVoiceId) {
      if (explicitVoiceId) return explicitVoiceId;
      const key = String(sender || "").trim().toLowerCase();
      return voiceMap[key] || defaultVoiceId || "";
    }

    function playBlob(blob) {
      if (!queueEnabled) {
        const audio = new Audio(URL.createObjectURL(blob));
        return audio.play();
      }

      return new Promise((resolve, reject) => {
        audioQueue.push({ blob, resolve, reject });
        if (!playing) pumpQueue();
      });
    }

    async function pumpQueue() {
      playing = true;
      while (audioQueue.length) {
        const { blob, resolve, reject } = audioQueue.shift();
        try {
          const url = URL.createObjectURL(blob);
          sharedAudio.src = url;
          sharedAudio.onended = () => {
            URL.revokeObjectURL(url);
            resolve();
          };
          sharedAudio.onerror = (err) => {
            URL.revokeObjectURL(url);
            reject(err);
          };
          await sharedAudio.play();
        } catch (err) {
          reject(err);
        }
      }
      playing = false;
    }

    async function speak({ sender, message, name, text, voice_id, voiceId }) {
      const resolvedSender = sender || name || "";
      const resolvedText = message || text || "";
      if (!resolvedText.trim()) {
        throw new Error("Missing message/text");
      }
      const resolvedVoiceId = resolveVoiceId(resolvedSender, voice_id || voiceId);
      if (!resolvedVoiceId) {
        throw new Error(
          "No voice_id resolved. Provide voice_id, set defaultVoiceId, or map sender in voiceMap."
        );
      }

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: resolvedSender, text: resolvedText, voice_id: resolvedVoiceId }),
      });

      if (!res.ok) {
        const errText = await res.text();
        throw new Error(errText || `TTS request failed (${res.status})`);
      }

      const blob = await res.blob();
      await playBlob(blob);
      return blob;
    }

    return {
      speak,
      setVoiceMap(nextMap) {
        voiceMap = normalizeVoiceMap(nextMap);
      },
      setDefaultVoiceId(nextId) {
        defaultVoiceId = nextId || null;
      },
      setEndpoint(nextEndpoint) {
        endpoint = nextEndpoint || endpoint;
      },
    };
  }

  if (isBrowser) {
    global.TTSClient = { createTTSClient };
  }

  if (!isNode) return;

  const http = require("http");
  const fs = require("fs");
  const os = require("os");
  const path = require("path");
  const { spawn } = require("child_process");

  const BASE_URL = "https://api.elevenlabs.io/v1";

  function loadDotenv(filePath = ".env") {
    try {
      const content = fs.readFileSync(filePath, "utf8");
      for (const rawLine of content.split(/\r?\n/)) {
        const line = rawLine.trim();
        if (!line || line.startsWith("#") || !line.includes("=")) continue;
        const [keyRaw, ...rest] = line.split("=");
        const key = keyRaw.trim();
        const value = rest.join("=").trim().replace(/^['"]|['"]$/g, "");
        if (process.env[key] === undefined) {
          process.env[key] = value;
        }
      }
    } catch (err) {
      if (err.code !== "ENOENT") throw err;
    }
  }

  function getApiKey() {
    loadDotenv();
    const apiKey = process.env.ELEVENLABS_API_KEY;
    if (!apiKey) {
      throw new Error("Set ELEVENLABS_API_KEY in .env (project-local)");
    }
    return apiKey;
  }

  function parseArgs(argv) {
    const args = {
      listVoices: false,
      serve: false,
      host: "127.0.0.1",
      port: 8000,
      corsOrigin: "*",
      voiceId: null,
      voiceName: null,
      text: null,
      textFile: null,
      modelId: null,
      outputFormat: "mp3_44100_128",
      output: "out.mp3",
      noLogging: false,
      noPlay: false,
      voiceSettings: null,
    };

    const it = argv[Symbol.iterator]();
    for (let arg of it) {
      switch (arg) {
        case "--list-voices":
          args.listVoices = true;
          break;
        case "--serve":
          args.serve = true;
          break;
        case "--host":
          args.host = it.next().value || args.host;
          break;
        case "--port":
          args.port = Number(it.next().value || args.port);
          break;
        case "--cors-origin":
          args.corsOrigin = it.next().value || args.corsOrigin;
          break;
        case "--voice-id":
          args.voiceId = it.next().value || null;
          break;
        case "--voice-name":
          args.voiceName = it.next().value || null;
          break;
        case "--text":
          args.text = it.next().value || null;
          break;
        case "--text-file":
          args.textFile = it.next().value || null;
          break;
        case "--model-id":
          args.modelId = it.next().value || null;
          break;
        case "--output-format":
          args.outputFormat = it.next().value || args.outputFormat;
          break;
        case "--output":
          args.output = it.next().value || args.output;
          break;
        case "--no-logging":
          args.noLogging = true;
          break;
        case "--no-play":
          args.noPlay = true;
          break;
        case "--voice-settings":
          args.voiceSettings = it.next().value || null;
          break;
        default:
          break;
      }
    }

    return args;
  }

  async function requestJsonOrText(response) {
    const text = await response.text();
    try {
      return JSON.stringify(JSON.parse(text), null, 2);
    } catch {
      return text;
    }
  }

  async function listVoices(apiKey) {
    const res = await fetch(`${BASE_URL}/voices`, {
      headers: { "xi-api-key": apiKey, Accept: "application/json" },
    });
    if (!res.ok) {
      throw new Error(`List voices failed (${res.status}): ${await requestJsonOrText(res)}`);
    }
    const payload = await res.json();
    return payload.voices || [];
  }

  function printVoices(voices) {
    for (const voice of voices) {
      const name = voice.name || "";
      const voiceId = voice.voice_id || "";
      const category = voice.category || "";
      const label = category ? `${name} [${category}]` : name;
      console.log(`${label} - ${voiceId}`);
    }
  }

  function pickVoiceByName(voices, nameQuery) {
    const query = nameQuery.trim().toLowerCase();
    const matches = voices.filter((voice) =>
      String(voice.name || "").toLowerCase().includes(query)
    );
    if (!matches.length) throw new Error(`No voice matched name query: ${nameQuery}`);
    if (matches.length > 1) {
      console.log("Multiple voices matched. Be more specific or use --voice-id.");
      printVoices(matches);
      process.exit(1);
    }
    return matches[0];
  }

  async function resolveVoiceId(apiKey, args) {
    if (args.voiceId) return args.voiceId;
    if (process.env.ELEVENLABS_VOICE_ID) return process.env.ELEVENLABS_VOICE_ID;

    const voices = await listVoices(apiKey);
    if (args.voiceName) {
      return pickVoiceByName(voices, args.voiceName).voice_id;
    }
    if (!voices.length) throw new Error("No voices returned. Check your ElevenLabs account.");
    const first = voices[0];
    const voiceId = first.voice_id;
    const name = first.name || "unknown";
    if (!voiceId) throw new Error("First voice is missing a voice_id.");
    console.log(`Using first available voice: ${name} (${voiceId})`);
    return voiceId;
  }

  function resolveText(args) {
    if (args.text) return args.text;
    if (args.textFile) {
      return fs.readFileSync(args.textFile, "utf8").trim();
    }
    if (!process.stdin.isTTY) {
      return fs.readFileSync(0, "utf8").trim();
    }
    throw new Error("Provide --text, --text-file, or pipe text via stdin.");
  }

  async function synthesizeBytes({
    apiKey,
    voiceId,
    text,
    modelId,
    outputFormat,
    enableLogging,
    voiceSettings,
  }) {
    const params = new URLSearchParams();
    if (outputFormat) params.set("output_format", outputFormat);
    if (!enableLogging) params.set("enable_logging", "false");

    const payload = { text };
    if (modelId) payload.model_id = modelId;
    if (voiceSettings) payload.voice_settings = voiceSettings;

    const url = `${BASE_URL}/text-to-speech/${voiceId}?${params.toString()}`;
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "xi-api-key": apiKey,
        "Content-Type": "application/json",
        Accept: "*/*",
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      throw new Error(`TTS request failed (${res.status}): ${await requestJsonOrText(res)}`);
    }
    return Buffer.from(await res.arrayBuffer());
  }

  async function synthesizeToFile(options, outputPath) {
    const audio = await synthesizeBytes(options);
    fs.writeFileSync(outputPath, audio);
    console.log(`Saved audio to ${outputPath}`);
  }

  function playAudio(filePath) {
    const platform = os.platform();
    if (platform === "darwin") {
      spawn("afplay", [filePath], { stdio: "ignore", detached: true });
      return;
    }
    if (platform === "linux") {
      const players = ["paplay", "aplay"];
      for (const player of players) {
        try {
          spawn(player, [filePath], { stdio: "ignore", detached: true });
          return;
        } catch {
          continue;
        }
      }
      return;
    }
    if (platform === "win32") {
      spawn("cmd", ["/c", "start", "", filePath], { stdio: "ignore", detached: true });
    }
  }

  function loadVoiceMap() {
    const raw = process.env.ELEVENLABS_VOICE_MAP;
    if (!raw) return {};
    let payload;
    try {
      payload = JSON.parse(raw);
    } catch (err) {
      throw new Error(`Invalid ELEVENLABS_VOICE_MAP JSON: ${err.message}`);
    }
    if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
      throw new Error("ELEVENLABS_VOICE_MAP must be a JSON object");
    }
    return normalizeVoiceMap(payload);
  }

  function readJsonBody(req) {
    return new Promise((resolve, reject) => {
      let data = "";
      req.on("data", (chunk) => {
        data += chunk;
      });
      req.on("end", () => {
        if (!data) return resolve({});
        try {
          resolve(JSON.parse(data));
        } catch (err) {
          reject(err);
        }
      });
      req.on("error", reject);
    });
  }

  function sendJson(res, status, payload, corsOrigin) {
    const body = Buffer.from(JSON.stringify(payload));
    res.writeHead(status, {
      "Content-Type": "application/json",
      "Content-Length": body.length,
      "Access-Control-Allow-Origin": corsOrigin,
    });
    res.end(body);
  }

  function sendAudio(res, audio, corsOrigin) {
    res.writeHead(200, {
      "Content-Type": "audio/mpeg",
      "Content-Length": audio.length,
      "Access-Control-Allow-Origin": corsOrigin,
    });
    res.end(audio);
  }

  async function serve(apiKey, args) {
    const voiceMap = loadVoiceMap();
    let defaultVoiceId = null;
    if (args.voiceId || args.voiceName || process.env.ELEVENLABS_VOICE_ID) {
      defaultVoiceId = await resolveVoiceId(apiKey, args);
    }

    const server = http.createServer(async (req, res) => {
      if (req.method === "OPTIONS") {
        res.writeHead(204, {
          "Access-Control-Allow-Origin": args.corsOrigin,
          "Access-Control-Allow-Methods": "POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type",
        });
        res.end();
        return;
      }

      if (req.method !== "POST" || req.url !== "/tts") {
        sendJson(res, 404, { error: "Not found" }, args.corsOrigin);
        return;
      }

      let payload;
      try {
        payload = await readJsonBody(req);
      } catch {
        sendJson(res, 400, { error: "Invalid JSON" }, args.corsOrigin);
        return;
      }

      const text = String(payload.text || payload.message || "").trim();
      if (!text) {
        sendJson(res, 400, { error: "Missing text" }, args.corsOrigin);
        return;
      }

      const name = String(payload.name || payload.sender || payload.speaker || "").trim();
      let voiceId = String(payload.voice_id || payload.voiceId || "").trim();
      if (!voiceId) {
        voiceId = voiceMap[name.toLowerCase()] || "";
      }
      if (!voiceId) {
        voiceId = defaultVoiceId || "";
      }
      if (!voiceId) {
        sendJson(
          res,
          400,
          {
            error:
              "No voice_id resolved. Provide voice_id, set ELEVENLABS_VOICE_ID, or map name via ELEVENLABS_VOICE_MAP.",
          },
          args.corsOrigin
        );
        return;
      }

      const modelId = payload.model_id || args.modelId;
      const outputFormat = payload.output_format || args.outputFormat;
      const voiceSettings = payload.voice_settings;
      if (voiceSettings != null && typeof voiceSettings !== "object") {
        sendJson(res, 400, { error: "voice_settings must be an object" }, args.corsOrigin);
        return;
      }

      try {
        const audio = await synthesizeBytes({
          apiKey,
          voiceId,
          text,
          modelId,
          outputFormat,
          enableLogging: !args.noLogging,
          voiceSettings,
        });
        sendAudio(res, audio, args.corsOrigin);
      } catch (err) {
        sendJson(res, 502, { error: String(err.message || err) }, args.corsOrigin);
      }
    });

    server.listen(args.port, args.host, () => {
      console.log(`TTS server listening on http://${args.host}:${args.port}/tts`);
    });
  }

  async function main() {
    const args = parseArgs(process.argv.slice(2));
    let apiKey;
    try {
      apiKey = getApiKey();
    } catch (err) {
      console.error(String(err.message || err));
      process.exit(1);
    }

    if (args.listVoices) {
      try {
        const voices = await listVoices(apiKey);
        printVoices(voices);
      } catch (err) {
        console.error(String(err.message || err));
        process.exit(1);
      }
      return;
    }

    if (args.serve) {
      await serve(apiKey, args);
      return;
    }

    let voiceId;
    try {
      voiceId = await resolveVoiceId(apiKey, args);
    } catch (err) {
      console.error(String(err.message || err));
      process.exit(1);
    }

    let text;
    try {
      text = resolveText(args);
    } catch (err) {
      console.error(String(err.message || err));
      process.exit(1);
    }

    let voiceSettings = null;
    if (args.voiceSettings) {
      try {
        voiceSettings = JSON.parse(args.voiceSettings);
      } catch (err) {
        console.error(`Invalid --voice-settings JSON: ${err.message}`);
        process.exit(1);
      }
    }

    try {
      await synthesizeToFile(
        {
          apiKey,
          voiceId,
          text,
          modelId: args.modelId,
          outputFormat: args.outputFormat,
          enableLogging: !args.noLogging,
          voiceSettings,
        },
        path.resolve(args.output)
      );
      if (!args.noPlay) {
        playAudio(path.resolve(args.output));
      }
    } catch (err) {
      console.error(String(err.message || err));
      process.exit(1);
    }
  }

  if (typeof module !== "undefined" && module.exports) {
    module.exports = { createTTSClient };
  }

  if (typeof require !== "undefined" && require.main === module) {
    main();
  }
})(typeof globalThis !== "undefined" ? globalThis : this);
