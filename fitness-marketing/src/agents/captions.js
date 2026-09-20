import { pick, seededIndex } from "../lib/io.js";

/**
 * Caption / Hashtag Agent — platform-aware tags and alt hooks.
 */
export function buildHashtags(brand, hashtagConfig, platform, pillarId, seed = 0) {
  const rules = hashtagConfig.rules[platform] || { min: 3, max: 8 };
  const nicheTags =
    hashtagConfig.niche[brand.niche] ||
    hashtagConfig.niche["functional fitness"] ||
    [];

  const pool = [
    ...hashtagConfig.evergreen,
    ...nicheTags,
    ...hashtagConfig.discovery,
    brand.niche.replace(/\s+/g, ""),
    pillarId
  ].map((t) => t.replace(/^#/, "").replace(/\s+/g, "").toLowerCase());

  const unique = [...new Set(pool)];
  const count = Math.min(
    rules.max,
    Math.max(rules.min, Math.min(unique.length, rules.min + (seed % 3)))
  );

  const tags = [];
  for (let i = 0; i < count; i++) {
    tags.push("#" + pick(unique, seededIndex(`${seed}-${platform}-${i}`, unique.length)));
  }

  return [...new Set(tags)];
}

export function enrichPostWithTags(post, brand, hashtagConfig, seed = 0) {
  const tags = buildHashtags(
    brand,
    hashtagConfig,
    post.platform,
    post.pillarId,
    seed
  );
  const taggedCaption =
    post.platform === "x"
      ? post.caption
      : `${post.caption}\n\n${tags.join(" ")}`;

  return {
    ...post,
    agent: "captions",
    hashtags: tags,
    caption: taggedCaption,
    altHooks: [
      post.hook,
      post.hook.replace(/^The /, ""),
      `${post.hook}? Save this.`
    ]
  };
}
