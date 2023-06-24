const express = require('express');
const router = express.Router();
const { Users, UserInfos } = require('../models');
const jwt = require('jsonwebtoken');

// 회원가입 API
router.post('/users', async (req, res) => {
  const { nickname, password, confirm } = req.body;
  const isExistUser = await Users.findOne({
    where: {
      nickname: nickname,
    },
  });
  try {
    // Validation 작업
    // 닉네임 중복확인
    if (isExistUser) {
      return res.status(412).json({ errorMessage: '중복된 닉네임입니다.' });
    }
    // 닉네임 형식이 비정상적인 경우
    if (nickname.length < 3 || nickname.match(/^[A-Za-z0-9]+$/)) {
      return res
        .status(412)
        .json({ errorMessage: '닉네임의 형식이 일치하지 않습니다.' });
    }
    // password와 confirm 일치하지 않는 경우
    if (password !== confirm) {
      return res
        .status(412)
        .json({ errorMessage: '패스워드가 일치하지 않습니다.' });
    }
    // password 형식이 비정상적인 경우 or 닉네임이 포함된 경우
    if (password.length < 4 || password === nickname) {
      return res.status(412).json({
        errorMessage:
          '패스워드의 형식이 일치하지 않거나 닉네임이 포함되어 있습니다.',
      });
    }
    const user = await Users.create({ nickname, password });
    return res.status(201).json({ message: '회원가입이 완료되었습니다.' });
  } catch (err) {
    console.err(err);
    res
      .status(400)
      .json({ errorMessage: '요청한 데이터 형식이 올바르지 않습니다.' });
  }
});

// 로그인 기능 API
router.post('/login', async (req, res) => {
  const { nickname, password } = req.body;
  const user = await Users.findOne({
    where: { nickname },
  });
  // validation
  // nickname 확인
  if (!user) {
    return res
      .status(401)
      .json({ message: '해당하는 사용자가 존재하지 않습니다.' });
  } else if (user.password !== password) {
    // 비밀번호 확인
    return res.status(401).json({ message: '비밀번호가 일치하지 않습니다.' });
  }

  // jwt 생성 => 쿠키 발급 => response 할당
  const token = jwt.sign(
    {
      userId: user.userId,
    },
    'customized_secret_key'
  );
  // 쿠키 발급
  res.cookie('authorization', `Bearer ${token}`);
  // response 할당
  return res.status(200).json({ messga: '로그인에 성공하였습니다.' });
});

module.exports = router;
