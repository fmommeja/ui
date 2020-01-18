import React, { useState, useRef } from 'react';
import styled from 'styled-components';
import cx from 'classnames';
import TextArea from 'react-textarea-autosize';
import {
  Button,
  ButtonGroup,
  Classes,
  ControlGroup,
  EditableText,
  HTMLSelect,
  Icon,
  InputGroup,
  Intent,
  Menu,
  MenuDivider,
  MenuItem,
  NonIdealState,
  Popover,
  Text
} from '@blueprintjs/core';
import {
  FIELD_VALUE_TYPE_NOTE,
  FIELD_VALUE_TYPE_OTP,
  FIELD_VALUE_TYPE_PASSWORD,
  FIELD_VALUE_TYPE_TEXT
} from '@buttercup/facades';
import { FormattedInput, FormattedText } from '@buttercup/react-formatted-input';
import { useCurrentEntry, useGroups } from './hooks/vault';
import { PaneContainer, PaneContent, PaneHeader, PaneFooter } from './Pane';
import ConfirmButton from './ConfirmButton';
import OTPDigits from '../OTPDigits';
import { copyToClipboard, getThemeProp } from '../../utils';

const FIELD_TYPE_OPTIONS = [
  { type: FIELD_VALUE_TYPE_TEXT, title: 'Text (default)', icon: 'italic' },
  { type: FIELD_VALUE_TYPE_NOTE, title: 'Note', icon: 'align-left' },
  { type: FIELD_VALUE_TYPE_PASSWORD, title: 'Password', icon: 'key' },
  { type: FIELD_VALUE_TYPE_OTP, title: 'OTP', icon: 'time' }
];

function title(entry) {
  const titleField = entry.fields.find(
    item => item.propertyType === 'property' && item.property === 'title'
  );
  return titleField ? titleField.value : <i>(Untitled)</i>;
}

const ActionBar = styled.div`
  display: flex;
  justify-content: space-between;
  flex: 1;

  > div button {
    margin-right: 10px;
  }
`;
const ValueWithNewLines = styled.span`
  white-space: pre-wrap;
`;
const FormContainer = styled.div`
  background-color: ${p => (p.primary ? getThemeProp(p, 'entry.primaryContainer') : 'transparent')};
  border-radius: 5px;
  padding: 1rem;
  margin-bottom: 1rem;
`;
const CustomFieldsHeading = styled.h5`
  text-transform: uppercase;
  color: ${p => getThemeProp(p, 'entry.separatorTextColor')};
  display: flex;
  align-items: center;
  justify-content: center;
  white-space: nowrap;
  margin-bottom: 0;

  &:before,
  &:after {
    display: flex;
    content: '';
    height: 1px;
    background-color: ${p => getThemeProp(p, 'entry.separatorBorder')};
    width: 100%;
  }

  span {
    padding: 0 0.5rem;
  }
`;
const FieldRowContainer = styled.div`
  display: flex;
  margin-bottom: 0.5rem;
  padding: 0.5rem 0;
`;
const FieldRowLabel = styled.div`
  display: flex;
  justify-content: flex-end;
  align-items: center;
  color: ${p => getThemeProp(p, 'entry.separatorTextColor')};
  width: 100px;
  margin-right: 1rem;
`;
const FieldRowChildren = styled.div`
  display: flex;
  justify-content: flex-start;
  align-items: center;
  width: 100%;
  flex: 1;

  ${`.${Classes.CONTROL_GROUP}`} {
    flex: 1;
  }
`;

const FieldTextToolbar = styled(ButtonGroup)`
  margin-left: 0.5rem;
  opacity: 0;
`;
const FieldTextWrapper = styled.span`
  border: 1px dashed transparent;
  border-radius: 2px;
  display: inline-flex;
  justify-content: center;
  align-items: center;
  padding: 2px;
  word-break: break-all;
  pointer-events: ${p => (p.disabled ? 'none' : 'all')};

  &:hover {
    border-color: ${p => (p.disabled ? 'transparent' : getThemeProp(p, 'entry.fieldHoverBorder'))};

    ${FieldTextToolbar} {
      opacity: ${p => (p.disabled ? 0 : 1)};
    }
  }
`;

const FieldText = ({ entryFacade, field }) => {
  const [visible, toggleVisibility] = useState(false);
  const otpRef = useRef(field.value);
  const { onFieldUpdateInPlace } = useCurrentEntry();
  const Element = field.valueType === FIELD_VALUE_TYPE_PASSWORD ? 'code' : 'span';
  const { _history: history = [] } = entryFacade;
  const historyItems = history.filter(
    item => item.property === field.property && item.propertyType === field.propertyType
  );
  if (historyItems.length > 0 && historyItems[historyItems.length - 1].newValue === field.value) {
    // Remove last item as it just shows the current value
    historyItems.pop();
  }
  const historyMenu = (
    <Menu>
      <For each="historyItem" of={historyItems} index="idx">
        <MenuItem
          text={`'${field.property}' was set to "${historyItem.newValue}"`}
          key={`${field.property}:${idx}`}
        >
          <MenuItem
            text="Copy Historical Value"
            icon="clipboard"
            onClick={() => copyToClipboard(historyItem.newValue)}
          />
          <MenuDivider />
          <MenuItem
            text="Restore Historical Value"
            icon="redo"
            intent={Intent.DANGER}
            onClick={() => {
              onFieldUpdateInPlace(entryFacade.id, field, historyItem.newValue);
            }}
          />
        </MenuItem>
      </For>
    </Menu>
  );
  return (
    <FieldTextWrapper role="content" disabled={!field.value}>
      <Choose>
        <When condition={field.valueType === FIELD_VALUE_TYPE_OTP}>
          <OTPDigits otpURI={field.value} otpRef={value => (otpRef.current = value)} />
        </When>
        <When condition={!field.value}>
          <Text className={Classes.TEXT_MUTED}>Not set.</Text>
        </When>
        <When condition={field.valueType === FIELD_VALUE_TYPE_NOTE}>
          <ValueWithNewLines>{field.value}</ValueWithNewLines>
        </When>
        <When condition={field.formatting && field.formatting.options}>
          {typeof field.formatting.options === 'object'
            ? field.formatting.options[field.value] || field.value
            : field.value}
        </When>
        <Otherwise>
          <Element>
            <Choose>
              <When condition={field.valueType === FIELD_VALUE_TYPE_PASSWORD && !visible}>
                ●●●●
              </When>
              <Otherwise>
                <FormattedText
                  format={
                    field.formatting && field.formatting.format
                      ? field.formatting.format
                      : undefined
                  }
                  value={field.value || ''}
                />
              </Otherwise>
            </Choose>
          </Element>
        </Otherwise>
      </Choose>
      <FieldTextToolbar>
        <If condition={field.valueType === FIELD_VALUE_TYPE_PASSWORD}>
          <Button
            text={visible ? 'Hide' : 'Reveal'}
            small
            onClick={() => toggleVisibility(!visible)}
          />
        </If>
        <Button icon="clipboard" small onClick={() => copyToClipboard(otpRef.current)} />
        <Popover content={historyMenu} boundary="viewport">
          <Button icon="history" small disabled={historyItems.length <= 0} />
        </Popover>
      </FieldTextToolbar>
    </FieldTextWrapper>
  );
};

const FieldRow = ({
  field,
  editing,
  entryFacade,
  onFieldNameUpdate,
  onFieldUpdate,
  onFieldSetValueType,
  onRemoveField
}) => {
  const label =
    editing && field.removeable ? (
      <EditableText
        value={field.property}
        onChange={value => {
          onFieldNameUpdate(field, value);
        }}
      />
    ) : (
      field.title || field.property
    );
  const renderMenu = (
    <Menu>
      {/*
        The following is in the parent level due to:
          - https://github.com/palantir/blueprint/issues/2796
          - https://github.com/palantir/blueprint/issues/3010#issuecomment-443031120
      */}
      <For each="fieldTypeOption" of={FIELD_TYPE_OPTIONS}>
        <MenuItem
          key={fieldTypeOption.type}
          text={`Change Type: ${fieldTypeOption.title}`}
          icon={fieldTypeOption.icon}
          labelElement={
            field.valueType === fieldTypeOption.type ? <Icon icon="small-tick" /> : null
          }
          onClick={() => {
            onFieldSetValueType(field, fieldTypeOption.type);
          }}
        />
      </For>
      <MenuDivider />
      <MenuItem text="Delete Field" icon="trash" onClick={() => onRemoveField(field)} />
    </Menu>
  );
  return (
    <FieldRowContainer>
      <If condition={!(field.valueType === FIELD_VALUE_TYPE_NOTE && !field.removeable)}>
        <FieldRowLabel>{label}</FieldRowLabel>
      </If>
      <FieldRowChildren>
        <Choose>
          <When condition={editing}>
            <ControlGroup>
              <Choose>
                <When condition={field.valueType === FIELD_VALUE_TYPE_NOTE}>
                  <TextArea
                    className={cx(Classes.INPUT, Classes.FILL)}
                    value={field.value}
                    onChange={val => onFieldUpdate(field, val.target.value)}
                  />
                </When>
                <When condition={field.formatting && field.formatting.options}>
                  <HTMLSelect
                    fill
                    defaultValue={field.value ? undefined : field.formatting.defaultOption}
                    value={field.value || undefined}
                    onChange={event => onFieldUpdate(field, event.target.value)}
                  >
                    <Choose>
                      <When condition={typeof field.formatting.options === 'object'}>
                        <For each="optionValue" of={Object.keys(field.formatting.options)}>
                          <option key={optionValue} value={optionValue}>
                            {field.formatting.options[optionValue]}
                          </option>
                        </For>
                      </When>
                      <Otherwise>
                        <For each="optionValue" of={field.formatting.options}>
                          <option key={optionValue} value={optionValue}>
                            {optionValue}
                          </option>
                        </For>
                      </Otherwise>
                    </Choose>
                  </HTMLSelect>
                </When>
                <Otherwise>
                  <FormattedInput
                    minimal
                    className={Classes.FILL}
                    element={InputGroup}
                    value={field.value}
                    onChange={(formattedValue, raw) => onFieldUpdate(field, raw)}
                    placeholder={
                      field.formatting && field.formatting.placeholder
                        ? field.formatting.placeholder
                        : field.title
                    }
                    format={
                      field.formatting && field.formatting.format
                        ? field.formatting.format
                        : undefined
                    }
                  />
                </Otherwise>
              </Choose>
              <If condition={field.removeable}>
                <Popover content={renderMenu} boundary="viewport" captureDismiss={false}>
                  <Button icon="cog" />
                </Popover>
              </If>
            </ControlGroup>
          </When>
          <Otherwise>
            <FieldText field={field} entryFacade={entryFacade} />
          </Otherwise>
        </Choose>
      </FieldRowChildren>
    </FieldRowContainer>
  );
};

const EntryDetailsContent = () => {
  const {
    entry,
    editing,
    onAddField,
    onCancelEdit,
    onEdit,
    onDeleteEntry,
    onFieldNameUpdate,
    onFieldUpdate,
    onFieldSetValueType,
    onRemoveField,
    onSaveEdit
  } = useCurrentEntry();
  const { onMoveEntryToTrash, trashID } = useGroups();

  const editableFields = editing
    ? entry.fields.filter(item => item.propertyType === 'property')
    : entry.fields.filter(item => item.propertyType === 'property' && item.property !== 'title');
  const mainFields = editableFields.filter(field => !field.removeable);
  const removeableFields = editableFields.filter(field => field.removeable);

  return (
    <>
      <PaneHeader title={editing ? 'Edit Document' : title(entry)} />
      <PaneContent>
        <FormContainer primary>
          <For each="field" of={mainFields}>
            <FieldRow
              key={field.id}
              entryFacade={entry}
              field={field}
              onFieldNameUpdate={onFieldNameUpdate}
              onFieldUpdate={onFieldUpdate}
              onRemoveField={onRemoveField}
              editing={editing}
            />
          </For>
        </FormContainer>
        <If condition={editing || removeableFields.length > 0}>
          <CustomFieldsHeading>
            <span>Custom Fields:</span>
          </CustomFieldsHeading>
        </If>
        <FormContainer>
          <For each="field" of={removeableFields}>
            <FieldRow
              key={field.id}
              entryFacade={entry}
              field={field}
              onFieldNameUpdate={onFieldNameUpdate}
              onFieldUpdate={onFieldUpdate}
              onFieldSetValueType={onFieldSetValueType}
              onRemoveField={onRemoveField}
              editing={editing}
            />
          </For>
        </FormContainer>
        <If condition={editing}>
          <Button onClick={onAddField} text="Add Custom Field" icon="small-plus" />
        </If>
      </PaneContent>
      <PaneFooter>
        <ActionBar>
          <If condition={!editing}>
            <Button onClick={onEdit} icon="edit" disabled={entry.parentID === trashID}>
              Edit
            </Button>
          </If>
          <If condition={editing}>
            <div>
              <Button onClick={onSaveEdit} intent={Intent.PRIMARY} icon="tick">
                Save
              </Button>
              <Button onClick={onCancelEdit}>Cancel</Button>
            </div>
            <If condition={!entry.isNew}>
              <ConfirmButton
                icon="trash"
                title="Confirm move to Trash"
                description="Are you sure you want to move this entry to Trash?"
                primaryAction="Move to Trash"
                onClick={() => onMoveEntryToTrash(entry.id)}
                danger
              />
            </If>
          </If>
        </ActionBar>
      </PaneFooter>
    </>
  );
};

const EntryDetails = () => {
  const { entry } = useCurrentEntry();
  return (
    <PaneContainer>
      <Choose>
        <When condition={entry}>
          <EntryDetailsContent />
        </When>
        <Otherwise>
          <PaneContent>
            <NonIdealState
              icon="satellite"
              title="No document selected"
              description="Select or create a new document."
            />
          </PaneContent>
        </Otherwise>
      </Choose>
    </PaneContainer>
  );
};

export default EntryDetails;
