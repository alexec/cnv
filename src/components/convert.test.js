import { convert } from "./convert";

test("json2yaml", () => {
  expect(convert(`{"a":1}`, "json", "yaml")).toBe(`a: 1
`);
});
