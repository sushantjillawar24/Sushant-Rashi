# Birthday Surprise 🎈

A small, mobile-first interactive birthday experience. Static site — no build step, no dependencies.

**Flow:** pop 4 balloons → blow the candle → rose bouquet → swipe photo cards → open the envelope and read the letter.

## Customise

Everything personal lives in **`js/config.js`**: name, balloon words, photos + captions, and the letter.

1. Upload your three photos into `assets/photos/` named exactly **`1.jpeg`**, **`2.jpeg`** and **`3.jpeg`** (lowercase — GitHub Pages is case-sensitive). They replace the placeholders already there. Portrait photos around 800px wide (under ~300 KB each) look best and load fast.
2. Want more than three? Add `4.jpeg` … and a matching line under `photos` in `config.js`.
3. Edit the `letter` paragraphs.

You can also change the name per link without editing code:

```
https://<your-username>.github.io/<repo>/?name=Riya&from=Sam
```

## Sound

Everything is original (composed and synthesised for this page), so it is safe to host publicly.

- **Music:** one happy tune (`assets/music/party.mp3`) plays from the gift all the way to the letter. It gets quieter while the letter is being printed and fades out a few seconds after the message is complete.
- **Sound effects** are generated in code (no files): ribbon rustle and unwrap, balloon pops that climb a scale, party poppers, the No button's boing, cake layers landing, candles planting and lighting, the blow, glasses clinking for the cheers, card swipes, paper rustles for the envelope and letter.
- Browsers don't allow sound before the first tap, so it starts when you lift your finger after unwrapping the gift. The speaker button in the top-left corner mutes/unmutes everything.
- To use your own song, upload an mp3 to `assets/music/` and change its path in `js/config.js` (`music`). `letterMusicVolume` and `letterMusicStopAfter` control the letter page. To turn the little effects off, set `sfx: false`.
- Popular songs are copyrighted — if you use one, keep the repo private or only share the link with her.

## Run locally

```bash
python3 -m http.server 8000
# open http://localhost:8000 (or your phone via your LAN IP)
```

## Deploy on GitHub Pages

1. Push this folder to a new GitHub repo.
2. Repo → **Settings → Pages** → Source: *Deploy from a branch* → `main` / `(root)`.
3. Your link appears at `https://<your-username>.github.io/<repo>/` after a minute.

> Tip: if the photos are personal, make sure you're comfortable with the repo being public — GitHub Pages on free plans requires a public repo.

## Structure

```
index.html        markup + inline SVG art (cake, bouquet, envelope)
js/audio.js       music crossfades + synthesised sound effects
css/style.css     all styling and animation
js/config.js     ← your content
js/app.js         scene flow and interactions
assets/photos/    your images (1.jpeg, 2.jpeg, 3.jpeg)
assets/music/     the music
```
