import { describe, it, expect } from "bun:test";
import { assertString, assertNumber, assertMap, assertSlice } from "./assert";

describe("assertString", () => {
  it("returns string value when present", () => {
    expect(assertString({ name: "hello" }, "name")).toBe("hello");
  });

  it("throws when key is missing", () => {
    expect(() => assertString({}, "name")).toThrow('key "name": missing');
  });

  it("throws when value is null", () => {
    expect(() => assertString({ name: null }, "name")).toThrow(
      'key "name": missing',
    );
  });

  it("throws when value is not a string", () => {
    expect(() => assertString({ name: 42 }, "name")).toThrow(
      'key "name": expected string, got number',
    );
  });
});

describe("assertNumber", () => {
  it("returns number value when present", () => {
    expect(assertNumber({ count: 5 }, "count")).toBe(5);
  });

  it("returns zero", () => {
    expect(assertNumber({ count: 0 }, "count")).toBe(0);
  });

  it("throws when key is missing", () => {
    expect(() => assertNumber({}, "count")).toThrow('key "count": missing');
  });

  it("throws when value is null", () => {
    expect(() => assertNumber({ count: null }, "count")).toThrow(
      'key "count": missing',
    );
  });

  it("throws when value is not a number", () => {
    expect(() => assertNumber({ count: "five" }, "count")).toThrow(
      'key "count": expected number, got string',
    );
  });
});

describe("assertMap", () => {
  it("returns object when present", () => {
    const obj = { key: "val" };
    expect(assertMap({ data: obj }, "data")).toEqual(obj);
  });

  it("throws when key is missing", () => {
    expect(() => assertMap({}, "data")).toThrow('key "data": missing');
  });

  it("throws when value is null", () => {
    expect(() => assertMap({ data: null }, "data")).toThrow(
      'key "data": missing',
    );
  });

  it("throws when value is an array", () => {
    expect(() => assertMap({ data: [1, 2] }, "data")).toThrow(
      'key "data": expected map',
    );
  });

  it("throws when value is a string", () => {
    expect(() => assertMap({ data: "str" }, "data")).toThrow(
      'key "data": expected map, got string',
    );
  });
});

describe("assertSlice", () => {
  it("returns array when present", () => {
    expect(assertSlice({ items: [1, 2, 3] }, "items")).toEqual([1, 2, 3]);
  });

  it("returns empty array", () => {
    expect(assertSlice({ items: [] }, "items")).toEqual([]);
  });

  it("throws when key is missing", () => {
    expect(() => assertSlice({}, "items")).toThrow('key "items": missing');
  });

  it("throws when value is null", () => {
    expect(() => assertSlice({ items: null }, "items")).toThrow(
      'key "items": missing',
    );
  });

  it("throws when value is not an array", () => {
    expect(() => assertSlice({ items: "not-array" }, "items")).toThrow(
      'key "items": expected slice, got string',
    );
  });
});
