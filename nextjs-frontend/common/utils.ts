const get = (
  obj: { [key: string]: object },
  path: string,
  defValue: object
) => {
  return obj[path] ?? defValue;
};

const toTitleCase = (str: string) => {
  return str.replace(
    /\w\S*/g,
    (text: string) =>
      text.charAt(0).toUpperCase() + text.substr(1).toLowerCase()
  );
};

export { get, toTitleCase };
