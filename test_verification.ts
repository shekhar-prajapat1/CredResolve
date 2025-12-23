import fetch from 'node-fetch';

const API_URL = 'http://localhost:3000';

async function runTest() {
    console.log('--- Starting Verification ---');
    const timestamp = Date.now();
    const randomName = (prefix: string) => `${prefix}_${Math.floor(Math.random() * 1000)}`;

    // 1. Create Users
    const u1Name = randomName('UserA');
    const u1Res = await fetch(`${API_URL}/users`, {
        method: 'POST',
        body: JSON.stringify({ name: u1Name, email: `${u1Name.toLowerCase()}@test.com`, mobile: '1234567890' }),
        headers: { 'Content-Type': 'application/json' }
    });
    const u1 = await u1Res.json();
    console.log(`User 1 Created (${u1.name}):`, u1);

    const u2Name = randomName('UserB');
    const u2Res = await fetch(`${API_URL}/users`, {
        method: 'POST',
        body: JSON.stringify({ name: u2Name, email: `${u2Name.toLowerCase()}@test.com`, mobile: '0987654321' }),
        headers: { 'Content-Type': 'application/json' }
    });
    const u2 = await u2Res.json();
    console.log(`User 2 Created (${u2.name}):`, u2);

    const u3Name = randomName('UserC');
    const u3Res = await fetch(`${API_URL}/users`, {
        method: 'POST',
        body: JSON.stringify({ name: u3Name, email: `${u3Name.toLowerCase()}@test.com` }),
        headers: { 'Content-Type': 'application/json' }
    });
    const u3 = await u3Res.json();
    console.log(`User 3 Created (${u3.name}):`, u3);


    // 2. Create Group
    const gRes = await fetch(`${API_URL}/groups`, {
        method: 'POST',
        body: JSON.stringify({ name: 'Trip', memberIds: [u1.id, u2.id, u3.id] }),
        headers: { 'Content-Type': 'application/json' }
    });
    const group = await gRes.json();
    console.log('Group Created:', group);

    // 3. Add Expense (Equal Split)
    // Alice pays 300, split equally (100 each)
    const e1Res = await fetch(`${API_URL}/expenses`, {
        method: 'POST',
        body: JSON.stringify({
            groupId: group.group.id,
            payerId: u1.id,
            amount: 300,
            description: 'Lunch',
            splitType: 'EQUAL',
            splits: [{ userId: u1.id }, { userId: u2.id }, { userId: u3.id }]
        }),
        headers: { 'Content-Type': 'application/json' }
    });
    console.log('Expense 1 (Equal) Added:', await e1Res.json());


    // 4. Add Expense (Exact Split)
    // Bob pays 100, Alice owes 30, Charlie owes 70 (Bob owes 0 to self logic implicitly handled if not in split? No, usually payer is owed.
    // Wait, splits define who OWES. If payer is not in splits, they just paid.
    // Split logic: Payer paid Total. Splits define who consumed what.
    // Own share: If payer consumed, they should be in splits? Yes.
    // Let's assume Bob pays 100. Alice owes 30, Charlie owes 70. Bob owes 0 (consumes 0 is uncommon but let's test).
    // Or: Bob pays 100. Bob consumes 50, Alice 50.
    const e2Res = await fetch(`${API_URL}/expenses`, {
        method: 'POST',
        body: JSON.stringify({
            groupId: group.group.id,
            payerId: u2.id,
            amount: 100,
            description: 'Taxi',
            splitType: 'EXACT',
            splits: [
                { userId: u2.id, amount: 50 },
                { userId: u1.id, amount: 50 }
            ]
        }),
        headers: { 'Content-Type': 'application/json' }
    });
    console.log('Expense 2 (Exact) Added:', await e2Res.json());

    // 4.5. Add Expense (Percentage Split)
    // Charlie pays 200. Split: Alice 20%, Bob 30%, Charlie 50%.
    // Amounts: A(40), B(60), C(100).
    // Net 3: C(+200-100=+100), A(-40), B(-60).
    const e3Res = await fetch(`${API_URL}/expenses`, {
        method: 'POST',
        body: JSON.stringify({
            groupId: group.group.id,
            payerId: u3.id,
            amount: 200,
            description: 'Drinks',
            splitType: 'PERCENTAGE',
            splits: [
                { userId: u1.id, percentage: 20 },
                { userId: u2.id, percentage: 30 },
                { userId: u3.id, percentage: 50 }
            ]
        }),
        headers: { 'Content-Type': 'application/json' }
    });
    console.log('Expense 3 (Percentage) Added:', await e3Res.json());

    // 4.6. Add Expense with Rounding (100 / 3)
    // Alice pays 100. Split equal (33.33, 33.33, 33.33, Total 99.99). Remainder 0.01 to first person.
    // Check if system handles it without crashing.
    const e4Res = await fetch(`${API_URL}/expenses`, {
        method: 'POST',
        body: JSON.stringify({
            groupId: group.group.id,
            payerId: u1.id,
            amount: 100,
            description: 'Rounding Check',
            splitType: 'EQUAL',
            splits: [
                { userId: u1.id },
                { userId: u2.id },
                { userId: u3.id }
            ]
        }),
        headers: { 'Content-Type': 'application/json' }
    });
    console.log('Expense 4 (Rounding) Added:', await e4Res.json());

    // 5. Get Balance
    // Expected:
    // Expense 1: Alice paid 300. Consumed: A(100), B(100), C(100).
    // Net 1: A(+200), B(-100), C(-100).
    // Expense 2: Bob paid 100. Consumed: B(50), A(50).
    // Net 2: B(+50), A(-50).
    // Total Net:
    // A: +200 - 50 = +150
    // B: -100 + 50 = -50
    // C: -100     = -100
    // Simplification:
    // Debtors: B(-50), C(-100)
    // Creditors: A(+150)
    // Match High Debt C(100) with A. C pays A 100. A rem: +50.
    // Match B(50) with A. B pays A 50. A rem: 0.
    // Transactions: C->A(100), B->A(50).

    const bRes = await fetch(`${API_URL}/groups/${group.group.id}/balance`);
    const balance = await bRes.json();
    console.log('Group Balance:', JSON.stringify(balance, null, 2));
}

runTest();
