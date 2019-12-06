const colors = ['rgb(242, 46, 78)', 'rgb(54, 173, 164)', 'rgb(220, 137, 50)', 'rgb(174, 157, 49)', 'rgb(119, 171, 49)', 'rgb(51, 176, 122)', 'rgb(56, 169, 197)', 'rgb(110, 155, 244)', 'rgb(204, 122, 244)', 'rgb(245, 101, 204)'];

function addRegexColor(data, index) {
  if (Array.isArray(data)) {
    const dataWithColor = [];
    data.forEach((datum, i) => {
      const regex = datum;
      let j = i;
      // an open modal will pass in an array of one with an index
      if (index) j += index;
      regex.color = colors[j % colors.length];
      dataWithColor.push(regex);
    });
    return dataWithColor;
  }
  const regex = data;
  regex.color = colors[index % colors.length];
  return regex;
}

export default addRegexColor;
