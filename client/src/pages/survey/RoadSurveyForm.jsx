import * as Yup from 'yup';
import { Box, Stack, Typography } from '@mui/material';
import { useEffect, useRef, useState } from 'react';
import { MdArrowBackIosNew } from 'react-icons/md';
import { useNavigate, useParams } from 'react-router-dom';
import HeaderImg from '../../assets/following_values.jpg';
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
import { purpose } from '../../constants';

const schema = Yup.object().shape({
  project: Yup.string().required('Project name is required'),
  purpose: Yup.string().required('Purpose is required'),

  instrumentNo: Yup.string().when('purpose', {
    is: 'Initial Level',
    then: (schema) => schema.required('Instrument number is required'),
    otherwise: (schema) => schema.nullable(),
  }),

  backSight: Yup.number()
    .transform((value, originalValue) => (originalValue === '' ? null : value))
    .when('purpose', {
      is: 'Initial Level',
      then: (schema) =>
        schema
          .typeError('Backsight is required')
          .required('Backsight is required'),
      otherwise: (schema) => schema.nullable(),
    }),

  reducedLevel: Yup.number()
    .transform((value, originalValue) => (originalValue === '' ? null : value))
    .when('purpose', {
      is: 'Initial Level',
      then: (schema) =>
        schema
          .typeError('Reduced level is required')
          .required('Reduced level is required'),
      otherwise: (schema) => schema.nullable(),
    }),

  chainageMultiple: Yup.number()
    .transform((value, originalValue) => (originalValue === '' ? null : value))
    .when('purpose', {
      is: 'Initial Level',
      then: (schema) =>
        schema
          .typeError('Chainage multiple is required')
          .required('Chainage multiple is required'),
      otherwise: (schema) => schema.nullable(),
    }),

  slope: Yup.number()
    .transform((value, originalValue) => (originalValue === '' ? null : value))
    .when('purpose', {
      is: 'Proposed Level',
      then: (schema) =>
        schema.typeError('Slope is required').required('Slope is required'),
      otherwise: (schema) => schema.nullable(),
    }),

  estimateQuality: Yup.number()
    .transform((value, originalValue) => (originalValue === '' ? null : value))
    .when('purpose', {
      is: 'Proposed Level',
      then: (schema) =>
        schema
          .typeError('Estimate quality is required')
          .required('Estimate quality is required'),
      otherwise: (schema) => schema.nullable(),
    }),
});

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
    options: purpose.map((n) => ({ label: n, value: n })),
    for: 'All',
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
    label: 'Slope*',
    name: 'slope',
    type: 'number',
    hidden: true,
    for: 'Proposed Level',
  },
  {
    label: 'Estimate quality*',
    name: 'estimateQuality',
    type: 'number',
    hidden: true,
    for: 'Proposed Level',
  },
];

const initialFormValues = {
  project: '',
  purpose: '',
  instrumentNo: '',
  backSight: '',
  reducedLevel: '',
  chainageMultiple: '',
  slope: '',
  estimateQuality: '',
};

const RoadSurveyForm = () => {
  const { id } = useParams();

  const navigate = useNavigate();

  const dispatch = useDispatch();

  const { global } = useSelector((state) => state.loading);

  const [inputData, setInputData] = useState(inputDetails);

  const [survey, setSurvey] = useState(null);

  const [formValues, setFormValues] = useState(initialFormValues);

  const [formErrors, setFormErrors] = useState(null);

  const [btnLoading, setBtnLoading] = useState(false);

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

      const isProposalLevelFinish = surveyDoc?.purposes?.find(
        (p) => p.type === 'Proposed Level'
      );

      const completedLevels = surveyDoc?.purposes?.map((p) => p.type) || [];
      const updatedFormValues = { ...formValues, project: surveyDoc?.project };

      if (isProposalLevelFinish) {
        updateInputData('', completedLevels);
      } else {
        updatedFormValues.purpose = 'Proposed Level';

        updateInputData('Proposed Level', completedLevels);
      }

      setFormValues(updatedFormValues);
      setSurvey(surveyDoc);
    } catch (error) {
      handleFormError(error, null, dispatch, navigate);
    } finally {
      dispatch(stopLoading());
    }
  };

  const updateInputData = (level, completedLevels = []) => {
    setInputData((prev) =>
      prev.map((e) => {
        if (e.for === 'All') {
          if (e.name === 'purpose') {
            return {
              ...e,
              hidden: false,
              options: purpose
                .filter((p) => !completedLevels.includes(p))
                .map((p) => ({ label: p, value: p })),
            };
          }

          if (e.name === 'project')
            return { ...e, hidden: false, disabled: true };

          return { ...e, hidden: false };
        }

        if (level === 'Proposed Level' && e.for === 'Proposed Level') {
          return { ...e, hidden: false };
        }

        if (level !== 'Proposed Level' && e.for === 'Rest') {
          return { ...e, hidden: false };
        }

        return { ...e, hidden: true };
      })
    );
  };

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
        <Box className="set-chainage-img-wrapper">
          <img
            src={HeaderImg}
            srcSet={`${HeaderImg}?w=800 800w, ${HeaderImg}?w=1600 1600w, ${HeaderImg}?w=2400 2400w`}
            sizes="100vw"
            alt="landing"
            // loading="lazy"
            className="chainage-img"
          />
        </Box>

        <Stack alignItems={'center'}>
          <Typography fontSize={'26px'} fontWeight={700}>
            Please Enter The Following Values
          </Typography>
          <Typography fontSize={'16px'} fontWeight={400} color="#434343">
            Sed ut perspiciatis unde omnis iste natus error sit voluptatem
          </Typography>
        </Stack>

        <Stack width={'100%'} spacing={3} className="input-wrapper">
          {inputData.map(
            (input, index) =>
              !input.hidden && (
                <Box
                  key={index}
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
                    />
                  )}
                </Box>
              )
          )}
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
