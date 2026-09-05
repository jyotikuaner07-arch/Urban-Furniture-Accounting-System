// User accounts, persisted in localStorage.
// Roles: admin | accountant | contact
// A "contact" user is additionally either a customer or a vendor.

const USERS_KEY = "uf_users";
const CURRENT_KEY = "uf_current_user";

export const ROLE_LABELS = {
  admin: "Admin",
  accountant: "Accountant",
  contact: "Contact",
};

export const CONTACT_TYPE_LABELS = {
  customer: "Customer",
  vendor: "Vendor",
};

// What each role is allowed to do — used for the access matrix on Profile.
export const ROLE_ACCESS = {
  admin: [
    "Create, modify and archive all master data",
    "Record every transaction type",
    "View and print all reports",
    "Full user management (create, edit, delete)",
  ],
  accountant: [
    "Create master data (contacts, products, accounts)",
    "Record transactions (orders, bills, invoices, payments)",
    "View and print all reports",
    "No user management access",
  ],
  contact: [
    "View only your own invoices or bills",
    "Make payments against your own documents",
    "No access to master data or reports",
  ],
};

function read() {
  try {
    return JSON.parse(localStorage.getItem(USERS_KEY)) || [];
  } catch {
    return [];
  }
}
function write(users) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

const newId = () => Math.random().toString(36).slice(2, 10);

export function seedUsers() {
  if (read().length > 0) return;
  write([
    {
      id: newId(), name: "Riya Admin", loginId: "admin01",
      email: "admin@urban.com", password: "Admin@123",
      role: "admin", contactType: null, avatar: null,
      mobile: "9812345670", city: "Ahmedabad", state: "Gujarat",
      joinedOn: "2026-01-15",
    },
    {
      id: newId(), name: "Kunal Accounts", loginId: "account01",
      email: "accounts@urban.com", password: "Acct@1234",
      role: "accountant", contactType: null, avatar: null,
      mobile: "9812345671", city: "Ahmedabad", state: "Gujarat",
      joinedOn: "2026-02-02",
    },
    {
      id: newId(), name: "Nimesh Pathak", loginId: "customer01",
      email: "nimesh@example.com", password: "Cust@1234",
      role: "contact", contactType: "customer", avatar: null,
      mobile: "9090090909", city: "Ahmedabad", state: "Gujarat",
      joinedOn: "2026-03-10",
    },
    {
      id: newId(), name: "Azure Furniture", loginId: "vendor01",
      email: "azure@example.com", password: "Vend@1234",
      role: "contact", contactType: "vendor", avatar: null,
      mobile: "8080080808", city: "Surat", state: "Gujarat",
      joinedOn: "2026-03-12",
    },
  ]);
}

export function getUsers() {
  return read();
}

export function registerUser(data) {
  const users = read();

  if (users.some((u) => u.loginId.toLowerCase() === data.loginId.toLowerCase()))
    return { ok: false, field: "loginId", message: "This Login ID is already taken." };

  if (users.some((u) => u.email.toLowerCase() === data.email.toLowerCase()))
    return { ok: false, field: "email", message: "This email is already registered." };

  const user = {
    id: newId(),
    name: data.name,
    loginId: data.loginId,
    email: data.email,
    password: data.password,
    role: data.role,
    contactType: data.role === "contact" ? data.contactType : null,
    avatar: data.avatar || null,
    mobile: data.mobile || "",
    city: data.city || "",
    state: data.state || "",
    joinedOn: new Date().toISOString().slice(0, 10),
  };
  users.push(user);
  write(users);
  return { ok: true, user };
}

// Admin CRUD — update
export function updateUser(id, changes) {
  const users = read();
  const idx = users.findIndex((u) => u.id === id);
  if (idx === -1) return { ok: false, message: "User not found." };

  if (changes.loginId &&
      users.some((u) => u.id !== id && u.loginId.toLowerCase() === changes.loginId.toLowerCase()))
    return { ok: false, message: "This Login ID is already taken." };

  if (changes.email &&
      users.some((u) => u.id !== id && u.email.toLowerCase() === changes.email.toLowerCase()))
    return { ok: false, message: "This email is already registered." };

  users[idx] = {
    ...users[idx],
    ...changes,
    contactType: (changes.role ?? users[idx].role) === "contact"
      ? (changes.contactType ?? users[idx].contactType)
      : null,
  };
  write(users);
  return { ok: true, user: users[idx] };
}

// Admin CRUD — delete
export function deleteUser(id) {
  const users = read();
  const target = users.find((u) => u.id === id);
  if (!target) return { ok: false, message: "User not found." };

  // Never allow deleting the last admin — that would lock everyone out.
  if (target.role === "admin" && users.filter((u) => u.role === "admin").length === 1)
    return { ok: false, message: "Cannot delete the only Admin account." };

  write(users.filter((u) => u.id !== id));
  return { ok: true };
}

export function findUser(identifier, password) {
  const id = identifier.trim().toLowerCase();
  return (
    read().find(
      (u) =>
        (u.loginId.toLowerCase() === id || u.email.toLowerCase() === id) &&
        u.password === password
    ) || null
  );
}

export function saveCurrentUser(user) {
  localStorage.setItem(CURRENT_KEY, JSON.stringify(user));
}
export function readCurrentUser() {
  try {
    return JSON.parse(localStorage.getItem(CURRENT_KEY)) || null;
  } catch {
    return null;
  }
}
export function clearCurrentUser() {
  localStorage.removeItem(CURRENT_KEY);
}