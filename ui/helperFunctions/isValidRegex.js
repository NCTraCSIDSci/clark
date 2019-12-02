function isValidRegex(regex) {
  if (regex === '') return false;
  let valid = true;
  try {
    const reg = new RegExp(regex);
    reg.test();
  } catch (e) {
    valid = false;
  }
  return valid;
}

export default isValidRegex;
