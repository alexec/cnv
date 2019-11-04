import { hexDecode, hexEncode } from "./hex";

test("hexEncode", () => {
  expect(hexEncode("foo")).toBe("666f6f");
});

test("hexDecode", () => {
  expect(hexDecode("666f6f")).toBe("foo");
});
