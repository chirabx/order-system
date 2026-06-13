const { EventEmitter } = require("events");

const bus = global.orderSystemSseBus || new EventEmitter();
bus.setMaxListeners(500);
global.orderSystemSseBus = bus;

function normalizeRoom(room) {
  return String(room || "").trim();
}

function publish(room, event, payload) {
  const target = normalizeRoom(room);
  if (!target) return;
  bus.emit(target, {
    id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
    event,
    payload,
    at: new Date().toISOString()
  });
}

function publishMany(rooms, event, payload) {
  rooms.forEach((room) => publish(room, event, payload));
}

function writeEvent(res, message) {
  res.write(`id: ${message.id}\n`);
  res.write(`event: ${message.event}\n`);
  res.write(`data: ${JSON.stringify(message.payload)}\n\n`);
}

function subscribe(req, res, room) {
  const target = normalizeRoom(room);
  if (!target) {
    res.status(400).json({ success: false, message: "缺少 room 参数" });
    return;
  }

  res.writeHead(200, {
    "Content-Type": "text/event-stream; charset=utf-8",
    "Cache-Control": "no-cache, no-transform",
    Connection: "keep-alive",
    "X-Accel-Buffering": "no"
  });

  res.write("retry: 3000\n\n");
  writeEvent(res, {
    id: `${Date.now()}-connected`,
    event: "connected",
    payload: { room: target, message: "SSE 已连接" }
  });

  const listener = (message) => writeEvent(res, message);
  const heartbeat = setInterval(() => {
    res.write(`: heartbeat ${Date.now()}\n\n`);
  }, 25000);

  bus.on(target, listener);

  req.on("close", () => {
    clearInterval(heartbeat);
    bus.off(target, listener);
    res.end();
  });
}

module.exports = { publish, publishMany, subscribe };
