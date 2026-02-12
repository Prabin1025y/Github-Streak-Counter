# 🔥 GitHub Streak Counter

> **Github streak counter but cooler** — a self-hosted service that generates animated SVG stat cards for your GitHub profile README.

## Preview

<p align="center">
  <img src="./public/example.svg" width="500" />
</p>



## Usage

### Use the hosted version

Simply paste this into your GitHub `README.md`:

```md
![GitHub Streak](https://github-streak-counter.up.railway.app/badge.svg?username={your-username})
```
Replace `{your-username}` with your GitHub username.
**Example:**

```md
![GitHub Streak](https://github-streak-counter.up.railway.app/badge.svg?username=Prabin1025y)
```

### Self-host

#### Prerequisites

- Node.js 18+
- npm

#### Installation

```bash
git clone https://github.com/Prabin1025y/Github-Streak-Counter.git
cd Github-Streak-Counter
npm install
```

#### Configuration

Create a `.env` file in the root directory:

```env
PORT=3000
```

#### Run

```bash
node index.js
```

The server will start on `http://localhost:3000`.

#### Usage after self-hosting

```md
![GitHub Streak](http://localhost:3000/badge.svg?username={username})
```

---

## Architecture

```
Github-Streak-Counter/
├── index.js          # Express server entry point
├── router/           # Route handlers
├── utils/            # SVG generation + GitHub scraper
│   ├── scraper.js    # Puppeteer scraping logic
│   └── svgGenerator.js  # Animated SVG string builder
├── public/
├── .env              # Environment config
└── package.json
```

---

## SVG Card Details

The generated card is a `668×420` SVG containing:

| Section | Content |
|---|---|
| Left | Contributions this year |
| Center | Animated 🔥 flame + current streak number |
| Right | Active days this year |
| Bottom bar | This week's daily contributions with streak highlighted |


## Limitations

- Only works for **public GitHub profiles**
- Data is scraped from GitHub's HTML — changes to GitHub's DOM structure may break scraping
- Response time on cache miss depends on GitHub page load speed (typically 2–5 seconds)

---

## Contributing

Pull requests are welcome. For major changes, please open an issue first.

1. Fork the repo
2. Create your feature branch (`git checkout -b feature/cool-thing`)
3. Commit your changes (`git commit -m 'Add cool thing'`)
4. Push to the branch (`git push origin feature/cool-thing`)
5. Open a Pull Request

---

## License

MIT

---

## Author

Made by [@Prabin1025y](https://github.com/Prabin1025y)