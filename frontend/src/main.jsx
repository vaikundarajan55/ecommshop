import React from 'react';
import ReactDOM from 'react-dom/client';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import AppToaster from './components/common/AppToaster.jsx';
import { ConfirmDialogHost } from './components/common/ConfirmDialog.jsx';
import App from './App.jsx';
import { store } from './store/store.js';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Provider store={store}>
      <BrowserRouter>
        <App />
        <AppToaster />
        <ConfirmDialogHost />
      </BrowserRouter>
    </Provider>
  </React.StrictMode>
);
