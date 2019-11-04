import JWT from "jsonwebtoken";
import parser from "fast-xml-parser";
import YAML from "yaml";
import sha1 from "sha1";

const sha256 = require("js-sha256").sha256;

export const convert = (text, from, to) => {
  let obj = null;

  switch (from) {
    case "base64":
      text = atob(text);
      break;
    case "hex":
      text = this.hexDecode(text);
      break;
    case "json":
      obj = JSON.parse(text);
      break;
    case "jwt":
      text = JSON.stringify(JWT.decode(text));
      break;
    case "text":
    case "sha1":
    case "sha256":
      break;
    case "xml":
      obj = parser.parse(text, {});
      break;
    case "url":
      text = decodeURI(text);
      break;
    case "yaml":
      obj = YAML.parse(text);
      break;
    default:
      throw new Error("cannot convert from " + from);
  }

  switch (to) {
    case "base64":
      return btoa(text);
    case "hex":
      return this.hexEncode(text);
    case "json":
      if (obj === null) {
        obj = JSON.parse(text);
      }
      return JSON.stringify(obj, null, 2);
    case "sha1":
      return sha1(text);
    case "sha256":
      return sha256(text);
    case "text":
      return text;
    case "url":
      return encodeURI(text);
    case "yaml":
      if (obj === null) {
        obj = YAML.parse(text);
      }
      return YAML.stringify(obj);
    default:
      throw new Error("cannot convert to " + to);
  }
};
