This is a [Next.js](https://nextjs.org/) project bootstrapped with [`create-next-app`](https://github.com/vercel/next.js/tree/canary/packages/create-next-app).

## Getting Started

### Requirements

You will need Node.js installed on your computer to run the front-end development server. You can get the latest version from [here](https://nodejs.org/en/).

### Run the front-end development server

Once Node.js is installed, navigate to the repo. You will need to install the JavaScript dependencies by install either via `npm` or `yarn`:

```bash
npm install
npm run dev
```

The preferred method uses the yarn package manager. If you don't have `yarn` installed, run `npm install -g yarn`.

```bash
yarn install
yarn dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the front-end development files.

### To export and build the front-end static assets

```bash
npm run build
```

Alternatively, use yarn:

```bash
yarn build
```

This will generate the static assets in `.\out`, which are required by the back-end development server in the next step.

### Run the back-end development server

The back-end development server is written in Python. When run, it will serve the front-end static assets. You will need to first export and build the front-end static assets (with steps above) before running this step.

You will also need to install the Python dependencies by running:

Using pip:

```bash
pip install -r requirements.txt
```

The preferred method uses the Conda package manager.

Using conda: Create a new environment via the provided .yml file.
Please [set the "name" (environment name) and "prefix" (environment creation directory) values appropriately](https://conda.io/projects/conda/en/latest/user-guide/tasks/manage-environments.html#exporting-an-environment-file-across-platforms) before you run the below command.

```bash
conda env create -f environment.yml
```

Open [http://localhost:5000](http://localhost:5000) with your browser to see the back-end development server serving the exported front-end static assets.
