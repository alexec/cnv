import JWT from "jsonwebtoken";
import parser from "fast-xml-parser";
import YAML from "yaml";
import sha1 from "sha1";
import { hexDecode, hexEncode } from "./hex";

const sha256 = require("js-sha256").sha256;

export const convert = (text, from, to, compact = false) => {
  let obj = null;

  switch (from) {
    case "base64":
      try {
        text = atob(text);
      } catch (e) {
        throw new Error("invalid base64");
      }
      break;
    case "hex":
      text = hexDecode(text);
      break;
    case "json":
      obj = JSON.parse(text);
      break;
    case "jwt":
      obj = JWT.decode(text, { complete: true });
      if (obj === null) {
        throw new Error("invalid JWT");
      }
      break;
    case "text":
    case "sha1":
    case "sha256":
      break;
    case "xml":
      obj = parser.parse(text, {}, true);
      break;
    case "url":
      if (text.indexOf("\n") >= 0) {
        throw new Error("invalid URL");
      }
      text = decodeURI(text);
      break;
    case "yaml":
      obj = YAML.parse(text);
      break;
    default:
      throw new Error("cannot convert from " + from);
  }

  if (obj !== null) {
    text = JSON.stringify(obj);
  }

  switch (to) {
    case "base64":
      return btoa(text);
    case "hex":
      return hexEncode(text);
    case "json":
      return JSON.stringify(obj, null, compact ? 0 : 2);
    case "sha1":
      return sha1(text);
    case "sha256":
      return sha256(text);
    case "text":
      return text;
    case "url":
      return encodeURI(text);
    case "yaml":
      return YAML.stringify(obj);
    default:
      throw new Error("cannot convert to " + to);
  }
};
