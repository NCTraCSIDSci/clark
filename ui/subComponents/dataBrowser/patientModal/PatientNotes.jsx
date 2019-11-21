import React, { useState } from 'react';
import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import shortid from 'shortid';

import API from '../../../API';

function PatientNotes(props) {
  const { noteIds, patientId } = props;
  const [note, setNote] = useState({});

  function getNote(noteId) {
    API.getPatientNote(patientId, noteId)
      .then((res) => {
        console.log('result note', res);
        setNote(res);
      })
      .catch((err) => {
        console.log('error:', err);
      });
  }

  return (
    <div id="patientNotes">
      <div id="noteIds">
        <List>
          {noteIds.map((noteId) => (
            <ListItem
              key={shortid.generate()}
              button
              onClick={() => getNote(noteId)}
            >
              {noteId}
            </ListItem>
          ))}
        </List>
      </div>
      <div id="patientNote">
        <p>{note.id}</p>
        <p>{note.indexed}</p>
        <p>{note.status}</p>
        <p>{note.data}</p>
      </div>
    </div>
  );
}

export default PatientNotes;
