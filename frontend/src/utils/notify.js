import toast from 'react-hot-toast';

// One place for app alerts. The `variant` option is read by AppToaster to pick
// the colour, icon and title - react-hot-toast keeps extra options on the toast object.
export const notify = {
  created: (message) => toast.success(message, { variant: 'created' }),
  updated: (message) => toast.success(message, { variant: 'updated', duration: 2500 }),
  deleted: (message) => toast.success(message, { variant: 'deleted' }),
  login: (message) => toast.success(message, { variant: 'login' }),
  logout: (message) => toast.success(message, { variant: 'logout', duration: 2500 }),
  success: (message) => toast.success(message),
  error: (message) => toast.error(message, { duration: 4000 }),
};

// Pull a readable message out of an axios error (or the string a rejected thunk gives back via unwrap())
export const errorMessage = (err, fallback = 'Something went wrong') =>
  (typeof err === 'string' && err) || err?.response?.data?.message || fallback;

// rejectWithValue payload for form thunks: the message plus field errors ({ name: 'already exists' })
export const formError = (err, fallback) => ({
  message: errorMessage(err, fallback),
  errors: err?.response?.data?.errors || {},
});
