export const hexDecode = hex => {
  let text = "";
  for (let n = 0; n < hex.length; n += 2) {
    let s = hex.substr(n, 2);
    const code = parseInt(s, 16);
    if (isNaN(code)) {
      throw new Error("invalid hex");
    }
    text += String.fromCharCode(code);
  }
  return text;
};

export const hexEncode = str => {
  let hex = "";
  for (let n = 0, l = str.length; n < l; n++) {
    hex += Number(str.charCodeAt(n)).toString(16);
  }
  return hex;
};
