import React, { useState, useEffect } from 'react';
import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import shortid from 'shortid';
import { debounce } from 'lodash';

import API from '../../../API';
import highlight from '../../../helperFunctions/highlight';
import addSections from '../../../helperFunctions/addSections';

function doMarkup(
  note, setText, regex,
) {
  if (regex.tab === 'sections') {
    const text = addSections(note, regex);
    setText(text);
  } else {
    const text = highlight(note, regex.validRegex);
    setText(text);
  }
}

const markup = debounce(doMarkup, 500);

function PatientNotes(props) {
  const {
    noteIds, patientId, regex, type,
  } = props;
  const [note, setNote] = useState({});
  const [noteId, setNoteId] = useState('');
  const [noteText, setNoteText] = useState(['Loading...']);

  function getNote(id) {
    if (id !== noteId) {
      API.getPatientNote(patientId, id, type)
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
    markup(note.data, setNoteText, regex);
  }, [regex.sectionBreak, regex.validRegex]);

  useEffect(() => {
    markup(note.data, setNoteText, regex);
    markup.flush(); // if note or regex tab change, run markup immediately
  }, [note.data, regex.tab]);

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
          {noteText.map((section) => section)}
        </div>
      </div>
    </div>
  );
}

export default PatientNotes;
