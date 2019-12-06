import { cloneDeep } from 'lodash';

function updateCompiledExpressions(regexList) {
  const tempRegexList = cloneDeep(regexList);
  tempRegexList.expressions.forEach((exp) => {
    const lib = tempRegexList.library.find((l) => l.name === exp.regex.substring(1));
    if (lib) {
      exp.compiled = lib.regex;
    } else {
      exp.compiled = '';
    }
  });
  return tempRegexList;
}

export default updateCompiledExpressions;
