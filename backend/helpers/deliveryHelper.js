// ─── deliveryHelper.js ────────────────────────────────────────────────────────
// Smart delivery date calculator
// Formula: Delivery Date = Order Date + Processing Days + Shipping Days
// Skips Sundays and public holidays

// ─── Shipping zones based on first digit of pincode ──────────────────────────
const SHIPPING_ZONES = {
    '6': { zone: 'South India',   days: 2 },   // TN, Kerala, Karnataka, AP
    '5': { zone: 'South India',   days: 2 },
    '4': { zone: 'West India',    days: 3 },   // Maharashtra, Gujarat
    '3': { zone: 'West India',    days: 3 },
    '1': { zone: 'North India',   days: 4 },   // Delhi, UP, HP
    '2': { zone: 'North India',   days: 4 },
    '7': { zone: 'East India',    days: 4 },   // West Bengal, Odisha
    '8': { zone: 'East India',    days: 4 },
    '9': { zone: 'Northeast',     days: 5 },   // Assam, NE states
};

// ─── Indian public holidays (add/update yearly) ───────────────────────────────
const PUBLIC_HOLIDAYS = [
    '2026-01-26',   // Republic Day
    '2026-08-15',   // Independence Day
    '2026-10-02',   // Gandhi Jayanti
    '2026-10-24',   // Dussehra (approx)
    '2026-11-12',   // Diwali (approx)
    '2026-12-25',   // Christmas
    '2026-01-14',   // Pongal
    '2026-04-14',   // Tamil New Year
    '2026-05-01',   // May Day
    '2025-01-26',
    '2025-08-15',
    '2025-10-02',
    '2025-12-25',
];

// ─── Order cut-off time: 5 PM IST ────────────────────────────────────────────
const CUTOFF_HOUR_IST = 17;   // 5 PM

// ─── Check if a date is a holiday ────────────────────────────────────────────
const isHoliday = (date) => {
    const dateStr = date.toISOString().split('T')[0];
    return PUBLIC_HOLIDAYS.includes(dateStr);
};

// ─── Check if a date is a working day (not Sunday, not holiday) ───────────────
const isWorkingDay = (date) => {
    const day = date.getDay();   // 0 = Sunday
    return day !== 0 && !isHoliday(date);
};

// ─── Add N working days to a date ────────────────────────────────────────────
const addWorkingDays = (startDate, days) => {
    let date = new Date(startDate);
    let added = 0;
    while (added < days) {
        date.setDate(date.getDate() + 1);
        if (isWorkingDay(date)) added++;
    }
    return date;
};

// ─── Get IST hour from current UTC time ──────────────────────────────────────
const getISTHour = () => {
    const now = new Date();
    const IST_OFFSET = 5.5 * 60 * 60 * 1000;
    const ist = new Date(now.getTime() + IST_OFFSET);
    return ist.getUTCHours();
};

// ─── MAIN FUNCTION ────────────────────────────────────────────────────────────
/**
 * getExpectedDelivery(pincode)
 * Returns: { deliveryDate, shippingDays, zone, note }
 */
const getExpectedDelivery = (pincode) => {
    const pin = String(pincode).trim();

    if (!/^\d{6}$/.test(pin)) {
        throw new Error('Invalid pincode. Must be exactly 6 digits.');
    }

    const firstDigit = pin[0];
    const zoneInfo   = SHIPPING_ZONES[firstDigit];

    if (!zoneInfo) {
        throw new Error('Pincode not serviceable.');
    }

    const { zone, days: shippingDays } = zoneInfo;

    // ── Processing day logic ──────────────────────────────────────────────
    const istHour = getISTHour();
    const now     = new Date();

    let processingDate = new Date(now);
    let note;

    if (istHour < CUTOFF_HOUR_IST) {
        // Before 5 PM → dispatches today if today is a working day
        if (!isWorkingDay(processingDate)) {
            // Today is Sunday/holiday — move to next working day
            processingDate = addWorkingDays(processingDate, 1);
            note = 'Today is a non-working day. Order will be dispatched on the next working day.';
        } else {
            note = `Order before 5 PM IST — dispatches today.`;
        }
    } else {
        // After 5 PM → next working day
        processingDate = addWorkingDays(processingDate, 1);
        note = 'Order placed after 5 PM IST — dispatches next working day.';
    }

    // ── Add shipping days (skipping Sundays + holidays) ───────────────────
    const deliveryDate = addWorkingDays(processingDate, shippingDays);

    return {
        deliveryDate,
        shippingDays,
        zone,
        note,
        dispatchDate: processingDate,
    };
};

// ─── Format date nicely ───────────────────────────────────────────────────────
const formatDate = (date) => {
    return date.toLocaleDateString('en-IN', {
        weekday: 'short',
        day:     'numeric',
        month:   'long',
        year:    'numeric',
    });
};

module.exports = { getExpectedDelivery, formatDate, isWorkingDay, addWorkingDays };