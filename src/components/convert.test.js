import { convert } from "./convert";

test("base642text", () => {
  expect(convert("Zm9v", "base64", "text")).toBe("foo");
});

test("base2text-bad", () => {
  expect(() => convert("???", "base64", "text")).toThrow("invalid base64");
});

test("hex2text", () => {
  expect(convert("666f6f", "hex", "text")).toBe("foo");
});

test("hex2text-bad", () => {
  expect(() => convert("zzz", "hex", "text")).toThrow("invalid hex");
});

test("jwt2text", () => {
  expect(
    convert(
      "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c",
      "jwt",
      "json"
    )
  ).toBe(
    `{
  "header": {
    "alg": "HS256",
    "typ": "JWT"
  },
  "payload": {
    "sub": "1234567890",
    "name": "John Doe",
    "iat": 1516239022
  },
  "signature": "SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c"
}`
  );
});

test("jwt2text-bad", () => {
  expect(() => convert("???", "jwt", "json")).toThrow("invalid JWT");
});

test("text2text", () => {
  expect(convert("foo", "text", "text")).toBe("foo");
});

test("url2text", () => {
  expect(convert("foo%20bar", "url", "text")).toBe("foo bar");
});

test("url2text-bad", () => {
  expect(() => convert(`\n`, "url", "text")).toThrow("invalid URL");
});

test("xml2json", () => {
  expect(
    convert(
      `<note>
  <to>Tove</to>
</note>`,
      "xml",
      "json"
    )
  ).toBe(`{
  "note": {
    "to": "Tove"
  }
}`);
});

test("xml2json-bar", () => {
  expect(() => convert(``, "xml", "json")).toThrow("Start tag expected.");
});

test("json2yaml", () => {
  expect(convert(`{"a":1}`, "json", "yaml")).toBe(`a: 1
`);
});

test("text2base64", () => {
  expect(convert("foo", "text", "base64")).toBe("Zm9v");
});

test("text2hex", () => {
  expect(convert("foo", "text", "hex")).toBe("666f6f");
});

test("text2sha1", () => {
  expect(convert("foo", "text", "sha1")).toBe("0beec7b5ea3f0fdbc95d0dd47f3c5bc275da8a33");
});

test("text2sha256", () => {
  expect(convert("foo", "text", "sha256")).toBe("2c26b46b68ffc68ff99b453c1d30413413422d706483bfa0f98a5e886266e7ae");
});

test("text2url", () => {
  expect(convert("foo bar", "text", "url")).toBe("foo%20bar");
});
