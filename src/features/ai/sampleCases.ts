export interface SampleCase {
  title: string;
  code: string;
}

export const SAMPLE_CASES: SampleCase[] = [
  {
    title: 'basic — setTimeout với var',
    code: `// Lỗi cơ bản: for + var + setTimeout
for (var i = 0; i < 3; i++) {
  setTimeout(function() {
    console.log(i); // luôn in 3, 3, 3
  }, 100);
}`,
  },
  {
    title: 'basic — async không có try/catch',
    code: `// Lỗi cơ bản: async function không bắt lỗi
const db = { findUser: (id) => Promise.reject(new Error(\`User \${id} not found\`)) };

async function loadUser(id) {
  const user = await db.findUser(id); // không có try/catch — reject rơi ra ngoài
  return user;
}

loadUser(42).catch((err) => console.error("Unhandled in caller:", err.message));`,
  },
  {
    title: 'basic — callback thiếu return',
    code: `// Lỗi cơ bản: thiếu return trong error path
const db = { find: (id, cb) => cb(new Error("not found"), null) };

function getUser(id, callback) {
  db.find(id, function(err, user) {
    if (err) callback(err); // thiếu return!
    callback(null, user);   // gọi callback lần 2 — bug thấy rõ ở output bên dưới
  });
}

let callCount = 0;
getUser(1, (err, user) => {
  callCount++;
  console.log(\`callback call #\${callCount}:\`, err ? \`error: \${err.message}\` : user);
});`,
  },
  {
    title: 'basic — 3 await tuần tự độc lập',
    code: `// Lỗi cơ bản: 3 await không phụ thuộc nhau
const delay = (ms, value) => new Promise((r) => setTimeout(() => r(value), ms));
const db = {
  users:  { findById: (id) => delay(100, { id, name: "User " + id }) },
  orders: { find: (id) => [delay(100, "order-1"), delay(100, "order-2")] },
  reviews:{ find: (id) => [delay(100, "review-1")] },
};

async function getProfile(userId) {
  const start = Date.now();
  const user    = await db.users.findById(userId);
  const orders  = await Promise.all(db.orders.find(userId));
  const reviews = await Promise.all(db.reviews.find(userId));
  console.log(\`Sequential: \${Date.now() - start}ms (nên là ~300ms)\`);
  return { user, orders, reviews };
}

const result = await getProfile(1);
console.log("profile:", result);`,
  },
  {
    title: 'race_condition — db stock decrement',
    code: `// Race condition: concurrent stock decrement
let stockValue = 1; // chỉ còn 1 sản phẩm trong kho
const delay = (ms, value) => new Promise((r) => setTimeout(() => r(value), ms));
const db = {
  getStock: (id) => delay(50, stockValue),
  setStock: (id, v) => { stockValue = v; return delay(50); },
  createOrder: (o) => { console.log("order created:", o); return delay(10); },
};

async function purchaseItem(productId, userId) {
  const stock = await db.getStock(productId);
  if (stock <= 0) { console.error(\`user \${userId}: Out of stock\`); return; }

  // Race window: another request reads stock = 1 here trước khi setStock chạy xong
  await db.setStock(productId, stock - 1);
  await db.createOrder({ productId, userId });
}

// 2 request đồng thời — cả 2 đều đọc stock = 1, cả 2 đều mua được (bug!)
await Promise.all([
  purchaseItem("p1", "userA"),
  purchaseItem("p1", "userB"),
]);
console.log("stock còn lại:", stockValue, "(đáng lẽ phải là 0 hoặc báo hết hàng cho 1 người)");`,
  },
  {
    title: 'event_loop_blocking — readFileSync in loop',
    code: `// Event loop blocking: sync I/O inside async route
function busyWaitMs(ms) { const end = Date.now() + ms; while (Date.now() < end) {} }
const fs = { readFileSync: () => { busyWaitMs(50); return "{}"; } }; // giả lập sync I/O chặn CPU
const app = { get: (path, handler) => handler({ params: {} }, { json: (v) => console.log("response:", v) }) };

app.get('/config', async (req, res) => {
  const files = ['db.json', 'cache.json', 'auth.json'];
  const configs = {};
  const start = Date.now();

  for (const file of files) {
    // Blocks entire Node.js event loop! — mọi request khác phải chờ suốt vòng lặp này
    configs[file] = JSON.parse(fs.readFileSync(\`/config/\${file}\`));
  }

  console.log(\`Event loop bị block \${Date.now() - start}ms — không request nào khác xử lý được trong lúc này\`);
  res.json(configs);
});`,
  },
  {
    title: 'zalgo — sync/async mixed callback',
    code: `// Zalgo: callback sometimes sync, sometimes async
const cacheStore = new Map([[123, { id: 123, name: "cached user" }]]);
const cache = { has: (id) => cacheStore.has(id), get: (id) => cacheStore.get(id), set: (id, v) => cacheStore.set(id, v) };
const db = { findUser: (id, cb) => setTimeout(() => cb(null, { id, name: "db user" }), 50) };

function getUserData(userId, callback) {
  if (cache.has(userId)) {
    callback(null, cache.get(userId)); // sync path!
  } else {
    db.findUser(userId, function(err, user) {
      if (err) return callback(err);
      cache.set(userId, user);
      callback(null, user); // async path
    });
  }
}

// Caller assumes always async — broken when cache hits
console.log("before call (userId=123, đã có trong cache)");
getUserData(123, function(err, user) {
  console.log("callback fired:", user);
});
console.log("after call — vì cache hit nên dòng này chạy SAU callback, ngược thứ tự mong đợi!");`,
  },
  {
    title: 'resource_exhaustion — Promise.all unlimited',
    code: `// Resource exhaustion: Promise.all with N items — không giới hạn concurrency
let activeConnections = 0, maxConnections = 0;
const delay = (ms, value) => new Promise((r) => setTimeout(() => r(value), ms));
const db = { users: { findById: async (id) => {
  activeConnections++; maxConnections = Math.max(maxConnections, activeConnections);
  await delay(30, { id, email: \`user\${id}@mail.com\` });
  activeConnections--;
  return { id, email: \`user\${id}@mail.com\` };
}}};
const emailService = { send: (email) => delay(10) };
const allUserIds = Array.from({ length: 50 }, (_, i) => i + 1); // thu nhỏ từ 10000 để demo nhanh

async function sendBulkEmails(userIds) {
  // Fires ALL concurrent DB queries + HTTP calls cùng lúc — không giới hạn
  // Với 10000 user thật sẽ crash DB connection pool, exhausts memory
  const users = await Promise.all(
    userIds.map(id => db.users.findById(id))
  );

  await Promise.all(
    users.map(user => emailService.send(user.email))
  );
}

await sendBulkEmails(allUserIds);
console.log(\`Peak concurrent DB connections: \${maxConnections} (không có giới hạn — với 10000 user sẽ crash pool)\`);`,
  },
  {
    title: 'callback_hell — nested 4 levels deep',
    code: `// Callback hell: 4 levels of nesting
const db = {
  getOrder: (id, cb) => setTimeout(() => cb(null, { id, userId: 1, total: 99 }), 20),
  getUser: (id, cb) => setTimeout(() => cb(null, { id, card: "4242", email: "user@mail.com" }), 20),
};
const payment = { charge: (card, total, cb) => setTimeout(() => cb(null, { card, total, status: "charged" }), 20) };
const email = { send: (to, subject, cb) => setTimeout(() => cb(null), 20) };

function processOrder(orderId, callback) {
  db.getOrder(orderId, function(err, order) {
    if (err) return callback(err);
    db.getUser(order.userId, function(err, user) {
      if (err) return callback(err);
      payment.charge(user.card, order.total, function(err, charge) {
        if (err) return callback(err);
        email.send(user.email, "Order confirmed", function(err) {
          if (err) return callback(err);
          callback(null, { order, charge });
        });
      });
    });
  });
}

processOrder(1001, (err, result) => {
  console.log(err ? "error: " + err.message : "order processed:", result);
});`,
  },
  {
    title: 'missing_error_handler — stream pipe',
    code: `// Buffer leak: stream without error handler
// Fake stream tối giản để minh hoạ — pipe() không tự propagate lỗi
function fakeStream(name) {
  const listeners = {};
  return {
    on(event, cb) { listeners[event] = cb; return this; },
    pipe(dest) {
      // Giả lập lỗi xảy ra giữa chừng khi đọc file
      setTimeout(() => {
        if (listeners['error']) listeners['error'](new Error(name + ": file not found"));
        else console.error(\`UNCAUGHT in \${name} — không có .on('error'), lỗi bị nuốt mất, process có thể crash\`);
      }, 20);
      return dest;
    },
  };
}
const fs = { createReadStream: (path) => fakeStream("readStream(" + path + ")") };
const zlib = { createGzip: () => fakeStream("gzip") };
const app = { get: (path, handler) => handler({ params: { file: "report.csv" } }, { write: () => {}, end: () => {} }) };

app.get('/download/:file', (req, res) => {
  const readStream = fs.createReadStream(\`/data/\${req.params.file}\`);
  const gzip = zlib.createGzip();

  // No .on('error') handlers — stream error leaks memory
  // and crashes the process
  readStream.pipe(gzip).pipe(res);
});`,
  },
  {
    title: 'singleton_race — lazy init shared state',
    code: `// Race condition: lazy singleton initialization
let connectionsCreated = 0;
const delay = (ms, value) => new Promise((r) => setTimeout(() => r(value), ms));
const db = { connect: async () => { connectionsCreated++; const id = connectionsCreated; return delay(50, { id, query: () => delay(10, ["row1", "row2"]) }); } };
const app = { get: (path, handler) => handler({}, { json: (v) => console.log("response:", v) }) };

let dbConnection = null;

async function getConnection() {
  if (!dbConnection) {
    // Two concurrent requests both see null
    // Both call connect() → two connections created
    dbConnection = await db.connect();
  }
  return dbConnection;
}

const usersHandler = async (req, res) => {
  const conn = await getConnection();
  const users = await conn.query('SELECT * FROM users');
  res.json({ connId: conn.id, users });
};

// 2 request đồng thời — cả 2 đều thấy dbConnection === null lúc đầu
await Promise.all([app.get('/users', usersHandler), app.get('/users', usersHandler)]);
console.log(\`Tổng số connection đã tạo: \${connectionsCreated} (đáng lẽ phải là 1)\`);`,
  },
  {
    title: 'event_loop_ordering — nextTick vs setTimeout',
    code: `// Event loop ordering: wrong assumption about execution order
const process = { nextTick: (cb) => Promise.resolve().then(cb) }; // microtask, chạy TRƯỚC setTimeout (macrotask)

class DataLoader {
  constructor() {
    this.data = null;
    this.load();
  }

  load() {
    setTimeout(() => {
      this.data = { users: [1, 2, 3] };
    }, 0);
  }

  getData(callback) {
    // Assumes data is already loaded — wrong! nextTick chạy trước setTimeout(0)
    process.nextTick(() => callback(this.data));
  }
}

const loader = new DataLoader();
loader.getData(data => {
  try {
    console.log(data.users); // TypeError: data is null — nextTick chạy trước khi setTimeout gán data!
  } catch (err) {
    console.error("Bug xảy ra đúng như dự đoán:", err.message);
  }
});`,
  },
];
