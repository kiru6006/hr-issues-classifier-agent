import os
import asyncio
from playwright.async_api import async_playwright

async def capture_all():
    screenshots_dir = os.path.join(os.path.dirname(__file__), "screenshots")
    os.makedirs(screenshots_dir, exist_ok=True)

    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context(viewport={"width": 1440, "height": 900}, device_scale_factor=2)
        page = await context.new_page()

        # 1. Login Page
        print("1. Capturing Login Page...")
        await page.goto("http://localhost:5173/auth/login", wait_until="networkidle")
        await page.wait_for_timeout(1000)
        await page.screenshot(path=os.path.join(screenshots_dir, "01_login_portal.png"), full_page=False)

        # Login as employee
        await page.click("text=Employee (Rajesh)")
        await page.click("button:has-text('Sign In Securely')")
        await page.wait_for_url("**/employee/dashboard", timeout=8000)
        await page.wait_for_timeout(1500)

        # 2. Employee Dashboard
        print("2. Capturing Employee Dashboard...")
        await page.screenshot(path=os.path.join(screenshots_dir, "02_employee_dashboard.png"), full_page=False)

        # 3. Submit Grievance Form
        print("3. Capturing Grievance Submission Form...")
        await page.goto("http://localhost:5173/employee/submit", wait_until="networkidle")
        await page.wait_for_timeout(1000)
        await page.click("text=Payroll")
        await page.wait_for_timeout(500)
        await page.screenshot(path=os.path.join(screenshots_dir, "03_submit_grievance_form.png"), full_page=False)

        # 4. Ticket Detail / Timeline
        print("4. Capturing Ticket Detail View...")
        await page.goto("http://localhost:5173/employee/tickets", wait_until="networkidle")
        await page.wait_for_timeout(1000)
        cards = await page.query_selector_all(".glass-card")
        if cards:
            await cards[0].click()
            await page.wait_for_timeout(1500)
            await page.screenshot(path=os.path.join(screenshots_dir, "04_ticket_details_timeline.png"), full_page=False)

        # 5. Switch Role to HR / Admin
        print("5. Switching to HR Reviewer / Admin...")
        await page.select_option("select", value="reviewer@company.com")
        await page.wait_for_timeout(1500)

        # 6. HR Review Queue
        print("6. Capturing HR Review Queue...")
        await page.goto("http://localhost:5173/hr/review-queue", wait_until="networkidle")
        await page.wait_for_timeout(1500)
        await page.screenshot(path=os.path.join(screenshots_dir, "06_hr_review_queue.png"), full_page=False)

        # 7. HR KPIs Dashboard
        print("7. Capturing HR Analytics Dashboard...")
        await page.goto("http://localhost:5173/hr/dashboard", wait_until="networkidle")
        await page.wait_for_timeout(1500)
        await page.screenshot(path=os.path.join(screenshots_dir, "05_hr_analytics_dashboard.png"), full_page=False)

        # 8. Switch to Admin for SLA, Patterns, Audit Logs
        print("8. Switching to Admin...")
        await page.select_option("select", value="admin@company.com")
        await page.wait_for_timeout(1500)

        # 9. SLA Monitor
        print("9. Capturing SLA Monitor...")
        await page.goto("http://localhost:5173/admin/sla-monitor", wait_until="networkidle")
        await page.wait_for_timeout(1500)
        await page.screenshot(path=os.path.join(screenshots_dir, "07_sla_compliance_monitor.png"), full_page=False)

        # 10. Systemic Patterns
        print("10. Capturing Systemic Patterns...")
        await page.goto("http://localhost:5173/admin/patterns", wait_until="networkidle")
        await page.wait_for_timeout(1500)
        await page.screenshot(path=os.path.join(screenshots_dir, "08_systemic_pattern_alerts.png"), full_page=False)

        # 11. Audit Logs
        print("11. Capturing Audit Logs...")
        await page.goto("http://localhost:5173/admin/audit-logs", wait_until="networkidle")
        await page.wait_for_timeout(1500)
        await page.screenshot(path=os.path.join(screenshots_dir, "09_immutable_audit_ledger.png"), full_page=False)

        # 12. Settings / DPDP Erasure
        print("12. Capturing Settings & DPDP Erasure...")
        await page.goto("http://localhost:5173/admin/settings", wait_until="networkidle")
        await page.wait_for_timeout(1500)
        await page.screenshot(path=os.path.join(screenshots_dir, "10_dpdp_privacy_settings.png"), full_page=False)

        await browser.close()
        print("All high-resolution screenshots captured successfully!")

if __name__ == "__main__":
    asyncio.run(capture_all())
