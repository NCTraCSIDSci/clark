import { useState, useEffect } from 'react';

import API from '../API';

function usePatientDetails(type, popup) {
  const [show, toggle] = useState(false);
  const [patient, setPatient] = useState({});
  const [patientId, setPatientId] = useState('');
  const [loading, setLoading] = useState(true);

  function setId(rowDetails) {
    const { id } = rowDetails.rowData;
    setPatientId(id);
    toggle(true);
  }

  function exploreId(id) {
    setPatientId(id);
    toggle(true);
  }

  function getPatientInfo() {
    setLoading(true);
    API.getPatientDetails(patientId, type)
      .then((res) => {
        setPatient(res);
        setLoading(false);
      })
      .catch(() => {
        popup.showSnackbar({
          text: `Unable to get patient: ${patientId}`,
          type: 'error',
        });
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
    exploreId,
    patient,
    show,
    toggle,
    loading,
  };
}

export default usePatientDetails;
