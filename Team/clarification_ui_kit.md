# Clarification UI Kit (v1.0)

This document defines the high-fidelity selection and context-gathering components used by **Prof** and the AI Team.

---

## 1. Markdown-Enhanced Chat (Simple Clarifications)

Use these templates directly in chat responses for quick context extraction.

### Question Header
```markdown
### 📝 Clarification Required: [Subject]
> [!NOTE]
> [One sentence explaining why this context is needed.]
```

### Radio Selection (Single Choice)
```markdown
[Question text here]

| Choice | Option |
| :--- | :--- |
| **(1)** | [Option A Text] |
| **(2)** | [Option B Text] |
| **(3)** | **Something else...** |

**Reply with the number of your choice.**
```

### Checkbox Selection (Multiple Choice)
```markdown
[Question text here]

- [ ] **A.** [Option A]
- [ ] **B.** [Option B]
- [ ] **C.** [Option C]

**Reply with the letters that apply (e.g., 'A, B').**
```

---

## 2. Interactive Form Artifact (Complex Onboarding)

For complex, multi-step clarifications, use a `.html` artifact with the following aesthetic traits:
- **Background**: Light gray (#f9fafb).
- **Container**: White modal with subtle shadow.
- **Typography**: Sans-serif (Inter/Roboto).
- **Interaction**: Functional buttons and checkboxes.

### HTML/CSS Skeleton Structure
```html
<style>
  body { font-family: 'Inter', sans-serif; background: #f3f4f6; padding: 40px; }
  .modal { background: white; border-radius: 12px; padding: 24px; max-width: 600px; margin: auto; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
  .option { display: flex; align-items: center; padding: 12px; border: 1px solid #e5e7eb; border-radius: 8px; margin-bottom: 8px; cursor: pointer; transition: background 0.2s; }
  .option:hover { background: #f9fafb; }
  .option.selected { border-color: #3b82f6; background: #eff6ff; }
  .button-group { display: flex; justify-content: flex-end; gap: 12px; margin-top: 24px; }
  .btn { padding: 8px 16px; border-radius: 6px; font-weight: 500; cursor: pointer; }
  .btn-primary { background: #3b82f6; color: white; border: none; }
  .btn-secondary { background: white; border: 1px solid #d1d5db; }
</style>
```

---

## 3. Progressive Disclosure (Carousels)

Use the `<carousel>` tag to break down long sets of questions.

```markdown
````carousel
### Step 1: Vision
Choose the primary goal for this project.
1. [Goal A]
2. [Goal B]
<!-- slide -->
### Step 2: Tech Stack
Which technologies should we prioritize?
1. [Tech A]
2. [Tech B]
````
```
