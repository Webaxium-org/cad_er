import { showAlert } from '../redux/alertSlice';
import { logOut } from '../redux/userSlice';
// import { logOut } from '../redux/userSlice';
// import { disconnectSocket } from './socket';

export const handleFormError = (error, setFormErrors, dispatch, navigate) => {
  const validationErrors = {};

  // Check if the error is a Yup validation error
  if (error?.inner && Array.isArray(error.inner)) {
    error.inner.forEach((innerError) => {
      validationErrors[innerError.path] = innerError.message;
    });
  }

  const errorMessage =
    error?.response?.data?.message || error?.message || 'Something went wrong.';

  if (import.meta.env.VITE_NODE_ENV === 'development') {
    console.error(error); // Log full error in development
    console.error(validationErrors); // Log full error in development
  }

  // Set form validation errors if any
  if (setFormErrors) {
    setFormErrors(validationErrors);
  }

  if (error?.response?.status === 401 || error?.response?.status === 403) {
    // disconnectSocket();
    dispatch(logOut()); // Clear user state in Redux
  }

  if (error?.response?.status === 500) {
    navigate('/server-error'); // Redirect to server error page
  }

  if (error?.response?.status === 404) {
    navigate('/not-found'); // Redirect to 404 error page
  }

  // Dispatch alert for API or other errors
  dispatch(
    showAlert({
      type: error.response ? 'error' : 'warning',
      message: errorMessage,
    })
  );
};
