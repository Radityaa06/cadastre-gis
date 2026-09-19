<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://ai.google.dev/static/site-assets/images/share-ais-513315318.png" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/2d3154b8-1584-4cf9-a614-53f190013e33

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`

## GitHub Pages

The static frontend is deployed to:
https://radityaa06.github.io/cadastre-gis/

GitHub Pages cannot run the Express API used by the drone analysis and VARAI chat features. Those features require the Node server started with `npm run dev` or `npm start`.
