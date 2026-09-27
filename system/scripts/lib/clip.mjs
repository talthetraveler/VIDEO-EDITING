/**
 * Local CLIP embeddings via Transformers.js (pure Node, onnxruntime — no Python).
 * This is the "not 90% transcript-driven" layer: images and text land in the
 * same 512-d space, so footage is searchable by visual meaning.
 *
 * Model: Xenova/clip-vit-base-patch32 (downloaded + cached on first use).
 */
import {
  AutoProcessor,
  AutoTokenizer,
  CLIPVisionModelWithProjection,
  CLIPTextModelWithProjection,
  RawImage,
} from "@huggingface/transformers";

const MODEL_ID = "Xenova/clip-vit-base-patch32";

let _v, _t, _proc, _tok;
const vision = async () => {
  _proc ??= await AutoProcessor.from_pretrained(MODEL_ID);
  _v ??= await CLIPVisionModelWithProjection.from_pretrained(MODEL_ID);
  return { proc: _proc, model: _v };
};
const text = async () => {
  _tok ??= await AutoTokenizer.from_pretrained(MODEL_ID);
  _t ??= await CLIPTextModelWithProjection.from_pretrained(MODEL_ID);
  return { tok: _tok, model: _t };
};

const l2 = (a) => {
  let n = 0;
  for (const x of a) n += x * x;
  n = Math.sqrt(n) || 1;
  return Float32Array.from(a, (x) => x / n);
};

/** Embed a local image file -> normalized Float32Array(512) */
export const embedImage = async (jpgPath) => {
  const { proc, model } = await vision();
  const img = await RawImage.read(jpgPath);
  const inputs = await proc(img);
  const { image_embeds } = await model(inputs);
  return l2(image_embeds.data);
};

/** Embed one or more text strings -> array of normalized Float32Array(512) */
export const embedText = async (texts) => {
  const arr = Array.isArray(texts) ? texts : [texts];
  const { tok, model } = await text();
  const t = await tok(arr, { padding: true, truncation: true });
  const { text_embeds } = await model(t);
  const d = text_embeds.dims[1];
  return arr.map((_, i) => l2(text_embeds.data.slice(i * d, (i + 1) * d)));
};

/**
 * A small vocabulary of moment/action concepts. Scoring a frame against these
 * gives cheap visual tags without a full vision-LLM.
 */
export const MOMENT_VOCAB = {
  smiling: "a person smiling warmly at the camera",
  laughing: "a person laughing with their mouth open",
  hug: "two people hugging each other",
  handshake: "two people shaking hands",
  "high five": "two people giving a high five, palms meeting",
  "arm around": "a person putting their arm around someone's shoulder",
  waving: "a person waving their hand in greeting",
  surprised: "a person with a surprised, wide-eyed expression",
  "group smiling": "a group of people smiling together at the camera",
  "giving flowers": "a person handing flowers to someone",
  "receiving flowers": "a person receiving a bouquet of flowers",
  "showing food": "a shop owner showing or serving food",
  "food closeup": "a beautiful close-up shot of food",
  market: "a busy outdoor market with stalls",
  street: "a city street with people walking",
  "talking to camera": "a person talking directly to the camera, selfie style",
  reaction: "a surprised or emotional facial reaction",
  walking: "a first-person walking shot down a path",
  cooking: "someone cooking at a food stand",
  crowd: "a crowd of people",
};

/** The subset that makes a good human "connective tissue" beat. */
export const REACTION_VOCAB = [
  "smiling",
  "laughing",
  "hug",
  "handshake",
  "high five",
  "arm around",
  "waving",
  "surprised",
  "group smiling",
];

let _vocabEmb;
export const vocabEmbeddings = async () => {
  if (_vocabEmb) return _vocabEmb;
  const keys = Object.keys(MOMENT_VOCAB);
  const embs = await embedText(keys.map((k) => MOMENT_VOCAB[k]));
  _vocabEmb = keys.map((k, i) => ({ tag: k, emb: embs[i] }));
  return _vocabEmb;
};
