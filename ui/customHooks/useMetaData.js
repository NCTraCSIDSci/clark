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
    features: ['max', 'min', 'recent', 'oldest'],
  },
  meds: {
    text: '',
    sort: 'desc',
    features: ['count', 'boolean'],
  },
  vitals: {
    text: '',
    sort: 'desc',
    features: ['max', 'min', 'recent', 'oldest'],
  },
};

const patientMetaData = [
  {
    display: 'Age',
  },
  {
    display: 'Gender',
  },
  {
    display: 'Race',
  },
  {
    display: 'Ethnicity',
  },
  {
    display: 'Marital Status',
  },
];

function useMetaData() {
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
      const len = tempMetaData.patient.Age ? tempMetaData.patient.Age.length : 0;
      updateBadgeNum((prev) => prev - len);
      delete tempMetaData.patient.Age;
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
        console.log('error', err);
      });
  }

  function updateMetaData(code, system, value) {
    const key = `${code}${system ? ` ${system}` : ''}`;
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

  function loadMetaData(obj) {
    setMetaData(obj);
    let num = 0;
    Object.keys(obj).forEach((metaDataKey) => {
      Object.keys(obj[metaDataKey]).forEach((feature) => {
        num += obj[metaDataKey][feature].length;
      });
    });
    updateBadgeNum(num);
  }

  return {
    metaData,
    setMetaData,
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
    loadMetaData,
  };
}

export default useMetaData;
