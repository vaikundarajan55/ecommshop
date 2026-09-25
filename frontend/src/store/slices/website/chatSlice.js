import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import siteApi from '../../../services/siteApi';
import { errorMessage } from '../../../utils/notify';
import { logout } from './siteAuthSlice';

// AI assistant conversation.

// POST /chat streams Server-Sent Events: {type:'text'|'done'|'error'}
async function streamReply(message, token, onText) {
  const res = await fetch(`${siteApi.defaults.baseURL}/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ message }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.message || 'The assistant is unavailable right now.');
  }
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  for (;;) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const events = buffer.split('\n\n');
    buffer = events.pop(); // keep any half-received event
    for (const evt of events) {
      const line = evt.split('\n').find((l) => l.startsWith('data: '));
      if (!line) continue;
      const data = JSON.parse(line.slice(6));
      if (data.type === 'text') onText(data.text);
      if (data.type === 'error') throw new Error(data.message);
    }
  }
}

export const fetchChatHistory = createAsyncThunk('chat/fetchHistory', async (_, { rejectWithValue }) => {
  try {
    const { data } = await siteApi.get('/chat/history');
    return data.data;
  } catch (err) {
    return rejectWithValue(errorMessage(err));
  }
});

export const clearChatHistory = createAsyncThunk('chat/clearHistory', async (_, { rejectWithValue }) => {
  try {
    await siteApi.delete('/chat/history');
    return true;
  } catch (err) {
    return rejectWithValue(errorMessage(err, 'Could not clear chat'));
  }
});

// Adds the user's bubble plus an empty assistant bubble that fills in as the reply streams
export const sendChatMessage = createAsyncThunk('chat/send', async (message, { dispatch, getState }) => {
  dispatch(chatSlice.actions.messageSent({ id: `u${Date.now()}`, content: message }));
  try {
    await streamReply(message, getState().auth.token, (chunk) => dispatch(chatSlice.actions.replyChunk(chunk)));
    dispatch(chatSlice.actions.replyDone());
  } catch (err) {
    dispatch(chatSlice.actions.replyFailed(err.message));
  }
});

const patchPending = (state, fn) => {
  const msg = state.messages?.find((m) => m.id === 'pending');
  if (msg) fn(msg);
};

const chatSlice = createSlice({
  name: 'chat',
  initialState: {
    messages: null, // null = loading history
    busy: false,    // a reply is streaming
  },
  reducers: {
    messageSent: (state, action) => {
      state.messages = [
        ...(state.messages || []),
        { id: action.payload.id, role: 'user', content: action.payload.content },
        { id: 'pending', role: 'assistant', content: '' },
      ];
    },
    replyChunk: (state, action) => { patchPending(state, (m) => { m.content += action.payload; }); },
    replyDone: (state) => { patchPending(state, (m) => { m.id = `a${Date.now()}`; }); },
    replyFailed: (state, action) => {
      patchPending(state, (m) => { m.id = `e${Date.now()}`; m.content = action.payload; m.error = true; });
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchChatHistory.fulfilled, (state, action) => { state.messages = action.payload; })
      .addCase(fetchChatHistory.rejected, (state) => { state.messages = []; })

      .addCase(clearChatHistory.fulfilled, (state) => { state.messages = []; })

      .addCase(sendChatMessage.pending, (state) => { state.busy = true; })
      .addCase(sendChatMessage.fulfilled, (state) => { state.busy = false; })
      .addCase(sendChatMessage.rejected, (state) => { state.busy = false; })

      .addCase(logout, (state) => { state.messages = null; state.busy = false; });
  },
});

export default chatSlice.reducer;
