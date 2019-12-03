import { useState, useEffect } from 'react';
import { cloneDeep } from 'lodash';

import API from '../API';
import isValidRegex from '../helperFunctions/isValidRegex';

const colors = ['rgb(242, 46, 78)', 'rgb(54, 173, 164)', 'rgb(220, 137, 50)', 'rgb(174, 157, 49)', 'rgb(119, 171, 49)', 'rgb(51, 176, 122)', 'rgb(56, 169, 197)', 'rgb(110, 155, 244)', 'rgb(204, 122, 244)', 'rgb(245, 101, 204)'];

const initialRegex = {
  library: [],
  expressions: [],
  sections: [],
};

const columnData = {
  library: [
    {
      id: 'name',
      label: 'Name',
      width: '50%',
    },
    {
      id: 'regex',
      label: 'Reg. Exp',
      width: '50%',
    },
  ],
  expressions: [
    { id: 'name', label: 'Name' },
    { id: 'rawRegex', label: 'Reg. Exp' },
  ],
  sections: [
    { id: 'name', label: 'Name' },
    { id: 'regex', label: 'Reg. Exp' },
    { id: 'ignore', label: 'Ignore' },
  ],
};

function useRegex() {
  const [regexList, updateRegexList] = useState(initialRegex);
  const [tab, setTab] = useState(Object.keys(initialRegex)[0]);
  const [activeName, updateActiveName] = useState('');
  const [activeRegex, updateActiveRegex] = useState('');
  const [compiled, updateCompiled] = useState('');
  const [validRegex, updateValidRegex] = useState([]);
  const [showModal, toggleModal] = useState(false);
  const [regexIndex, setRegexIndex] = useState(undefined);
  const [sectionBreak, updateSectionBreak] = useState('');
  const [ignore, updateIgnore] = useState(false);

  function remove(i) {
    const tempRegex = cloneDeep(regexList);
    tempRegex[tab].splice(i, 1);
    updateRegexList(tempRegex);
  }

  function save() {
    const tempRegex = cloneDeep(regexList);
    if (regexList[tab].find((row, i) => regexIndex !== i && row.name === activeName)) {
      // TODO: replace this with modal error
      window.alert('a row with that name already exists');
      return;
    }
    const row = {
      name: activeName,
      regex: activeRegex,
      compiled,
      color: colors[regexIndex % colors.length],
    };
    if (tab === 'sections') {
      row.ignore = ignore;
    }
    tempRegex[tab][regexIndex] = row;
    updateRegexList(tempRegex);
    updateActiveName('');
    updateActiveRegex('');
    updateCompiled('');
    toggleModal(false);
  }

  function openModal(i) {
    if (i === undefined) {
      setRegexIndex(regexList[tab].length);
    } else {
      const { name, regex } = regexList[tab][i];
      updateActiveName(name);
      updateActiveRegex(regex);
      if (tab === 'sections') {
        const { ignore: ign } = regexList[tab][i];
        updateIgnore(ign);
      }
      updateIgnore(ignore);
      if (tab === 'expressions' && regex.startsWith('#')) {
        // do the search
        const libRegex = regexList.library.find((reg) => reg.name === regex.substring(1));
        if (libRegex) {
          updateCompiled(libRegex.regex);
        } else {
          updateCompiled('');
        }
      }
      setRegexIndex(i);
    }
    toggleModal(true);
  }

  function update(value) {
    if (tab === 'expressions' && value.startsWith('#')) { // if the expression starts with a #
      // find the label in the library and set that regex as the active value
      const regex = regexList.library.find((reg) => reg.name === value.substring(1));
      if (regex) {
        updateCompiled(regex.regex);
      } else {
        updateCompiled('');
      }
    } else {
      // TODO: if library name changes, we need to update compiled expressions
      updateCompiled('');
    }
    updateActiveRegex(value);
  }

  useEffect(() => {
    if (showModal) {
      const regex = compiled || activeRegex;
      if (isValidRegex(regex)) {
        updateValidRegex([{
          regex,
          color: colors[regexIndex % colors.length],
          name: activeName,
        }]);
      } else {
        updateValidRegex([]);
      }
    } else {
      const tempValidRegex = regexList.expressions.filter((regex) => {
        if (!regex.name) {
          return false;
        }
        if (!isValidRegex(regex.regex)) {
          return false;
        }
        return true;
      });
      updateValidRegex(tempValidRegex);
    }
  }, [
    regexList,
    activeRegex,
    showModal,
    regexIndex,
    activeName,
    compiled,
  ]);

  function uploadRegex() {
    // use tab to determine the type of regex to upload
    API.uploadRegex();
  }

  function saveRegex() {
    // use tab to determine the type of regex to save
    API.saveRegex();
  }

  return {
    tabs: Object.keys(initialRegex),
    tab,
    setTab,
    columns: columnData[tab],
    rows: regexList[tab],
    activeName,
    updateActiveName,
    activeRegex,
    compiled,
    update,
    save,
    remove,
    validRegex,
    sectionBreak,
    updateSectionBreak,
    ignore,
    updateIgnore,
    showModal,
    toggleModal,
    openModal,
    badgeNum: regexList.expressions.length + regexList.sections.length,
    uploadRegex,
    saveRegex,
  };
}

export default useRegex;
