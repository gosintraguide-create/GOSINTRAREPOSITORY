# Comprehensive Content Management System

## Overview

The Go Sintra website now has a comprehensive content management system that allows you to edit **every word on every page** through a single, centralized admin interface.

## Accessing the Content Editor

1. Navigate to the Admin page
2. Log in with your admin password
3. Click on the **"Content"** tab
4. You'll see a comprehensive editor with multiple sections

## Content Organization

The content is organized into these main sections:

### 1. **Company** Tab
- Company name, email, phone, location
- Operating hours
- WhatsApp number
- Navigation menu labels (Home, How It Works, Attractions, etc.)

### 2. **Home** Tab
Edit all homepage content including:
- **Hero Section**: Title, subtitle, CTA button, benefit pills
- **Why Choose Section**: Title and subtitle
- **Features**: All 6 features with titles, descriptions, and icons
- **Service Highlights**: How it works section items
- **Call to Action**: Final CTA section

### 3. **How It Works** Tab
- **Hero Section**: Page title and subtitle
- **Steps**: All 3 steps with titles and descriptions
- **What Makes Us Special**: Section title and all 6 features
- **FAQ Section**: Title, subtitle, and all questions/answers
- **Call to Action**: CTA at bottom of page

### 4. **Attractions** Tab
- **Hero Section**: Page title, subtitle, and description
- **Listing Intro**: Introduction text for attractions list
- **Attraction Detail Labels**: All labels used on detail pages
- **Individual Attractions**: Full details for each attraction:
  - Pena Palace
  - Quinta da Regaleira
  - Moorish Castle
  - Monserrate Palace
  - Sintra National Palace
  
  For each attraction, you can edit:
  - Name
  - Short and long descriptions
  - Highlights (bullet points)
  - Hours, duration, tips
  - Ticket prices

### 5. **Buy Ticket** Tab
Edit all booking flow content:
- **Hero Section**: Page title and subtitle
- **Step Labels**: Names for each step in the booking process
- **Date Selection Form**: All labels and button text
- **Passenger Selection Form**: Form labels and placeholders
- **Attractions Selection**: Titles and descriptions
- **Payment Form**: Order summary labels and button text

### 6. **Other Pages** Tab
Content for additional pages:
- **About Page**: Hero, mission, values
- **Manage Booking Page**: Login form and booking details labels
- **Request Pickup Page**: Form labels and instructions
- **Operations Page** (Driver Portal): Dashboard labels

### 7. **Common** Tab
Shared content across the site:
- **Common Buttons**: Labels for all buttons (Book Now, Learn More, etc.)
- **Common Labels**: Standard labels (Loading, Error, Total, etc.)
- **Footer**: All footer sections (Quick Links, Contact Info, Legal)
- **SEO Meta Tags**: Title, description, and keywords for each page

## Key Features

### Array Items (Lists)
Some content sections have lists of items (e.g., features, FAQs, benefit pills):
- **Add Items**: Click the "+ Add" button at the bottom
- **Edit Items**: Click on any item in the accordion to expand and edit
- **Remove Items**: Click the trash icon to delete an item
- **Reorder**: Items appear in the order shown (no drag-and-drop yet, but you can delete and re-add to reorder)

### Icons
Many sections use Lucide icons. When editing icon fields:
- Use the exact icon name from Lucide React (e.g., "Star", "MapPin", "Users")
- Icons are case-sensitive
- Find icon names at: https://lucide.dev/icons/

### Rich Text
Currently, most fields are plain text or simple HTML. For longer descriptions:
- Use line breaks naturally (they'll be preserved)
- Keep formatting simple

## Saving Changes

1. Make your edits in any section
2. An alert will appear at the top showing you have unsaved changes
3. Click **"Save All Changes"** button at the top right
4. All changes are saved to localStorage
5. Refresh any page to see the changes take effect

## Resetting Content

If you want to start over:
1. Click **"Reset to Defaults"** button
2. Confirm the action
3. All content will revert to the original English defaults

## Search Functionality

Use the search box at the top to quickly find specific content:
- Type keywords to filter content
- Search works across all sections

## Best Practices

1. **Test Changes**: After saving, view the actual pages to ensure everything looks good
2. **Backup Important Text**: Before major changes, copy important text to a document
3. **Consistency**: Keep tone and style consistent across all pages
4. **SEO**: Update SEO meta tags when changing page content
5. **Translations**: This system manages English content. Translations are in separate files.

## Technical Details

### Storage
- Content is stored in browser localStorage
- Key: `comprehensive-content`
- Automatically loads on page refresh
- Survives browser restarts

### File Locations
- **Content Structure**: `/lib/comprehensiveContent.ts`
- **Editor Component**: `/components/ContentEditor.tsx`
- **Integration**: `/components/AdminPage.tsx`

### Adding New Content Fields

To add new editable content:

1. Edit `/lib/comprehensiveContent.ts`
2. Add your new field to the `ComprehensiveContent` interface
3. Add the default value to `DEFAULT_COMPREHENSIVE_CONTENT`
4. Edit `/components/ContentEditor.tsx` to add the UI for editing
5. Update the relevant page component to use the new content

## Future Enhancements

Potential improvements for the future:
- Multi-language support in the editor
- Drag-and-drop reordering for array items
- Rich text editor for long descriptions
- Image upload for attraction photos
- Live preview of changes
- Export/import content as JSON
- Revision history and undo

## Support

If you encounter any issues:
1. Check the browser console for errors
2. Ensure you've saved your changes
3. Try refreshing the page
4. As a last resort, reset to defaults and re-enter your content

---

**Last Updated**: October 2025
