# Referencer

Referencer is a Bible study annotation tool which makes it easy to cross-reference multiple passages from different parts of the Bible. It is written in React (utilising Next.js), TypeScript and Express.js.

## To-do

### Selecting a passage

- As a user, I want to be able to create a room so that I can collaborate in real-time with other people.

  - Requires websocket support
  - Requires backend room design

- As a user, when I type into the search bar, I want to be able to add the passage into Section A/B of the screen.

### Layer navigation pane

- As a user, I want to be able to manage my available layers.
  1. Layer names should be visible
  2. Layers should have on/off functionality

### Working within the passage

- As a user, I want to be able to highlight words and phrases within the passage. These should also appear as layers within the colours section.
- As a user, when I type into the search bar, I want to have autocomplete on my book names.
- As a user, I want to be able to select a verse of the Bible and have it displayed.

### Known Issues

- ESV Dataset is incomplete; missing verse one of for all books, Chapter 2 onwards (i.e. Any x:1 where x>1)
- Text needs to be without quotes around it
