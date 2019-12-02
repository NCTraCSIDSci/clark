import { useState, useEffect } from 'react';

import API from '../API';

function usePatientDetails() {
  const [show, toggle] = useState(false);
  const [patient, setPatient] = useState({});
  const [patientId, setPatientId] = useState('');
  const [loading, setLoading] = useState(true);

  function setId(rowDetails) {
    const { id } = rowDetails.rowData;
    setPatientId(id);
    toggle(true);
  }

  function getPatientInfo() {
    setLoading(true);
    API.getPatientDetails(patientId)
      .then((res) => {
        setPatient(res);
        setLoading(false);
      })
      .catch((err) => {
        console.log('unable to get patient:', patientId);
        console.log('error message:', err);
        setLoading(false);
      });
  }

  useEffect(() => {
    if (patientId) {
      getPatientInfo();
    }
  }, [patientId]);

  return {
    setId,
    patient,
    show,
    toggle,
    loading,
  };
}

export default usePatientDetails;
