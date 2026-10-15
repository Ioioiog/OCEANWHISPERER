# Ocean Whisperer — website

Homepage for Ocean Whisperer, private helicopter journeys above Curaçao.
A static site: plain HTML, CSS and JavaScript. No build step, no framework.

## Project structure

Each page sits in a folder named like its address on the old WordPress site, so existing links
(for example theoceanwhisperer.com/experiences/) keep working after the move.

```
ocean-whisperer/
├── index.html                Home
├── experiences/index.html    Signature journeys
├── transfers/index.html      Helicopter transfers
├── aircraft/index.html       The Robinson R66 NxG
├── charters/index.html       Private charter
├── journal/index.html        Film and photographs
├── contact/index.html        Contact
├── booking-terms/index.html  Operations
├── privacy/index.html        Operations
├── safety/index.html         Operations
├── book-now/index.html       Old "Join the Inaugural List" address, forwards to the form
├── assets/
│   ├── css/style.css         All styles
│   ├── js/main.js            All behaviour
│   ├── logo/                 Logo files
│   └── img/                  Site photos (0-2-2.jpg is the canopy view)
├── .nojekyll
└── README.md
```

## Run it locally

Because pages link to folders (experiences/, transfers/ …), open the site through a small local server
rather than by double-clicking a file:

```bash
python3 -m http.server 8000
# then visit http://localhost:8000
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
| Privacy contact | `privacy.html`, comment `PRIVACY` | The privacy text asks guests to “write to us” to remove their details. Add the email address they should use; for now the page points to the form and WhatsApp. |
| Social media links | `index.html`, comment `SOCIAL` | Replace each `href="#"` with the profile URL. Remove any network that isn't used. |
| Journal film | `index.html`, comment `VIDEO` | Put the MP4 URL in `data-src`. |
| Host the photos yourself | `index.html` and `assets/js/main.js` (`PHOTOS`) | Images currently load from the WordPress site (`theoceanwhisperer.com/wp-content/...`). Copy them into `assets/img/` and update the paths, otherwise they disappear if WordPress is removed. |
| Cabin sound recordings | `assets/js/main.js`, section *Sound* | Sounds are synthesised in the browser and labelled as illustrative. Replace with real recordings when available. |
| Aircraft photo | `index.html` and `aircraft.html`, comment above the helicopter illustration | The aircraft section shows a line illustration. Replace it with a photo of the Ocean Whisperer R66 once delivered. |
| Aircraft page claims | `aircraft.html` | Air conditioning and the autopilot are described from Robinson’s R66 NxG / Riviera page. Confirm both are fitted to the delivered aircraft. |
| Aircraft details | `index.html`, section `#aircraft` | Copy describes the Robinson R66 NxG (five seats, Rolls-Royce RR300 turbine, Garmin glass cockpit, autopilot, leather seats). Confirm the final equipment of the delivered aircraft, and add doors-off flights or air conditioning only if they will be offered. |
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
- **Fonts:** Fraunces (variable, Google Fonts) and Satoshi (Fontshare).
- **Map:** the coastline of Curaçao and Klein Curaçao comes from OpenStreetMap data (via the MIT-licensed `@geo-maps/countries-land-100m` package), simplified to 100 m. OpenStreetMap data is © OpenStreetMap contributors under the ODbL; keep the attribution line in the footer. Routes are illustrative and drawn from real coordinates (Hato airport, Willemstad, Westpunt, Spanish Water, Klein Curaçao).
