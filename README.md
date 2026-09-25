# Amr Shop Bella

Bella is a lightweight chatbot for Amr shop, a family-run Indian cafe in Jalandhar. Customers can browse the menu, ask dietary questions, check store information, and build a basic order through a simple browser interface.

The project includes a browser frontend and an Express backend. If an OpenAI-compatible API key is not configured, the backend uses a local deterministic fallback so the app still works during development.

## Features

- Menu browsing with prices and item descriptions
- Vegetarian, vegan, and gluten-free recommendations
- Allergen information with a severe-allergy reminder
- Order building with quantities and a live total
- Order confirmation guidance
- Store hours, location, service, and promotion details
- OpenAI-compatible chatbot responses when configured
- Local fallback responses when no API key is available
- Health-check endpoint for basic monitoring

## Requirements

- Node.js 18 or newer
- npm
- An OpenAI-compatible API key is optional

## Run locally

1. Install dependencies:

	 ```bash
	 npm install
	 ```

2. Start the server:

	 ```bash
	 npm start
	 ```

3. Open [http://localhost:8000](http://localhost:8000).

The default port is `8000`. Set `PORT` to use another port.

## Environment variables

Create a `.env` file in the project root when you want to enable AI-generated replies:

```env
OPENAI_API_KEY=your-api-key
MODEL_NAME=gpt-4o-mini
AI_PROVIDER=openai
PORT=8000
```

For another OpenAI-compatible provider, set `OPENAI_BASE_URL` as well:

```env
AI_PROVIDER=groq
OPENAI_BASE_URL=https://api.groq.com/openai/v1
OPENAI_API_KEY=your-api-key
MODEL_NAME=llama-3.1-8b-instant
```

Never commit `.env` or API keys to GitHub. The included `.gitignore` excludes local environment files and dependencies.

## API

### `POST /api/chat`

Send a message to Bella:

```bash
curl -X POST http://localhost:8000/api/chat \
	-H 'Content-Type: application/json' \
	-d '{"message":"What vegan options do you have?"}'
```

Example response:

```json
{
	"reply": "Our vegan picks are Vegan Chickpea Curry, Masala Fries, and Mint Lime Soda. Please double-check with staff for severe allergies."
}
```

### `GET /api/health`

Returns a simple health response:

```json
{
	"ok": true,
	"name": "Amr Shop Bella"
}
```

## Project structure

```text
.
├── index.html   # Chatbot page markup
├── styles.css   # Layout and visual styling
├── script.js    # Browser chat and order state
├── server.js    # Express server, menu data, and chat API
├── package.json # Scripts and dependencies
└── .gitignore   # Local files excluded from Git
```

## Development notes

- The menu is defined in both `server.js` and `script.js` so the backend fallback and browser order UI can work independently.
- The browser sends messages to `/api/chat` and renders the returned `reply`.
- The server does not process payments. It directs customers to checkout via the website, app, or phone.
- The current store service is configured as dine-in only.

## GitHub

Initialize and commit the project locally:

```bash
git init
git add .
git commit -m "Initial Amr Shop Bella chatbot"
git branch -M main
```

Create an empty repository on GitHub, then connect and push it:

```bash
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPOSITORY.git
git push -u origin main
```

Replace `YOUR_USERNAME` and `YOUR_REPOSITORY` with the GitHub account and repository name you choose.
