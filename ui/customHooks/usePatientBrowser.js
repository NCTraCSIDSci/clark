import { useState, useEffect } from 'react';
import { cloneDeep } from 'lodash';

import API from '../API';

const columns = [
  {
    dataKey: 'id',
    label: 'ID',
    width: 100,
    sortable: false,
  },
  {
    dataKey: 'birthDate',
    label: 'Birthdate',
    width: 100,
    sortable: false,
  },
  {
    dataKey: 'gender',
    label: 'Gender',
    width: 100,
    sortable: false,
  },
  {
    dataKey: 'maritalStatus',
    label: 'Marital Status',
    width: 200,
    sortable: false,
  },
  {
    dataKey: 'num_labs',
    label: 'Labs',
    width: 80,
    sortable: true,
  },
  {
    dataKey: 'num_medications',
    label: 'Meds',
    width: 80,
    sortable: true,
  },
  {
    dataKey: 'num_notes',
    label: 'Notes',
    width: 80,
    sortable: true,
  },
  {
    dataKey: 'num_vitals',
    label: 'Vitals',
    width: 80,
    sortable: true,
  },
];

const initialFilter = {
  text: {},
  sort: {},
};

function usePatientBrowser() {
  const [fhirDir, setFhirDirectory] = useState('');
  const [patientList, setPatientList] = useState([]);
  const [sortedPatients, updateSortedPatients] = useState([]);
  const [filter, setFilter] = useState(initialFilter);
  const [sortedDir, setSortedDir] = useState(null);
  const [sortedBy, setSortedBy] = useState('');

  function initializeFilter() {
    columns.forEach((column) => {
      if (column.sortable) {
        filter.sort[column.dataKey] = null;
      } else {
        filter.text[column.dataKey] = '';
      }
    });
    setFilter({ ...filter });
  }

  function initialize(type) {
    API.getPatientList(type)
      .then((list) => {
        setPatientList(list);
        updateSortedPatients(list);
        initializeFilter();
      })
      .catch(() => {
        setPatientList([]);
        updateSortedPatients([]);
      });
  }

  function sortByColumn({ sortBy, sortDirection }) {
    if (sortedBy === sortBy && sortedDir === 'DESC') {
      setSortedDir(null);
      setSortedBy(null);
    } else {
      setSortedDir(sortDirection);
      setSortedBy(sortBy);
    }
    const tempFilter = cloneDeep(filter);
    Object.keys(tempFilter.sort).forEach((sortItem) => {
      if (sortItem === sortBy) {
        tempFilter.sort[sortItem] = sortDirection;
      } else {
        tempFilter.sort[sortItem] = null;
      }
    });
    setFilter(tempFilter);
  }

  function updateFilter(key, value) {
    const tempFilter = cloneDeep(filter);
    tempFilter.text[key] = value;
    setFilter(tempFilter);
  }

  useEffect(() => {
    if (Object.keys(patientList).length) {
      let sortedList = cloneDeep(patientList);
      Object.keys(filter.text).forEach((key) => {
        sortedList = sortedList.filter((patient) => {
          if (!(key in patient)) {
            console.log(`Patient without ${key} was excluded`);
            return false;
          }
          return patient[key].toLowerCase().includes(filter.text[key].toLowerCase());
        });
      });
      Object.keys(filter.sort).forEach((key) => {
        if (filter.sort[key] && sortedBy) {
          if (sortedDir === 'ASC') {
            sortedList = sortedList.sort((a, b) => a[sortedBy] - b[sortedBy]);
          } else if (sortedDir === 'DESC') {
            sortedList = sortedList.sort((a, b) => b[sortedBy] - a[sortedBy]);
          }
        }
      });
      updateSortedPatients(sortedList);
    }
  }, [filter]);

  return {
    fhirDir,
    setFhirDirectory,
    initialize,
    sortedPatients,
    numPatients: patientList.length,
    filter,
    updateFilter,
    sortByColumn,
    sortedDir,
    sortedBy,
    columns,
  };
}

export default usePatientBrowser;
