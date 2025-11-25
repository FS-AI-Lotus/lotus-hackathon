const express = require('express');
const router = express.Router();
const changelogService = require('../services/changelogService');
const logger = require('../utils/logger');

/**
 * GET /changelog
 * Get system changelog with pagination
 */
router.get('/', async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 50,
      type
    } = req.query;

    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10))); // Max 100 per page

    const result = changelogService.getChangelog(pageNum, limitNum, type);

    logger.info('Changelog requested', {
      page: pageNum,
      limit: limitNum,
      type,
      totalChanges: result.pagination.total
    });

    res.status(200).json({
      success: true,
      ...result
    });
  } catch (error) {
    logger.error('Failed to get changelog', {
      error: error.message
    });
    next(error);
  }
});

/**
 * GET /changelog/stats
 * Get changelog statistics
 */
router.get('/stats', async (req, res, next) => {
  try {
    const stats = changelogService.getStats();

    logger.info('Changelog stats requested');

    res.status(200).json({
      success: true,
      stats
    });
  } catch (error) {
    logger.error('Failed to get changelog stats', {
      error: error.message
    });
    next(error);
  }
});

/**
 * GET /changelog/search
 * Search changelog entries
 */
router.get('/search', async (req, res, next) => {
  try {
    const { q, query, limit = 20 } = req.query;
    const searchQuery = q || query;

    if (!searchQuery) {
      return res.status(400).json({
        success: false,
        error: 'Search query is required (use "q" or "query" parameter)'
      });
    }

    const limitNum = Math.min(50, Math.max(1, parseInt(limit, 10))); // Max 50 results
    const results = changelogService.searchChangelog(searchQuery, limitNum);

    logger.info('Changelog search performed', {
      query: searchQuery,
      results: results.length
    });

    res.status(200).json({
      success: true,
      query: searchQuery,
      results,
      total: results.length
    });
  } catch (error) {
    logger.error('Failed to search changelog', {
      error: error.message,
      query: req.query.q || req.query.query
    });
    next(error);
  }
});

/**
 * POST /changelog/cleanup
 * Cleanup old changelog entries (admin endpoint)
 */
router.post('/cleanup', async (req, res, next) => {
  try {
    const { keepCount = 500 } = req.body;
    const keepNum = Math.max(100, Math.min(1000, parseInt(keepCount, 10)));

    changelogService.cleanup(keepNum);

    logger.info('Changelog cleanup triggered', {
      keepCount: keepNum
    });

    res.status(200).json({
      success: true,
      message: `Changelog cleaned up, keeping ${keepNum} most recent entries`
    });
  } catch (error) {
    logger.error('Failed to cleanup changelog', {
      error: error.message
    });
    next(error);
  }
});

module.exports = router;

