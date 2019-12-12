import React from 'react';
import Zoom from '@material-ui/core/Zoom';
import Dialog from '@material-ui/core/Dialog';
import DialogTitle from '@material-ui/core/DialogTitle';
import DialogContent from '@material-ui/core/DialogContent';
import DialogActions from '@material-ui/core/DialogActions';
import TextField from '@material-ui/core/TextField';
import Button from '@material-ui/core/Button';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import Checkbox from '@material-ui/core/Checkbox';

const Transition = React.forwardRef((props, ref) => <Zoom ref={ref} {...props} />); // eslint-disable-line react/jsx-props-no-spreading

function AddRegexModal(props) {
  const { regex, container } = props;

  return (
    <Dialog
      open={regex.showModal}
      onClose={() => regex.toggleModal(false)}
      TransitionComponent={Transition}
      maxWidth="xl"
      fullWidth
      container={container}
      BackdropProps={{ style: { position: 'absolute' } }}
      style={{ position: 'absolute' }}
      PaperProps={{ style: { height: '100%' } }}
    >
      <DialogTitle>
        Test
      </DialogTitle>
      <DialogContent id="regexModalContent">
        <TextField
          label="Name"
          onChange={(e) => regex.updateName(e.target.value)}
          value={regex.activeName}
        />
        <TextField
          label="Reg Exp"
          multiline
          rows="3"
          placeholder="\bdisease\b"
          onChange={(e) => regex.updateRegex(e.target.value)}
          value={regex.activeRegex}
        />
        {regex.compiled && (
          <TextField
            label="Compiled Reg Exp"
            multiline
            rows="3"
            disabled
            value={regex.compiled}
          />
        )}
        {regex.tab === 'sections' && (
          <FormControlLabel
            control={(
              <Checkbox
                checked={regex.ignore}
                onChange={() => regex.updateIgnore(!regex.ignore)}
                value="ignore"
              />
            )}
            label="Ignore"
          />
        )}
      </DialogContent>
      <DialogActions id="dialogActions">
        <Button
          onClick={() => regex.toggleModal(false)}
          className="popupButton"
        >
          Close
        </Button>
        <Button
          onClick={regex.save}
          disabled={!regex.activeName || !regex.activeRegex}
        >
          Save
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default AddRegexModal;
