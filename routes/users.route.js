const express = require('express');
const router = express.Router();
const { Users, UserInfos } = require('../models');

// 회원가입 API
router.post('/users', async (req, res) => {
  const { email, password, name, age, gender, profileImage } = req.body;
  const isExistUser = await Users.findOne({
    where: {
      email: email,
    },
  });
  // Validation : 이메일 중복확인
  if (isExistUser) {
    return res
      .status(409)
      .json({ errorMessage: '이미 존재하는 이메일입니다.' });
  }

  // 사용자 테이블 삽입
  const user = await Users.create({ email, password });
  // 사용자 정보 테이블에 데이터를 삽입
  // 어떤 사용자의 사용자 정보인지 내용이 필요.
  await UserInfos.create({
    UserId: user.userId, // 현재 사용자 정보가 21번째 줄에서 생성한 userId 할당
    name,
    age,
    gender,
    profileImage,
  });

  return res.status(201).json({ message: '회원가입이 완료되었습니다.' });
});

// 로그인

module.exports = router;
