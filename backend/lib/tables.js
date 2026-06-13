const mongoose = require("mongoose");
const Table = require("../models/Table");

function buildTableQuery(value) {
  const conditions = [{ number: value }, { token: value }];
  if (mongoose.Types.ObjectId.isValid(value)) {
    conditions.unshift({ _id: value });
  }
  return { $or: conditions };
}

function findTable(value) {
  return Table.findOne(buildTableQuery(value));
}

function generateAccessCode() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

function getAccessCode(req) {
  return String(
    req.body?.accessCode ||
    req.query?.accessCode ||
    req.headers["x-table-access-code"] ||
    ""
  ).trim();
}

function hasValidAccess(table, accessCode) {
  if (table.status !== "occupied" || !table.accessCode) return true;
  return String(table.accessCode) === String(accessCode || "").trim();
}

module.exports = { buildTableQuery, findTable, generateAccessCode, getAccessCode, hasValidAccess };
