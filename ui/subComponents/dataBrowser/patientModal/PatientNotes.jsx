import React, { useState, useEffect } from 'react';
import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import shortid from 'shortid';

import API from '../../../API';
import highlight from '../../../helperFunctions/highlight';
import addSections from '../../../helperFunctions/addSections';
import useDebounce from '../../../customHooks/useDebounce';

function PatientNotes(props) {
  const {
    noteIds, patientId, regex, type, popup,
  } = props;
  const [note, setNote] = useState({});
  const [noteId, setNoteId] = useState('');
  const [noteText, setNoteText] = useState(['Loading...']);

  const debouncedRegex = useDebounce(regex, 300);

  function getNote(id) {
    if (id !== noteId) {
      API.getPatientNote(patientId, id, type)
        .then((res) => {
          setNote(res);
          setNoteId(id);
        })
        .catch(() => {
          popup.showSnackbar({
            text: `Unable to get note: ${id}`,
            type: 'success',
          });
        });
    }
  }

  useEffect(() => {
    if (regex.tab === 'sections') {
      const text = addSections(note.data, regex);
      setNoteText(text);
    } else {
      const text = highlight(note.data, regex.validRegex);
      setNoteText(text);
    }
  }, [debouncedRegex]);

  useEffect(() => {
    if (regex.tab === 'sections') {
      const text = addSections(note.data, regex);
      setNoteText(text);
    } else {
      const text = highlight(note.data, regex.validRegex);
      setNoteText(text);
    }
  }, [note.data]);

  useEffect(() => {
    if (noteIds.length) {
      getNote(noteIds[0]);
    }
  }, []);

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
        <p>{note.indexed && `Date: ${note.indexed}`}</p>
        <div id="patientNoteText">
          {noteText.length ? (
            noteText.map((section) => section)
          ) : (
            'This patient has no notes.'
          )}
        </div>
      </div>
    </div>
  );
}

export default PatientNotes;
