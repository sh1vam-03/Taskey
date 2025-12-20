# 🧪 Quality Assurance & Testing Strategy

**Objective:** Maintain >80% Code Coverage on critical paths (Auth, Payments, Data Integrity).

---

## 1. Testing Pyramid
We strictly adhere to the Testing Pyramid principles:
1.  **Unit Tests (70%):** Fast, isolated tests for utilities and logic.
2.  **Integration Tests (20%):** API endpoint tests interacting with a Test Database.
3.  **E2E Tests (10%):** Full browser flows using Cypress/Playwright.

---

## 2. Backend Testing (Node.js)

### Tools
-   **Runner:** Jest
-   **Requests:** Supertest
-   **Mocks:** jest-mock-extended

### Naming Convention
-   `src/tests/unit/**/*.test.js`
-   `src/tests/integration/**/*.spec.js`

### Example: Integration Test (Auth)
```javascript
describe('POST /api/auth/login', () => {
    it('should return 200 and JWT for valid credentials', async () => {
        const res = await request(app)
            .post('/api/auth/login')
            .send({ email: 'test@example.com', password: 'pass' });
            
        expect(res.statusCode).toBe(200);
        expect(res.body).toHaveProperty('token');
    });

    it('should return 401 for invalid password', async () => {
        // ...
    });
});
```

---

## 3. Frontend Testing (React)

### Tools
-   **Unit:** React Testing Library (RTL) + Vitest
-   **E2E:** Cypress

### Snapshot Testing
We use Snapshot testing **sparingly**, only for "dumb" UI components (Buttons, Icons) to detect visual regressions.

### Critical User Flows (E2E)
Every release must pass these Cypress flows:
1.  **User Onboarding:** Signup -> Login -> Dashboard.
2.  **Core Loop:** Create Task -> Edit Task -> Complete Task.
3.  **Analytics:** Open Insights -> Verify Chart renders.

---

## 4. CI/CD Pipeline Integration (GitHub Actions)
Tests run automatically on `push` to `main` or `PR`.

```yaml
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - run: npm install
      - run: npm run test:ci
```
