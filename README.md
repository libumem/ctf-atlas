# CTF Atlas

A searchable CTF platform atlas built with plain HTML, CSS, JavaScript, and JSON data.

The project also includes an `inspiration.html` page with the story behind the atlas.

## Run locally

```bash
python3 -m http.server 5173 --bind 127.0.0.1
```

Then open `http://127.0.0.1:5173/`.

## Data format

Platforms live in `data/platforms.json`.

```json
{
  "Name": "Example Platform",
  "Description": "Short description of the platform.",
  "URL": "https://example.com/"
}
```

## Repository link

Repository: https://github.com/dibsy/ctf-atlas

The header button uses `REPOSITORY_URL` in `app.js` for submissions.

## Image attribution

Atlas icons created by Freepik - Flaticon: https://www.flaticon.com/free-icons/atlas

Only inactive platforms include the optional `Status` field:

```json
{
  "Name": "Legacy Platform",
  "Description": "Archived platform retained for historical reference.",
  "Status": "inactive",
  "URL": "https://example.com/"
}
```

Self-hosted labs include the optional `SelfHosted` field:

```json
{
  "Name": "Self-hosted Lab",
  "Description": "A lab that you deploy in your own environment.",
  "SelfHosted": true,
  "URL": "https://example.com/"
}
```
