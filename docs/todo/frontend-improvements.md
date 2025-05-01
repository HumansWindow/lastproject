# Frontend Improvement Tasks

## React Warnings & Loading State Enhancements

### 1. Fix `fetchPriority` Warning ✅

~~The browser console shows React warnings about the `fetchPriority` prop:~~

```
Warning: React does not recognize the `fetchPriority` prop on a DOM element. If you intentionally want it to appear in the DOM as a custom attribute, spell it as lowercase `fetchpriority` instead. If you accidentally passed it from a parent component, remove it from the DOM element.
```

#### Steps taken to fix:

- [x] Located components using the `fetchPriority` prop in `WalletSelector.tsx`
- [x] Completely removed the `fetchpriority`/`fetchPriority` prop since it was causing TypeScript errors and React warnings
- [x] The component still uses the `priority={true}` prop for image loading optimization

### 2. Implement Loading States ⚠️ (Partially Complete)

Currently, API errors appear in the console during authentication flow because components try to fetch data before authentication completes:

```
API Error [get] /profile: Status 404 Object
Error fetching user profile: AxiosError
Error initializing user: AxiosError
```

#### Completed tasks:

- [x] Added loading state management to the authentication context:
  - [x] Added `isAuthenticating` state variable to `auth.tsx`
  - [x] Added `authStage` state to track different stages of authentication
  - [x] Set appropriate loading states when authentication starts/completes/fails

- [x] Updated components to handle loading state:
  - [x] Enhanced WalletConnectButton to show current authentication stage
  - [x] Added spinners and visual indicators for each authentication step
  - [x] Disabled UI interactions during authentication process

- [x] Fixed modal positioning to show properly below navbar
  - [x] Added proper CSS for modal centering
  - [x] Fixed server-side rendering issues with `document is not defined`

#### Remaining tasks:

- [ ] Create conditional rendering for authenticated content:
  - [ ] Show skeleton screens or placeholders during loading
  - [ ] Hide components that depend on authentication until auth is complete

### 3. Error Handling Improvements ❌

- [ ] Implement proper error handling for failed API requests:
  - [ ] Create reusable error components
  - [ ] Log errors in a structured way
  - [ ] Display user-friendly error messages

- [ ] Add retry mechanisms for authentication and API requests:
  - [ ] Auto-retry logic for transient failures
  - [ ] Exponential backoff for repeated failures

## Implementation Notes

- These changes will improve the user experience by preventing error messages from appearing in the console
- Adding proper loading states will make the application feel more polished
- The auth flow should appear seamless to users rather than showing error flashes during transitions

## Progress Summary (April 30, 2025)

- Fixed the React warnings related to fetchPriority
- Enhanced wallet connection UI with proper loading indicators and authentication stage feedback
- Fixed modal positioning to appear below navbar instead of at the bottom
- Fixed server-side rendering issues with browser-only code

## Next Steps

1. Complete the skeleton loading screens for authenticated content
2. Implement comprehensive error handling components
3. Add retry mechanisms with exponential backoff for API requests

## References

- Current error logs can be found in browser console output from April 30, 2025
- The auth flow implementation is in `auth.tsx` and `WalletConnectButton.tsx`
- Error handling improvements should be aligned with existing patterns in `wallet-guard.js`