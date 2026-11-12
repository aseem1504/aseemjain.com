# aseemjain.com

Personal site of Aseem Jain, product manager. Built with Astro and Tailwind, deployed to GitHub Pages.

```bash
npm install
npm run dev        # http://localhost:4321
npm run build      # static site in dist/
npm run check:numbers
python3 scripts/check_snippets.py
```

## How to edit

All text lives in `src/content/`, so you rarely need to touch a component.

| To change | Edit |
|---|---|
| The six work cases and their five lens versions | `src/content/cases.json` |
| Roles in the Story timeline | `src/content/experience.json` |
| Places you have travelled (map, chips and the counter update themselves) | `src/content/places.json` |
| Photos, alt text and captions | `src/content/photos.json` and `src/assets/photos/` |
| A Live Photo loop for a photo | Put `<file>.mp4` and `<file>.webm` in `public/media/live/`, set `"live": true` |
| A poem | Copy `src/content/poems/_example.md` to `src/content/poems/<name>.md`. The poems block shows up once one exists |
| A Speaker Series guest | Add an object to `src/content/speakers.json`. Empty fields stay hidden |
| A code project | Add `src/content/projects/<repo-name>.md`. Copy an existing one. The file name must match the GitHub repo name |
| The hero photo and its live clip | `src/assets/photos/seaside-lawn.jpg` plus `public/media/live/seaside-lawn.mp4` and `.webm`. Adjust `object-position` in `src/components/Hero.astro` |
| The tabla video | Set `MUSIC_VIDEO_ID` at the top of `src/components/Beyond.astro` |
| A logo on a Credentials tile | Save the file as `src/assets/logos/<id>.svg` (or png), where the id is in `src/content/credentials.json`, for example `iima.svg`. Until then a monogram shows |
| The CV | Replace `public/Aseem_Jain_CV.pdf` |
| The headline | `src/components/Hero.astro` (options A, B and C are in the comment) |
| The accent colour | `--accent` and `--accent-ink` in `src/styles/global.css` |

Lens links work as shareable URLs: `https://aseemjain.com/?lens=strategy`, `consulting`, `gm`, `ai`.

## Checks before every deploy

- `npm run build`
- `npm run check:numbers` finds every number, rupee amount and percentage on the built site and checks that it
  appears in the public CV, the master CV, or (for project figures) that project's own README. Reviewed
  exceptions go in `scripts/number_allowlist.txt` with a reason.
- `python3 scripts/check_snippets.py` checks that every code line shown on a project page exists in that repo.
- Map data comes from the repos' own demos: `~/Code/venv-proj/bin/python scripts/export_project_data.py`.
- Social image and icons: `npm run og`.

## Deploy

Pushing to `main` runs `.github/workflows/deploy.yml`. In the repo settings, Pages must be set to
**GitHub Actions** as its source. `public/CNAME` keeps the custom domain, which is on GoDaddy and points at GitHub Pages.
