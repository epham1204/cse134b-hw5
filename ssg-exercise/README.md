# SSG Exercise (Eleventy)

Two pages from my portfolio, Home and About, built with Eleventy.
Both pages share one footer, written once in `_includes/footer.njk`.

## Requirements

Node.js 18 or newer.

## Install dependencies

Run these commands from inside the `ssg-exercise` folder.

```
npm install
```

## Build

```
npx @11ty/eleventy
```

The built site is written to the `_site` folder.

## Preview locally

```
npx @11ty/eleventy --serve
```

- Home: http://localhost:8080/
- About: http://localhost:8080/about.html

## Shared footer

The footer lives in `_includes/footer.njk`. Each page pulls it in with
`{% include "footer.njk" %}`. Editing that one file and rebuilding
updates the footer on both pages.

## Notes

Only Home and About has been done