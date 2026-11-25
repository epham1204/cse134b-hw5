export default function (eleventyConfig) {
  // Copy these to the built site unchanged
  eleventyConfig.addPassthroughCopy("personal.css");
  eleventyConfig.addPassthroughCopy("fact-viewer.css");
  eleventyConfig.addPassthroughCopy("theme.js");
  eleventyConfig.addPassthroughCopy("fact-viewer.js");
  eleventyConfig.addPassthroughCopy("images");

  // The README is documentation, not a page to build
  eleventyConfig.ignores.add("README.md");

  return {
    // Process .html files with Nunjucks so the include line works
    htmlTemplateEngine: "njk"
  };
}