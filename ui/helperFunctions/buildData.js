import { cloneDeep } from 'lodash';

/**
 * buildData takes a session object and converts it into
 * the structure expected by the backend server.
 * @param {*} session The master session object from all data received
 * in the app.
 */
function buildData(session) {
  const regex = cloneDeep(session.unstructured_data);
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
    structured_data: session.structured_data,
    unstructured_data: regex,
    algo: session.algo,
  };
}

export default buildData;
