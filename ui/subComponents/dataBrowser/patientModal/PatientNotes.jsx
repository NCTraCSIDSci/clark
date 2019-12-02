import React, { useState, useEffect } from 'react';
import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import shortid from 'shortid';

import API from '../../../API';
import highlight from '../../../helperFunctions/highlight';
import addSections from '../../../helperFunctions/addSections';

function PatientNotes(props) {
  const { noteIds, patientId, regex } = props;
  const [note, setNote] = useState({});
  const [noteId, setNoteId] = useState('');
  const [noteText, setNoteText] = useState(['Please select a note']);

  function getNote(id) {
    if (id !== noteId) {
      API.getPatientNote(patientId, id)
        .then((res) => {
          setNote(res);
          setNoteId(id);
        })
        .catch((err) => {
          console.log('error:', err);
        });
    }
  }

  useEffect(() => {
    if (regex.tab === 'sections') {
      const text = addSections(regex.sectionBreak, note.data);
      console.log('text', text);
      setNoteText(text);
    } else {
      const text = highlight(regex.validRegex, note.data);
      setNoteText(text);
    }
  }, [regex.tab, regex.sectionBreak, regex.validRegex, note.data]);

  return (
    <div id="patientNotes">
      <div id="noteIds">
        <List>
          {noteIds.map((id) => (
            <ListItem
              key={shortid.generate()}
              button
              onClick={() => getNote(id)}
              className={id === noteId ? 'activePage' : ''}
            >
              {id}
            </ListItem>
          ))}
        </List>
      </div>
      <div id="patientNote">
        <p>{note.id}</p>
        <p>{note.indexed}</p>
        <p>{note.status}</p>
        {noteText.map((section) => section)}
      </div>
    </div>
  );
}

export default PatientNotes;
