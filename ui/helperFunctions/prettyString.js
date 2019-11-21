function prettyString(string) {
  return (string[0].toUpperCase() + string.slice(1)).replace(/_/g, ' ');
}

export default prettyString;
