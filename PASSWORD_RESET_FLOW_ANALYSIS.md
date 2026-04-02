# Password Reset & OTP Verification Flow Analysis

## Executive Summary
The password reset flow is **partially implemented**. The **backend is complete**, but the **client-side is missing the crucial reset password page** where users can enter their OTP and set a new password.

---

## 1. BACKEND IMPLEMENTATION ✅

### 1.1 Route Definitions
**File:** [server/routes/authRoutes.js](server/routes/authRoutes.js#L50-L51)

```javascript
// Password Management
router.post('/forgot-password', authLimiter, sanitizeInput, forgotPassword);
router.post('/reset-password', authLimiter, sanitizeInput, resetPassword);
```

### 1.2 Forgot Password Endpoint
**Function:** [authController.forgotPassword()](server/controllers/authController.js#L401-L422)

**Route:** `POST /api/auth/forgot-password`

**Parameters:**
```javascript
{
  email: string (required) // User's email address
}
```

**Response:**
```javascript
{
  success: true,
  message: "Password reset OTP sent to your email"
}
```

**What it does:**
1. Finds user by email
2. Generates a 6-digit OTP using `user.generateOTP()`
3. Sets OTP expiry to 10 minutes (configurable via `OTP_EXPIRE_MINUTES`)
4. Sends OTP email with context type `'forgotPassword'`
5. Returns success message

**Email Template:** [server/config/email.js](server/config/email.js#L44-L61)
- Subject: "Password Reset OTP - FreakyTravellers"
- Contains: OTP code, expiry info, link to reset
- Template type: `'forgotPassword'`

### 1.3 Reset Password Endpoint
**Function:** [authController.resetPassword()](server/controllers/authController.js#L428-L465)

**Route:** `POST /api/auth/reset-password`

**Parameters:**
```javascript
{
  email: string (required),     // User's email
  otp: string (required),       // 6-digit OTP from email
  newPassword: string (required) // New password (min 6 chars)
}
```

**Response:**
```javascript
{
  success: true,
  message: "Password reset successful. You can now login with your new password."
}
```

**Validation Steps:**
1. Finds user by email
2. Verifies OTP using `user.verifyOTP(otp)`
   - Checks if hashed OTP matches stored value
   - Checks if OTP hasn't expired
3. Updates password (auto-hashed before saving)
4. Clears OTP fields
5. Returns success message

### 1.4 OTP Verification Methods
**User Model:** [server/models/User.js](server/models/User.js#L289-L314)

```javascript
// Generate OTP (returns plain OTP to send via email)
generateOTP() {
  // Returns 6-digit OTP
  // Hashes it before storing
  // Sets 10-minute expiry
}

// Verify OTP
verifyOTP(enteredOTP) {
  // Returns true if:
  // 1. Hashed OTP matches stored hash
  // 2. Current time < otpExpire
  // Returns false otherwise
}
```

### 1.5 Related OTP Fields in User Schema
```javascript
otp: String (select: false),      // Hashed OTP
otpExpire: Date (select: false)   // OTP expiration time
```

---

## 2. CLIENT-SIDE IMPLEMENTATION

### 2.1 Forgot Password Page ✅
**File:** [client/src/app/forgot-password/page.js](client/src/app/forgot-password/page.js)

**Features:**
- Email input form
- Loading state while sending
- Success state with email confirmation message
- "Back to Login" button after submission

**API Call:**
```javascript
const response = await authAPI.forgotPassword(email);
// Sends: POST /api/auth/forgot-password with { email }
```

**User Flow:**
1. User enters email
2. Clicks "Send Reset Link"
3. Backend sends OTP email
4. Frontend shows confirmation message
5. User is instructed to check email

### 2.2 API Client Setup ✅
**File:** [client/src/utils/api.js](client/src/utils/api.js#L81-L82)

```javascript
export const authAPI = {
  forgotPassword: (email) => api.post('/auth/forgot-password', { email }),
  resetPassword: (data) => api.post('/auth/reset-password', data),
  // ... other auth endpoints
};
```

Both functions are defined but **resetPassword is never called from a page component**.

---

## 3. CRITICAL MISSING PIECE ❌

### Missing: Reset Password Page/Component

**What's missing:**
- **No page:** `client/src/app/reset-password/page.js` does NOT exist
- **No component:** No form to enter OTP + new password
- **No workflow:** Users cannot complete the password reset flow

**User Experience Gap:**
```
Current Flow:
1. ✅ User clicks "Forgot Password"
2. ✅ Enters email
3. ✅ Receives OTP email
4. ❌ STUCK - No page to enter OTP and new password
5. ❌ Cannot call POST /api/auth/reset-password endpoint
```

### Expected Reset Password Flow (NEEDED):
```
1. User receives OTP email with link/instruction
2. User navigates to reset-password page with OTP
3. Page shows three inputs:
   - Email (pre-filled or entered)
   - OTP (from email)
   - New Password
4. Form validates inputs
5. Calls resetPassword(email, otp, newPassword)
6. Shows success message
7. Redirects to login page
```

---

## 4. OTP HANDLING - Current Implementation

### How OTP Works:
1. **Generation:** `Math.floor(100000 + Math.random() * 900000)` = 6-digit number
2. **Storage:** Hashed with SHA-256 before storing in DB
3. **Expiry:** 10 minutes (configurable via `OTP_EXPIRE_MINUTES` env var)
4. **Purpose:** Used for:
   - Email verification during signup
   - Passwordless login (OTP login feature)
   - **Password reset** (this flow)

### Multiple OTP Endpoints:
| Route | Purpose | Status |
|-------|---------|--------|
| `POST /api/auth/send-otp` | Generate OTP for login/verification | ✅ |
| `POST /api/auth/verify-otp` | Verify OTP for email verification | ✅ |
| `POST /api/auth/login-with-otp` | OTP-based passwordless login | ✅ |
| `POST /api/auth/forgot-password` | Send OTP for password reset | ✅ |
| `POST /api/auth/reset-password` | Reset password with OTP | ✅ (Backend) / ❌ (Frontend) |

---

## 5. PARAMETER EXPECTATIONS - Summary

### POST /api/auth/forgot-password
**Request Body:**
```json
{
  "email": "user@example.com"
}
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Password reset OTP sent to your email"
}
```

---

### POST /api/auth/reset-password
**Request Body:**
```json
{
  "email": "user@example.com",
  "otp": "123456",
  "newPassword": "newSecurePassword123"
}
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Password reset successful. You can now login with your new password."
}
```

**Validation Rules:**
- Email must exist in database
- OTP must be valid and not expired (10 minutes)
- OTP must match the one sent to this email
- New password must be at least 6 characters
- Password will be auto-hashed before saving

---

## 6. WHAT'S MISSING IN CLIENT-SIDE

### Implementation Checklist:

- [ ] **Create Reset Password Page** (`client/src/app/reset-password/page.js`)
  - [ ] Email input field
  - [ ] OTP input field (6 digits)
  - [ ] New password input field
  - [ ] Password confirmation field (optional)
  - [ ] Form validation
  - [ ] Loading state during API call
  - [ ] Error handling with toast messages
  - [ ] Success state with redirect to login

- [ ] **Link from Forgot Password Page**
  - [ ] After OTP email sent, show message: "Enter the code sent to your email"
  - [ ] Option to navigate to reset-password page
  - [ ] Or: Handle entire flow on forgot-password page (two-step form)

- [ ] **Update Navigation**
  - [ ] Login page should link to /forgot-password
  - [ ] Forgot password page should navigate to /reset-password after email submission

### Email Sending
- ✅ OTP is sent correctly with `forgotPassword` context
- ✅ Email template is properly formatted
- ⚠️ Email does NOT contain a clickable link (just OTP code)
- 💡 **Recommendation:** Email should include link to reset-password page or on-screen instructions

---

## 7. SECURITY NOTES

### Current Implementation:
- ✅ OTP is hashed before storage (SHA-256)
- ✅ OTP expires after 10 minutes
- ✅ Rate limiting on `/forgot-password` endpoint (authLimiter)
- ✅ Input sanitization via middleware
- ✅ Password is hashed with bcrypt (10 salt rounds)

### Recommendations:
1. Add max attempts limit for OTP verification (prevent brute force)
2. Consider rate limiting OTP verification attempts separately
3. Log password reset attempts for security audit
4. Send confirmation email after successful password reset

---

## 8. Complete Backend Code References

### Forgot Password Controller
Location: [server/controllers/authController.js](server/controllers/authController.js#L401-L422)
```javascript
exports.forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;

  const user = await User.findOne({ email });

  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'No account found with this email',
    });
  }

  // Generate OTP instead of reset token (simpler for users)
  const otp = user.generateOTP();
  await user.save();

  // Send OTP email with 'forgotPassword' context
  await sendOTPEmail(email, otp, 'forgotPassword');

  res.status(200).json({
    success: true,
    message: 'Password reset OTP sent to your email',
  });
});
```

### Reset Password Controller
Location: [server/controllers/authController.js](server/controllers/authController.js#L428-L465)
```javascript
exports.resetPassword = asyncHandler(async (req, res) => {
  const { email, otp, newPassword } = req.body;

  // Find user and include OTP fields
  const user = await User.findOne({ email }).select('+otp +otpExpire');

  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found',
    });
  }

  // Verify OTP
  const isOTPValid = user.verifyOTP(otp);

  if (!isOTPValid) {
    return res.status(400).json({
      success: false,
      message: 'Invalid or expired OTP',
    });
  }

  // Update password
  user.password = newPassword;
  user.otp = undefined;
  user.otpExpire = undefined;
  await user.save();

  res.status(200).json({
    success: true,
    message: 'Password reset successful. You can now login with your new password.',
  });
});
```

---

## 9. SUMMARY TABLE

| Component | Status | Location | Issue |
|-----------|--------|----------|-------|
| Forgot Password Route | ✅ Complete | `server/routes/authRoutes.js` | - |
| Forgot Password Controller | ✅ Complete | `server/controllers/authController.js` | - |
| Forgot Password Page | ✅ Complete | `client/src/app/forgot-password/page.js` | - |
| Reset Password Route | ✅ Complete | `server/routes/authRoutes.js` | - |
| Reset Password Controller | ✅ Complete | `server/controllers/authController.js` | - |
| Reset Password Page | ❌ MISSING | Should be: `client/src/app/reset-password/page.js` | **BLOCKER** |
| OTP Generation | ✅ Complete | `server/models/User.js` | - |
| OTP Verification | ✅ Complete | `server/models/User.js` | - |
| Email Sending | ✅ Complete | `server/config/email.js` | - |
| API Client Methods | ✅ Complete | `client/src/utils/api.js` | Never called |

---

## 10. IMMEDIATE ACTION ITEMS

### Priority 1 (Blocking):
1. Create `/reset-password` page component with OTP + password form
2. Implement form submission that calls `authAPI.resetPassword()`
3. Add proper error handling and success messaging

### Priority 2 (Enhancement):
1. Add OTP verification attempt limiting (backend)
2. Include direct link in password reset email
3. Add password strength validation
4. Add "Resend OTP" functionality

### Priority 3 (UX):
1. Multi-step form or single page with all fields
2. OTP auto-focus and auto-submit on 6 digits
3. Show OTP expiry countdown timer
4. Add email masking (show user@***.com)
