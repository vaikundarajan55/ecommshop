import { combineReducers } from '@reduxjs/toolkit';
import websiteReducer from './websiteReducer';
import adminReducer from './adminReducer';

const rootReducer = combineReducers({
  ...websiteReducer,
  ...adminReducer,
});

export default rootReducer;
