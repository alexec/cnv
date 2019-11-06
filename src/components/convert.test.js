import { convert } from "./convert";

test("json2yaml", () => {
  expect(convert(`{"a":1}`, "json", "yaml")).toBe(`a: 1
`);
});

test("text2hex", () => {
  expect(convert("foo", "text", "hex")).toBe(
    "666f6f"
  );
});

test("hex2text", () => {
  expect(convert("666f6f", "text", "hex")).toBe(
    "foo"
  );
});
test("text2sha1", () => {
  expect(convert("foo", "text", "sha1")).toBe(
    "0beec7b5ea3f0fdbc95d0dd47f3c5bc275da8a33"
  );
});

test("text2sha256", () => {
  expect(convert("foo", "text", "sha256")).toBe(
    "2c26b46b68ffc68ff99b453c1d30413413422d706483bfa0f98a5e886266e7ae"
  );
});
