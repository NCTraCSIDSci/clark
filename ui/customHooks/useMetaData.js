import { useState, useEffect } from 'react';
import { cloneDeep } from 'lodash';

import API from '../API';

const initialMetaData = {
  patient: {},
  labs: {},
  meds: {},
  vitals: {},
};

const initialFilter = {
  patient: {},
  labs: {
    text: '',
    sort: 'desc',
    features: ['max', 'min', 'newest', 'oldest'],
  },
  meds: {
    text: '',
    sort: 'desc',
    features: ['count', 'boolean'],
  },
  vitals: {
    text: '',
    sort: 'desc',
    features: ['max', 'min', 'newest', 'oldest'],
  },
};

const patientMetaData = [
  {
    display: 'age',
  },
  {
    display: 'gender',
  },
  {
    display: 'race',
  },
  {
    display: 'ethnicity',
  },
  {
    display: 'marital status',
  },
];

function useMetaData(popup) {
  const [metaData, setMetaData] = useState(initialMetaData);
  const [initialLists, setInitialLists] = useState({});
  const [initialized, setInitialized] = useState(false);
  const [filteredList, setFilteredList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState(initialFilter);
  const [tab, setTab] = useState(Object.keys(initialFilter)[0]);
  const [badgeNum, updateBadgeNum] = useState(0);

  function updateDate(d) {
    const tempMetaData = cloneDeep(metaData);
    if (d) {
      tempMetaData.patient.date = d;
    } else { // null date, need to clear the selected metaData
      delete tempMetaData.patient.date;
      const len = tempMetaData.patient.age ? tempMetaData.patient.age.length : 0;
      updateBadgeNum((prev) => prev - len);
      delete tempMetaData.patient.age;
    }
    setMetaData(tempMetaData);
  }

  function updateFilteredList() {
    const tempFilteredList = initialLists[tab].filter((patient) => {
      const searchText = filter[tab].text.toLowerCase();
      const displayText = patient.display.toLowerCase();
      if (displayText.indexOf(searchText) !== -1) {
        return true;
      }
      return false;
    });
    if (filter[tab].sort === 'asc') {
      tempFilteredList.sort((a, b) => a.unique_count - b.unique_count);
    } else {
      tempFilteredList.sort((a, b) => b.unique_count - a.unique_count);
    }
    setFilteredList(tempFilteredList);
  }

  function initialize(type) {
    setLoading(true);
    const calls = [API.getLabs(type), API.getMeds(type), API.getVitals(type)];
    Promise.all(calls)
      .then((res) => {
        setInitialLists({
          labs: res[0].data,
          meds: res[1].data,
          vitals: res[2].data,
          patient: patientMetaData,
        });
        setLoading(false);
        setInitialized(true);
      })
      .catch((err) => {
        // TODO: make this better
        popup.showModal({
          text: err,
          type: 'error',
        });
      });
  }

  function updateMetaData(system, code, value) {
    const key = `(${system}${code ? `, ${code}` : ''}`;
    if (metaData[tab][key]) {
      const aggregationArray = metaData[tab][key];
      const index = aggregationArray.indexOf(value);
      if (index !== -1) {
        updateBadgeNum((prev) => prev - 1);
        aggregationArray.splice(index, 1);
        if (!aggregationArray.length) {
          delete metaData[tab][key];
        }
      } else {
        updateBadgeNum((prev) => prev + 1);
        aggregationArray.push(value);
      }
    } else {
      updateBadgeNum((prev) => prev + 1);
      metaData[tab][key] = [value];
    }
    setMetaData({ ...metaData });
  }

  function updateFilter(key, value) {
    const tempFilter = cloneDeep(filter);
    if (key === 'text') {
      tempFilter[tab][key] = value;
    } else {
      tempFilter[tab][key] = tempFilter[tab][key] === 'asc' ? 'desc' : 'asc';
    }
    setFilter(tempFilter);
  }

  useEffect(() => {
    if (!loading) {
      if (tab !== 'patient') {
        updateFilteredList();
      } else {
        setFilteredList(['patient']);
      }
    }
  }, [filter, tab, loading]);

  function modifyForExport(obj, type) {
    const tempObj = {};
    Object.keys(obj).forEach((key) => {
      if (type === 'patient' && key === 'date') {
        tempObj.age = tempObj.age || {};
        tempObj.age.reference_date = obj.date;
      } else {
        tempObj[key] = tempObj[key] || {};
        tempObj[key].features = obj[key];
      }
    });
    return tempObj;
  }

  function loadMetaData(obj) {
    const tempMetaData = {};
    let num = 0;
    Object.keys(obj).forEach((metaDataKey) => {
      tempMetaData[metaDataKey] = {};
      Object.keys(obj[metaDataKey]).forEach((keyItem) => {
        if (metaDataKey === 'patient' && keyItem === 'age') {
          tempMetaData.patient.age = obj.patient.age.features;
          tempMetaData.patient.date = obj.patient.age.reference_date;
        } else {
          tempMetaData[metaDataKey][keyItem] = obj[metaDataKey][keyItem].features;
          num += obj[metaDataKey][keyItem].features.length;
        }
      });
    });
    setMetaData(tempMetaData);
    updateBadgeNum(num);
  }

  function exportMetaData() {
    const tempMetaData = {
      patient: modifyForExport(metaData.patient, 'patient'),
      labs: modifyForExport(metaData.labs),
      meds: modifyForExport(metaData.meds),
      vitals: modifyForExport(metaData.vitals),
    };
    return tempMetaData;
  }

  return {
    exportMetaData,
    loadMetaData,
    metaData,
    updateMetaData,
    initialize,
    initialized,
    loading,
    filter,
    updateFilter,
    tab,
    setTab,
    filteredList,
    badgeNum,
    patientMetaData,
    updateDate,
  };
}

export default useMetaData;
