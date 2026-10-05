/**
 * Business Rules and Constraints Verification Script
 * IMPORTANT: This runs completely in-memory with ZERO database writes.
 * Production MongoDB data remains 100% untouched.
 */
import {
  parseTimeRange,
  timeToMinutes,
  timesOverlap,
  calculateEventStatus,
  assertCanUpdateEvent,
  assertCanCancelEvent,
  assertCanDeleteEvent,
  assertCanRegister,
  getEventDateTimes,
} from '../utils/eventRules.js';

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

function assertThrows(fn, expectedCode, message) {
  try {
    fn();
    failed++;
    console.error(`  ✗ FAILED (Did not throw): ${message}`);
  } catch (err) {
    if (!expectedCode || err.statusCode === expectedCode) {
      passed++;
      console.log(`  ✓ ${message} [threw ${err.statusCode || 'error'}: "${err.message}"]`);
    } else {
      failed++;
      console.error(`  ✗ FAILED (Wrong status code ${err.statusCode}, expected ${expectedCode}): ${message}`);
    }
  }
}

console.log('\n========================================');
console.log('RUNNING CEMS BUSINESS RULES VERIFICATION');
console.log('========================================\n');

// 1. Time parsing and conversion
console.log('TEST SUITE 1: Time Parsing & Conversion');
const t1 = parseTimeRange('10:00 AM - 04:00 PM');
assert(t1.startTime === '10:00 AM' && t1.endTime === '04:00 PM', 'parseTimeRange splits interval correctly');
const t2 = parseTimeRange('01:30 PM');
assert(t2.startTime === '01:30 PM' && t2.endTime === '', 'parseTimeRange handles single time');
assert(timeToMinutes('10:00 AM') === 600, '10:00 AM converts to 600 minutes');
assert(timeToMinutes('01:30 PM') === 810, '01:30 PM converts to 810 minutes');
assert(timeToMinutes('12:00 AM') === 0, '12:00 AM converts to 0 minutes');
assert(timeToMinutes('12:00 PM') === 720, '12:00 PM converts to 720 minutes');

// 2. Overlap checks
console.log('\nTEST SUITE 2: Time Overlap Detection');
assert(timesOverlap('10:00 AM - 01:00 PM', '11:00 AM - 02:00 PM') === true, 'Overlapping slots detected');
assert(timesOverlap('10:00 AM - 12:00 PM', '01:00 PM - 03:00 PM') === false, 'Disjoint slots do not overlap');
assert(timesOverlap('10:00 AM - 12:00 PM', '12:00 PM - 02:00 PM') === false, 'Consecutive slots do not overlap');
assert(timesOverlap('10:00 AM', '10:00 AM') === true, 'Identical times overlap');

// 3. Automatic Status Calculation
console.log('\nTEST SUITE 3: Automatic Event Status Calculation');
const futureDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
const pastDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
const todayDate = new Date().toISOString();

assert(calculateEventStatus({ date: futureDate, time: '10:00 AM - 12:00 PM' }) === 'upcoming', 'Future event is "upcoming"');
assert(calculateEventStatus({ date: pastDate, time: '10:00 AM - 12:00 PM' }) === 'completed', 'Past event is "completed"');

// Critical: Cancelled events must stay cancelled!
assert(calculateEventStatus({ status: 'cancelled', date: futureDate, time: '10:00 AM - 12:00 PM' }) === 'cancelled', 'Cancelled future event stays "cancelled"');
assert(calculateEventStatus({ status: 'cancelled', date: pastDate, time: '10:00 AM - 12:00 PM' }) === 'cancelled', 'Cancelled past event stays "cancelled"');

// 4. Event Update Restrictions
console.log('\nTEST SUITE 4: Event Update Restrictions');
assertThrows(() => assertCanUpdateEvent({ date: pastDate, time: '10:00 AM' }), 403, 'Completed event update rejected');
assertThrows(() => assertCanUpdateEvent({ status: 'cancelled', date: futureDate, time: '10:00 AM' }), 403, 'Cancelled event update rejected');

// 5. Event Cancellation Restrictions
console.log('\nTEST SUITE 5: Event Cancellation Restrictions');
assertThrows(() => assertCanCancelEvent({ status: 'cancelled', date: futureDate, time: '10:00 AM' }), 400, 'Already cancelled event cancellation rejected');
assertThrows(() => assertCanCancelEvent({ date: pastDate, time: '10:00 AM' }), 400, 'Completed event cancellation rejected');

// 6. Event Deletion Restrictions
console.log('\nTEST SUITE 6: Event Deletion Restrictions');
assertThrows(() => assertCanDeleteEvent({ date: pastDate, time: '10:00 AM' }), 403, 'Completed event deletion rejected');

// 7. Registration Eligibility
console.log('\nTEST SUITE 7: Student Registration Constraints');
// Full capacity
assertThrows(
  () => assertCanRegister({
    event: { date: futureDate, time: '10:00 AM', capacity: 50, registrationDeadline: futureDate },
    registeredCount: 50,
  }),
  400,
  'Full capacity registration rejected'
);

// Concluded event
assertThrows(
  () => assertCanRegister({
    event: { date: pastDate, time: '10:00 AM', capacity: 50, registrationDeadline: pastDate },
    registeredCount: 10,
  }),
  400,
  'Concluded event registration rejected'
);

// Cancelled event
assertThrows(
  () => assertCanRegister({
    event: { status: 'cancelled', date: futureDate, time: '10:00 AM', capacity: 50, registrationDeadline: futureDate },
    registeredCount: 10,
  }),
  400,
  'Cancelled event registration rejected'
);

// Valid upcoming event with open seats
try {
  assertCanRegister({
    event: { date: futureDate, time: '10:00 AM', capacity: 50, registrationDeadline: futureDate },
    registeredCount: 20,
  });
  passed++;
  console.log('  ✓ Valid upcoming event registration allowed');
} catch (err) {
  failed++;
  console.error('  ✗ FAILED: Valid upcoming event was rejected:', err.message);
}

// 8. Location Capacity Constraints (Requirement 32)
console.log('\nTEST SUITE 8: Location Capacity Constraints');
import { assertLocationCapacity } from '../utils/eventRules.js';
assertThrows(
  () => assertLocationCapacity(120, 100),
  400,
  'Event capacity (120) exceeding location capacity (100) rejected'
);

try {
  assertLocationCapacity(80, 100);
  passed++;
  console.log('  ✓ Event capacity (80) within location capacity (100) permitted');
} catch (err) {
  failed++;
  console.error('  ✗ FAILED: Valid capacity was rejected:', err.message);
}

try {
  assertLocationCapacity(100, 100);
  passed++;
  console.log('  ✓ Event capacity exactly matching location capacity permitted');
} catch (err) {
  failed++;
  console.error('  ✗ FAILED: Exact match capacity was rejected:', err.message);
}

console.log('\n========================================');
console.log(`TOTAL: ${passed + failed} | PASSED: ${passed} | FAILED: ${failed}`);
console.log('Production MongoDB data was not modified.');
console.log('========================================\n');

if (failed > 0) {
  process.exit(1);
}
