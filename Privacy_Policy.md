Part I: Classroom API Scopes

In order to search through and sort your Google Classroom assignments and announcements, this extension requires access to read, but not alter, your Classroom courses, assignments, and announcements. Specifically, the extension requires three scopes:
- View your Google Classroom classes.
This scope is required to identify which class you are currently viewing, so it can then sort through the assignments and announcements of that class.
- Manage your coursework and view your grades in Google Classroom.
Only the first part of this scope (“manage your coursework”) is needed and used by this extension. This allows the extension to access a list of your Classroom assignments and read their titles and descriptions. The terms inputted in the search bar are then matched against these titles and descriptions to find the closest matches. The grades of the user for these assignments are not accessed in any way by the extension. 
- View your announcements in Google Classroom.
Similarly to assignments, this scope allows the extension to view a list of your courses’ announcements. The extension uses this data on to search through the announcements and return matching results. 

Part II: Other Permissions

In order to function, the extension needs several other additional permissions to access Chrome APIs. Specifically, the extension requires five other permissions:
- “Tabs,” used to interact with the Chrome browser’s tabs system.
The extension uses this permission for two purposes. The first is to note when the user navigates to a Google Classroom page. When the user does so, the search bar elements and its accompanying CSS styles are inserted into the page. The second use of the tabs permission is to create a new tab when the user clicks on an assignment that was returned by the search bar. When the user clicks on the assignment, it brings the user to the details page for that assignment, just as Classroom would operate if any assignment in the stream was clicked. 
- “Storage,” used to store anonymous user data in the user’s browser.
After the user authorizes the extension to view their Classroom data, the extension is given an access token to include in the Classroom API request, signaling the user’s consent. This access token, along with a refresh token used to receive another access token after it expires, is stored in Chrome’s local storage. This means the user will only ever have to log into their Google account to give consent once. These tokens are anonymous strings of letters and numbers that contain no user identifying information.
Additionally, even if these tokens were somehow compromised from Chrome’s storage, they could not be used, since this authorization occurs on a secure, remote private server that holds the “client secret,” a password given to the application by Google to allow the extension to authorize requests. 
- “Identity,” used to launch the OAuth 2.0 interactive authorization flow.
If the extension does not find any access or refresh tokens in the browser’s storage, it means the user has never logged into the extension before. In this case, the extension launches a pop up that guides the user into logging into their Google account to give the extension access to their Classroom data, as specified in Part I. The extension follows OAuth 2.0 protocol directly, and does not access or store the user’s email or password entered in this process in any way. 
The ability to send and receive messages to/from classroom.googleapis.com.
This is used to interact with the Google Classroom API as specified in Part I.
The ability to send and receive messages to/from classroom-searchbar.herokuapp.com.
As an additional security measure for the user, requests to Google’s authorization servers that require the use of a ‘client secret,’ which is defined under the “storage” permission, occur on a remote, private server. This ensures that only the extension can access the user’s Classroom data, even if the access token is somehow exposed from the browser’s storage. This server is located at classroom-searchbar.herokuapp.com, so the extension needs permission to send and receive messages from this server. Messages to and from this server are performed via secure HTTPS POST communications. 
- “Email,” the user’s email address
The extension uses the user’s email address to determine which account should be used when requesting an access token for the user. This information is not stored or retained by the extension in any way after it is used to acquire the access token.

Part III: Data Storage and Revoking Access
The extension does not store or cache any identifiable user data at any time, nor does it share this data with any services not related to authorizing the user for API access.

If the user no longer wants to give the extension access to it’s Classroom data, this permission can be revoked at any time by either turning off the extension at chrome://extensions, or revoking it’s access at chrome://identity-internals.
