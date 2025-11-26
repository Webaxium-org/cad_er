import * as Yup from 'yup';
import { useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useParams } from 'react-router-dom';
import { handleFormError } from '../../utils/handleFormError';
import { startLoading, stopLoading } from '../../redux/loadingSlice';
import { Box, Stack, Typography, Grid, InputAdornment } from '@mui/material';
import BasicButtons from '../../components/BasicButton';
import { IoAdd, IoPauseCircleOutline } from 'react-icons/io5';
import { IoIosAddCircleOutline } from 'react-icons/io';
import { IoIosRemove } from 'react-icons/io';
import BasicCheckbox from '../../components/BasicCheckbox';
import { showAlert } from '../../redux/alertSlice';
import { MdArrowBackIosNew } from 'react-icons/md';
import {
  createSurveyRow,
  endSurveyPurpose,
  getSurveyPurpose,
  pauseSurveyPurpose,
} from '../../services/surveyServices';
import AlertDialogSlide from '../../components/AlertDialogSlide';
import BasicInput from '../../components/BasicInput';
import { calculateReducedLevel, initialChartOptions } from '../../constants';
import CrossSectionChart from './components/CrossSectionChart';

const finishSurveyAlertData = {
  title: 'Confirm End of Survey',
  description:
    'Ending this survey will lock all existing data and prevent any new rows from being added. Do you want to continue?',
  content: '',
  cancelButtonText: 'Cancel',
  submitButtonText: 'Submit',
};

const pauseSurveyAlertData = {
  title: 'Pause Survey?',
  description:
    'Pausing this survey will save your current progress. You can resume later',
  content: (
    <Box mt={2}>
      <BasicInput
        label="Foresight*"
        placeholder="Enter foresight"
        type="number"
        name="foreSight"
        id="inpPauseForeSight"
      />
    </Box>
  ),
  cancelButtonText: 'Cancel',
  submitButtonText: 'Pause',
};

const initialFormValues = {
  type: 'Chainage',
  chainage: '',
  roadWidth: '',
  spacing: '',
  intermediateOffsets: [{ intermediateSight: '', offset: '' }],
  intermediateSight: '',
  foreSight: '',
  backSight: '',
  remark: '',
};

const values = {
  Chainage: ['chainage', 'roadWidth', 'spacing', 'intermediateOffsets'],
  CP: ['foreSight', 'backSight', 'remark'],
  TBM: ['intermediateSight', 'remark'],
};

const inputDetails = [
  { label: 'Chainage*', name: 'chainage', placeholder: '0/000', type: 'text' },
  { label: 'Road width*', name: 'roadWidth', type: 'number' },
  { label: 'Spacing*', name: 'spacing', type: 'number' },
  { label: 'Fore sight*', name: 'foreSight', type: 'number' },
  { label: 'Back sight*', name: 'backSight', type: 'number' },
  { label: 'Remark*', name: 'remark', type: 'text' },
];

const RoadSurveyRowsForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const didMount = useRef(false);
  const { global } = useSelector((state) => state.loading);

  const [purpose, setPurpose] = useState(null);
  const [formValues, setFormValues] = useState(initialFormValues);
  const [formErrors, setFormErrors] = useState({});
  const [inputData, setInputData] = useState([]);
  const [rowType, setRowType] = useState('Chainage');
  const [page, setPage] = useState(0);
  const [autoOffset, setAutoOffset] = useState(false);
  const [btnLoading, setBtnLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [isLastProposalReading, setIsLastProposalReading] = useState(false); // only for proposal's
  const [chartOptions, setChartOptions] = useState(initialChartOptions);
  const [selectedCs, setSelectedCs] = useState(null);
  const [alertData, setAlertData] = useState(null);

  const schema = Yup.object().shape({
    type: Yup.string().required('Type is required'),

    chainage: Yup.string().when('type', {
      is: 'Chainage',
      then: (schema) =>
        schema
          .required('Chainage is required')
          .matches(
            /^\d+\/\d+(\.\d{1,3})?$/,
            'Invalid chainage format. Use ####/###.###'
          ),
      otherwise: (schema) => schema.nullable(),
    }),

    roadWidth: Yup.number()
      .transform((value, originalValue) =>
        originalValue === '' ? null : value
      )
      .when('type', {
        is: 'Chainage',
        then: (schema) =>
          schema
            .typeError('Road width is required')
            .required('Road width is required'),
        otherwise: (schema) => schema.nullable(),
      }),

    spacing: Yup.number()
      .transform((value, originalValue) =>
        originalValue === '' ? null : value
      )
      .when('type', {
        is: 'Chainage',
        then: (schema) =>
          schema
            .typeError('Spacing is required')
            .required('Spacing is required'),
        otherwise: (schema) => schema.nullable(),
      }),

    intermediateOffsets: Yup.array()
      .of(
        Yup.object().shape({
          reducedLevel:
            purpose?.phase !== 'Proposal'
              ? Yup.number()
                  .transform((v, o) => (o === '' ? null : v))
                  .nullable()
              : Yup.number()
                  .transform((v, o) => (o === '' ? null : v))
                  .nullable()
                  .typeError('Reduced level is required')
                  .required('Reduced level is required'),
          intermediateSight:
            purpose?.phase === 'Proposal'
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
        is: 'CP',
        then: (schema) =>
          schema
            .typeError('Back sight is required')
            .required('Back sight is required'),
        otherwise: (schema) => schema.nullable(),
      }),

    remark: Yup.string()
      .trim()
      .when('type', {
        is: (val) => ['CP', 'TBM'].includes(val),
        then: (schema) => schema.required('Remark is required'),
        otherwise: (schema) => schema.nullable(),
      }),
  });

  const handleCalculateFinalForesight = (e) => {
    const inpFinalForesight = document.getElementById('finalForesight');

    const lastReading = purpose.rows.at(-1);
    // const reducedLevel = purpose.surveyId?.reducedLevel || 0;
    const reducedLevel = lastReading.reducedLevels[0] || 0;

    const value = Number(lastReading.heightOfInstrument) - Number(reducedLevel);

    inpFinalForesight.value = e.target.checked ? value.toFixed(3) : '';
  };

  const handleClickOpen = (action) => {
    if (
      action === 'Finish Survey' &&
      (formValues.foreSight.trim() || formValues.backSight.trim())
    ) {
      dispatch(
        showAlert({
          type: 'error',
          message:
            'If you are trying to add a Change Point (CP), please click "Continue" first, then finish the survey. Otherwise, clear the input fields before proceeding.',
        })
      );

      setOpen(false);
    } else {
      let updatedAlertData = null;

      if (action === 'Finish Survey' && purpose?.type === 'Initial Level') {
        updatedAlertData = {
          ...finishSurveyAlertData,
          onSubmit: handleEndSurveyPurpose,
          content: (
            <Box mt={2}>
              <Stack direction={'row'} alignItems={'center'}>
                <Typography fontSize={'16px'} fontWeight={600} color="black">
                  Auto calculate
                </Typography>
                <BasicCheckbox
                  onChange={(e) => handleCalculateFinalForesight(e)}
                />
              </Stack>
              <BasicInput
                label="Final foresight*"
                placeholder="Enter foresight"
                type="number"
                name="finalForesight"
                id="finalForesight"
              />
            </Box>
          ),
        };
      } else {
        updatedAlertData = {
          ...pauseSurveyAlertData,
          onSubmit: handlePauseSurvey,
        };
      }

      setAlertData(updatedAlertData);
      setOpen(true);
    }
  };

  const handleClose = () => {
    setOpen(false);
  };

  const updateInputData = () => {
    const filteredInputData = inputDetails?.filter((d) =>
      values[rowType]?.includes(d.name)
    );

    if (rowType === 'TBM') {
      filteredInputData.unshift({
        label: 'Intermediate sight*',
        name: 'intermediateSight',
        type: 'number',
      });
    }

    setFormValues((prev) => ({ ...prev, type: rowType }));
    setInputData(filteredInputData);
  };

  const handleChangeRowType = (type) => setRowType(type);

  const calculateOffset = () => {
    const roadWidth = Number(formValues.roadWidth || 0);
    const spacing = Number(formValues.spacing || 0);

    const intermediateOffsets = ['0.000'];

    const halfWidth = roadWidth / 2;
    let limit = Math.ceil(halfWidth / spacing);

    for (let i = 1; i <= limit; i++) {
      let value = i * spacing;

      // Cap the value at halfWidth if it exceeds it
      if (value > halfWidth) value = halfWidth;

      const negativeValue = -value;

      intermediateOffsets.push(value.toFixed(3), negativeValue.toFixed(3));

      if (i + 1 === limit && value < halfWidth) {
        limit += 1;
      }

      // Stop if we've reached or exceeded the half width
      if (value >= halfWidth) break;
    }

    const previousLength = formValues.intermediateOffsets.length;
    const updatedRows = [...formValues.intermediateOffsets];

    intermediateOffsets
      ?.sort((a, b) => a - b)
      ?.forEach((entry, i) => {
        if (i >= previousLength) {
          updatedRows[i] = {
            offset: entry,
            intermediateSight: '',
          };
        } else {
          updatedRows[i].offset = entry;
          updatedRows[i].intermediateSight =
            updatedRows[i].intermediateSight || '';
        }
      });

    setFormValues((prev) => ({ ...prev, intermediateOffsets: updatedRows }));
    handleChangeReducedLevel(updatedRows);
  };

  const handleChangeAutoOffset = (e) => {
    const checked = e.target.checked;
    setAutoOffset(checked);

    if (!checked) return;

    calculateOffset();
  };

  const handleInputChange = async (event, index, field) => {
    const { name, value } = event.target;

    const target =
      name === 'intermediateOffsets'
        ? `intermediateOffsets[${index}].${field}`
        : name;

    if (name === 'intermediateOffsets') {
      const updated = [...formValues.intermediateOffsets];
      updated[index][field] = value;

      setFormValues((prev) => ({
        ...prev,
        intermediateOffsets: updated,
      }));

      handleChangeReducedLevel(updated);
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

  const handleAddRow = () => {
    setFormValues((prev) => ({
      ...prev,
      intermediateOffsets: [
        ...(formValues.intermediateOffsets || []),
        { intermediateSight: '', offset: '' },
      ],
    }));

    setInputData([...inputData]);
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

  const getNewChainage = (purpose) => {
    try {
      if (purpose.type !== 'Initial Level') {
        const initialSurvey = purpose?.surveyId?.purposes?.find(
          (p) => p.type === 'Initial Level'
        );

        const isProposal = purpose.phase === 'Proposal';
        let currentReading = null;

        if (isProposal) {
          if (purpose?.rows?.length) {
            const prevChainage = purpose?.rows?.at(-1)?.chainage;

            const filteredInitialSurvey =
              initialSurvey?.rows?.filter((r) => r.type === 'Chainage') ?? [];

            const currentIndex = filteredInitialSurvey.findIndex(
              (r) => r.chainage === prevChainage
            );

            if (currentIndex === -1) {
              throw new Error('Previous chainage not found in initial survey');
            }

            const nextReading = filteredInitialSurvey[currentIndex + 1] || null;
            const isLastReading =
              currentIndex + 1 >= filteredInitialSurvey.length - 1;

            if (isLastReading) setIsLastProposalReading(true);

            if (!nextReading) {
              throw new Error(
                'Next chainage not found, returning to dashboard'
              );
            }

            currentReading = nextReading;
          } else {
            currentReading = initialSurvey?.rows?.find(
              (r) => r.type === 'Chainage'
            );
          }

          updateSelectedCs(
            purpose.surveyId,
            currentReading?.chainage,
            purpose.type
          );
        } else {
          const nextIndex = purpose?.rows?.length ?? 0;
          currentReading = initialSurvey?.rows?.[nextIndex] || null;
        }

        if (currentReading) {
          const type = currentReading.type;

          const updatedValues = {
            type,
            chainage: currentReading?.chainage || '',
            roadWidth: currentReading?.roadWidth || '',
            spacing: currentReading?.spacing || '',
            backSight: currentReading?.backSight || '',
            foreSight: currentReading?.foreSight || '',
          };

          if (!isProposal) {
            if (type === 'Chainage') {
              updatedValues.intermediateOffsets =
                currentReading?.intermediateSight?.map((entry, idx) => ({
                  intermediateSight: entry,
                  offset: currentReading?.offsets[idx],
                }));
            } else if (type === 'TBM') {
              updatedValues.intermediateSight =
                currentReading?.intermediateSight || '';
            }
          }

          setFormValues((prev) => ({
            ...prev,
            ...updatedValues,
          }));

          setRowType(type);

          const isLastReading =
            purpose?.rows?.length === initialSurvey?.rows?.length - 1;

          if (isLastReading) setIsLastProposalReading(true);
        } else {
          setRowType('CP');
        }
      } else {
        const isFirstChainage = purpose?.rows?.find(
          (r) => r.type === 'Chainage'
        );

        if (!isFirstChainage) {
          setFormValues((prev) => ({
            ...prev,
            chainage: '0/000',
          }));
        } else {
          let lastChainage = null;
          purpose?.rows?.forEach((row) => {
            if (row.type === 'Chainage') lastChainage = row.chainage;
          });

          const chainageMultiple = purpose?.surveyId?.chainageMultiple;
          const lastDigit = Number(lastChainage.split('/')[1]);

          const remainder = lastDigit % chainageMultiple;
          const nextNumber =
            remainder === 0
              ? lastDigit + chainageMultiple
              : lastDigit + (chainageMultiple - remainder);

          const nextChainage = `0/${String(nextNumber).padStart(3, '0')}`;

          setFormValues((prev) => ({
            ...prev,
            chainage: nextChainage,
          }));
        }
      }
    } catch (error) {
      navigate('/');

      handleFormError(error, null, dispatch, navigate);
    }
  };

  const handleSubmit = async () => {
    setBtnLoading(true);
    try {
      if (rowType === 'Chainage' && page === 0) {
        const pickItems = ['chainage', 'roadWidth', 'spacing'];

        const isProposal = purpose.phase === 'Proposal';

        const partialSchema = schema.pick(pickItems);
        await partialSchema.validate(formValues, { abortEarly: false });

        if (formValues.intermediateOffsets?.length === 1) {
          if (isProposal) {
            setFormValues((prev) => ({
              ...prev,
              intermediateOffsets: [
                {
                  reducedLevel: '',
                  offset: '',
                },
                {
                  reducedLevel: '',
                  offset: '',
                },
                {
                  reducedLevel: '',
                  offset: '',
                },
              ],
            }));
          } else {
            setFormValues((prev) => ({
              ...prev,
              intermediateOffsets: [
                ...prev.intermediateOffsets,
                {
                  intermediateSight: '',
                  offset: '',
                },
                { intermediateSight: '', offset: '' },
              ],
            }));
          }
        }

        setBtnLoading(false);
        return setPage(1);
      }

      await schema.validate(formValues, { abortEarly: false });

      let payload = null;

      if (rowType === 'Chainage') {
        const sortedOffsets = [...(formValues.intermediateOffsets || [])].sort(
          (a, b) => a.offset - b.offset
        );

        payload = {
          ...formValues,
          reducedLevels:
            purpose.phase !== 'Proposal'
              ? []
              : sortedOffsets.map((r) => r.reducedLevel),
          intermediateSight:
            purpose.phase === 'Proposal'
              ? []
              : sortedOffsets.map((r) => r.intermediateSight),
          offsets: sortedOffsets.map((r) => r.offset),
        };
      } else {
        payload = { ...formValues, chainage: null };
      }

      const { data } = await createSurveyRow(id, payload);

      if (data.success) {
        // const message = isLastProposalReading
        //   ? `${purpose.type} Ended Successfully`
        //   : `${rowType} Added Successfully`;

        // dispatch(
        //   showAlert({
        //     type: 'success',
        //     message,
        //   })
        // );

        if (isLastProposalReading) {
          navigate('/survey/purpose');
          return;
        }

        const purposeDoc = data.purpose;

        setFormValues({
          ...initialFormValues,
          intermediateOffsets: [{ intermediateSight: '', offset: '' }],
        });

        getNewChainage(purposeDoc);

        if (rowType === 'Chainage') {
          setPage(0);
          setAutoOffset(false);
        }

        if (
          (purpose.type === 'Initial Level' && rowType === 'TBM') ||
          purpose.status === 'Paused'
        ) {
          setRowType('Chainage');
        }

        setPurpose(purposeDoc);
      } else {
        throw new Error('Something went wrong.');
      }
    } catch (error) {
      handleFormError(error, setFormErrors, dispatch, navigate);
    } finally {
      setBtnLoading(false);
    }
  };

  const handleEndSurveyPurpose = async () => {
    try {
      let finalForesight = null;

      if (purpose.type === 'Initial Level') {
        const inpFinalForesight = document.getElementById('finalForesight');

        if (!inpFinalForesight?.value?.trim()) {
          inpFinalForesight.parentElement.parentElement.classList.add(
            'inp-err'
          );
        } else {
          inpFinalForesight.parentElement.parentElement.classList.remove(
            'inp-err'
          );

          finalForesight = inpFinalForesight.value;
        }
      }

      const { data } = await endSurveyPurpose(id, finalForesight);

      if (data.success) {
        dispatch(
          showAlert({
            type: 'success',
            message: `${purpose.type} Finished`,
          })
        );

        const link =
          purpose.type === 'Initial Level'
            ? `/survey/road-survey/${purpose._id}/field-book`
            : '/survey';

        navigate(link);
      } else {
        throw new Error('Something went wrong.');
      }
    } catch (error) {
      handleFormError(error, setFormErrors, dispatch, navigate);
    } finally {
      setBtnLoading(false);
    }
  };

  const handlePauseSurvey = async () => {
    try {
      const inpForeSight = document.getElementById('inpPauseForeSight');

      if (!inpForeSight?.value?.trim()) {
        inpForeSight.parentElement.parentElement.classList.add('inp-err');
        return;
      } else {
        inpForeSight.parentElement.parentElement.classList.remove('inp-err');
      }

      const { data } = await pauseSurveyPurpose(id, inpForeSight.value);

      if (data.success) {
        dispatch(
          showAlert({
            type: 'success',
            message: `${purpose.type} Paused`,
          })
        );

        navigate('/survey');
      } else {
        throw new Error('Something went wrong.');
      }
    } catch (error) {
      handleFormError(error, null, dispatch, navigate);
    }
  };

  const handleChangeReducedLevel = (values) => {
    if (!selectedCs?.series?.[0]?.data) return;

    // Create deep copies of what you mutate
    const newSeries = selectedCs.series.map((s, i) => {
      if (i === 0) {
        const updatedData = s.data.map(([x]) => {
          const matched = values.find((e) => Number(e.offset) === Number(x));
          const rl = matched ? Number(matched.reducedLevel)?.toFixed(3) : null;

          return [Number(x), rl];
        });

        return { ...s, data: updatedData };
      }

      return s;
    });

    const updated = {
      ...selectedCs,
      series: newSeries,
      // change id to force Chart remount
      id: `${selectedCs.id}-r${Date.now()}`,
    };

    setSelectedCs(updated);
  };

  const updateSelectedCs = (survey, chainage, type) => {
    const initialLevel = survey.purposes?.find(
      (p) => p.type === 'Initial Level'
    );

    const row = initialLevel.rows?.find(
      (row) => row.type === 'Chainage' && row.chainage === chainage
    );
    if (!row) return;

    const safeOffsets = row.offsets || [];
    const safeInitial = row.reducedLevels || [];

    const makeSeries = (name, offsets, levels) =>
      offsets.map((o, i) => [Number(o), Number(levels?.[i] ?? 0).toFixed(3)]);

    const data = {
      id: id,
      datum: 9.4,
      offsets: safeOffsets,
      chainage,
      series: [],
    };

    data.series.push({
      name: type,
      data: makeSeries(type, safeOffsets, null),
    });

    data.series.push({
      name: 'Initial Level',
      data: makeSeries(type, safeOffsets, safeInitial),
    });

    setSelectedCs(data);
  };

  useEffect(() => {
    if (didMount.current) {
      updateInputData();
    } else {
      didMount.current = true;
    }
  }, [rowType, purpose]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (!global) dispatch(startLoading());

        const { data } = await getSurveyPurpose(id);

        const purposeDoc = data.purpose;

        if (purposeDoc?.isPurposeFinish) {
          navigate('/survey/purpose');
          throw Error(`${data?.purpose?.type} already completed`);
        }

        if (purposeDoc.status === 'Paused') {
          const lastRow = purposeDoc.rows[purposeDoc.rows.length - 1];

          setFormValues((prev) => ({ ...prev, foreSight: lastRow.foreSight }));
          setRowType('CP');
        } else {
          getNewChainage(purposeDoc);
        }

        setPurpose(purposeDoc);
      } catch (error) {
        handleFormError(error, null, dispatch, navigate);
      } finally {
        dispatch(stopLoading());
      }
    };
    fetchData();
  }, [id]);

  return (
    <Box p={3}>
      <AlertDialogSlide {...alertData} open={open} onCancel={handleClose} />

      {page === 1 && (
        <Box
          sx={{
            border: '1px solid #EFEFEF',
            borderRadius: '9px',
            width: '40px',
            height: '40px',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            cursor: 'pointer',
            mb: '24px',
          }}
          onClick={() => setPage(0)}
        >
          <MdArrowBackIosNew />
        </Box>
      )}
      <Stack alignItems={'center'} spacing={5}>
        {selectedCs && selectedCs?.series && (
          <CrossSectionChart
            selectedCs={selectedCs}
            chartOptions={chartOptions}
          />
        )}

        <Stack spacing={2}>
          <Box display={'flex'} flexDirection={'column'} alignItems={'center'}>
            <Typography fontSize={'26px'} fontWeight={700}>
              Please Set The {page === 1 ? 'IS' : rowType}:
            </Typography>
            <Typography fontSize={'16px'} fontWeight={400} color="#434343">
              Please Enter The Following Values
            </Typography>
          </Box>
        </Stack>

        <Box width={'100%'} maxWidth={'md'}>
          <Grid container spacing={3} columns={12}>
            {page === 0 &&
              inputData.map((input, index) => (
                <Grid
                  size={{
                    xs: 12,
                    sm:
                      input.name === 'roadWidth' || input.name === 'spacing'
                        ? 6
                        : 12,
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
                      sx={{ width: '100%' }}
                      onChange={(e) => handleInputChange(e)}
                    />
                  </Box>
                </Grid>
              ))}

            {/* ✅ Dynamic Intermediate + Offset Rows */}
            {page === 1 && rowType === 'Chainage' && (
              <Grid size={{ xs: 12 }}>
                <Stack direction={'row'} alignItems={'center'}>
                  <BasicCheckbox
                    checked={autoOffset}
                    onChange={(e) => handleChangeAutoOffset(e)}
                  />
                  <Typography fontSize={'16px'} fontWeight={600} color="black">
                    Default offset
                  </Typography>
                </Stack>
                <Typography
                  fontSize={'16px'}
                  fontWeight={600}
                  color="black"
                  mb={1}
                >
                  Chainage: {formValues.chainage}
                </Typography>
                <Stack spacing={2}>
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
                        {purpose.phase === 'Proposal' ? (
                          <BasicInput
                            label="Reduced Level"
                            type="number"
                            name="intermediateOffsets"
                            value={row.reducedLevel || ''}
                            error={
                              formErrors &&
                              formErrors[
                                `intermediateOffsets[${idx}].reducedLevel`
                              ]
                            }
                            sx={{ width: '100%' }}
                            onChange={(e) =>
                              handleInputChange(e, idx, 'reducedLevel')
                            }
                          />
                        ) : (
                          <BasicInput
                            label="Intermediate Sight"
                            type="number"
                            name="intermediateOffsets"
                            value={row.intermediateSight || ''}
                            error={
                              formErrors &&
                              formErrors[
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
                          label="Offset"
                          type="number"
                          name="intermediateOffsets"
                          value={row.offset}
                          onChange={(e) => handleInputChange(e, idx, 'offset')}
                          error={
                            formErrors &&
                            formErrors[`intermediateOffsets[${idx}].offset`]
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

                            <Box
                              className="add-new-sight"
                              onClick={handleAddRow}
                            >
                              <IoAdd fontSize={'24px'} color="#0059E7" />
                            </Box>
                          </Stack>
                        ) : (
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
                      </Box>
                    </Stack>
                  ))}
                </Stack>
              </Grid>
            )}
          </Grid>
        </Box>

        <Box px={'24px'} width={'100%'} maxWidth={'md'}>
          <Stack direction={'row'} spacing={2}>
            <BasicButtons
              value={
                (purpose?.phase === 'Proposal' &&
                  isLastProposalReading &&
                  page === 1) ||
                (rowType !== 'Chainage' && isLastProposalReading)
                  ? `Finish ${purpose?.type}`
                  : 'Continue'
              }
              sx={{
                backgroundColor:
                  (purpose?.phase === 'Proposal' &&
                    isLastProposalReading &&
                    page === 1) ||
                  (rowType !== 'Chainage' && isLastProposalReading)
                    ? '#4caf50'
                    : '#0059E7',
                height: '45px',
              }}
              fullWidth={true}
              onClick={handleSubmit}
              loading={btnLoading}
            />

            {rowType === 'CP' && purpose.type === 'Initial Level' && (
              <BasicButtons
                value={'Finish Survey'}
                sx={{ backgroundColor: '#4caf50', height: '45px' }}
                fullWidth={true}
                onClick={() => handleClickOpen('Finish Survey')}
                loading={btnLoading}
              />
            )}
          </Stack>
        </Box>

        <Stack direction={'row'} justifyContent={'end'} gap={2}>
          {purpose &&
            purpose?.status === 'Active' &&
            purpose?.type === 'Initial Level' &&
            page === 0 && (
              <>
                {rowType !== 'Chainage' && (
                  <BasicButtons
                    value={
                      <Box display={'flex'} gap={1} alignItems={'center'}>
                        <IoIosAddCircleOutline fontSize={'20px'} />
                        Chainage
                      </Box>
                    }
                    onClick={() => handleChangeRowType('Chainage')}
                    sx={{ backgroundColor: '#0059E7' }}
                  />
                )}
                {rowType !== 'CP' && (
                  <BasicButtons
                    value={
                      <Box display={'flex'} gap={1} alignItems={'center'}>
                        <IoIosAddCircleOutline fontSize={'20px'} />
                        CP
                      </Box>
                    }
                    onClick={() => handleChangeRowType('CP')}
                    sx={{ backgroundColor: '#0059E7' }}
                  />
                )}
                {rowType !== 'TBM' && (
                  <BasicButtons
                    value={
                      <Box display={'flex'} gap={1} alignItems={'center'}>
                        <IoIosAddCircleOutline fontSize={'20px'} />
                        TBM
                      </Box>
                    }
                    onClick={() => handleChangeRowType('TBM')}
                    sx={{ backgroundColor: '#0059E7' }}
                  />
                )}
              </>
            )}

          {purpose &&
            purpose?.type === 'Initial Level' &&
            purpose?.status !== 'Paused' &&
            page === 0 && (
              <BasicButtons
                value={
                  <Box display={'flex'} gap={1} alignItems={'center'}>
                    <IoPauseCircleOutline fontSize={'20px'} />
                    Survey
                  </Box>
                }
                onClick={() => handleClickOpen('Pause Survey')}
                sx={{ backgroundColor: '#e7c400ff' }}
              />
            )}

          {page === 0 && (
            <>
              <BasicButtons
                value={
                  <Box display={'flex'} gap={1} alignItems={'center'}>
                    <IoIosAddCircleOutline fontSize={'20px'} />
                    Branch
                  </Box>
                }
                onClick={() => {}}
                sx={{ backgroundColor: '#9C27B0' }}
              />
              <BasicButtons
                value={
                  <Box display={'flex'} gap={1} alignItems={'center'}>
                    <IoIosAddCircleOutline fontSize={'20px'} />
                    Break
                  </Box>
                }
                onClick={() => {}}
                sx={{ backgroundColor: '#FF5722' }}
              />
            </>
          )}
        </Stack>
      </Stack>
    </Box>
  );
};

export default RoadSurveyRowsForm;
