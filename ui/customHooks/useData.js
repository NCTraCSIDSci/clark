import { useState } from 'react';

function useData() {
  const [data, setData] = useState({});

  return {
    data,
    setData,
  };
}

export default useData;
