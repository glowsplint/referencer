# Referencer [![react](https://badges.aleen42.com/src/react.svg)](https://badges.aleen42.com/src/react.svg) [![typescript](https://badges.aleen42.com/src/typescript.svg)](https://badges.aleen42.com/src/typescript.svg) [![Webpack](https://badges.aleen42.com/src/webpack.svg)](https://badges.aleen42.com/src/webpack.svg) [![Python 3.10](https://img.shields.io/badge/python-3.9-blue.svg)](https://www.python.org/downloads/release/python-390/)

Referencer is a web-based online Bible study annotation tool which makes it easy to cross-reference multiple passages from different parts of the Bible. It is written in React (via Next.js), TypeScript and Python.

### Features

Collaborative online group bible study can often be challenging because:

1. It is difficult to take notes online as you are reading from the text.
2. It is difficult to share the notes you have taken with other people from the group.

The Referencer online bible study tool aims to resolve these issues by allowing users to highlight, draw arrows, comment, and share these user-made annotations with other people who are also joined into the same study session.

Users can:

1. Use left-click drag to make text selections. They can highlight the selected text.
2. Hold down the Ctrl key to enter arrowing mode. In this mode, left-click drag will draw arrows instead.

# Development

This repository is a [Next.js](https://nextjs.org/) project bootstrapped with [`create-next-app`](https://github.com/vercel/next.js/tree/canary/packages/create-next-app).

## Requirements

You will need:

1. Node.js installed to run the front-end development server. You can get the latest version from [here](https://nodejs.org/en/).
2. Python interpreter installed to run the back-end development server. You can get the latest version from [here](https://www.python.org/).

### Front-end development

The preferred method uses the yarn package manager.

To run the front-end development server, run:

```bash
# if you don't have the yarn package manager installed
npm install -g yarn

# to run the front-end dev server
cd nextjs-frontend
yarn install
yarn dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser.

To export and build the front-end static assets, run:

```bash
yarn build
```

This will generate the static assets in `nextjs-frontend\out`, which are required by the back-end development server in the next step.

### Back-end development

The back-end development server is written in Python. When run, it will serve the front-end static assets. You will need to first export and build the front-end static assets (with steps above) before running this step.

You will also need to install the Python dependencies by running from the root directory:

Using pipenv:

```bash
# if you don't have pipenv
pip install pipenv

# install dependencies into a virtualenv
pipenv install

# to run the back-end dev server
py run.py
```

Open [http://localhost:5000](http://localhost:5000) with your browser to see the back-end development server serving the exported front-end static assets.
