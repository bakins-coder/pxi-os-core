# Protecting Your Code & Intellectual Property

Preventing a developer from "stealing" your code to build a competing product requires a mix of legal, technical, and architectural strategies.

## 1. The Legal Layer (Your Primary Defense)

Technology alone cannot prevent someone with read-access from copying text. The law is what stops them from *using* it.

*   **NDA (Non-Disclosure Agreement)**: Before showing any code, have them sign an NDA. This legally binds them to secrecy.
*   **IP Assignment Agreement**: This is critical. The contract must explicitly state: *"Anything created by the developer during the course of their employment belongs 100% to the Company, not the Developer."*
    *   *Without this, in many jurisdictions, the developer might actually own the copyright to the code they wrote!*

> **Disclaimer**: I am an AI, not a lawyer. Always consult with a legal professional to get compliant contracts for your region.

## 2. Technical Access Control (Least Privilege)

Don't give everyone the keys to the castle.

*   **Repository Access**: If you have multiple projects, only invite developers to the specific repositories they need.
*   **Branch Protection**: As we discussed, require approvals. This prevents a disgruntled developer from sabotaging the code (deleting everything) before they leave.
*   **Revoke Instantly**: When a contract ends, your first step is to remove their GitHub and Supabase access immediately.

## 3. Secrets Management (Protecting the Data)

Code is valuable, but **User Data** is often more valuable.

*   **Environment Variables**: Never put passwords or API keys in the code. Use `.env` files.
*   **Production vs. Development**:
    *   Give developers "Development Keys" that connect to a test database with fake data.
    *   **Keep Production Keys to yourself.** Only you (and the live server) should have the ability to delete the real user database.

## 4. Architectural Defense ("The Secret Sauce")

If your product has a unique algorithm or business logic, don't put it in the React Frontend (which runs on the user's browser and is easily inspectable).

*   **Move Logic to the Backend**: Put your proprietary formulas, pricing logic, or AI prompts in **Supabase Edge Functions** or a private API.
*   **Why?**: The developer works on the "UI" (the button), but they can't see the "Brain" (what happens on the server when the button is clicked). Even if they copy the UI code, they don't have the product.

## 5. Audit Logs

*   **GitHub**: Tracks who cloned the repo and when.
*   **Supabase**: Tracks who accessed the database.
*   **Deterrence**: Letting developers know that actions are logged is a strong psychological deterrent against bad behavior.
