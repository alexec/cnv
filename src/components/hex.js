export const hexDecode = str1 => {
  const hex = str1.toString();
  let str = "";
  for (let n = 0; n < hex.length; n += 2) {
    const code = parseInt(hex.substr(n, 2), 16);
    if (isNaN(code)) {
      throw new Error("invalid hex");
    }
    str += String.fromCharCode(code);
  }
  return str;
};

export const hexEncode = str => {
  const arr1 = [];
  for (let n = 0, l = str.length; n < l; n++) {
    const hex = Number(str.charCodeAt(n)).toString(16);
    arr1.push(hex);
  }
  return arr1.join("");
};
