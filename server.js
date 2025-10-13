const express = require('express');
const axios = require('axios');
const app = express();

// Health check endpoint
app.get('/', (req, res) => {
  res.json({ 
    status: 'online', 
    service: 'Pixeldrain Proxy',
    endpoints: {
      download: '/download/:id',
      info: '/:id/info'
    }
  });
});

// Download endpoint - streams files from Pixeldrain
app.get('/download/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const url = `https://pixeldrain.com/api/file/${id}`;
    
    console.log(`Proxying download request for file: ${id}`);
    
    const response = await axios({
      url: url,
      method: 'GET',
      responseType: 'stream',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      },
      timeout: 300000 // 5 minutes timeout
    });
    
    // Forward important headers
    if (response.headers['content-type']) {
      res.setHeader('Content-Type', response.headers['content-type']);
    }
    if (response.headers['content-length']) {
      res.setHeader('Content-Length', response.headers['content-length']);
    }
    if (response.headers['content-disposition']) {
      res.setHeader('Content-Disposition', response.headers['content-disposition']);
    }
    
    // Enable CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    
    // Stream the file directly
    response.data.pipe(res);
    
  } catch (error) {
    console.error('Download error:', error.message);
    if (error.response) {
      res.status(error.response.status).json({ 
        error: 'Download failed', 
        message: error.message 
      });
    } else {
      res.status(500).json({ 
        error: 'Proxy error', 
        message: error.message 
      });
    }
  }
});

// Alternative direct file ID endpoint (without /download/)
app.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if this is an info request
    if (req.path.endsWith('/info')) {
      return; // Let the /info handler handle it
    }
    
    const url = `https://pixeldrain.com/api/file/${id}`;
    
    console.log(`Proxying download request for file: ${id}`);
    
    const response = await axios({
      url: url,
      method: 'GET',
      responseType: 'stream',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      },
      timeout: 300000
    });
    
    if (response.headers['content-type']) {
      res.setHeader('Content-Type', response.headers['content-type']);
    }
    if (response.headers['content-length']) {
      res.setHeader('Content-Length', response.headers['content-length']);
    }
    if (response.headers['content-disposition']) {
      res.setHeader('Content-Disposition', response.headers['content-disposition']);
    }
    
    res.setHeader('Access-Control-Allow-Origin', '*');
    response.data.pipe(res);
    
  } catch (error) {
    console.error('Download error:', error.message);
    res.status(500).json({ error: 'Download failed' });
  }
});

// File info endpoint
app.get('/:id/info', async (req, res) => {
  try {
    const { id } = req.params;
    const url = `https://pixeldrain.com/api/file/${id}/info`;
    
    console.log(`Fetching info for file: ${id}`);
    
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });
    
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.json(response.data);
    
  } catch (error) {
    console.error('Info fetch error:', error.message);
    res.status(500).json({ 
      error: 'Failed to fetch file info',
      message: error.message 
    });
  }
});

// Handle CORS preflight
app.options('*', (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.status(200).end();
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Pixeldrain Proxy Server running on port ${PORT}`);
  console.log(`📥 Download endpoint: /download/:id or /:id`);
  console.log(`ℹ️  Info endpoint: /:id/info`);
});
