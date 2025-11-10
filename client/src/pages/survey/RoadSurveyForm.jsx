import * as Yup from 'yup';
import { Box, Grid, InputAdornment, Stack, Typography } from '@mui/material';
import { useEffect, useState } from 'react';
import { MdArrowBackIosNew } from 'react-icons/md';
import { useNavigate, useParams } from 'react-router-dom';
import {
  createSurvey,
  createSurveyPurpose,
  getSurvey,
} from '../../services/surveyServices';
import BasicTextFields from '../../components/BasicTextFields';
import BasicButtons from '../../components/BasicButton';
import { useDispatch, useSelector } from 'react-redux';
import { handleFormError } from '../../utils/handleFormError';
import { startLoading, stopLoading } from '../../redux/loadingSlice';
import { showAlert } from '../../redux/alertSlice';
import BasicSelect from '../../components/BasicSelect';
import { purposeLevels, proposalLevels } from '../../constants';
import BasicCheckbox from '../../components/BasicCheckbox';

const inputDetails = [
  {
    label: 'Project name*',
    name: 'project',
    type: 'text',
    for: 'All',
  },
  {
    label: 'Purpose*',
    name: 'purpose',
    mode: 'select',
    options: [{ label: 'Initial Level', value: 'Initial Level' }],
    for: 'All',
  },
  {
    label: 'Proposal*',
    name: 'proposal',
    mode: 'select',
    options: proposalLevels?.map((p) => ({ label: p, value: p })),
    for: 'Proposed Level',
    size: 6,
    hidden: true,
  },
  {
    label: 'Instrument number*',
    name: 'instrumentNo',
    type: 'text',
    for: 'Initial Level',
  },
  {
    label: 'Back sight*',
    name: 'backSight',
    type: 'number',
    for: 'Initial Level',
  },
  {
    label: 'Reduced level*',
    name: 'reducedLevel',
    type: 'number',
    for: 'Initial Level',
  },
  {
    label: 'Chainage multiple*',
    name: 'chainageMultiple',
    mode: 'select',
    options: [5, 10, 20, 30, 50].map((n) => ({ label: n, value: n })),
    for: 'Initial Level',
  },
  {
    label: 'Average height*',
    name: 'averageHeight',
    type: 'number',
    hidden: true,
    for: 'Proposed Level',
  },
  {
    label: '',
    name: 'lSection',
    type: 'number',
    hidden: true,
    for: 'Proposed Level',
    size: 6,
  },
  {
    label: '',
    name: 'lsSlop',
    type: 'number',
    hidden: true,
    for: 'Proposed Level',
    size: 6,
  },
  {
    label: '',
    name: 'cSection',
    type: 'number',
    hidden: true,
    for: 'Proposed Level',
    size: 6,
  },
  {
    label: '',
    name: 'csSlop',
    type: 'number',
    hidden: true,
    for: 'Proposed Level',
    size: 6,
  },
  {
    label: 'Cross section lamper',
    name: 'csLamper',
    type: 'text',
    hidden: true,
    for: 'Proposed Level',
  },
];

const initialFormValues = {
  project: '',
  purpose: '',
  proposal: '',
  instrumentNo: '',
  backSight: '',
  reducedLevel: '',
  chainageMultiple: '',
  averageHeight: '',
  lSection: '',
  lsSlop: '',
  cSection: '',
  csSlop: '',
  csLamper: '',
};

const RoadSurveyForm = () => {
  const { id } = useParams();

  const navigate = useNavigate();

  const dispatch = useDispatch();

  const { global } = useSelector((state) => state.loading);

  const [inputData, setInputData] = useState(inputDetails);

  const [survey, setSurvey] = useState(false);

  const [type, setType] = useState(false);

  const [formValues, setFormValues] = useState(initialFormValues);

  const [formErrors, setFormErrors] = useState(null);

  const [btnLoading, setBtnLoading] = useState(false);

  const schema = Yup.object().shape({
    project: Yup.string().required('Project name is required'),
    purpose: Yup.string().required('Purpose is required'),

    proposal: type
      ? Yup.string().required('Proposal is required')
      : Yup.string().nullable(),

    instrumentNo: !id
      ? Yup.string().required('Instrument number is required')
      : Yup.string().nullable(),

    backSight: !id
      ? Yup.number()
          .typeError('Backsight is required')
          .required('Backsight is required')
      : Yup.string().nullable(),
    reducedLevel: !id
      ? Yup.number()
          .typeError('Reduced level is required')
          .required('Reduced level is required')
      : Yup.string().nullable(),
    chainageMultiple: !id
      ? Yup.number()
          .typeError('Chainage multiple is required')
          .required('Chainage multiple is required')
      : Yup.string().nullable(),

    averageHeight: type
      ? Yup.number()
          .typeError('Average height is required')
          .required('Average height is required')
      : Yup.string().nullable(),
    lSection: type
      ? Yup.number()
          .typeError('Longitudinal section slop is required')
          .required('Longitudinal section slop is required')
      : Yup.string().nullable(),

    lsSlop: type
      ? Yup.number()
          .typeError('Longitudinal section slop is required')
          .required('Longitudinal section slop is required')
      : Yup.string().nullable(),
    cSection: type
      ? Yup.number()
          .typeError('Cross section slop is required')
          .required('Cross section slop is required')
      : Yup.string().nullable(),

    csSlop: type
      ? Yup.number()
          .typeError('Cross section slop is required')
          .required('Cross section slop is required')
      : Yup.string().nullable(),
    csLamper: type
      ? Yup.string().required('Cross section lamper is required')
      : Yup.string().nullable(),
  });

  const handleGoBack = () => navigate('/');

  const handleInputChange = async (event) => {
    const { name, value } = event.target;

    setFormValues((prev) => ({
      ...prev,
      [name]: value,
    }));

    try {
      await Yup.reach(schema, name).validate(value);

      setFormErrors({ ...formErrors, [name]: null });
    } catch (error) {
      setFormErrors({ ...formErrors, [name]: error.message });
    }
  };

  const handleSubmit = async () => {
    setBtnLoading(true);

    try {
      await schema.validate(formValues, { abortEarly: false });

      const { data } = id
        ? await createSurveyPurpose(id, formValues)
        : await createSurvey(formValues);

      if (data.success) {
        const purposeId = data?.survey?.purposeId;

        dispatch(
          showAlert({
            type: 'success',
            message: `Form Submitted Successfully`,
          })
        );

        dispatch(startLoading());

        navigate(`/survey/road-survey/${purposeId}/rows`);
      } else {
        throw new Error('Something went wrong.');
      }
    } catch (error) {
      handleFormError(error, setFormErrors, dispatch, navigate);
    } finally {
      setBtnLoading(false);
    }
  };

  const fetchData = async () => {
    try {
      if (!global) dispatch(startLoading());

      const { data } = await getSurvey(id);

      if (data?.survey?.isSurveyFinish) {
        navigate('/survey');
        throw Error('The survey already completed');
      }

      const surveyDoc = data.survey;

      const updatedFormValues = { ...formValues, project: surveyDoc?.project };

      const completedLevels = surveyDoc?.purposes?.map((p) => p.type) || [];

      updateInputData(completedLevels);

      setFormValues(updatedFormValues);
      setSurvey(surveyDoc);
    } catch (error) {
      handleFormError(error, null, dispatch, navigate);
    } finally {
      dispatch(stopLoading());
    }
  };

  const updateInputData = (completedLevels) => {
    setInputData(
      !id
        ? [...inputDetails]
        : (prev) =>
            prev.map((e) => {
              if (e.for === 'All') {
                if (e.name === 'purpose') {
                  return {
                    ...e,
                    hidden: false,
                    options: type
                      ? purposeLevels.map((p) => ({ label: p, value: p }))
                      : purposeLevels
                          ?.filter((p) => !completedLevels.includes(p))
                          .map((p) => ({ label: p, value: p })),
                    size: type ? 6 : null,
                  };
                }

                if (e.name === 'project')
                  return { ...e, hidden: false, disabled: true };

                return { ...e, hidden: false };
              }

              if (type && e.for === 'Proposed Level') {
                return { ...e, hidden: false };
              }

              if (!type && e.for === 'Rest') {
                return { ...e, hidden: false };
              }

              return { ...e, hidden: true };
            })
    );
  };

  useEffect(() => {
    const completedLevels = survey?.purposes?.map((p) => p.type) || [];

    updateInputData(completedLevels);
  }, [type]);

  useEffect(() => {
    if (id) {
      fetchData();
    }

    dispatch(stopLoading());
  }, [id]);

  return (
    <Box padding={'24px'}>
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
        onClick={handleGoBack}
      >
        <MdArrowBackIosNew />
      </Box>

      <Stack alignItems={'center'} spacing={5}>
        <Stack alignItems={'center'}>
          <Typography fontSize={'26px'} fontWeight={700}>
            Please Enter The Following Values
          </Typography>
          <Typography fontSize={'16px'} fontWeight={400} color="#434343">
            Sed ut perspiciatis unde omnis iste natus error sit voluptatem
          </Typography>
        </Stack>

        <Stack width={'100%'} spacing={3} className="input-wrapper">
          {id && (
            <Box display={'flex'} alignItems={'center'} justifyContent={'end'}>
              <Typography fontSize={'16px'} fontWeight={400} color="#434343">
                Proposal
              </Typography>
              <BasicCheckbox
                checked={type || ''}
                onChange={() => setType(!type)}
              />
            </Box>
          )}

          <Grid container spacing={3} columns={12} alignItems={'end'}>
            {inputData.map(
              (input, index) =>
                !input.hidden && (
                  <Grid
                    size={{
                      xs: 12,
                      sm: input.size || 12,
                    }}
                    key={index}
                  >
                    {((type && input.name === 'purpose') ||
                      input.name === 'lSection' ||
                      input.name === 'cSection') && (
                      <Typography
                        fontSize={'16px'}
                        fontWeight={400}
                        color="#434343"
                      >
                        {input.name === 'purpose'
                          ? 'Proposal Between'
                          : input.name === 'lSection'
                          ? 'Longitudinal section slop'
                          : 'Cross section slop'}
                        :
                      </Typography>
                    )}
                    <Box
                      sx={{
                        '& .MuiOutlinedInput-root, & .MuiFilledInput-root': {
                          borderRadius: '15px',
                        },
                        width: '100%',
                      }}
                    >
                      {input?.mode === 'select' ? (
                        <BasicSelect
                          {...input}
                          value={formValues[input.name] || ''}
                          error={(formErrors && formErrors[input.name]) || ''}
                          variant={'filled'}
                          sx={{ width: '100%' }}
                          onChange={(e) => handleInputChange(e)}
                        />
                      ) : (
                        <BasicTextFields
                          {...input}
                          value={formValues[input.name] || ''}
                          error={(formErrors && formErrors[input.name]) || ''}
                          variant={'filled'}
                          sx={{ width: '100%' }}
                          onChange={(e) => handleInputChange(e)}
                          slotProps={
                            (input.name === 'lSection' ||
                              input.name === 'cSection') && {
                              input: {
                                endAdornment: (
                                  <InputAdornment
                                    position="end"
                                    sx={{
                                      '& .MuiTypography-body1': {
                                        fontWeight: 900,
                                      },
                                    }}
                                  >
                                    :
                                  </InputAdornment>
                                ),
                              },
                            }
                          }
                        />
                      )}
                    </Box>
                  </Grid>
                )
            )}
          </Grid>
        </Stack>

        <Box px={'24px'} className="landing-btn">
          <BasicButtons
            value={'Continue'}
            sx={{ backgroundColor: '#0059E7', height: '45px' }}
            fullWidth={true}
            onClick={handleSubmit}
            loading={btnLoading}
          />
        </Box>
      </Stack>
    </Box>
  );
};

export default RoadSurveyForm;
