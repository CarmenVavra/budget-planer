# Project Guide: Angular & C# (.NET) Web API Application

This document contains strict rules, guidelines, and commands that Claude MUST follow during development, testing, and automated code reviews.

## 1. System Commands & Workflow

Before finalizing any task, creating a commit, or finishing a review, you must execute verification.

- **Frontend Build & Test:** `npm run build` and `npm run test -- --watch=false`
- **Frontend Lint:** `npm run lint`
- **Backend Build & Test:** `dotnet build` and `dotnet test`
- **Backend Format Check:** `dotnet format --verify-no-changes`

CRITICAL: Never commit code that breaks the build or fails tests. Fix issues autonomously before reporting completion.

## 2. Automated Code Review Checklist

### Angular (Frontend) Guidelines

- **Architecture:** Use standalone components. Keep components clean; delegate data fetching and state to Services.
- **Reactivity:** Prefer Angular Signals for state tracking. For RxJS, prevent memory leaks using the `async` pipe or `takeUntilDestroyed()`.
- **API Clients:** Centralize all backend communication in dedicated Angular services using `HttpClient`.

### C# / .NET (Backend) Guidelines

- **Architecture:** Follow Clean Architecture or CQRS patterns if present. Ensure Controllers only handle HTTP concerns and delegate logic to Handlers/Services.
- **Asynchronous Code:** Use `async` and `await` all the way down. Never use `.Result` or `.Wait()` (prevents thread pool starvation).
- **Nullability:** Strict C# Nullable Reference Types (`#nullable enable`) must be respected. Use `?` for optional data.
- **LINQ Performance:** Avoid heavy operations in memory. Use `IQueryable` for database filtering and compile with `ToListAsync()` to prevent blocking threads. Do not use `.ToList()` too early.
- **Dependency Injection:** Inject abstractions (Interfaces like `IUserService`), never concrete implementations. Register them with correct lifetimes (Transient, Scoped, Singleton).

### General Testing Requirements

- **Frontend:** Unit tests are required for all logic-heavy pipes, services, and components.
- **Backend:** Write unit tests using xUnit, NUnit, or MSTest. Use FluentAssertions for readable asserts and Moq/NSubstitute for mocking dependencies.

## 3. Naming & Style Conventions

- **Angular:** strict `kebab-case` for file names, `camelCase` for properties/methods.
- **C# / .NET:** `PascalCase` for classes, interfaces (must start with `I`), methods, and public properties. `_camelCase` for private readonly fields.

## 4. Git & Commit Guidelines

- **Format:** Conventional Commits (e.g., `feat(api): add stripe webhook handler`, `refactor(ui): convert product-list to signals`).
