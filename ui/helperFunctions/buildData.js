function buildData(metaData, regex, algo) {
  regex.features.forEach((exp) => {
    if (exp.regex.startsWith('#')) {
      const lib = regex.regex_library.find((l) => l.name === exp.regex.substring(1));
      if (lib) {
        exp.regex = lib.regex;
      }
    }
  });
  delete regex.regex_library;
  return {
    structured_data: metaData,
    unstructured_data: regex,
    algo,
  };
}

export default buildData;
