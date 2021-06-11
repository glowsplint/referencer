export const get = (obj: object, path, defValue) => {
  if (!path) return undefined;
  const pathArray = Array.isArray(path) ? path : path.match(/([^[.\]])+/g);
  return (
    pathArray.reduce((prevObj, key) => prevObj && prevObj[key], obj) || defValue
  );
};

export const toTitleCase = (str: string) => {
  return str.replace(
    /\w\S*/g,
    (text: string) =>
      text.charAt(0).toUpperCase() + text.substr(1).toLowerCase()
  );
};

export function range(size: number, startAt: number = 0) {
  return [...Array(size).keys()].map((i) => i + startAt);
}

export function mergeRanges(ranges: [number, number][]): [number, number][] {
  if (!(ranges && ranges.length)) {
    return [];
  }
  let stack = [];
  ranges.sort(function (a, b) {
    return a[0] - b[0];
  });
  stack.push(ranges[0]);

  ranges.slice(1).forEach(function (range, i) {
    let top = stack[stack.length - 1];

    if (top[1] < range[0]) {
      stack.push(range);
    } else if (top[1] < range[1]) {
      top[1] = range[1];
    }
  });

  return stack;
}
