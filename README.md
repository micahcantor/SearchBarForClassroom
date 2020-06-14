# Search Bar For Classroom
A simple Chrome extension to add a search bar to Google Classroom. Uses the Classroom API to find assignments and announcements matching the search criteria, then displays the results in the stream.

![example](https://raw.githubusercontent.com/micahcantor/ClassroomSearchbar/master/extension-example.png "Example Image")

## How does it work?
Once authorized by the user, the extension connects to the Google Classroom API and pulls all the assignments and announcements for the class being searched. It then matches the query terms against the list of coursework using the fuzzy search tool fuse.js, and orders them by relevancy. 

Now that the relevant data is collected the extension generates new assignment or announcement bubbles for each of the matched results from an HTML/CSS template. The templates are generated from Classroom's source using the extension SnappySnippet. These new assignments are then displayed at the top of the stream.

## Installation Guide
Search Bar for Classroom is [available on the Chrome Web Store](https://chrome.google.com/webstore/detail/search-bar-for-classroom/dmlfplbdckbemkkhkojekbagnpldghnc).
![webstore](https://raw.githubusercontent.com/micahcantor/ClassroomSearchbar/master/ChromeWebStoreBadge.png "Webstore")

## Known Issues
1. The extension cannot generate the 'material' coursework type, which adds a link or file directly to the stream, since these are not made available in the Classroom API.
2. The extension will not work if you manage multiple Google Classroom accounts with different email addresses on the same browser profile. If you want to switch to work on multiple accounts, you can click on the extension's icon in the browser, then click **clear access tokens from local storage**. You should now be able to sign into another account when you use the search bar again.



