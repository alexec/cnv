import JWT from "jsonwebtoken";
import parser from "fast-xml-parser";
import YAML from "yaml";
import sha1 from "sha1";

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
      text = btoa(text);
      break;
    case "hex":
      text = this.hexEncode(text);
      break;
    case "json":
      if (obj === null) {
        obj = JSON.parse(text);
      }
      text = JSON.stringify(obj, null, 2);
      break;
    case "sha1":
      text = sha1(text);
      break;
    case "text":
      break;
    case "url":
      text = encodeURI(text);
      break;
    case "yaml":
      if (obj === null) {
        obj = YAML.parse(text);
      }
      text = YAML.stringify(obj);
      break;
    default:
      throw new Error("cannot convert to " + to);
  }

  return text;
};
