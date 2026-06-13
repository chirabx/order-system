function ok(res, data = {}, message = "操作成功", status = 200) {
  return res.status(status).json({
    success: true,
    message,
    data
  });
}

function fail(res, message = "操作失败", status = 400, details = null) {
  return res.status(status).json({
    success: false,
    message,
    details
  });
}

function setCors(res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Guest-Id, X-Guest-Name");
}

function methodNotAllowed(res) {
  res.setHeader("Allow", "GET,POST,PUT,PATCH,DELETE");
  return fail(res, "请求方法不被支持", 405);
}

function asyncHandler(handler) {
  return async (req, res) => {
    try {
      setCors(res);
      if (req.method === "OPTIONS") {
        res.status(204).end();
        return;
      }
      await handler(req, res);
    } catch (error) {
      console.error(error);
      return fail(res, error.message || "服务器内部错误", error.statusCode || 500);
    }
  };
}

module.exports = { ok, fail, methodNotAllowed, asyncHandler, setCors };
