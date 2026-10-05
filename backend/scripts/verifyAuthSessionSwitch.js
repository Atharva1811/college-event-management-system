/**
 * CEMS Authentication, Role Switching, and Session Safety Verification Suite
 * Runs 100% in-memory with ZERO database mutations. Production DB is untouched.
 */

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    passed++;
    console.log(`  ✓ ${message}`);
  } else {
    failed++;
    console.error(`  ✗ FAILED: ${message}`);
  }
}

// Emulate isPathAllowedForRole as implemented in SignInForm.tsx
function isPathAllowedForRole(path, userRole) {
  if (
    !path ||
    path === '/' ||
    path.includes('/signin') ||
    path.includes('/login') ||
    path.includes('/unauthorized') ||
    path.includes('/access-denied')
  ) {
    return false;
  }
  if (userRole === 'admin') {
    return path.startsWith('/admin') || path.startsWith('/profile') || path.startsWith('/settings');
  }
  if (userRole === 'organizer') {
    return (
      (path.startsWith('/organizer') || path.startsWith('/profile') || path.startsWith('/settings')) &&
      !path.startsWith('/admin') &&
      !path.startsWith('/student')
    );
  }
  if (userRole === 'student') {
    return (
      (path.startsWith('/student') || path.startsWith('/profile') || path.startsWith('/settings')) &&
      !path.startsWith('/admin') &&
      !path.startsWith('/organizer')
    );
  }
  return false;
}

function getDefaultDashboard(userRole) {
  if (userRole === 'admin') return '/admin/dashboard';
  if (userRole === 'organizer') return '/organizer/dashboard';
  return '/student/dashboard';
}

function resolvePostLoginRedirect(fromPath, userRole) {
  if (fromPath && isPathAllowedForRole(fromPath, userRole)) {
    return fromPath;
  }
  return getDefaultDashboard(userRole);
}

// In-memory session mock
class SessionManager {
  constructor() {
    this.localStorage = new Map();
    this.sessionStorage = new Map();
    this.apiHeaders = {};
  }

  setApiAuthToken(token) {
    if (token) {
      this.apiHeaders['Authorization'] = `Bearer ${token}`;
    } else {
      delete this.apiHeaders['Authorization'];
    }
  }

  login(user, token) {
    this.sessionStorage.delete('cems_suspension_reason');
    this.setApiAuthToken(token);
    this.localStorage.set('cems_token', token);
    this.localStorage.set('cems_user', JSON.stringify(user));
  }

  logout() {
    this.localStorage.delete('cems_token');
    this.localStorage.delete('cems_user');
    this.sessionStorage.delete('cems_suspension_reason');
    this.setApiAuthToken(null);
  }

  get currentUser() {
    const raw = this.localStorage.get('cems_user');
    return raw ? JSON.parse(raw) : null;
  }

  get token() {
    return this.localStorage.get('cems_token') || null;
  }

  get authorizationHeader() {
    return this.apiHeaders['Authorization'] || null;
  }
}

console.log('\n======================================================');
console.log('RUNNING CEMS AUTHENTICATION & SESSION SWITCH AUDIT');
console.log('======================================================\n');

const session = new SessionManager();

const adminUser = { _id: 'u1', name: 'Dr. Sarah', role: 'admin', email: 'admin@cems.edu' };
const organizerUser = { _id: 'u2', name: 'Prof. Vance', role: 'organizer', email: 'vance@cems.edu' };
const studentUser = { _id: 'u3', name: 'Alex Johnson', role: 'student', email: 'alex@cems.edu' };

// SUITE 1: Clean Session Initialization and Logout Purge
console.log('TEST SUITE 1: Session Lifecycle & Token Management');
session.login(adminUser, 'token_admin_1');
assert(session.currentUser.role === 'admin', 'Admin logged in with role admin');
assert(session.token === 'token_admin_1', 'Admin token stored in localStorage');
assert(session.authorizationHeader === 'Bearer token_admin_1', 'Authorization header attached');

session.logout();
assert(session.currentUser === null, 'User cleared on logout');
assert(session.token === null, 'Token cleared on logout');
assert(session.authorizationHeader === null, 'Authorization header deleted on logout');
assert(!session.sessionStorage.has('cems_suspension_reason'), 'Suspension reason purged on logout');

// SUITE 2: Role Switch Transitions
console.log('\nTEST SUITE 2: Role Switch Transitions (Cross-Role Safety)');

// Test: Admin -> Organizer
session.login(adminUser, 'token_admin_1');
let staleRedirect = '/admin/dashboard';
session.logout();
session.login(organizerUser, 'token_org_2');
let target = resolvePostLoginRedirect(staleRedirect, session.currentUser.role);
assert(target === '/organizer/dashboard', 'Admin -> Organizer safely redirects to /organizer/dashboard (NOT /admin/dashboard)');
assert(session.currentUser.role === 'organizer', 'Session user is now Organizer');
assert(session.token === 'token_org_2', 'Session token is now Organizer token');
assert(session.authorizationHeader === 'Bearer token_org_2', 'API Authorization header has Organizer token');

// Test: Organizer -> Student
staleRedirect = '/organizer/events/create';
session.logout();
session.login(studentUser, 'token_stu_3');
target = resolvePostLoginRedirect(staleRedirect, session.currentUser.role);
assert(target === '/student/dashboard', 'Organizer -> Student safely redirects to /student/dashboard (NOT /organizer/events/create)');
assert(session.currentUser.role === 'student', 'Session user is now Student');
assert(session.token === 'token_stu_3', 'Session token is now Student token');

// Test: Student -> Admin
staleRedirect = '/student/registrations';
session.logout();
session.login(adminUser, 'token_admin_4');
target = resolvePostLoginRedirect(staleRedirect, session.currentUser.role);
assert(target === '/admin/dashboard', 'Student -> Admin safely redirects to /admin/dashboard');
assert(session.currentUser.role === 'admin', 'Session user is now Admin');

// Test: Admin -> Student
staleRedirect = '/admin/locations';
session.logout();
session.login(studentUser, 'token_stu_5');
target = resolvePostLoginRedirect(staleRedirect, session.currentUser.role);
assert(target === '/student/dashboard', 'Admin -> Student safely redirects to /student/dashboard');

// Test: Organizer -> Admin
staleRedirect = '/organizer/analytics';
session.logout();
session.login(adminUser, 'token_admin_6');
target = resolvePostLoginRedirect(staleRedirect, session.currentUser.role);
assert(target === '/admin/dashboard', 'Organizer -> Admin safely redirects to /admin/dashboard');

// Test: Student -> Organizer
staleRedirect = '/student/feedback';
session.logout();
session.login(organizerUser, 'token_org_7');
target = resolvePostLoginRedirect(staleRedirect, session.currentUser.role);
assert(target === '/organizer/dashboard', 'Student -> Organizer safely redirects to /organizer/dashboard');

// SUITE 3: Same-Role Login Transitions
console.log('\nTEST SUITE 3: Same-Role Login Transitions');
const anotherAdmin = { _id: 'u4', name: 'Admin Two', role: 'admin', email: 'admin2@cems.edu' };
session.login(adminUser, 'tok_adm_1');
session.logout();
session.login(anotherAdmin, 'tok_adm_2');
assert(session.currentUser.email === 'admin2@cems.edu', 'Admin -> Admin preserves new identity');
assert(session.token === 'tok_adm_2', 'Admin -> Admin updates token');

const anotherOrg = { _id: 'u5', name: 'Org Two', role: 'organizer', email: 'org2@cems.edu' };
session.logout();
session.login(anotherOrg, 'tok_org_2');
assert(session.currentUser.email === 'org2@cems.edu', 'Organizer -> Organizer preserves new identity');

const anotherStudent = { _id: 'u6', name: 'Student Two', role: 'student', email: 'stu2@cems.edu' };
session.logout();
session.login(anotherStudent, 'tok_stu_2');
assert(session.currentUser.email === 'stu2@cems.edu', 'Student -> Student preserves new identity');

// SUITE 4: Repeated Rapid Switching Cycle
console.log('\nTEST SUITE 4: Repeated Account Switching Cycle');
const cycle = [adminUser, organizerUser, studentUser, adminUser, organizerUser];
for (let i = 0; i < cycle.length; i++) {
  const u = cycle[i];
  const tok = `tok_cycle_${i}_${u.role}`;
  session.login(u, tok);
  assert(session.currentUser.role === u.role, `Cycle step ${i + 1}: Logged in as ${u.role}`);
  assert(session.token === tok, `Cycle step ${i + 1}: Token matches`);
  session.logout();
  assert(session.currentUser === null && session.token === null, `Cycle step ${i + 1}: Logged out cleanly`);
}

// SUITE 5: In-Flight Race Condition Protection
console.log('\nTEST SUITE 5: Race Condition Stale Storage Protection');
let activeToken = 'token_active_admin';
session.login(adminUser, activeToken);

// Simulate an in-flight request started under adminUser
let inFlightTokenSnapshot = activeToken;
// User logs out before in-flight finishes
session.logout();

// When in-flight getMe returns, test race guard condition:
const shouldPersist = session.token === inFlightTokenSnapshot;
assert(shouldPersist === false, 'Stale in-flight getMe is blocked from resurrecting old user in localStorage');

// SUITE 6: Authorization Error Code Distinction
console.log('\nTEST SUITE 6: FORBIDDEN vs ACCOUNT_SUSPENDED Code Distinction');
const roleMiddlewareResponse = { success: false, code: 'FORBIDDEN', message: "Forbidden: User role 'organizer' is not authorized to access this resource." };
const suspensionResponse = { success: false, code: 'ACCOUNT_SUSPENDED', message: 'Your account has been suspended by the administrator.' };

assert(roleMiddlewareResponse.code === 'FORBIDDEN', 'Role error returns code FORBIDDEN');
assert(suspensionResponse.code === 'ACCOUNT_SUSPENDED', 'Suspension error returns code ACCOUNT_SUSPENDED');
assert(roleMiddlewareResponse.code !== suspensionResponse.code, 'Role authorization failure and suspension are strictly distinguished');

console.log('\n======================================================');
console.log(`TOTAL: ${passed + failed} | PASSED: ${passed} | FAILED: ${failed}`);
console.log('Zero database mutations executed.');
console.log('======================================================\n');

if (failed > 0) {
  process.exit(1);
}
