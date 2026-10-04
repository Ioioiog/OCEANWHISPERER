# Ocean Whisperer — website

Homepage for Ocean Whisperer, private helicopter journeys above Curaçao.
A static site: plain HTML, CSS and JavaScript. No build step, no framework.

## Project structure

```
ocean-whisperer/
├── index.html            Page markup
├── assets/
│   ├── css/style.css     All styles (light palettes, layout, responsive rules)
│   ├── js/main.js        All behaviour (3D hero, flight map, sound, form, invitation)
│   └── logo/             Logo files (original + brass, ivory, navy versions)
├── .nojekyll             Tells GitHub Pages to serve files as they are
└── README.md
```

The logo used on the page is embedded in `style.css` (`--wings`), so the site works
even if the `logo/` folder is moved. The PNGs in `assets/logo/` are for other uses.

## Run it locally

Open `index.html` in a browser, or serve the folder (recommended, closer to production):

```bash
npx serve .
# or
python3 -m http.server 8000
```

## Publish with GitHub Pages

1. Create a repository and upload the contents of this folder (keep the structure).
2. Go to **Settings → Pages**.
3. Under **Build and deployment**, choose **Deploy from a branch**, branch `main`, folder `/ (root)`.
4. Save. The site appears at `https://<username>.github.io/<repository>/` within a minute or two.

To use the real domain (theoceanwhisperer.com), add it under **Settings → Pages → Custom domain**
and point the domain's DNS to GitHub Pages as described in GitHub's documentation.

## Before launch — to do

| What | Where | Notes |
|---|---|---|
| Connect the invitation form | `assets/js/main.js`, section *Seat, envelope and invitation* | Send `name`, `email`, `preferred_date`, `travel_window`, `journey`, `seat`, `note`, `understood` to Fillout or the CRM. Right now the form only shows the invitation card. |
| Social media links | `index.html`, comment `SOCIAL` | Replace each `href="#"` with the profile URL. Remove any network that isn't used. |
| Journal film | `index.html`, comment `VIDEO` | Put the MP4 URL in `data-src`. |
| Host the photos yourself | `index.html` and `assets/js/main.js` (`PHOTOS`) | Images currently load from the WordPress site (`theoceanwhisperer.com/wp-content/...`). Copy them into `assets/img/` and update the paths, otherwise they disappear if WordPress is removed. |
| Cabin sound recordings | `assets/js/main.js`, section *Sound* | Sounds are synthesised in the browser and labelled as illustrative. Replace with real recordings when available. |
| Canopy panorama | `index.html`, element `#pano` | A real panoramic photo from the cabin will look much better than the current photo. |

## Useful to know

- **Live light:** the hero colours follow the local time in Willemstad (night, dawn, daylight,
  golden hour, dusk). Preview any of them by adding `?light=day`, `?light=golden`, `?light=dusk`,
  `?light=night` or `?light=dawn` to the address.
- **Sound** is on by default but, as browsers require, starts at the visitor's first click, tap
  or key press. The visitor's choice is remembered.
- **3D hero** uses three.js (r128) from cdnjs; smooth scrolling uses Lenis from jsDelivr.
  If either fails to load, or the device is too slow, the page falls back to a drawn map
  and native scrolling automatically.
- **Reduced motion:** visitors who ask their system for reduced motion get a calm version
  without the intro, 3D flight or cloud transitions.
- **Fonts:** Cormorant Garamond and Hanken Grotesk from Google Fonts.
