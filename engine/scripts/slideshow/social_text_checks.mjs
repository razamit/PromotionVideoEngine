// Checks social_text.md, the paste-ready post text written beside the slides.
// Its shape is fixed so a publisher always finds the same four blocks:
//
//   ## Title            one fenced block, 90 characters at most
//   ## Caption          hook on the first line, keyword early, 3 to 5 hashtags
//   ## Pinned comment   with the brief's placeholders for tracked links
//   ## Disclosure       says to tick commercial content > "Your brand"

import { existsSync, readFileSync } from "node:fs";
import { checkCopy } from "./copy_checks.mjs";

const TITLE_MAX_CHARS = 90; // TikTok Content Posting API, photo post title
const KEYWORD_WINDOW_CHARS = 100;
const HASHTAG_RANGE = { min: 3, max: 5 };

/** The first fenced block under a "## heading", or null. */
function fencedBlockUnder(markdown, heading) {
  const section = new RegExp(`^##\\s+${heading}\\s*$([\\s\\S]*?)(?=^##\\s)`, "im").exec(`${markdown}\n## end`);
  if (!section) return null;
  const block = /```[^\n]*\n([\s\S]*?)```/.exec(section[1]);
  return block ? block[1].trim() : null;
}

function checkTitle(title, brief) {
  if (title === null) return [{ level: "error", message: "social_text.md: no ## Title block" }];
  const problems = checkCopy(title, "social_text.md title", brief);
  if (title.length > TITLE_MAX_CHARS) {
    problems.push({ level: "error", message: `social_text.md: the title is ${title.length} characters; TikTok allows ${TITLE_MAX_CHARS}` });
  }
  return problems;
}

function checkCaption(caption, brief, deckSource) {
  if (caption === null) return [{ level: "error", message: "social_text.md: no ## Caption block" }];
  const problems = checkCopy(caption, "social_text.md caption", brief);
  const hashtags = caption.match(/#[\p{L}\p{N}_]+/gu) ?? [];
  if (hashtags.length < HASHTAG_RANGE.min || hashtags.length > HASHTAG_RANGE.max) {
    problems.push({ level: "error", message: `social_text.md: the caption has ${hashtags.length} hashtags; use ${HASHTAG_RANGE.min} to ${HASHTAG_RANGE.max}` });
  }
  for (const required of brief.hashtags?.always ?? []) {
    if (!hashtags.includes(required)) problems.push({ level: "error", message: `social_text.md: the caption is missing ${required} (brief, hashtags.always)` });
  }
  const waysToFindIt = [brief.cta?.searchPhrase, brief.cta?.bioLink].filter(Boolean);
  const pointsToBio = Boolean(brief.cta?.bioLink) && /link in (the |my |our )?bio/i.test(caption);
  if (waysToFindIt.length && !pointsToBio && !waysToFindIt.some((way) => caption.includes(way))) {
    problems.push({ level: "warn", message: 'social_text.md: the caption does not say how to find the product: the brief\'s search phrase (cta.searchPhrase) or "link in bio"' });
  }
  const opening = caption.slice(0, KEYWORD_WINDOW_CHARS).toLowerCase();
  if (!deckSource.keyword) {
    problems.push({ level: "warn", message: "slideshow.md: set keyword so lint can check it sits in the caption's first 100 characters" });
  } else if (!opening.includes(deckSource.keyword.toLowerCase())) {
    problems.push({ level: "error", message: `social_text.md: the keyword "${deckSource.keyword}" is not in the caption's first ${KEYWORD_WINDOW_CHARS} characters` });
  }
  return problems;
}

function checkPinnedComment(comment, brief) {
  if (comment === null) return [{ level: "error", message: "social_text.md: no ## Pinned comment block" }];
  const problems = checkCopy(comment, "social_text.md pinned comment", brief);
  for (const placeholder of brief.cta?.pinnedCommentPlaceholders ?? []) {
    if (!comment.includes(placeholder)) {
      problems.push({ level: "error", message: `social_text.md: the pinned comment is missing the placeholder ${placeholder}` });
    }
  }
  return problems;
}

/** @returns {{ level: "error" | "warn", message: string }[]} */
export function checkSocialText(socialTextFile, brief, deckSource) {
  if (!existsSync(socialTextFile)) {
    return [{ level: "warn", message: "social_text.md is not written yet; every slideshow ships with one (references/slideshow-mode.md, step 6)" }];
  }
  const markdown = readFileSync(socialTextFile, "utf8");
  const problems = [
    ...checkTitle(fencedBlockUnder(markdown, "Title"), brief),
    ...checkCaption(fencedBlockUnder(markdown, "Caption"), brief, deckSource),
    ...checkPinnedComment(fencedBlockUnder(markdown, "Pinned comment"), brief),
  ];
  if (!/your brand/i.test(markdown)) {
    problems.push({ level: "error", message: 'social_text.md: no disclosure note; tell the publisher to tick commercial content > "Your brand"' });
  }
  return problems;
}
