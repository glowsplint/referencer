export const get = (obj: object, path, defValue) => {
  // If path is not defined or it has false value
  if (!path) return undefined;
  // Check if path is string or array. Regex : ensure that we do not have '.' and brackets.
  // Regex explained: https://regexr.com/58j0k
  const pathArray = Array.isArray(path) ? path : path.match(/([^[.\]])+/g);
  // Find value if exist return otherwise return undefined value;
  return (
    pathArray.reduce((prevObj, key) => prevObj && prevObj[key], obj) || defValue
  );
};
