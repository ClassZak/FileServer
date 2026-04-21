# TODO.md (Frontend)

## Code Quality & Refactoring
- [✅] **Unify service response format**: All API methods should return an object with `success: boolean`, `error?: string`, and `data?: any`. Update components to rely on this consistent structure.
- [✅] **Replace `any` types**: Gradually replace all `any` with proper interfaces/models to improve type safety. Keep it for ModelTable component.
- [✅] **Centralize error handling**: Create a global error handler service to capture and display errors uniformly.
- [✅] **Refactor API workflow**: Use Angular HttpClient instead of axios for server requests.

## Features & UX
- [✅] **Global notification system**: Implement toast notifications (e.g., using a library or custom service) to inform users about operation results (success, error, info).
- [✅] **Loading state management**: Add loading indicators for all async actions (button spinners, disabling inputs) – fully implemented.
- [✅] **Accessibility improvements**: Add ARIA labels, ensure keyboard navigation works (focus trapping in modals, etc.).

## Testing
- [✅] **Unit tests**: Write tests for critical services (`AuthService`, `GroupService`, `UserService`, `FileService`).
- [❌] **E2E tests**: Cover main user flows (login, file browsing, group management) with Cypress or Playwright.

## Performance & Security
- [❌] **Move tokens to httpOnly cookies**: Replace `localStorage` with secure cookies to mitigate XSS risks. *(Требует изменений на бэке, фронтенд готов)*
- [✅] **Lazy loading**: Implement lazy loading for feature modules to reduce initial bundle size.
- [❌] **Virtual scrolling**: For large file lists, consider virtual scrolling to improve performance.

## UI
- [✅] **Fix spinner dots animation**: Use CSS pseudo-elements or Angular dynamic text for the animated dots.
- [✅] **Responsive design**: Test and improve layout on very small screens (below 400px).
- [✅] **Consistent error display**: Replace all inline error messages with the reusable `error-message-component`.