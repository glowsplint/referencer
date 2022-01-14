import { get } from "../../common/utils";

describe("get utility function", () => {
  it("extracts the correct value for existing key with non-null value", () => {
    const testObj = {
      apple: 3,
      orange: 0,
    };
    const testDefValue = 99;
    expect(get(testObj, "apple", testDefValue)).toBe(3);
    expect(get(testObj, "orange", testDefValue)).toBe(0);
  });

  it("extracts the correct value for existing key with nullish value", () => {
    const testObj: { [key: string]: number | null | undefined } = {
      apple: null,
      orange: undefined,
    };
    const testDefValue = 99;
    expect(get(testObj, "apple", testDefValue)).toBe(null);
    expect(get(testObj, "orange", testDefValue)).toBe(undefined);
  });

  it("returns the default value for a key that does not exist", () => {
    const testObj = {};
    const testDefValue = 99;
    expect(get(testObj, "apple", testDefValue)).toBe(99);
  });
});
