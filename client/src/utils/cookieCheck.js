export const canUseCookies = () => {
  try {
    document.cookie = 'test_cookie=1; SameSite=Lax';

    const cookiesEnabled = document.cookie.includes('test_cookie=');

    // Cleanup
    document.cookie =
      'test_cookie=1; expires=Thu, 01 Jan 1970 00:00:01 GMT; SameSite=Lax';

    return cookiesEnabled;
  } catch (err) {
    return false;
  }
};
