const { ok, methodNotAllowed, asyncHandler } = require("../../../lib/response");

export default asyncHandler(async function logout(req, res) {
  if (req.method !== "POST") return methodNotAllowed(res);
  return ok(res, {}, "Logged out");
});

