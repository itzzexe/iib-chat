const express = require('express');
const ogs = require('open-graph-scraper');
const router = express.Router();

router.post('/extract-metadata', async (req, res) => {
  const { url } = req.body;
  if (!url) {
    return res.status(400).json({ success: false, error: 'URL is required' });
  }

  try {
    const { result } = await ogs({ url });
    if (result.success) {
      res.json({ success: true, data: result });
    } else {
      throw new Error(result.error);
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error(`Metadata extraction error for ${url}:`, errorMessage);
    res.status(500).json({ success: false, error: 'Failed to extract metadata' });
  }
});

module.exports = router; 