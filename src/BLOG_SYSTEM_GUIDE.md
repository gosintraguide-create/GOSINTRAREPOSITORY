# Blog System Guide

## Overview

Your Go Sintra website now has a complete blog/articles system where you can publish travel guides, tips, and helpful articles about visiting Sintra.

## Features

### For Visitors
- **Blog Listing Page**: Beautiful grid layout of all published articles
- **Category Filtering**: Filter articles by category (Planning, Getting There, Attractions, Tips, History)
- **Search**: Full-text search across articles, titles, and tags
- **Individual Article Pages**: Clean, readable article view with Markdown formatting
- **Related Articles**: Automatically shows related articles at the bottom
- **Social Sharing**: Share articles on Facebook, Twitter, or via email
- **Responsive Design**: Looks great on all devices

### For Admins
- **Full CRUD**: Create, Read, Update, and Delete articles
- **Rich Text Editor**: Write articles using Markdown (supports headings, lists, links, bold, italic, etc.)
- **SEO Controls**: Set custom SEO title, description, and keywords per article
- **Categories**: Organize articles into predefined categories
- **Tags**: Add multiple tags to each article for better discoverability
- **Draft Mode**: Save articles as drafts before publishing
- **Featured Images**: Add hero images from Unsplash or other sources
- **Auto-calculations**: Read time automatically calculated
- **Auto-slug**: URL slugs auto-generated from titles

## How to Use

### Accessing the Blog (Visitors)

1. Click **"Travel Guide"** in the main navigation menu
2. Browse all articles or filter by category
3. Use the search bar to find specific topics
4. Click any article to read the full content

### Managing Articles (Admins)

1. Log into the Admin Console
2. Go to the **"Blog"** tab
3. Click **"New Article"** to create an article
4. Fill in the required fields:
   - **Title**: Article headline
   - **Excerpt**: Short summary (2-3 sentences)
   - **Category**: Select from dropdown
   - **Content**: Write your article using Markdown
   - **Tags**: Add relevant tags
   - **Featured Image**: Add an image URL
   - **Published**: Toggle to publish or keep as draft
5. Click **"Save Article"**

## Default Articles

The system comes with 3 comprehensive default articles:

1. **How to Get to Sintra from Lisbon**
   - Complete transportation guide
   - Train schedules and costs
   - Tips for traveling to Sintra

2. **Planning Your Perfect Day in Sintra**
   - Sample itineraries
   - Timing recommendations
   - Budget planning

3. **Pena Palace: The Complete Visitor's Guide**
   - History and architecture
   - Ticket options
   - Insider tips

## Markdown Formatting

Articles support full Markdown formatting:

```markdown
# Main Heading
## Subheading
### Smaller Heading

**Bold text**
*Italic text*

- Bullet point 1
- Bullet point 2

1. Numbered item 1
2. Numbered item 2

[Link text](https://example.com)

> Blockquote text
```

## Categories

### Planning Your Visit
Everything you need to know to plan the perfect Sintra day trip

### Getting There
Transportation guides and tips for reaching Sintra

### Attractions & Sights
In-depth guides to Sintra's palaces, castles, and gardens

### Travel Tips
Insider tips and local advice for exploring Sintra

### History & Culture
Learn about Sintra's rich history and cultural heritage

## Technical Details

### File Locations
- **Blog Manager**: `/lib/blogManager.ts` - Core blog data structure and functions
- **Blog Listing Page**: `/components/BlogPage.tsx` - Main blog index
- **Article Page**: `/components/BlogArticlePage.tsx` - Individual article view
- **Blog Editor**: `/components/BlogEditor.tsx` - Admin interface for managing articles

### Storage
- Articles are stored in browser localStorage
- Key: `blog-articles`
- Categories are stored separately as: `blog-categories`
- Survives browser restarts
- Can be exported/imported via JSON

### Routing
- Blog listing: `/blog` or `?page=blog`
- Individual articles: `/blog/{slug}` or `?page=blog-article&slug={slug}`

### SEO
Each article has customizable SEO fields:
- **SEO Title**: Shown in browser tab and search results
- **SEO Description**: Meta description for search engines
- **SEO Keywords**: Comma-separated keywords

## Adding New Articles

### Quick Steps

1. Admin → Blog → New Article
2. Enter a compelling title
3. Write a 2-3 sentence excerpt
4. Choose a category
5. Write your content in Markdown
6. Add 3-5 relevant tags
7. Add a featured image URL (use Unsplash)
8. Toggle "Published" to make it live
9. Save

### Content Tips

- **Titles**: Keep them under 60 characters for SEO
- **Excerpts**: Make them engaging to encourage clicks
- **Content**: Aim for 800-2000 words for comprehensive guides
- **Images**: Use high-quality images from Unsplash
- **Tags**: Use lowercase, hyphenated tags (e.g., "travel-tips")
- **Headings**: Use proper heading hierarchy (H1 → H2 → H3)

### Image URLs

Use Unsplash for free, high-quality images:
1. Go to unsplash.com
2. Search for "Sintra" or related terms
3. Click an image
4. Right-click → Copy Image Address
5. Paste into the Featured Image field

## Article Ideas

Consider writing about:
- Best time to visit Sintra
- What to pack for Sintra
- Budget travel tips
- Photography spots
- Local restaurants
- Day trip itineraries
- Specific palace guides
- Hidden gems in Sintra
- Family-friendly activities
- Accessibility information
- Weather and climate
- Nearby attractions
- Historical stories
- Architecture styles
- Gardens and nature

## Advanced Features

### URL Slugs
- Auto-generated from titles
- Can be manually edited
- Should be lowercase and hyphenated
- Permanent once article is published

### Read Time
- Automatically calculated based on word count
- Assumes 200 words per minute reading speed
- Displayed on both listing and article pages

### Related Articles
- Automatically shows 3 articles from the same category
- Excludes the current article
- Appears at the bottom of each article

### Search
- Searches article titles, excerpts, and tags
- Case-insensitive
- Results update in real-time

## Maintenance

### Resetting Articles
Click "Reset to Defaults" in the Blog Editor to restore the original 3 articles. This will delete any custom articles you've created.

### Exporting Articles
Articles are stored in localStorage and can be exported:
```javascript
const articles = localStorage.getItem('blog-articles');
console.log(articles); // Copy and save this JSON
```

### Importing Articles
To import articles:
```javascript
localStorage.setItem('blog-articles', 'paste-json-here');
location.reload();
```

## SEO Best Practices

1. **Unique Titles**: Each article should have a unique, descriptive title
2. **Meta Descriptions**: Write compelling 150-160 character descriptions
3. **Keywords**: Use relevant, specific keywords (3-5 per article)
4. **Internal Linking**: Link to other relevant pages on your site
5. **Image Alt Text**: Articles display featured images with proper alt text
6. **Regular Updates**: Keep content fresh and up-to-date

## Future Enhancements

Possible improvements for the future:
- Multi-language support for articles
- Author profiles
- Comments section
- Article series/collections
- Featured articles carousel
- Newsletter integration
- RSS feed
- Print-friendly view
- Reading progress indicator
- Bookmark/save articles
- View counts
- Popular articles widget

---

**Need Help?**

If you encounter any issues or have questions about the blog system, check the browser console for error messages or refer to the main documentation.
