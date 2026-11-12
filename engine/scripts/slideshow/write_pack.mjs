// Writes the two files a publisher works from, straight from the rendered
// deck so they can never disagree with the images:
//   pack.md          slide order, format, sizes, cover, sound, upload steps
//   overlay_text.md  the line for each slide, for typing it in TikTok over
//                    the clean set

import { writeFileSync } from "node:fs";
import { basename } from "node:path";
import { slideLines } from "./copy_checks.mjs";
import { slideFileName } from "./render_deck.mjs";

const DEFAULT_VIEWS_TO_REPEAT = 15000;
const oneLine = (text) => String(text ?? "").replace(/\s*\n\s*/g, " / ");

function slideRows(deck) {
  return deck.slides.map((slide, index) => {
    const file = slide.blocked ? `not rendered: ${slide.blocked}` : `\`${slideFileName(deck, slide)}\``;
    return `| ${index + 1} | ${file} | ${slide.role} | ${oneLine(slideLines(slide).join(" / ")) || "(screenshot only)"} |`;
  });
}

function soundLines(deckSource) {
  const mood = deckSource.sound?.mood ?? "something low-key that does not fight the text";
  const hint = deckSource.sound?.searchHint ? ` Search hint: ${deckSource.sound.searchHint}.` : "";
  return [
    "- Sound: the image files carry none; a photo post gets its sound in TikTok. The app usually picks a track",
    `  by itself when the photos are selected. Check it and swap it for one that fits. Mood: ${mood}.${hint}`,
    "  A Business account can only use the Commercial Music Library. On the web uploader, look for the sound",
    "  option before publishing; if there is none, upload from the phone so the post is not silent.",
  ];
}

function settingsLines(brief) {
  const aiLabel = brief.claims?.aiGeneratedImages === true
    ? "- AI label: ON. The brief says this product's slides use AI-generated images."
    : "- AI label: not needed. The slides are real screenshots, typed text and, in the cartoon look, code-drawn cartoon art.";
  return [
    '- Content disclosure: turn on "Disclose commercial content" and choose "Your brand". It cannot be changed after posting.',
    aiLabel,
  ];
}

/** 9:16 is not on TikTok Studio's list of photo shapes, so the first post in it is a test. */
function firstUploadLines(output) {
  if (output.aspect !== "9:16") return [];
  return [
    "- First 9:16 photo post on this account: check it on a phone. If TikTok crops it or shows it between bars,",
    '  set `output.aspect: "3:4"` in the product brief and render again.',
  ];
}

function packMarkdown({ deck, deckSource, brief, layout }, largestBytes) {
  const { output } = deck;
  const primary = output.primaryText === "native" ? "slides-clean/ (type the text in TikTok from overlay_text.md)" : "slides/ (text baked in)";
  const other = output.primaryText === "native" ? "slides/ has the same slides with the text baked in." : "slides-clean/ has the same slides with no text; overlay_text.md has the lines to type in TikTok.";
  const rendered = deck.slides.filter((slide) => !slide.blocked).length;
  return [
    `# Pack: ${basename(layout.deckDir)}`, "",
    `Product: ${deck.product.name}. Format: \`${deck.format}\`. Topic: ${deck.topic ?? ""}`, "",
    "## Slides, in upload order", "",
    "| # | File | Role | Text on the slide |", "|---|---|---|---|", ...slideRows(deck), "",
    "## Files", "",
    `- Upload this set: ${primary}`,
    `- ${other}`,
    `- ${rendered} images, ${output.imageFormat.toUpperCase()}, ${output.width}x${output.height} (${output.aspect}), all the same size. Largest file: ${(largestBytes / 1024).toFixed(0)} KB.`,
    `- Cover: slide ${deckSource.cover ?? 1}.`,
    ...soundLines(deckSource),
    "- Post text: `social_text.md` (title, caption, pinned comment).",
    "- `preview-for-review-only.mp4`, when present, is for looking at on a computer. Do not upload it.", "",
    "## Uploading (a person does this; nothing here posts)", "",
    "- Computer: TikTok Studio, Upload, Photos tab. Select the files in name order.",
    "- Phone: plus button, Photo (not the video flow, which can turn stills into an autoplay video). Pick the files in name order.",
    ...settingsLines(brief),
    ...firstUploadLines(output), "",
    "## After posting", "",
    `- Repeat this format if the post passes about ${(brief.test?.viewsToRepeat ?? DEFAULT_VIEWS_TO_REPEAT).toLocaleString("en-US")} views, or three times the account's median slideshow views.`,
    "- Note profile visits and installs next to views; views alone do not show whether the format works.", "",
  ].join("\n");
}

/** Where the baked set puts this slide's line, in words, so text typed over the clean set lands in the same place. */
function textPlacement(slide) {
  if (slide.layout === "screenshot") return `${slide.textPosition === "bottom" ? "under" : "above"} the screenshot, in the empty band`;
  if (slide.character) return "top of the frame, above the character's head";
  if (slide.photo) {
    const band = { top: "top", bottom: "lower part", middle: "middle" }[slide.textPosition ?? "middle"];
    return `${band} of the frame, off any face or sign in the picture`;
  }
  return "centre of the frame";
}

function overlayMarkdown(deck) {
  const blocks = deck.slides.filter((slide) => !slide.blocked).flatMap((slide) => [
    `## ${slideFileName(deck, slide)}`, "",
    "```", slideLines(slide).join("\n") || "(no text)", "```", "",
    `Where: ${textPlacement(slide)}. Keep it out of the bottom quarter and off the right edge.`, "",
  ]);
  return [
    "# Text to type in TikTok over the clean set", "",
    "Use this with `slides-clean/` when adding text in TikTok's own editor. One",
    "block per slide, in upload order. White text with the outline style is the",
    "closest match to the baked set.", "", ...blocks,
  ].join("\n");
}

/** @param {{ deck: Record<string, any>, deckSource: Record<string, any>, brief: Record<string, any>, layout: Record<string, string> }} packInput */
export function writePublisherFiles(packInput, largestBytes) {
  writeFileSync(packInput.layout.pack, packMarkdown(packInput, largestBytes));
  writeFileSync(packInput.layout.overlayText, overlayMarkdown(packInput.deck));
}
