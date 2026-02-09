# Referencer [![react](https://badges.aleen42.com/src/react.svg)](https://badges.aleen42.com/src/react.svg) [![typescript](https://badges.aleen42.com/src/typescript.svg)](https://badges.aleen42.com/src/typescript.svg) [![Webpack](https://badges.aleen42.com/src/webpack.svg)](https://badges.aleen42.com/src/webpack.svg) [![Python 3.10](https://img.shields.io/badge/python-3.9-blue.svg)](https://www.python.org/downloads/release/python-390/)

Referencer is a web-based online Bible study annotation tool which makes it easy to cross-reference multiple passages from different parts of the Bible. It is written in React (via Next.js), TypeScript and Python.

### Features

Referencer allows you to:

1. Cross-reference different parts of the Bible side-by-side
2. Make highlights, inline annotations and draw arrows
3. Group ideas in different layers

### Controls

1. Drag your left-click to make text selections.
2. Press the Ctrl key before dragging your left click to draw arrows.

# Development

This repository is a [Next.js](https://nextjs.org/) project bootstrapped with [`create-next-app`](https://github.com/vercel/next.js/tree/canary/packages/create-next-app).

## Requirements

You will need:

1. Bun installed to run the front-end development server. You can get the latest version from [here](https://bun.sh/).
2. Python interpreter installed to run the back-end development server. You can get the latest version from [here](https://www.python.org/).

### Front-end development

The preferred method uses the Bun package manager.

To run the front-end development server, run:

```bash
# if you don't have Bun installed
# Install from https://bun.sh/ or use: curl -fsSL https://bun.sh/install | bash

# to run the front-end dev server
cd frontend
bun install
bun run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser.

To export and build the front-end static assets, run:

```bash
cd frontend
bun run build
```

This will generate the static assets in `.\frontend\out`, which are required by the back-end development server in the next step.

### Back-end development

The back-end development server is written in Python. When run, it will serve the front-end static assets. You will need to first export and build the front-end static assets (with steps above) before running this step.

Install the Python dependencies using pipenv:

```bash
# if you don't have pipenv
pip install pipenv

# install dependencies into a virtualenv
pipenv install
```

Then run the back-end dev server:

```bash
make serve
```

Open [http://localhost:5000](http://localhost:5000) with your browser to see the back-end development server serving the exported front-end static assets.

### Build and run everything

```bash
make
```

This will build the frontend and start the backend server. You can also run each step individually with `make build` and `make serve`.

You will need to supply a `.env` file in the root directory with a valid ESV API key.
