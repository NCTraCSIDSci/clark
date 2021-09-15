import { useState, useEffect } from 'react';
import { cloneDeep } from 'lodash';
import { remote } from 'electron';

import API from '../API';

import isValidRegex from '../helperFunctions/isValidRegex';
import makeRegExpFile from '../helperFunctions/makeRegExpFile';
import addRegexColor from '../helperFunctions/addRegexColor';
import validateRegExpFile from '../helperFunctions/validateRegExpFile';
import updateCompiledExpressions from '../helperFunctions/updateCompiledExpressions';

const fs = remote.require('fs');

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
    // { id: 'coverage', label: 'Coverage' },
  ],
  sections: [
    { id: 'name', label: 'Name' },
    { id: 'regex', label: 'Reg. Exp' },
    { id: 'ignore', label: 'Ignore' },
  ],
};

const tabs = Object.keys(initialRegex);

function useRegex(popup) {
  const [regexList, updateRegexList] = useState(initialRegex);
  const [tab, setTab] = useState(Object.keys(initialRegex)[1]);
  const [activeName, updateName] = useState('');
  const [activeRegex, updateActiveRegex] = useState('');
  const [compiled, updateCompiled] = useState('');
  const [validRegex, updateValidRegex] = useState([]);
  const [showModal, toggleModal] = useState(false);
  const [regexIndex, setRegexIndex] = useState(undefined);
  const [sectionBreak, updateSectionBreak] = useState('');
  const [ignore, updateIgnore] = useState(false);
  const [ignoreHeader, updateHeaderIgnore] = useState(false);
  const [ignoreUnnamed, updateUnnamedIgnore] = useState(false);
  const [gettingCoverage, setGettingCoverage] = useState(false);

  function remove(i) {
    const tempRegex = cloneDeep(regexList);
    tempRegex[tab].splice(i, 1);
    updateRegexList(tempRegex);
  }

  function save() {
    const tempRegex = cloneDeep(regexList);
    if (regexList[tab].find((row, i) => regexIndex !== i && row.name === activeName)) {
      popup.showSnackbar({
        text: 'A row with that name already exists.',
        type: 'error',
      });
      return;
    }
    let row = {
      name: activeName,
      regex: activeRegex,
      compiled,
    };
    row = addRegexColor(row, regexIndex);
    if (tab === 'sections') {
      row.ignore = ignore;
    }
    if (tab === 'library') {
      const exp = tempRegex.expressions.find((expression) => (
        expression.regex.startsWith('#') &&
        (
          expression.regex.substring(1) === tempRegex.library[regexIndex].name ||
          expression.regex.substring(1) === activeName
        )
      ));
      if (exp) delete exp.coverage;
    }
    tempRegex[tab][regexIndex] = row;
    updateRegexList(tempRegex);
    updateName('');
    updateActiveRegex('');
    updateCompiled('');
    toggleModal(false);
  }

  function openModal(i) {
    if (i === undefined) {
      // i could be index 0
      setRegexIndex(regexList[tab].length);
    } else {
      const { name, regex } = regexList[tab][i];
      updateName(name);
      updateActiveRegex(regex);
      if (tab === 'sections') {
        const { ignore: ign } = regexList[tab][i];
        updateIgnore(ign);
      }
      if (tab === 'expressions' && regex.startsWith('#')) {
        // do the search
        const libRegex = regexList.library.find((reg) => reg.name === regex.substring(1));
        if (libRegex) {
          updateCompiled(libRegex.regex);
        } else {
          updateCompiled('');
        }
      } else {
        updateCompiled('');
      }
      setRegexIndex(i);
    }
    toggleModal(true);
  }

  function closeModal() {
    updateName('');
    updateActiveRegex('');
    updateCompiled('');
    updateIgnore(false);
    toggleModal(false);
  }

  function updateRegex(value) {
    if (tab === 'expressions' && value.startsWith('#')) { // if the expression starts with a #
      // find the label in the library and set that regex as the active value
      const regex = regexList.library.find((reg) => reg.name === value.substring(1));
      if (regex) {
        updateCompiled(regex.regex);
      } else {
        updateCompiled('');
      }
    }
    updateActiveRegex(value);
  }

  // When the modal closes on the expressions or library tab,
  // update the linked regex between the two
  useEffect(() => {
    if (tab !== 'sections' && !showModal && regexList.expressions.length) {
      const tempRegexList = updateCompiledExpressions(regexList);
      updateRegexList(tempRegexList);
    }
  }, [tab, showModal]);

  // when modifying the name of a library regex,
  // update it's linked expression
  useEffect(() => {
    const debounced = setTimeout(() => {
      if (tab === 'library' && regexList.expressions.length) {
        const tempRegexList = updateCompiledExpressions(regexList);
        updateRegexList(tempRegexList);
      }
    }, 200);
    return () => clearTimeout(debounced);
  }, [activeName]);

  /**
   * This use effect watches everything and updates
   * the valid regex that's passed to the patient browser
   */
  useEffect(() => {
    const debounced = setTimeout(() => {
      let tempValidRegex = [];
      var modActiveRegex = activeRegex.replace('(?i)','');
      var modActiveCase = true;
      if (activeRegex.includes('(?i)')) {
        //modActiveRegex = activeRegex.replace('(?i)','');
        modActiveCase = true;
      }
      else {
        //modActiveRegex = activeRegex;
        modActiveCase = false;
      }
      //console.log('The initial modifiedActiveRegex is ' + modActiveRegex);
      if (tab === 'sections') {
        if (sectionBreak) {
          if (showModal) {
            if (isValidRegex(modActiveRegex)) {
              tempValidRegex = [{
                regex: modActiveRegex,
                name: activeName,
                case: modActiveCase,
                ignore,
              }];
              tempValidRegex = addRegexColor(tempValidRegex, regexIndex);
            }
          } else {
            tempValidRegex = regexList.sections.filter((regex) => {
              if (!regex.name || !isValidRegex(regex.regex)) return false;
              return true;
            });
            tempValidRegex = addRegexColor(tempValidRegex);
          }
        }
      } else if (tab === 'expressions' || tab === 'library') {
          //console.log('Compiled = ' + compiled);
          if (typeof compiled !== 'undefined' && compiled != '' && modActiveRegex == '') {
            if (compiled.includes('(?i)')) {
              modActiveRegex = compiled.replace('(?i)','');
              modActiveCase = true;
            }
            else {
              modActiveRegex = compiled;
              modActiveCase = false;
            }
          }

        if (showModal) {
          if (isValidRegex(compiled || modActiveRegex)) {
            tempValidRegex = [{
              regex: compiled || modActiveRegex,
              name: activeName,
              case: modActiveCase,
            }];
            tempValidRegex = addRegexColor(tempValidRegex, regexIndex);
          }
          //console.log('The modifiedActiveRegex is ' + modActiveRegex);
        } else {
          tempValidRegex = regexList.expressions.filter((regex) => {
            if (!regex.name || !isValidRegex(regex.regex)) return false;
            return true;
          });
        }
      }
      updateValidRegex(tempValidRegex);
    }, 400);
    return () => clearTimeout(debounced);
  }, [
    tab, regexList, showModal, sectionBreak, activeRegex, ignore,
  ]);

  // If anything changes in the sections tab, remove all
  // expression coverages
  useEffect(() => {
    if (tab === 'sections') {
      regexList.expressions.forEach((exp) => {
        delete exp.coverage;
      });
    }
  }, [sectionBreak, ignoreHeader, ignoreUnnamed, regexList]);

  // function updateRegex(value) {
  //   if (tab === 'expressions' && value.startsWith('#')) { // if the expression starts with a #
  //     // find the label in the library and set that regex as the active value
  //     const regex = regexList.library.find((reg) => reg.name === value.substring(1));
  //     if (regex) {
  //       updateCompiled(regex.regex);
  //     } else {
  //       updateCompiled('');
  //     }
  //   }
  //   updateActiveRegex(value);
  // }

  // // When the modal closes on the expressions or library tab,
  // // update the linked regex between the two
  // useEffect(() => {
  //   if (tab !== 'sections' && !showModal && regexList.expressions.length) {
  //     const tempRegexList = updateCompiledExpressions(regexList);
  //     updateRegexList(tempRegexList);
  //   }
  // }, [tab, showModal]);

  // // when modifying the name of a library regex,
  // // update it's linked expression
  // useEffect(() => {
  //   const debounced = setTimeout(() => {
  //     if (tab === 'library' && regexList.expressions.length) {
  //       const tempRegexList = updateCompiledExpressions(regexList);
  //       updateRegexList(tempRegexList);
  //     }
  //   }, 200);
  //   return () => clearTimeout(debounced);
  // }, [activeName]);

  // /**
  //  * This use effect watches everything and updates
  //  * the valid regex that's passed to the patient browser
  //  */
  // useEffect(() => {
  //   const debounced = setTimeout(() => {
  //     let tempValidRegex = [];
  //     if (tab === 'sections') {
  //       if (sectionBreak) {
  //         if (showModal) {
  //           //console.log('This is the activeRegex: ' + activeRegex);
  //           if (activeRegex.includes('(?i)')) {
  //             var modifiedActiveRegex = activeRegex.replace('(?i)','');
  //             var modPythonCase = true;
  //           }
  //           else {
  //             var modifiedActiveRegex = activeRegex;
  //             var modPythonCase = false;
  //           }
  
  //           if (isValidRegex(modifiedActiveRegex)) {
  //             tempValidRegex = [{
  //               regex: modifiedActiveRegex,
  //               name: activeName,
  //               case: modPythonCase,
  //               ignore,
  //             }];
  //             tempValidRegex = addRegexColor(tempValidRegex, regexIndex);
  //           }
  //         } else {
  //           // console.log('This will be the activeRegex: ' + regex);
  //           if (activeRegex.includes('(?i)')) {
  //             var modifiedActiveRegex = regex.replace('(?i)','');
  //             var modPythonCase = true;
  //           }
  //           else {
  //             var modifiedActiveRegex = regex;
  //             var modPythonCase = false;
  //           }
  //           tempValidRegex = regexList.sections.filter((modifiedActiveRegex) => {
  //             if (!modifiedActiveRegex.name || !isValidRegex(modifiedActiveRegex.regex)) return false;
  //             return true;
  //           });
  //           tempValidRegex = addRegexColor(tempValidRegex);
  //         }
  //       }
  //     } else if (tab === 'expressions' || tab === 'library') {
  //       if (showModal) {
  //         //console.log('Maybe this will be the activeRegex: ' + activeRegex);
  //         if (activeRegex.includes('(?i)')) {
  //           var modifiedActiveRegex = activeRegex.replace('(?i)','');
  //           var modPythonCase = true;
  //         }
  //         else {
  //           var modifiedActiveRegex = activeRegex;
  //           var modPythonCase = false;
  //         }
  //         //console.log('The modified activeRegex: ' + modifiedActiveRegex);
  //         // console.log('The compiled activeRegex: ' + compiled);
  //         if (compiled.includes('(?i)')) {
  //           var modifiedCompiledRegex = compiled.replace('(?i)','');
  //           var modPythonCase = true;
  //         }
  //         else {
  //           var modifiedCompiledRegex = compiled;
  //           var modPythonCase = false;
  //         }
  //         if (isValidRegex(modifiedCompiledRegex || modifiedActiveRegex)) {
  //           tempValidRegex = [{
  //             regex: modifiedCompiledRegex || modifiedActiveRegex,
  //             name: activeName,
  //             case: modPythonCase,
  //           }];
  //           tempValidRegex = addRegexColor(tempValidRegex, regexIndex);
  //         }
  //       } else {
  //         if (typeof regex !== 'undefined' && regex.includes('(?i)')) {
  //           var modifiedRegex = regex.replace('(?i)','');
  //           var modPythonCase = true;
  //         }
  //         else {
  //           if (typeof regex !== 'undefined') {
  //             var modifiedRegex = regex;
  //           }
  //           else {
  //             var modifiedRegex = '';
  //           }
  //           var modPythonCase = false;
  //         }
  //         tempValidRegex = regexList.expressions.filter((modifiedRegex) => {
  //           if (!modifiedRegex.name || !isValidRegex(modifiedRegex.regex)) return false;
  //           return true;
  //         });
  //       }
  //     }
  //     updateValidRegex(tempValidRegex);
  //   }, 400);
  //   return () => clearTimeout(debounced);
  // }, [
  //   tab, regexList, showModal, sectionBreak, activeRegex, ignore,
  // ]);

  // // If anything changes in the sections tab, remove all
  // // expression coverages
  // useEffect(() => {
  //   if (tab === 'sections') {
  //     regexList.expressions.forEach((exp) => {
  //       delete exp.coverage;
  //     });
  //   }
  // }, [sectionBreak, ignoreHeader, ignoreUnnamed, regexList]);

  function getCoverage(i, exp) {
    const data = {
      features: [
        { regex: exp },
      ],
      sections: {
        ignore_header: ignoreHeader,
        ignore_untagged: ignoreUnnamed,
        section_break: (sectionBreak === '') ? null : sectionBreak,
        tags: regexList.sections,
      },
    };
    setGettingCoverage(true);
    API.coverage(data)
      .then((res) => {
        setGettingCoverage(false);
        const tempRegex = cloneDeep(regexList);
        [tempRegex.expressions[i].coverage] = Object.values(res);
        updateRegexList(tempRegex);
      })
      .catch(() => {
        setGettingCoverage(false);
        popup.showSnackbar({
          text: 'Unable to get coverage.',
          type: 'error',
        });
      });
  }

  function uploadRegex() {
    const filePath = remote.dialog.showOpenDialogSync({
      filters: [{
        name: 'JSON',
        extensions: ['json'],
      }],
    });
    if (filePath) {
      // use tab to determine the type of regex to upload
      fs.readFile(filePath[0], 'utf8', (err, data) => { // filepath is an array
        if (err) {
          popup.showSnackbar({
            text: 'Unable to read file.',
            type: 'error',
          });
        } else {
          let tempRegexList = cloneDeep(regexList);
          const valid = validateRegExpFile(tab, JSON.parse(data));
          if (valid) {
            if (tab === 'sections') {
              const sections = JSON.parse(data);
              updateSectionBreak(sections.section_break);
              updateHeaderIgnore(sections.ignore_header);
              updateUnnamedIgnore(sections.ignore_untagged);
              tempRegexList[tab] = addRegexColor(sections.tags);
            } else {
              tempRegexList[tab] = addRegexColor(JSON.parse(data));
            }
            tempRegexList = updateCompiledExpressions(tempRegexList);
            updateRegexList(tempRegexList);
            popup.showSnackbar({
              text: 'Successfully uploaded regex.',
              type: 'success',
            });
          } else {
            popup.showSnackbar({
              text: 'Invalid regex file.',
              type: 'error',
            });
          }
        }
      });
    }
  }

  function saveRegex() {
    const filePath = remote.dialog.showSaveDialogSync({
      title: 'Save file as',
      defaultPath: `clark_${tab}`,
      filters: [{
        name: 'JSON',
        extensions: ['json'],
      }],
    });
    if (filePath) {
      // use tab to determine the type of regex to save
      const regexFile = makeRegExpFile(
        tab, regexList[tab], sectionBreak, ignoreHeader, ignoreUnnamed,
      );
      fs.writeFile(filePath, JSON.stringify(regexFile), (err) => {
        if (err) {
          popup.showSnackbar({
            text: 'Unable to save regex file.',
            type: 'error',
          });
        }
        popup.showSnackbar({
          text: 'Regex saved successfully.',
          type: 'success',
        });
      });
    }
  }

  function loadRegex(obj) {
    const session = cloneDeep(obj);
    let tempRegexList = {
      library: addRegexColor(session.regex_library),
      expressions: addRegexColor(session.features),
      sections: addRegexColor(session.sections.tags),
    };
    tempRegexList = updateCompiledExpressions(tempRegexList);
    updateRegexList(tempRegexList);
    updateSectionBreak(session.sections.section_break);
    updateHeaderIgnore(session.sections.ignore_header);
    updateUnnamedIgnore(session.sections.ignore_untagged);
  }

  function exportRegex() {
    const tempRegex = {
      regex_library: makeRegExpFile('', regexList.library),
      features: makeRegExpFile('', regexList.expressions),
      sections: makeRegExpFile(
        'sections', regexList.sections,
        sectionBreak, ignoreHeader,
        ignoreUnnamed,
      ),
    };
    return tempRegex;
  }

  function resetRegex() {
    updateRegexList(initialRegex);
    updateSectionBreak('');
    updateHeaderIgnore(false);
    updateUnnamedIgnore(false);
    toggleModal(false);
    updateValidRegex([]);
  }

  return {
    exportRegex,
    loadRegex,
    tabs,
    tab,
    setTab,
    columns: columnData[tab],
    rows: regexList[tab],
    activeName,
    updateName,
    activeRegex,
    compiled,
    updateRegex,
    save,
    remove,
    getCoverage,
    validRegex,
    sectionBreak,
    updateSectionBreak,
    ignore,
    updateIgnore,
    ignoreHeader,
    updateHeaderIgnore,
    ignoreUnnamed,
    updateUnnamedIgnore,
    showModal,
    toggleModal,
    openModal,
    closeModal,
    badgeNum: regexList.expressions.length + regexList.sections.length,
    uploadRegex,
    saveRegex,
    resetRegex,
    gettingCoverage,
  };
}

export default useRegex;
