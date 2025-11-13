import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { generateApiKey, getApiKeyInfo } from './src/apiKeyGenerator.ts';
import { validateApiKey } from './src/apiKeyValidator.ts';
import { submitReport } from './src/submitEndpoint';
import { fetchReports } from './src/fetchEndpoint';
import { visualizationPage } from './src/visualization';

const app = new Hono();

app.use('*', logger());
app.use('*', cors());

// Health check
app.get('/health', (c) => {
  return c.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

app.post('/api/v1/keys/generate', async (c) => {
  try {
    const body = await c.req.json();
    const { name, description } = body;

    if (!name) {
      return c.json({ error: 'Name is required' }, 400);
    }

    const result = await generateApiKey(name, description);
    return c.json({
      success: true,
      message: 'API key generated successfully',
      data: result
    }, 201);
  } catch (error: any) {
    return c.json({ error: error.message || 'Failed to generate API key' }, 500);
  }
});

app.get('/api/v1/keys/:keyId', async (c) => {
  try {
    const keyId = c.req.param('keyId');
    const keyInfo = await getApiKeyInfo(keyId);

    if (!keyInfo) {
      return c.json({ error: 'API key not found' }, 404);
    }

    return c.json({ success: true, data: keyInfo });
  } catch (error: any) {
    return c.json({ error: error.message || 'Failed to fetch API key info' }, 500);
  }
});

app.post('/api/v1/monitoring/reports', validateApiKey, async (c) => {
  try {
    const body = await c.req.json();
    const result = await submitReport(body);
    return c.json({
      success: true,
      message: 'Report stored successfully',
      data: result
    }, 201);
  } catch (error: any) {
    console.error('Error submitting report:', error);
    return c.json({
      error: 'Failed to store report',
      details: error.message
    }, 500);
  }
});

app.post('/api/v1/reports/query', validateApiKey, async (c) => {
  try {
    const body = await c.req.json();
    const result = await fetchReports(body);
    return c.json({
      success: true,
      data: result.data,
      pagination: result.pagination
    });
  } catch (error: any) {
    console.error('Error fetching reports:', error);
    return c.json({
      error: 'Failed to fetch reports',
      details: error.message
    }, 500);
  }
});

app.get('/dashboard', async (c) => {
  const html = await visualizationPage();
  return c.html(html);
});

app.get('/dashboard/data', validateApiKey, async (c) => {
  try {
    const query = c.req.query();
    const result = await fetchReports({
      environment: query.environment,
      limit: parseInt(query.limit || '50'),
      offset: 0
    });
    return c.json(result);
  } catch (error) {
    return c.json({ error: 'Failed to fetch dashboard data' }, 500);
  }
});

// Start server
const port = parseInt(process.env.PORT || '3000');
console.log(`🚀 Server running development on http://localhost:${port}`);

export default {
  port,
  fetch: app.fetch,
};