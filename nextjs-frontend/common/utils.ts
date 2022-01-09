const get = <T>(obj: { [key: string]: T }, path: string, defValue: T) => {
  return path in obj ? obj[path] : defValue;
};

export { get };
