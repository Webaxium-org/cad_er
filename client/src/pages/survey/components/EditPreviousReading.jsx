import * as Yup from 'yup';

import { Box, Grid, Stack } from '@mui/material';
import AlertDialogSlide from '../../../components/AlertDialogSlide';
import BasicInput from '../../../components/BasicInput';
import { useEffect, useState } from 'react';
import { handleFormError } from '../../../utils/handleFormError';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { updateSurveyRow } from '../../../services/surveyServices';
import { showAlert } from '../../../redux/alertSlice';
import { IoAdd } from 'react-icons/io5';
import { IoIosRemove } from 'react-icons/io';

const alertData = {
  title: 'Edit Previous Reading',
  description: '',
  cancelButtonText: 'Cancel',
  submitButtonText: 'Update',
};

const initialFormValues = {
  type: 'Chainage',
  chainage: '',
  intermediateOffsets: [{ intermediateSight: '', offset: '', remark: '' }],
  intermediateSight: '',
  foreSight: '',
  backSight: '',
  remark: '',
};

const values = {
  Chainage: ['chainage', 'intermediateOffsets'],
  CP: ['foreSight', 'backSight', 'remark'],
  TBM: ['intermediateSight', 'remark'],
  'Instrument setup': ['backSight', 'remark'],
};

const inputDetails = [
  { label: 'Chainage*', name: 'chainage', placeholder: '0/000', type: 'text' },
  { label: 'Fore sight*', name: 'foreSight', type: 'number' },
  { label: 'Back sight*', name: 'backSight', type: 'number' },
  { label: 'Remark*', name: 'remark', type: 'text' },
];

const EditPreviousReading = ({ open, doc, updateDoc, onCancel, onSubmit }) => {
  const dispatch = useDispatch();

  const navigate = useNavigate();

  const [formValues, setFormValues] = useState(initialFormValues);

  const [formErrors, setFormErrors] = useState({});

  const [formWarnings, setFormWarnings] = useState({});

  const [inputData, setInputData] = useState([]);

  const schema = Yup.object().shape({
    type: Yup.string().required('Type is required'),

    chainage: Yup.string().when('type', {
      is: 'Chainage',
      then: (schema) =>
        schema
          .required('Chainage is required')
          .matches(
            /^\d+(\/|\+|,)\d+(\.\d{1,3})?$/,
            "Invalid chainage format. Use ####/###.### or '####+###.###' or '####,###.###'"
          ),
      otherwise: (schema) => schema.nullable(),
    }),

    intermediateOffsets: Yup.array()
      .of(
        Yup.object().shape({
          reducedLevel:
            doc?.phase !== 'Proposal'
              ? Yup.number()
                  .transform((v, o) => (o === '' ? null : v))
                  .nullable()
              : Yup.number()
                  .transform((v, o) => (o === '' ? null : v))
                  .nullable()
                  .typeError('Reduced level is required')
                  .required('Reduced level is required'),
          intermediateSight:
            doc?.phase === 'Proposal'
              ? Yup.number()
                  .transform((v, o) => (o === '' ? null : v))
                  .nullable()
              : Yup.number()
                  .transform((v, o) => (o === '' ? null : v))
                  .nullable()
                  .typeError('Intermediate sight is required')
                  .required('Intermediate sight is required'),
          offset: Yup.number()
            .transform((v, o) => (o === '' ? null : v))
            .nullable()
            .typeError('Offset is required')
            .required('Offset is required'),
          remark: Yup.string().required('Remark is required'),
        })
      )
      .when('type', {
        is: 'Chainage',
        then: (schema) =>
          schema
            .min(1, 'At least one row is required')
            .required('Offsets are required'),
        otherwise: (schema) => schema.transform(() => null).nullable(),
      }),

    foreSight: Yup.number()
      .transform((v, o) => (o === '' ? null : v))
      .when('type', {
        is: 'CP',
        then: (schema) =>
          schema
            .typeError('Fore sight is required')
            .required('Fore sight is required'),
        otherwise: (schema) => schema.nullable(),
      }),

    intermediateSight: Yup.number()
      .transform((v, o) => (o === '' ? null : v))
      .when('type', {
        is: 'TBM',
        then: (schema) =>
          schema
            .typeError('Intermediate sight is required')
            .required('Intermediate sight is required'),
        otherwise: (schema) => schema.nullable(),
      }),

    backSight: Yup.number()
      .transform((v, o) => (o === '' ? null : v))
      .when('type', {
        is: (val) => ['CP', 'Instrument setup'].includes(val),
        then: (schema) =>
          schema
            .typeError('Back sight is required')
            .required('Back sight is required'),
        otherwise: (schema) => schema.nullable(),
      }),

    remark: Yup.string()
      .trim()
      .when('type', {
        is: (val) => ['CP', 'TBM', 'Instrument setup'].includes(val),
        then: (schema) => schema.required('Remark is required'),
        otherwise: (schema) => schema.nullable(),
      }),
  });

  const handleAddRow = () => {
    setFormValues((prev) => ({
      ...prev,
      intermediateOffsets: [
        ...(formValues.intermediateOffsets || []),
        { intermediateSight: '', offset: '', remark: '' },
      ],
    }));
  };

  const handleRemoveRow = (index) => {
    if (formValues.intermediateOffsets.length > 1) {
      setFormValues((prev) => ({
        ...prev,
        intermediateOffsets: formValues.intermediateOffsets.filter(
          (_, idx) => idx !== index
        ),
      }));
    }
  };

  const handleInputChange = async (event, index, field) => {
    const { name, value } = event.target;

    const target =
      name === 'intermediateOffsets'
        ? `intermediateOffsets[${index}].${field}`
        : name;

    if (name === 'intermediateOffsets' || name === 'intermediateSight') {
      if (value) {
        const numValue = Number(value);
        if (!isNaN(numValue)) {
          const decimalPlaces = (value.toString().split('.')[1] || '').length;

          if (decimalPlaces > 0 && !value.endsWith('005')) {
            setFormWarnings({
              ...formWarnings,
              [target]: 'Floating values should end with .005',
            });
          } else {
            setFormWarnings({ ...formWarnings, [target]: null });
          }
        }
      }
    }

    if (name === 'intermediateOffsets') {
      const updated = [...formValues.intermediateOffsets];
      updated[index][field] = value;

      setFormValues((prev) => ({
        ...prev,
        intermediateOffsets: updated,
      }));
    } else {
      setFormValues((prev) => ({
        ...prev,
        [name]: value,
      }));
    }

    try {
      await Yup.reach(schema, name).validate(value);

      setFormErrors({ ...formErrors, [target]: null });
    } catch (error) {
      setFormErrors({ ...formErrors, [target]: error.message });
    }
  };

  const handleSubmit = async () => {
    try {
      await schema.validate(formValues, { abortEarly: false });
      let payload = null;

      if (doc.type === 'Chainage') {
        const sortedOffsets = [...(formValues.intermediateOffsets || [])].sort(
          (a, b) => a.offset - b.offset
        );

        payload = {
          ...formValues,
          reducedLevels:
            doc.phase !== 'Proposal'
              ? []
              : sortedOffsets.map((r) => r.reducedLevel),
          intermediateSight:
            doc.phase === 'Proposal'
              ? []
              : sortedOffsets.map((r) => r.intermediateSight),
          offsets: sortedOffsets.map((r) => r.offset),
          remark: sortedOffsets.map((r) => r.remark),
        };
      } else {
        payload = { ...formValues, chainage: null };
      }

      const { data } = await updateSurveyRow(doc.purposeId, doc._id, payload);

      if (data.success) {
        updateDoc((prev) => ({
          ...prev,
          rows: prev.rows?.map((r) => {
            if (String(r._id) === String(doc._id)) {
              return data.row;
            }

            return r;
          }),
        }));

        setFormValues({
          ...initialFormValues,
          intermediateOffsets: [
            { intermediateSight: '', offset: '', remark: '' },
          ],
        });

        onCancel();

        dispatch(
          showAlert({
            type: 'success',
            message: `${
              doc.type === 'Instrument setup' ? 'TBM' : doc.type
            } updated successfully`,
          })
        );
      } else {
        throw new Error('Something went wrong.');
      }
    } catch (error) {
      handleFormError(error, setFormErrors, dispatch, navigate);
    } finally {
      setFormWarnings({});
    }
  };

  useEffect(() => {
    const updatedFormValues = {
      type: doc.type,
    };

    const filteredInputData = inputDetails?.filter((d) =>
      values[doc.type]?.includes(d.name)
    );

    if (doc.type === 'TBM') {
      filteredInputData.unshift({
        label: 'Intermediate sight*',
        name: 'intermediateSight',
        type: 'number',
      });

      updatedFormValues.intermediateSight = doc.intermediateSight[0];
      updatedFormValues.remark = doc.remarks[0];
    }

    if (doc.type === 'Instrument setup') {
      updatedFormValues.backSight = doc.backSight;
      updatedFormValues.remark = doc.remarks[0];
    }

    if (doc.type === 'CP') {
      updatedFormValues.backSight = doc.backSight;
      updatedFormValues.foreSight = doc.foreSight;
      updatedFormValues.remark = doc.remarks[0];
    }

    if (doc.type === 'Chainage') {
      updatedFormValues.chainage = doc.chainage;
      updatedFormValues.intermediateOffsets = [];

      doc.intermediateSight?.forEach((i, idx) => {
        updatedFormValues.intermediateOffsets.push({
          intermediateSight: i,
          offset: doc.offsets[idx],
          remark: doc.remarks[idx],
        });
      });
    }

    setFormValues((prev) => ({ ...prev, ...updatedFormValues }));
    setInputData(filteredInputData);
  }, [doc]);

  return (
    <AlertDialogSlide
      {...alertData}
      content={
        <Box>
          <Grid container spacing={2} columns={12}>
            {inputData.map(({ size, ...input }, index) => (
              <Grid
                size={{
                  xs: size ? size : 12,
                }}
                key={index}
              >
                <Box
                  sx={{
                    '& .MuiOutlinedInput-root, & .MuiFilledInput-root': {
                      borderRadius: '15px',
                    },
                    width: '100%',
                  }}
                >
                  <BasicInput
                    {...input}
                    value={formValues[input.name] || ''}
                    error={(formErrors && formErrors[input.name]) || ''}
                    warning={(formWarnings && formWarnings[input.name]) || ''}
                    sx={{ width: '100%' }}
                    onChange={(e) => handleInputChange(e)}
                  />
                </Box>
              </Grid>
            ))}
          </Grid>

          {doc.type === 'Chainage' && (
            <Stack spacing={2} mt={2}>
              {formValues.intermediateOffsets.map((row, idx) => (
                <Stack
                  key={idx}
                  direction={'row'}
                  alignItems={'end'}
                  spacing={1}
                >
                  <Stack
                    key={idx}
                    direction={'row'}
                    alignItems={'center'}
                    spacing={1}
                    width={'100%'}
                  >
                    {doc.phase === 'Proposal' ? (
                      <BasicInput
                        label={idx === 0 ? 'RL*' : ''}
                        type="number"
                        name="intermediateOffsets"
                        value={row.reducedLevel || ''}
                        error={
                          formErrors &&
                          formErrors[`intermediateOffsets[${idx}].reducedLevel`]
                        }
                        sx={{ width: '100%' }}
                        onChange={(e) =>
                          handleInputChange(e, idx, 'reducedLevel')
                        }
                      />
                    ) : (
                      <BasicInput
                        label={idx === 0 ? 'IS*' : ''}
                        type="number"
                        name="intermediateOffsets"
                        value={row.intermediateSight || ''}
                        error={
                          formErrors &&
                          formErrors[
                            `intermediateOffsets[${idx}].intermediateSight`
                          ]
                        }
                        warning={
                          formWarnings &&
                          formWarnings[
                            `intermediateOffsets[${idx}].intermediateSight`
                          ]
                        }
                        sx={{ width: '100%' }}
                        onChange={(e) =>
                          handleInputChange(e, idx, 'intermediateSight')
                        }
                      />
                    )}

                    <BasicInput
                      label={idx === 0 ? 'Offset*' : ''}
                      type="number"
                      name="intermediateOffsets"
                      value={row.offset}
                      onChange={(e) => handleInputChange(e, idx, 'offset')}
                      error={
                        formErrors &&
                        formErrors[`intermediateOffsets[${idx}].offset`]
                      }
                    />
                    <BasicInput
                      label={idx === 0 ? 'Remark*' : ''}
                      type="text"
                      name="intermediateOffsets"
                      value={row.remark}
                      onChange={(e) => handleInputChange(e, idx, 'remark')}
                      error={
                        formErrors &&
                        formErrors[`intermediateOffsets[${idx}].remark`]
                      }
                    />
                  </Stack>

                  <Box>
                    {idx === formValues.intermediateOffsets?.length - 1 ? (
                      <Stack direction={'row'} spacing={1}>
                        {formValues.intermediateOffsets?.length > 1 && (
                          <Box
                            className="remove-new-sight"
                            onClick={() => handleRemoveRow(idx)}
                          >
                            <IoIosRemove
                              fontSize={'24px'}
                              color="rgb(231 0 0)"
                            />
                          </Box>
                        )}

                        <Box className="add-new-sight" onClick={handleAddRow}>
                          <IoAdd fontSize={'24px'} color="#0059E7" />
                        </Box>
                      </Stack>
                    ) : (
                      <Box
                        className="remove-new-sight"
                        onClick={() => handleRemoveRow(idx)}
                      >
                        <IoIosRemove fontSize={'24px'} color="rgb(231 0 0)" />
                      </Box>
                    )}
                  </Box>
                </Stack>
              ))}
            </Stack>
          )}
        </Box>
      }
      open={open}
      onCancel={onCancel}
      onSubmit={handleSubmit}
    />
  );
};

export default EditPreviousReading;
