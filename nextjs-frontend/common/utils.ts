const DEVELOPMENT_MODE = process.env.NEXT_PUBLIC_DEVELOPMENT_MODE === "True";
const APP_VERSION = process.env.NEXT_PUBLIC_APP_VERSION;

const get = <T>(obj: { [key: string]: T }, path: string, defValue: T) => {
  return path in obj ? obj[path] : defValue;
};

const imageLoader = (src: string) => {
  return src; // REPLACE WITH YOUR IMAGE DIRECTORY
};

export { DEVELOPMENT_MODE, APP_VERSION, get, imageLoader };
