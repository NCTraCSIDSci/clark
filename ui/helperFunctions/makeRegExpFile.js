function makeRegExpFile(tab, data, sectionBreak, ignoreHeader, ignoreUnnamed) {
  const json = [];
  data.forEach((row) => {
    const rowData = {};
    rowData.name = row.name;
    rowData.regex = row.regex;
    if (tab === 'sections') {
      rowData.ignore = row.ignore;
    }
    json.push(rowData);
  });
  if (tab === 'sections') {
    const sections = {
      section_break: sectionBreak,
      ignore_header: ignoreHeader,
      ignore_untagged: ignoreUnnamed,
      tags: json,
    };
    return sections;
  }
  return json;
}

export default makeRegExpFile;
