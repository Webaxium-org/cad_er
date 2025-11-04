import * as Yup from 'yup';
import { Box, Stack, Typography } from '@mui/material';
import { useEffect, useRef, useState } from 'react';
import { MdArrowBackIosNew } from 'react-icons/md';
import { useNavigate } from 'react-router-dom';
import HeaderImg from '../../assets/following_values.jpg';
import { checkSurveyExists, createSurvey } from '../../services/surveyServices';
import BasicTextFields from '../../components/BasicTextFields';
import BasicButtons from '../../components/BasicButton';
import { useDispatch, useSelector } from 'react-redux';
import { handleFormError } from '../../utils/handleFormError';
import { startLoading, stopLoading } from '../../redux/loadingSlice';
import { showAlert } from '../../redux/alertSlice';
import BasicSelect from '../../components/BasicSelect';

const schema = Yup.object().shape({
  project: Yup.string().required('Project name is required'),
  purpose: Yup.string().required('Purpose name is required'),
  instrumentNo: Yup.string().required('Instrument number is required'),
  backSight: Yup.number()
    .typeError('Backsight is required')
    .required('Backsight is required'),
  reducedLevel: Yup.number()
    .typeError('Reduced level is required')
    .required('Reduced level is required'),
  chainageMultiple: Yup.number()
    .typeError('Chainage multiple is required')
    .required('Chainage multiple is required'),
});

const inputData = [
  {
    label: 'Project name*',
    name: 'project',
    type: 'text',
  },
  {
    label: 'Purpose*',
    name: 'purpose',
    mode: 'select',
    options: [
      'Initial Level',
      'Final Level',
      'Final Earth Work',
      'Quarry Muck',
    ].map((n) => ({ label: n, value: n })),
  },
  {
    label: 'Instrument number*',
    name: 'instrumentNo',
    type: 'text',
  },
  {
    label: 'Back sight*',
    name: 'backSight',
    type: 'number',
  },
  {
    label: 'Reduced level*',
    name: 'reducedLevel',
    type: 'number',
  },
  {
    label: 'Chainage multiple*',
    name: 'chainageMultiple',
    mode: 'select',
    options: [5, 10, 20, 30, 50].map((n) => ({ label: n, value: n })),
  },
];

const initialFormValues = {
  project: '',
  purpose: '',
  instrumentNo: '',
  backSight: '',
  reducedLevel: '',
  chainageMultiple: '',
};

const RoadSurveyForm = () => {
  const navigate = useNavigate();

  const dispatch = useDispatch();

  const { global } = useSelector((state) => state.loading);

  const formValues = useRef(initialFormValues);

  const [formErrors, setFormErrors] = useState(null);

  const [btnLoading, setBtnLoading] = useState(false);

  const handleGoBack = () => navigate('/');

  const handleInputChange = async (event) => {
    const { name, value } = event.target;

    formValues.current = {
      ...formValues.current,
      [name]: value,
    };

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
      await schema.validate(formValues.current, { abortEarly: false });

      const { data } = await createSurvey(formValues.current);

      if (data.success) {
        const id = data?.survey?.purposeId;

        dispatch(
          showAlert({
            type: 'success',
            message: `Form Submitted Successfully`,
          })
        );

        dispatch(startLoading());

        navigate(`/survey/road-survey/${id}/rows`);
      } else {
        throw new Error('Something went wrong.');
      }
    } catch (error) {
      handleFormError(error, setFormErrors, dispatch, navigate);
    } finally {
      setBtnLoading(false);
    }
  };

  useEffect(() => {
    dispatch(stopLoading());
  }, []);

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
          {inputData.map((input, index) => (
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
                  value={formValues.current[input.name]}
                  error={formErrors && formErrors[input.name]}
                  variant={'filled'}
                  sx={{ width: '100%' }}
                  onChange={(e) => handleInputChange(e)}
                />
              ) : (
                <BasicTextFields
                  {...input}
                  value={formValues.current[input.name]}
                  error={formErrors && formErrors[input.name]}
                  variant={'filled'}
                  sx={{ width: '100%' }}
                  onChange={(e) => handleInputChange(e)}
                />
              )}
            </Box>
          ))}
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
