const get = (obj: object, path, defValue) => {
  if (!path) return undefined;
  const pathArray = Array.isArray(path) ? path : path.match(/([^[.\]])+/g);
  return (
    pathArray.reduce((prevObj, key) => prevObj && prevObj[key], obj) || defValue
  );
};

const toTitleCase = (str: string) => {
  return str.replace(
    /\w\S*/g,
    (text: string) =>
      text.charAt(0).toUpperCase() + text.substr(1).toLowerCase()
  );
};

export { get, toTitleCase };
