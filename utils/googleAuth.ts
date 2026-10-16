/** Returns the loaded Google OAuth client or throws a readable error. */
export const getGoogleOAuth = (): GoogleOAuth2 => {
  const oauth2 = window.google?.accounts?.oauth2;
  if (!oauth2) {
    throw new Error('Google Sign-In is not available. Please try again.');
  }
  return oauth2;
};
