const jwt = require('jsonwebtoken');
const { Users } = require('../models');

module.exports = async (req, res, next) => {
  const { authorization } = req.cookies;
  const [tokenType, token] = authorization.split(' ');
  try {
    if (tokenType !== 'Bearer') {
      return res
        .status(401)
        .json({ message: '토큰 타입이 일치하지 않습니다.' });
    }
    if (!token) {
      return res.status(401).json({ message: '토큰이 발급되지 않았습니다.' });
    }

    const decodedToken = jwt.verify(token, 'customized_secret_key');
    const userId = decodedToken.userId;
    const user = await Users.findOne({ where: { userId } });
    if (!user) {
      return res
        .status(401)
        .json({ message: '토큰 사용자가 존재하지 않습니다.' });
    }
    // Users 모델에서 유저 정보를 조회하여 nickname을 가져옴
    const { nickname } = user;
    // 인증을 거치면 res.locals.user에 userId와 nickname을 저장한다.
    res.locals.user = { userId, nickname };
    // 미들웨어를 지나가기 위한 메서드
    next();
  } catch (error) {
    return res.status(401).json({
      message: '비정상적인 요청입니다.',
    });
  }
};
