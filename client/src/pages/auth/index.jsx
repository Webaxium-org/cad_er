import * as React from 'react';
import * as Yup from 'yup';
import {
  Box,
  CssBaseline,
  Divider,
  Link,
  Typography,
  Stack,
  Card as MuiCard,
} from '@mui/material';
import { styled } from '@mui/material/styles';
import { GoogleLogin } from '@react-oauth/google';
import { useDispatch } from 'react-redux';
import { stopLoading } from '../../redux/loadingSlice';
import { jwtDecode } from 'jwt-decode';
import { googleLogin, loginUser } from '../../services/indexServices';
import { showAlert } from '../../redux/alertSlice';
import { handleFormError } from '../../utils/handleFormError';
import { useNavigate } from 'react-router-dom';
import { setUser } from '../../redux/userSlice';
import BasicTextFields from '../../components/BasicTextFields';
import BasicButtons from '../../components/BasicButton';

// ✅ Styled Components
const Card = styled(MuiCard)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  alignSelf: 'center',
  width: '100%',
  padding: theme.spacing(4),
  gap: theme.spacing(2),
  margin: 'auto',
  [theme.breakpoints.up('sm')]: {
    maxWidth: '450px',
  },
  boxShadow:
    'hsla(220, 30%, 5%, 0.05) 0px 5px 15px 0px, hsla(220, 25%, 10%, 0.05) 0px 15px 35px -5px',
}));

const SignInContainer = styled(Stack)(({ theme }) => ({
  height: '100dvh',
  minHeight: '100%',
  padding: theme.spacing(2),
  [theme.breakpoints.up('sm')]: {
    padding: theme.spacing(4),
  },
  '&::before': {
    content: '""',
    display: 'block',
    position: 'absolute',
    zIndex: -1,
    inset: 0,
    backgroundImage:
      'radial-gradient(ellipse at 50% 50%, hsl(210, 100%, 97%), hsl(0, 0%, 100%))',
    backgroundRepeat: 'no-repeat',
  },
}));

const schema = Yup.object().shape({
  email: Yup.string()
    .trim()
    .matches(
      /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/,
      'Please enter a valid email address'
    )
    .email('Please enter a valid email address')
    .required('Email is required'),

  password: Yup.string()
    .min(6, 'Password must be at least 6 characters long')
    .required('Password is required'),
});

const inputDetails = [
  {
    label: 'Email',
    name: 'email',
    type: 'text',
  },
  {
    label: 'Password',
    name: 'password',
    type: 'password',
  },
];

const initialFormValues = {
  email: '',
  password: '',
};

export default function SignIn() {
  const dispatch = useDispatch();

  const navigate = useNavigate();

  const [inputData, setInputData] = React.useState(inputDetails);

  const [formValues, setFormValues] = React.useState(initialFormValues);

  const [formErrors, setFormErrors] = React.useState(null);

  const [loading, setLoading] = React.useState(false);

  const handleSuccessLogin = (user) => {
    dispatch(setUser(user));

    dispatch(
      showAlert({
        type: 'success',
        message: `Hi ${user?.name}, everything's ready for you. Let's get started!`,
      })
    );

    navigate('/');
  };

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
    setLoading(true);

    try {
      await schema.validate(formValues, { abortEarly: false });

      const { data } = await loginUser(formValues);

      handleSuccessLogin(data.user);
    } catch (error) {
      if (error?.response?.data?.message === 'Invalid credentials') {
        const innerError = [
          { path: 'email', message: error?.response?.data?.message },
          { path: 'password', message: error?.response?.data?.message },
        ];

        error.inner = innerError;
      }

      handleFormError(error, setFormErrors, dispatch, navigate);
    } finally {
      setLoading(false);
    }
  };

  // ✅ Google Sign-In Success
  const handleGoogleSuccess = async (credentialResponse) => {
    try {
      jwtDecode(credentialResponse.credential);

      // Send token to your backend
      const { data } = await googleLogin({
        data: credentialResponse.credential,
      });

      handleSuccessLogin(data.user);
    } catch (error) {
      handleFormError(error, null, dispatch, navigate);
    }
  };

  const handleGoogleError = () => {
    const error = new Error('Google Login Failed. Please try again.');
    handleFormError(error, null, dispatch, navigate);
  };

  React.useEffect(() => {
    dispatch(stopLoading());
  }, [dispatch]);

  return (
    <>
      <CssBaseline enableColorScheme />
      <SignInContainer
        direction="column"
        justifyContent="center"
        alignItems="center"
      >
        <Card variant="outlined">
          <Typography
            component="h1"
            variant="h4"
            sx={{
              width: '100%',
              fontSize: 'clamp(2rem, 10vw, 2.15rem)',
              textAlign: 'center',
            }}
          >
            Sign in
          </Typography>

          {/* Email & Password */}
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              width: '100%',
              gap: 2,
            }}
          >
            {inputData.map((input, index) => (
              <Box
                sx={{
                  '& .MuiOutlinedInput-root, & .MuiFilledInput-root': {
                    borderRadius: '15px',
                  },
                  width: '100%',
                }}
                key={index}
              >
                <BasicTextFields
                  {...input}
                  value={formValues[input.name] || ''}
                  error={(formErrors && formErrors[input.name]) || ''}
                  variant="filled"
                  sx={{ width: '100%' }}
                  onChange={(e) => handleInputChange(e)}
                />
              </Box>
            ))}

            <BasicButtons
              value={'Sign in'}
              sx={{ backgroundColor: '#0059E7', height: '45px' }}
              fullWidth={true}
              onClick={handleSubmit}
              loading={loading}
            />

            <Link
              component="button"
              type="button"
              variant="body2"
              sx={{ alignSelf: 'center' }}
              onClick={() => alert('This feature in progress !!')}
            >
              Forgot your password?
            </Link>
          </Box>

          <Divider>or</Divider>

          {/* ✅ Google Login Button */}
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'center',
              width: '100%',
            }}
          >
            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={handleGoogleError}
            />
          </Box>
        </Card>
      </SignInContainer>
    </>
  );
}
