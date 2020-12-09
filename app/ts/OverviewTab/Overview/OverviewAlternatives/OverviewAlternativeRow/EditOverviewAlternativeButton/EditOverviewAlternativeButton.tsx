import Button from '@material-ui/core/Button';
import Dialog from '@material-ui/core/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import Grid from '@material-ui/core/Grid';
import IconButton from '@material-ui/core/IconButton';
import TextField from '@material-ui/core/TextField';
import Tooltip from '@material-ui/core/Tooltip';
import Edit from '@material-ui/icons/Edit';
import IAlternative from '@shared/interface/IAlternative';
import DialogTitleWithCross from 'app/ts/DialogTitleWithCross/DialogTitleWithCross';
import createEnterHandler from 'app/ts/util/createEnterHandler';
import {getTitleError} from 'app/ts/util/getTitleError';
import {WorkspaceContext} from 'app/ts/Workspace/WorkspaceContext';
import React, {ChangeEvent, useContext, useEffect, useState} from 'react';

export default function EditOverviewAlternativeButton({
  alternative
}: {
  alternative: IAlternative;
}) {
  const {editAlternative, alternatives} = useContext(WorkspaceContext);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [title, setTitle] = useState<string>('');
  const [isButtonPressed, setIsButtonPressed] = useState<boolean>(false);
  const [error, setError] = useState<string>(
    getTitleError(title, alternatives, alternative.id)
  );

  useEffect(() => {
    setError(getTitleError(title, alternatives, alternative.id));
  }, [title]);

  const handleKey = createEnterHandler(handleButtonClick, isDisabled);

  function closeDialog(): void {
    setIsDialogOpen(false);
  }

  function openDialog(): void {
    setIsButtonPressed(false);
    setTitle(alternative.title);
    setIsDialogOpen(true);
  }

  function OverviewAlternativeChanged(
    event: ChangeEvent<HTMLTextAreaElement>
  ): void {
    setTitle(event.target.value);
  }

  function handleButtonClick(): void {
    if (!isButtonPressed) {
      setIsButtonPressed(true);
      closeDialog();
      editAlternative(alternative, title);
    }
  }

  function isDisabled(): boolean {
    return !!error || isButtonPressed;
  }

  return (
    <>
      <Tooltip title={'Edit alternative'}>
        <IconButton
          id={`edit-alternative-button-${alternative.id}`}
          color="primary"
          onClick={openDialog}
        >
          <Edit />
        </IconButton>
      </Tooltip>
      <Dialog
        open={isDialogOpen}
        onClose={closeDialog}
        fullWidth
        maxWidth={'sm'}
      >
        <DialogTitleWithCross id="dialog-title" onClose={closeDialog}>
          Edit alternative
        </DialogTitleWithCross>
        <DialogContent>
          <Grid container>
            <Grid item xs={12}>
              <TextField
                label="new title"
                id="alternative-title-input"
                value={title}
                onChange={OverviewAlternativeChanged}
                variant="outlined"
                onKeyDown={handleKey}
                autoFocus
                fullWidth
              />
            </Grid>
            <Grid
              id={`title-error`}
              item
              container
              xs={12}
              justify="flex-end"
              className="alert"
            >
              {error}
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button
            id={'edit-alternative-confirm-button'}
            variant="contained"
            color="primary"
            onClick={handleButtonClick}
            disabled={isDisabled()}
          >
            Edit
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
