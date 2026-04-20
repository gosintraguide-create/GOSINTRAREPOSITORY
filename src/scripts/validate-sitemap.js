#!/usr/bin/env node

/**
 * Sitemap Validation Script
 * 
 * This script validates the sitemap.xml file to ensure:
 * - File exists
 * - Valid XML format
 * - Correct number of URLs
 * - All URLs use HTTPS
 * - All URLs include domain
 * - No duplicates
 * - Proper structure
 */

const fs = require('fs');
const path = require('path');

// ANSI color codes
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

const EXPECTED_URL_COUNT = 23;
const BASE_URL = 'https://www.hoponsintra.com';

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function validateSitemap() {
  log('\n🔍 Starting Sitemap Validation...\n', 'cyan');
  
  let passed = 0;
  let failed = 0;
  let warnings = 0;

  // Test 1: Check if file exists
  const sitemapPath = path.join(__dirname, '../public/sitemap.xml');
  log('Test 1: Checking if sitemap.xml exists...', 'blue');
  
  if (!fs.existsSync(sitemapPath)) {
    log('❌ FAILED: sitemap.xml not found at /public/sitemap.xml', 'red');
    failed++;
    process.exit(1);
  }
  
  log('✅ PASSED: sitemap.xml exists', 'green');
  passed++;

  // Test 2: Read file content
  log('\nTest 2: Reading sitemap content...', 'blue');
  let content;
  
  try {
    content = fs.readFileSync(sitemapPath, 'utf-8');
    log('✅ PASSED: File is readable', 'green');
    passed++;
  } catch (error) {
    log(`❌ FAILED: Cannot read file - ${error.message}`, 'red');
    failed++;
    process.exit(1);
  }

  // Test 3: Check XML declaration
  log('\nTest 3: Checking XML declaration...', 'blue');
  
  if (content.includes('<?xml version="1.0" encoding="UTF-8"?>')) {
    log('✅ PASSED: Valid XML declaration found', 'green');
    passed++;
  } else {
    log('❌ FAILED: Missing or invalid XML declaration', 'red');
    failed++;
  }

  // Test 4: Check namespace
  log('\nTest 4: Checking XML namespace...', 'blue');
  
  if (content.includes('xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"')) {
    log('✅ PASSED: Correct namespace found', 'green');
    passed++;
  } else {
    log('❌ FAILED: Missing or incorrect namespace', 'red');
    failed++;
  }

  // Test 5: Check schema location
  log('\nTest 5: Checking schema location...', 'blue');
  
  if (content.includes('xsi:schemaLocation')) {
    log('✅ PASSED: Schema location declared', 'green');
    passed++;
  } else {
    log('⚠️  WARNING: Schema location not declared (optional but recommended)', 'yellow');
    warnings++;
  }

  // Test 6: Count URLs
  log('\nTest 6: Counting URLs...', 'blue');
  
  const urlMatches = content.match(/<url>/g);
  const urlCount = urlMatches ? urlMatches.length : 0;
  
  if (urlCount === EXPECTED_URL_COUNT) {
    log(`✅ PASSED: Found ${urlCount} URLs (expected ${EXPECTED_URL_COUNT})`, 'green');
    passed++;
  } else {
    log(`❌ FAILED: Found ${urlCount} URLs, expected ${EXPECTED_URL_COUNT}`, 'red');
    failed++;
  }

  // Test 7: Extract and validate URLs
  log('\nTest 7: Validating URL format...', 'blue');
  
  const locMatches = content.match(/<loc>(.*?)<\/loc>/g);
  if (!locMatches) {
    log('❌ FAILED: No <loc> tags found', 'red');
    failed++;
  } else {
    const urls = locMatches.map(match => match.replace(/<\/?loc>/g, ''));
    
    // Check all URLs use HTTPS
    const httpUrls = urls.filter(url => !url.startsWith('https://'));
    if (httpUrls.length > 0) {
      log(`❌ FAILED: ${httpUrls.length} URLs don't use HTTPS:`, 'red');
      httpUrls.forEach(url => log(`   - ${url}`, 'red'));
      failed++;
    } else {
      log('✅ PASSED: All URLs use HTTPS', 'green');
      passed++;
    }

    // Check all URLs include domain
    const urlsWithoutDomain = urls.filter(url => !url.startsWith(BASE_URL));
    if (urlsWithoutDomain.length > 0) {
      log(`❌ FAILED: ${urlsWithoutDomain.length} URLs missing domain:`, 'red');
      urlsWithoutDomain.forEach(url => log(`   - ${url}`, 'red'));
      failed++;
    } else {
      log(`✅ PASSED: All URLs include domain (${BASE_URL})`, 'green');
      passed++;
    }

    // Check for duplicates
    const uniqueUrls = [...new Set(urls)];
    if (uniqueUrls.length !== urls.length) {
      log(`❌ FAILED: Found ${urls.length - uniqueUrls.length} duplicate URLs`, 'red');
      failed++;
    } else {
      log('✅ PASSED: No duplicate URLs found', 'green');
      passed++;
    }
  }

  // Test 8: Check date format
  log('\nTest 8: Checking date format...', 'blue');
  
  const dateMatches = content.match(/<lastmod>(.*?)<\/lastmod>/g);
  if (!dateMatches) {
    log('⚠️  WARNING: No <lastmod> tags found', 'yellow');
    warnings++;
  } else {
    const dates = dateMatches.map(match => match.replace(/<\/?lastmod>/g, ''));
    const invalidDates = dates.filter(date => !/^\d{4}-\d{2}-\d{2}$/.test(date));
    
    if (invalidDates.length > 0) {
      log(`❌ FAILED: ${invalidDates.length} dates have invalid format:`, 'red');
      invalidDates.forEach(date => log(`   - ${date}`, 'red'));
      failed++;
    } else {
      log(`✅ PASSED: All dates use YYYY-MM-DD format`, 'green');
      log(`   Current date in sitemap: ${dates[0]}`, 'cyan');
      passed++;
    }
  }

  // Test 9: Check priority values
  log('\nTest 9: Checking priority values...', 'blue');
  
  const priorityMatches = content.match(/<priority>(.*?)<\/priority>/g);
  if (!priorityMatches) {
    log('⚠️  WARNING: No <priority> tags found', 'yellow');
    warnings++;
  } else {
    const priorities = priorityMatches.map(match => parseFloat(match.replace(/<\/?priority>/g, '')));
    const invalidPriorities = priorities.filter(p => p < 0 || p > 1);
    
    if (invalidPriorities.length > 0) {
      log(`❌ FAILED: ${invalidPriorities.length} priorities outside 0.0-1.0 range`, 'red');
      failed++;
    } else {
      log(`✅ PASSED: All priorities within valid range (0.0-1.0)`, 'green');
      const maxPriority = Math.max(...priorities);
      const minPriority = Math.min(...priorities);
      log(`   Range: ${minPriority} to ${maxPriority}`, 'cyan');
      passed++;
    }
  }

  // Test 10: Check changefreq values
  log('\nTest 10: Checking changefreq values...', 'blue');
  
  const freqMatches = content.match(/<changefreq>(.*?)<\/changefreq>/g);
  if (!freqMatches) {
    log('⚠️  WARNING: No <changefreq> tags found', 'yellow');
    warnings++;
  } else {
    const validFreqs = ['always', 'hourly', 'daily', 'weekly', 'monthly', 'yearly', 'never'];
    const frequencies = freqMatches.map(match => match.replace(/<\/?changefreq>/g, ''));
    const invalidFreqs = frequencies.filter(f => !validFreqs.includes(f));
    
    if (invalidFreqs.length > 0) {
      log(`❌ FAILED: ${invalidFreqs.length} invalid changefreq values:`, 'red');
      invalidFreqs.forEach(freq => log(`   - ${freq}`, 'red'));
      failed++;
    } else {
      log(`✅ PASSED: All changefreq values are valid`, 'green');
      passed++;
    }
  }

  // Test 11: File size check
  log('\nTest 11: Checking file size...', 'blue');
  
  const stats = fs.statSync(sitemapPath);
  const fileSizeKB = (stats.size / 1024).toFixed(2);
  const maxSizeKB = 50000; // 50MB in KB (sitemap limit)
  
  if (stats.size > maxSizeKB * 1024) {
    log(`❌ FAILED: File size (${fileSizeKB} KB) exceeds 50MB limit`, 'red');
    failed++;
  } else {
    log(`✅ PASSED: File size is ${fileSizeKB} KB (within 50MB limit)`, 'green');
    passed++;
  }

  // Summary
  log('\n' + '='.repeat(60), 'cyan');
  log('VALIDATION SUMMARY', 'cyan');
  log('='.repeat(60), 'cyan');
  log(`✅ Passed: ${passed}`, 'green');
  log(`❌ Failed: ${failed}`, failed > 0 ? 'red' : 'green');
  log(`⚠️  Warnings: ${warnings}`, warnings > 0 ? 'yellow' : 'green');
  log('='.repeat(60) + '\n', 'cyan');

  if (failed === 0) {
    log('🎉 SUCCESS! Your sitemap is valid and ready for deployment!', 'green');
    log('\nNext steps:', 'cyan');
    log('1. Deploy your site', 'cyan');
    log('2. Visit: https://www.hoponsintra.com/sitemap.xml', 'cyan');
    log('3. Submit to Google Search Console', 'cyan');
    process.exit(0);
  } else {
    log('❌ VALIDATION FAILED! Please fix the errors above.', 'red');
    process.exit(1);
  }
}

// Run validation
validateSitemap();
