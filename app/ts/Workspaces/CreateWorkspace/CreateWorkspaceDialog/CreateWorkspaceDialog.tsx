import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  Grid,
  Radio,
  RadioGroup,
  Select
} from '@material-ui/core';
import {ErrorObject} from 'ajv';
import DialogTitleWithCross from 'app/ts/DialogTitleWithCross/DialogTitleWithCross';
import DisplayErrors from 'app/ts/util/DisplayErrors';
import _ from 'lodash';
import React, {ChangeEvent, useContext} from 'react';
import {CreateWorkspaceContext} from '../CreateWorkspaceContext';
import IWorkspaceExample from '../IWorkspaceExample';
import {TWorkspaceCreateMethod} from '../TWorkspaceCreateMethod';

export default function CreateWorkspaceDialog({
  isDialogOpen,
  closeDialog
}: {
  isDialogOpen: boolean;
  closeDialog: () => void;
}): JSX.Element {
  const {
    examples,
    tutorials,
    method,
    setMethod,
    selectedProblem,
    setSelectedProblem,
    setUploadedFile,
    addWorkspaceCallback,
    validationErrors
  } = useContext(CreateWorkspaceContext);

  function handleMethodChanged(event: ChangeEvent<HTMLInputElement>): void {
    const method: TWorkspaceCreateMethod = event.target
      .value as TWorkspaceCreateMethod; //FIXME ?
    setMethod(method);
    if (method === 'example') {
      setSelectedProblem(examples[0]);
    } else if (method === 'tutorial') {
      setSelectedProblem(tutorials[0]);
    }
  }

  function renderWorkspaceInput(): JSX.Element {
    if (method === 'example') {
      return (
        <Select
          native
          id="example-workspace-selector"
          value={selectedProblem.title}
          onChange={handleExampleChanged}
          style={{minWidth: 220}}
        >
          <SelectOptions workspaceExamples={examples} />
        </Select>
      );
    } else if (method === 'tutorial') {
      return (
        <Select
          native
          id="tutorial-workspace-selector"
          value={selectedProblem.title}
          onChange={handleTutorialChanged}
          style={{minWidth: 220}}
        >
          <SelectOptions workspaceExamples={tutorials} />
        </Select>
      );
    } else if (method === 'upload') {
      return <input type="file" onChange={handleFileUpload} />;
    } else {
      return <></>;
    }
  }

  function SelectOptions({
    workspaceExamples
  }: {
    workspaceExamples: IWorkspaceExample[];
  }): JSX.Element {
    return (
      <>
        {_.map(
          workspaceExamples,
          (workspaceExample: IWorkspaceExample): JSX.Element => (
            <option value={workspaceExample.title} key={workspaceExample.title}>
              {workspaceExample.title}
            </option>
          )
        )}
      </>
    );
  }

  function handleExampleChanged(event: ChangeEvent<{value: string}>): void {
    setSelectedProblem(_.find(examples, ['title', event.target.value]));
  }

  function handleTutorialChanged(event: ChangeEvent<{value: string}>): void {
    setSelectedProblem(_.find(tutorials, ['title', event.target.value]));
  }

  function handleFileUpload(event: ChangeEvent<HTMLInputElement>): void {
    setUploadedFile(event.target.files[0]);
  }

  function handleAddButtonClick(): void {
    closeDialog();
    addWorkspaceCallback();
  }

  return (
    <Dialog open={isDialogOpen} onClose={closeDialog} fullWidth maxWidth={'sm'}>
      <DialogTitleWithCross id="dialog-title" onClose={closeDialog}>
        Add workspace
      </DialogTitleWithCross>
      <DialogContent>
        <Grid container>
          <Grid item xs={12}>
            Choose creation method
          </Grid>
          <Grid item xs={12}>
            <RadioGroup
              name="percentages-radio"
              value={method}
              onChange={handleMethodChanged}
            >
              <label id="example-workspace-radio">
                <Radio value="example" /> Select example workspace
              </label>
              <label id="tutorial-workspace-radio">
                <Radio value="tutorial" /> Select tutorial workspace
              </label>
              <label id="upload-workspace-radio">
                <Radio value="upload" /> Upload file
              </label>
              <label id="manual-workspace-radio">
                <Radio value="manual" /> Create new workspace
              </label>
            </RadioGroup>
          </Grid>
          <Grid item xs={12}>
            {renderWorkspaceInput()}
          </Grid>
          <Grid item xs={3}>
            {!_.isEmpty(validationErrors) ? 'Invalid upload: ' : ''}
          </Grid>
          <Grid item xs={9}>
            <DisplayErrors
              identifier="invalid-schema"
              errors={_.map(
                validationErrors,
                (error: ErrorObject): string =>
                  error.dataPath + ' ' + error.message
              )}
            />
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button
          id="add-workspace-button"
          color="primary"
          onClick={handleAddButtonClick}
          variant="contained"
          disabled={!_.isEmpty(validationErrors)}
        >
          Add
        </Button>
      </DialogActions>
    </Dialog>
  );
}
