function prettyString(string) {
  if (!string.length) return string;
  return (string[0].toUpperCase() + string.slice(1)).replace(/_/g, ' ');
}

export default prettyString;
