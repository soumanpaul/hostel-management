import * as SQLite from 'expo-sqlite';

export type StudentStatus = 'active' | 'inactive';
export type RoomStatus = 'occupied' | 'vacant' | 'maintenance';

export type Student = {
  id: string;
  fullName: string;
  mobile: string;
  email: string | null;
  roomNumber: string | null;
  roomType: string | null;
  checkInDate: string;
  status: StudentStatus;
};

export type Room = {
  id: string;
  number: string;
  type: string;
  monthlyRent: number;
  status: RoomStatus;
  occupantName: string | null;
};

export type Invoice = {
  id: string;
  invoiceNumber: string;
  studentName: string;
  roomNumber: string | null;
  dueDate: string;
  totalAmount: number;
  paidAmount: number;
  status: 'pending' | 'paid' | 'overdue' | 'cancelled';
};

export type DashboardSummary = {
  totalStudents: number;
  occupiedRooms: number;
  vacantRooms: number;
  monthlyRevenue: number;
  pendingAmount: number;
};

export type NewStudentInput = {
  fullName: string;
  mobile: string;
  email?: string;
  roomId?: string;
};

const DATABASE_NAME = 'rabgyals-hostel.db';
const DATABASE_VERSION = 1;

let databasePromise: Promise<SQLite.SQLiteDatabase> | null = null;

export async function getDatabase() {
  databasePromise ??= SQLite.openDatabaseAsync(DATABASE_NAME);
  return databasePromise;
}

export async function initializeDatabase() {
  const db = await getDatabase();
  await db.execAsync('PRAGMA foreign_keys = ON;');

  const versionRow = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version;');
  const currentVersion = versionRow?.user_version ?? 0;

  if (currentVersion < 1) {
    await migrateToVersionOne(db);
  }

  return db;
}

async function migrateToVersionOne(db: SQLite.SQLiteDatabase) {
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS app_meta (
      key TEXT PRIMARY KEY NOT NULL,
      value TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS rooms (
      id TEXT PRIMARY KEY NOT NULL,
      number TEXT NOT NULL UNIQUE,
      type TEXT NOT NULL,
      monthly_rent INTEGER NOT NULL,
      status TEXT NOT NULL DEFAULT 'vacant'
        CHECK (status IN ('occupied', 'vacant', 'maintenance')),
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS students (
      id TEXT PRIMARY KEY NOT NULL,
      full_name TEXT NOT NULL,
      mobile TEXT NOT NULL,
      email TEXT,
      room_id TEXT,
      check_in_date TEXT NOT NULL DEFAULT CURRENT_DATE,
      status TEXT NOT NULL DEFAULT 'active'
        CHECK (status IN ('active', 'inactive')),
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (room_id) REFERENCES rooms(id)
    );

    CREATE TABLE IF NOT EXISTS invoices (
      id TEXT PRIMARY KEY NOT NULL,
      student_id TEXT NOT NULL,
      invoice_number TEXT NOT NULL UNIQUE,
      due_date TEXT NOT NULL,
      total_amount INTEGER NOT NULL,
      paid_amount INTEGER NOT NULL DEFAULT 0,
      status TEXT NOT NULL DEFAULT 'pending'
        CHECK (status IN ('pending', 'paid', 'overdue', 'cancelled')),
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (student_id) REFERENCES students(id)
    );

    CREATE TABLE IF NOT EXISTS invoice_items (
      id TEXT PRIMARY KEY NOT NULL,
      invoice_id TEXT NOT NULL,
      label TEXT NOT NULL,
      amount INTEGER NOT NULL,
      FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS backups (
      id TEXT PRIMARY KEY NOT NULL,
      provider TEXT NOT NULL,
      remote_file_id TEXT,
      status TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `);

  await seedInitialData(db);
  await db.execAsync(`PRAGMA user_version = ${DATABASE_VERSION};`);
}

async function seedInitialData(db: SQLite.SQLiteDatabase) {
  const rooms = [
    ['room-101', '101', 'Single Room', 7500, 'occupied'],
    ['room-102', '102', 'Single Room', 7500, 'occupied'],
    ['room-103', '103', 'Single Room', 7500, 'occupied'],
    ['room-104', '104', 'Single Room', 7500, 'occupied'],
    ['room-201', '201', 'Double Sharing', 4500, 'occupied'],
    ['room-202', '202', 'Double Sharing', 4500, 'occupied'],
    ['room-203', '203', 'Double Sharing', 4500, 'vacant'],
  ] as const;

  for (const [id, number, type, monthlyRent, status] of rooms) {
    await db.runAsync(
      `INSERT OR IGNORE INTO rooms (id, number, type, monthly_rent, status)
       VALUES (?, ?, ?, ?, ?);`,
      id,
      number,
      type,
      monthlyRent,
      status
    );
  }

  const students = [
    ['student-rahul', 'Rahul Sharma', '9876543210', 'rahulsharma@example.com', 'room-101'],
    ['student-aman', 'Aman Verma', '9876543211', 'amanverma@example.com', 'room-102'],
    ['student-vikas', 'Vikas Singh', '9876543212', 'vikassingh@example.com', 'room-103'],
    ['student-rohit', 'Rohit Kumar', '9876543213', 'rohitkumar@example.com', 'room-104'],
    ['student-pooja', 'Pooja Singh', '9876543214', 'poojasingh@example.com', 'room-201'],
    ['student-neha', 'Neha Kumari', '9876543215', 'nehakumari@example.com', 'room-202'],
  ] as const;

  for (const [id, fullName, mobile, email, roomId] of students) {
    await db.runAsync(
      `INSERT OR IGNORE INTO students (id, full_name, mobile, email, room_id, check_in_date, status)
       VALUES (?, ?, ?, ?, ?, '2024-01-01', 'active');`,
      id,
      fullName,
      mobile,
      email,
      roomId
    );
  }

  await db.runAsync(
    `INSERT OR IGNORE INTO invoices
      (id, student_id, invoice_number, due_date, total_amount, paid_amount, status)
     VALUES (?, ?, ?, ?, ?, ?, ?);`,
    'invoice-1205',
    'student-rahul',
    'INV-2024-1205',
    '2024-06-01',
    7500,
    0,
    'pending'
  );
}

export async function getDashboardSummary(): Promise<DashboardSummary> {
  const db = await initializeDatabase();
  const students = await db.getFirstAsync<{ count: number }>(
    "SELECT COUNT(*) AS count FROM students WHERE status = 'active';"
  );
  const occupiedRooms = await db.getFirstAsync<{ count: number }>(
    "SELECT COUNT(*) AS count FROM rooms WHERE status = 'occupied';"
  );
  const vacantRooms = await db.getFirstAsync<{ count: number }>(
    "SELECT COUNT(*) AS count FROM rooms WHERE status = 'vacant';"
  );
  const monthlyRevenue = await db.getFirstAsync<{ amount: number | null }>(
    "SELECT SUM(monthly_rent) AS amount FROM rooms WHERE status = 'occupied';"
  );
  const pendingAmount = await db.getFirstAsync<{ amount: number | null }>(
    "SELECT SUM(total_amount - paid_amount) AS amount FROM invoices WHERE status != 'paid';"
  );

  return {
    totalStudents: students?.count ?? 0,
    occupiedRooms: occupiedRooms?.count ?? 0,
    vacantRooms: vacantRooms?.count ?? 0,
    monthlyRevenue: monthlyRevenue?.amount ?? 0,
    pendingAmount: pendingAmount?.amount ?? 0,
  };
}

export async function getStudents(): Promise<Student[]> {
  const db = await initializeDatabase();
  const rows = await db.getAllAsync<{
    id: string;
    full_name: string;
    mobile: string;
    email: string | null;
    room_number: string | null;
    room_type: string | null;
    check_in_date: string;
    status: StudentStatus;
  }>(`
    SELECT
      students.id,
      students.full_name,
      students.mobile,
      students.email,
      rooms.number AS room_number,
      rooms.type AS room_type,
      students.check_in_date,
      students.status
    FROM students
    LEFT JOIN rooms ON rooms.id = students.room_id
    ORDER BY rooms.number IS NULL, rooms.number, students.full_name;
  `);

  return rows.map((row) => ({
    id: row.id,
    fullName: row.full_name,
    mobile: row.mobile,
    email: row.email,
    roomNumber: row.room_number,
    roomType: row.room_type,
    checkInDate: row.check_in_date,
    status: row.status,
  }));
}

export async function getRooms(): Promise<Room[]> {
  const db = await initializeDatabase();
  const rows = await db.getAllAsync<{
    id: string;
    number: string;
    type: string;
    monthly_rent: number;
    status: RoomStatus;
    occupant_name: string | null;
  }>(`
    SELECT
      rooms.id,
      rooms.number,
      rooms.type,
      rooms.monthly_rent,
      rooms.status,
      students.full_name AS occupant_name
    FROM rooms
    LEFT JOIN students ON students.room_id = rooms.id AND students.status = 'active'
    ORDER BY rooms.number;
  `);

  return rows.map((row) => ({
    id: row.id,
    number: row.number,
    type: row.type,
    monthlyRent: row.monthly_rent,
    status: row.status,
    occupantName: row.occupant_name,
  }));
}

export async function getInvoices(): Promise<Invoice[]> {
  const db = await initializeDatabase();
  const rows = await db.getAllAsync<{
    id: string;
    invoice_number: string;
    student_name: string;
    room_number: string | null;
    due_date: string;
    total_amount: number;
    paid_amount: number;
    status: Invoice['status'];
  }>(`
    SELECT
      invoices.id,
      invoices.invoice_number,
      students.full_name AS student_name,
      rooms.number AS room_number,
      invoices.due_date,
      invoices.total_amount,
      invoices.paid_amount,
      invoices.status
    FROM invoices
    INNER JOIN students ON students.id = invoices.student_id
    LEFT JOIN rooms ON rooms.id = students.room_id
    ORDER BY invoices.created_at DESC;
  `);

  return rows.map((row) => ({
    id: row.id,
    invoiceNumber: row.invoice_number,
    studentName: row.student_name,
    roomNumber: row.room_number,
    dueDate: row.due_date,
    totalAmount: row.total_amount,
    paidAmount: row.paid_amount,
    status: row.status,
  }));
}

export async function addStudent(input: NewStudentInput) {
  const db = await initializeDatabase();
  const studentId = `student-${Date.now()}`;
  const cleanEmail = input.email?.trim() || null;
  const cleanRoomId = input.roomId?.trim() || null;

  await db.withExclusiveTransactionAsync(async (tx) => {
    await tx.runAsync(
      `INSERT INTO students (id, full_name, mobile, email, room_id, status)
       VALUES (?, ?, ?, ?, ?, 'active');`,
      studentId,
      input.fullName.trim(),
      input.mobile.trim(),
      cleanEmail,
      cleanRoomId
    );

    if (cleanRoomId) {
      await tx.runAsync("UPDATE rooms SET status = 'occupied' WHERE id = ?;", cleanRoomId);
    }
  });
}

export async function createDatabaseSnapshot() {
  const db = await initializeDatabase();
  const [rooms, students, invoices, invoiceItems] = await Promise.all([
    db.getAllAsync('SELECT * FROM rooms ORDER BY number;'),
    db.getAllAsync('SELECT * FROM students ORDER BY created_at;'),
    db.getAllAsync('SELECT * FROM invoices ORDER BY created_at;'),
    db.getAllAsync('SELECT * FROM invoice_items ORDER BY id;'),
  ]);

  return {
    app: 'rabgyals-hostel',
    schemaVersion: DATABASE_VERSION,
    exportedAt: new Date().toISOString(),
    tables: {
      rooms,
      students,
      invoices,
      invoiceItems,
    },
  };
}

export async function recordBackup(remoteFileId: string | null, status: 'success' | 'failed') {
  const db = await initializeDatabase();
  await db.runAsync(
    `INSERT INTO backups (id, provider, remote_file_id, status)
     VALUES (?, 'google-drive', ?, ?);`,
    `backup-${Date.now()}`,
    remoteFileId,
    status
  );
}
