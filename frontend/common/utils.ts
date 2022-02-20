const get = <T>(obj: { [key: string]: T }, path: string, defValue: T) => {
  return path in obj ? obj[path] : defValue;
};

const imageLoader = (src: string) => {
  return src; // replace with your image directory
};

export { get, imageLoader };
