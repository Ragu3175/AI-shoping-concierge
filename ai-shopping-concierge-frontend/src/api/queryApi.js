import client from './client';

export const runQuery = async (queryText) => {
  const response = await client.post('/api/query/', { query_text: queryText }, { timeout: 60000 });
  return response.data;
};

export const getHistory = async () => {
  const response = await client.get('/api/history/');
  return response.data;
};

export const getHistoryDetail = async (queryId) => {
  const response = await client.get(`/api/history/${queryId}`);
  return response.data;
};
