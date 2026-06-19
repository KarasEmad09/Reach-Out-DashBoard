const bcrypt = require('bcrypt');
const { getDb } = require('./db');

const SALT_ROUNDS = 10;

async function seed() {
  const db = getDb();

  // Clear existing data for fresh seed
  db.exec('DELETE FROM activity_log; DELETE FROM notifications; DELETE FROM notes; DELETE FROM tasks; DELETE FROM deals; DELETE FROM customers; DELETE FROM users;');

  const superAdminHash = await bcrypt.hash('SuperAdmin@123', SALT_ROUNDS);
  const adminHash = await bcrypt.hash('Admin@123', SALT_ROUNDS);
  const agent1Hash = await bcrypt.hash('Agent@123', SALT_ROUNDS);
  const agent2Hash = await bcrypt.hash('Agent@123', SALT_ROUNDS);

  const insertUser = db.prepare(
    'INSERT INTO users (name, email, password_hash, role, manager_id, avatar) VALUES (?,?,?,?,?,?)'
  );

  insertUser.run('Sara Superadmin', 'superadmin@saleshub.local', superAdminHash, 'super_admin', null, 'S');
  const adm = insertUser.run('Ahmed Admin', 'admin@saleshub.local', adminHash, 'admin', null, 'A');
  const adminId = adm.lastInsertRowid;
  insertUser.run('Aya Agent', 'agent@saleshub.local', agent1Hash, 'agent', adminId, 'A');
  const agent1Id = db.prepare("SELECT id FROM users WHERE email = 'agent@saleshub.local'").get().id;
  insertUser.run('Mohamed Agent', 'agent2@saleshub.local', agent2Hash, 'agent', adminId, 'M');
  const agent2Id = db.prepare("SELECT id FROM users WHERE email = 'agent2@saleshub.local'").get().id;

  const insertCust = db.prepare(
    `INSERT INTO customers (name, email, phone, company, source, status, lifecycle, assigned_agent_id, created_by, last_contact_date, next_follow_up_date)
     VALUES (?,?,?,?,?,?,?,?,?,?,?)`
  );

  const agents = [agent1Id, agent2Id];
  const allCustomers = [
    // New Leads (5)
    ['Ahmed Hassan', 'ahmed.hassan@email.com', '201001234567', 'TechCorp Egypt', 'Facebook Ads', 'New Lead', 'lead', agents[0], adminId, '2026-06-15', '2026-06-25'],
    ['Nour Ibrahim', 'nour.ibrahim@email.com', '201001112233', 'Nile Solutions', 'Website Form', 'New Lead', 'lead', agents[1], adminId, '2026-06-16', '2026-06-26'],
    ['Youssef Ali', 'youssef.ali@email.com', '201005556677', null, 'Cold Outreach', 'New Lead', 'lead', agents[0], adminId, '2026-06-14', '2026-06-24'],
    ['Layla Samir', 'layla.samir@email.com', '201009998877', 'Delta Tech', 'Instagram Ads', 'New Lead', 'lead', agents[1], adminId, '2026-06-17', '2026-06-27'],
    ['Tarek Mahmoud', 'tarek.mahmoud@email.com', '201006665544', null, 'WhatsApp', 'New Lead', 'lead', agents[0], adminId, '2026-06-13', '2026-06-23'],
    // Interested Customers (4)
    ['Mona Youssef', 'mona.youssef@email.com', '201002223344', 'Cloud Egypt', 'Website Form', 'Interested Customer', 'prospect', agents[0], adminId, '2026-06-16', '2026-06-24'],
    ['Hassan Khaled', 'hassan.khaled@email.com', '201003334455', 'Smart Systems', 'LinkedIn', 'Interested Customer', 'prospect', agents[1], adminId, '2026-06-15', '2026-06-25'],
    ['Fatma Adel', 'fatma.adel@email.com', '201004445566', null, 'Referral', 'Interested Customer', 'prospect', agents[0], adminId, '2026-06-14', '2026-06-22'],
    ['Omar Nabil', 'omar.nabil@email.com', '201005556600', 'Alpha Corp', 'Facebook Ads', 'Interested Customer', 'prospect', agents[1], adminId, '2026-06-17', '2026-06-27'],
    // Hot Leads (3)
    ['Karim Adel', 'karim.adel@email.com', '201006667788', null, 'Referral', 'Hot Lead', 'prospect', agents[0], adminId, '2026-06-17', '2026-06-22'],
    ['Salma Hassan', 'salma.hassan@email.com', '201007778899', 'Nile Tech', 'WhatsApp', 'Hot Lead', 'prospect', agents[1], adminId, '2026-06-16', '2026-06-21'],
    ['Ramy Ezzat', 'ramy.ezzat@email.com', '201008889900', 'Digital Hub', 'Website Form', 'Hot Lead', 'prospect', agents[0], adminId, '2026-06-18', '2026-06-23'],
    // Follow Ups (3)
    ['Sara Fathy', 'sara.fathy@email.com', '201009990011', 'Nile Tech', 'LinkedIn', 'Follow Up', 'active_customer', agents[0], adminId, '2026-06-14', '2026-06-28'],
    ['Mahmoud Samy', 'mahmoud.samy@email.com', '201001100022', 'Future Vision', 'Instagram Ads', 'Follow Up', 'active_customer', agents[1], adminId, '2026-06-15', '2026-06-29'],
    ['Dina Hani', 'dina.hani@email.com', '201002200033', null, 'Manual Entry', 'Follow Up', 'active_customer', agents[0], adminId, '2026-06-13', '2026-06-27'],
    // Won Deals (3)
    ['Omar Sherif', 'omar.sherif@email.com', '201003300044', 'Delta Corp', 'WhatsApp', 'Won Deal', 'active_customer', agents[0], adminId, '2026-06-10', null],
    ['Heba Magdy', 'heba.magdy@email.com', '201004400055', 'Innova Solutions', 'Facebook Ads', 'Won Deal', 'active_customer', agents[1], adminId, '2026-06-08', null],
    ['Amr Farouk', 'amr.farouk@email.com', '201005500066', 'TechVision', 'LinkedIn', 'Won Deal', 'active_customer', agents[0], adminId, '2026-06-05', null],
    // Lost Deals (2)
    ['Nadia Kamel', 'nadia.kamel@email.com', '201006600077', 'SoftWare House', 'Cold Outreach', 'Lost Deal', 'inactive', agents[1], adminId, '2026-06-12', null],
    ['Hany Osman', 'hany.osman@email.com', '201007700088', null, 'Website Form', 'Lost Deal', 'inactive', agents[0], adminId, '2026-06-11', null]
  ];

  const customerIds = [];
  for (const c of allCustomers) {
    const r = insertCust.run(...c);
    customerIds.push(r.lastInsertRowid);
  }

  // Seed deals for Won/Lost/Interested/Hot customers
  const insertDeal = db.prepare(
    'INSERT INTO deals (customer_id, title, value, stage, assigned_agent_id, product_purchased) VALUES (?,?,?,?,?,?)'
  );
  insertDeal.run(customerIds[15], 'Enterprise Plan', 15000, 'Won Deal', agents[0], 'Annual Subscription');
  insertDeal.run(customerIds[16], 'Pro Package', 22000, 'Won Deal', agents[1], 'Premium Bundle');
  insertDeal.run(customerIds[17], 'Starter Kit', 8000, 'Won Deal', agents[0], 'Basic Plan');
  insertDeal.run(customerIds[18], 'Custom Solution', 12000, 'Lost Deal', agents[1], null);
  insertDeal.run(customerIds[19], 'Consulting Package', 9500, 'Lost Deal', agents[0], null);
  insertDeal.run(customerIds[5], 'Starter Package', 5000, 'Interested Customer', agents[0], null);
  insertDeal.run(customerIds[10], 'Premium Plan', 18000, 'Hot Lead', agents[0], null);
  insertDeal.run(customerIds[6], 'Cloud Migration', 7500, 'Interested Customer', agents[1], null);

  // Seed tasks
  const insertTask = db.prepare(
    'INSERT INTO tasks (title, description, due_date, status, priority, customer_id, assigned_to, assignee_name, created_by) VALUES (?,?,?,?,?,?,?,?,?)'
  );
  const now = '2026-06-19';
  insertTask.run('Send proposal to Ahmed Hassan', 'Prepare and send the project proposal', '2026-06-22', 'todo', 'high', customerIds[0], agents[0], 'Aya Agent', adminId);
  insertTask.run('Follow up with Karim Adel', 'Call to discuss requirements', '2026-06-21', 'in_progress', 'urgent', customerIds[10], agents[0], 'Aya Agent', adminId);
  insertTask.run('Onboard Omar Sherif', 'Send welcome package and schedule training', '2026-06-30', 'todo', 'medium', customerIds[15], agents[0], 'Aya Agent', adminId);
  insertTask.run('Demo call with Hassan Khaled', 'Schedule product demonstration', '2026-06-20', 'todo', 'high', customerIds[6], agents[1], 'Mohamed Agent', adminId);
  insertTask.run('Prepare contract for Heba Magdy', 'Draft and review contract terms', '2026-06-25', 'in_progress', 'high', customerIds[16], agents[1], 'Mohamed Agent', adminId);
  insertTask.run('Review lost deal with Nadia Kamel', 'Analyze why deal was lost and document', '2026-06-23', 'todo', 'medium', customerIds[18], agents[1], 'Mohamed Agent', adminId);
  insertTask.run('Check in with Nour Ibrahim', 'Follow up on initial interest', '2026-06-19', 'done', 'medium', customerIds[1], agents[1], 'Mohamed Agent', adminId);
  insertTask.run('Phone call with Salma Hassan', 'Discuss hot lead requirements', '2026-06-19', 'todo', 'urgent', customerIds[11], agents[1], 'Mohamed Agent', adminId);

  // Seed notes
  const insertNote = db.prepare(
    'INSERT INTO notes (customer_id, author_id, type, content) VALUES (?,?,?,?)'
  );
  insertNote.run(customerIds[0], agents[0], 'note', 'Initial contact made via Facebook. Ahmed is interested in the enterprise solution.');
  insertNote.run(customerIds[0], agents[0], 'note', 'Ahmed requested pricing for 50+ seats. Follow up with a tailored proposal.');
  insertNote.run(customerIds[6], agents[1], 'note', 'Mona requested a demo of the cloud package. She has budget approval for Q3.');
  insertNote.run(customerIds[10], agents[0], 'question', 'Karim asked about pricing for multiple licenses. Also wants to know about support SLA.');
  insertNote.run(customerIds[15], agents[0], 'note', 'Deal closed successfully. Omar signed the annual contract.');
  insertNote.run(customerIds[16], agents[1], 'note', 'Heba is happy with the product. Sent welcome email and onboarding schedule.');
  insertNote.run(customerIds[18], agents[1], 'note', 'Nadia chose a competitor due to pricing. We were 15% higher.');

  // Seed notifications
  const insertNotif = db.prepare(
    'INSERT INTO notifications (user_id, message, is_read) VALUES (?,?,?)'
  );
  insertNotif.run(agents[0], 'New customer Ahmed Hassan added', 0);
  insertNotif.run(agents[0], 'Task "Send proposal to Ahmed Hassan" due soon', 0);
  insertNotif.run(agents[0], 'Karim Adel moved to Hot Lead', 1);
  insertNotif.run(agents[1], 'New customer Nour Ibrahim added', 0);
  insertNotif.run(agents[1], 'Demo call with Hassan Khaled scheduled for tomorrow', 0);
  insertNotif.run(adminId, 'System seeded with 20 customers', 1);

  // Seed activity log
  const insertActivity = db.prepare(
    'INSERT INTO activity_log (user_id, action, target_table, target_id, details) VALUES (?,?,?,?,?)'
  );
  for (let i = 0; i < 5; i++) {
    insertActivity.run(adminId, 'create', 'customers', customerIds[i], JSON.stringify({ name: allCustomers[i][0] }));
  }

  console.log('Seed complete: 3 users, 20 customers, 8 deals, 8 tasks, 7 notes, 6 notifications.');
}

module.exports = { seed };
