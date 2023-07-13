const jwt = require("jsonwebtoken");
const secret_config = require("./secret");
const jwtMiddleware = function (req, res, next) {
  // read the token from header or url
  const token = req.headers["x-access-token"] || req.query.token;
  // token does not exist
  if (!token) {
    return res.status(403).json({
      isSuccess: false,
      code: 403,
      message: "로그인이 되어 있지 않습니다.",
    });
  }
  // 토큰이 있는 경우, 토큰 검증
  try {
    const verifiedToken = jwt.verify(token, secret_config.jwtsecret);
    req.verifiedToken = verifiedToken;
    next();
  } catch {
    res.status(403).json({
      isSuccess: false,
      code: 403,
      message: "토큰 검증 실패",
    });
  }
};

module.exports = jwtMiddleware;
