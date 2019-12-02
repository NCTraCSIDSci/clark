import { useState, useEffect } from 'react';
import { cloneDeep } from 'lodash';

import API from '../API';

const initialMetaData = {
  labs: {},
  meds: {},
  vitals: {},
};

const initialFilter = {
  labs: {
    text: '',
    sort: 'desc',
    features: ['max', 'min', 'recent', 'oldest'],
    count: 0,
  },
  meds: {
    text: '',
    sort: 'desc',
    features: ['count', 'boolean'],
    count: 0,
  },
  vitals: {
    text: '',
    sort: 'desc',
    features: ['max', 'min', 'recent', 'oldest'],
    count: 0,
  },
};

function useMetaData() {
  const [metaData, setMetaData] = useState(initialMetaData);
  const [initialLists, setInitialLists] = useState({});
  const [filteredList, setFilteredList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState(initialFilter);
  const [tab, setTab] = useState(Object.keys(initialFilter)[0]);
  const [badgeNum, updateBadgeNum] = useState(0);

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

  function initialize() {
    setLoading(true);
    const calls = [API.getLabs(), API.getMeds(), API.getVitals()];
    Promise.all(calls)
      .then((res) => {
        setInitialLists({
          labs: res[0].data,
          meds: res[1].data,
          vitals: res[2].data,
        });
        setLoading(false);
      })
      .catch((err) => {
        console.log('error', err);
      });
  }

  function updateMetaData(code, system, value) {
    const key = `${code} ${system}`;
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
      updateFilteredList();
    }
  }, [filter, tab, loading]);

  return {
    metaData,
    updateMetaData,
    initialize,
    loading,
    filter,
    updateFilter,
    tab,
    setTab,
    filteredList,
    badgeNum,
  };
}

export default useMetaData;
