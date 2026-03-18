# TODO

## Refactoring & Code Quality
- [ ] Refactor all table components to use a unified `ModelTable` approach (already in use, but ensure consistency across all tables).
- [ ] Replace remaining `any` types with proper interfaces/models.
- [ ] Unify service response format – always return objects with `success`, `error`, and `data` fields.

## Features & Improvements
- [ ] Implement a global notification system (toasts) to inform users about operation results (success/error).
- [ ] Add loading state management to `FileSearchHeader` (disable button during navigation).
- [ ] Enable closing modals by clicking on the overlay.
- [ ] Improve accessibility (ARIA labels, keyboard navigation).

## Testing & Stability
- [ ] Write unit tests for critical services (`AuthService`, `GroupService`, `UserService`).
- [ ] Add end-to-end tests for main user flows (login, file upload, group management).
- [ ] Set up error logging to a remote service for production debugging.

## Performance & Security
- [ ] Move JWT tokens to httpOnly cookies to mitigate XSS risks.
- [ ] Optimize bundle size by lazy-loading feature modules.
- [ ] Implement virtual scrolling for large file lists.

## UI/UX
- [ ] Fix spinner dots animation (replace CSS `content` with proper pseudo-element or dynamic text).
- [ ] Add confirmation dialogs for destructive actions where missing.
- [ ] Improve responsive design for small screens.