const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/auth-middleware');
const { Posts } = require('../models');
const { Op } = require('sequelize');

// 게시글 생성 API
router.post('/posts', authMiddleware, async (req, res) => {
  const { userId, nickname } = res.locals.user;
  const { title, content } = req.body;
  try {
    // validation
    // 데이터 형식 검증
    if (!title || !content) {
      return res
        .status(412)
        .json({ errorMessage: '데이터 형식이 올바르지 않습니다.' });
    }
    // 쿠키 존재여부
    if (!userId || !nickname) {
      return res
        .status(403)
        .json({ errorMessage: '로그인이 필요한 기능입니다.' });
    }
    // 쿠키 만료 or 비정상적인 전달
    // => 이 부분은 잘 모르겠습니다. auth-middleware에서 이미 검증한 것 아닌가요?
    // 게시글의 제목이 string타입인지 검증
    if (typeof title !== String) {
      return res
        .status(412)
        .json({ errorMessage: '게시글 제목의 형식이 일치하지 않습니다.' });
    }
    // 게시글의 내용이 string타입인지 검증
    if (typeof content !== String) {
      return res
        .status(412)
        .json({ errorMessage: '게시글 내용의 형식이 일치하지 않습니다.' });
    }
    const post = await Posts.create({
      UserId: userId,
      nickname: nickname,
      title,
      content,
    });
    return res.status(201).json({ data: post });
  } catch (err) {
    // 예외 케이스 에러
    console.err(error);
    res.status(400).json({ errorMessage: '게시글 작성에 실패하였습니다.' });
  }
});

// 게시글 조회 API
router.get('/posts', authMiddleware, async (req, res) => {
  try {
    const posts = await Posts.findAll({
      attributes: [
        'postId',
        'UserId',
        'nickname',
        'title',
        'createdAt',
        'updatedAt',
      ],
      // mongoose쓸때와 다른 점
      // Posts.find({}).sort({-createdAt}).exec()
      // map을 사용하여 데이터 객체를 다시 생성
      order: [['createdAt', 'DESC']],
    });

    return res.status(200).json({ data: posts });
  } catch (err) {
    console.log(err);
    res.status(400).json({ errorMessage: '게시글 조회에 실패하였습니다.' });
  }
});

// 게시글 상세조회 API
router.get('/posts/:postId', authMiddleware, async (req, res) => {
  try {
    const { postId } = req.params;
    const post = await Posts.findOne({
      attributes: [
        'postId',
        'UserId',
        'nickname',
        'title',
        'content',
        'createdAt',
        'updatedAt',
      ],
      // mongoose쓸때와 다른 점
      // const result = Posts.findOne({postId})
      // res.status(200).json({postId: result.postId ... })
      where: { postId },
    });

    return res.status(200).json({ data: post });
  } catch (err) {
    console.log(err);
    res.status(400).json({ errorMessage: '게시글 조회에 실패하였습니다.' });
  }
});
// 게시글 수정 API
router.put('/posts/:postId', authMiddleware, async (req, res) => {
  const { postId } = req.params;
  const { title, content } = req.body;
  const { nickname } = res.locals.user;
  const user = await Posts.findOne({ where: { postId } });
  try {
    // 게시글이 존재하지 않을 경우
    if (!postId) {
      return res
        .status(404)
        .json({ errorMessage: '게시글이 존재하지 않습니다.' });
    }
    // body에 아무 내용이 없을 경우
    if (!title || !content) {
      return res
        .status(412)
        .json({ errorMessage: '데이터 형식이 올바르지 않습니다.' });
    }
    // 제목에 아무 내용이 없을 경우
    if (typeof title !== 'string') {
      return res
        .status(412)
        .json({ errorMessage: '게시글 제목의 형식이 올바르지 않습니다.' });
    }
    // 내용에 아무 내용이 없을 경우
    if (typeof content !== 'string') {
      return res
        .status(412)
        .json({ errorMessage: '게시글 내용의 형식이 올바르지 않습니다.' });
    }
    // 수정하려는 유저의 닉네임과 작성자의 닉네임이 일치하지 않을경우
    if (nickname !== user.nickname) {
      return res
        .status(403)
        .json({ errorMessage: '게시글 수정의 권한이 존재하지 않습니다.' });
    }
    // cookie가 존재하지 않을 경우
    if (!nickname) {
      return res
        .status(403)
        .json({ errorMessage: '게시글 수정의 권한이 존재하지 않습니다.' });
    }
    // cookie가 비정상적이거나 만료된 경우 => 모르겠습니다.
    // 실제로 수정하는 부분
    // update() 메서드는 수정된 레코드의 수를 반환하며 배열 형태로 반환
    const [updatePost] = await Posts.update(
      { title, content },
      {
        where: {
          // sequelize의 기능, where절에서 and(&&)를 사용할 수 있다.
          [Op.and]: [{ postId }, { nickname: nickname }],
        },
      }
    );
    // 게시글 수정
    if (updatePost > 0) {
      return res.status(200).json({ message: '게시글을 수정하였습니다.' });
    } else {
      // 게시글 수정이 실패한 경우
      res
        .status(401)
        .json({ errorMessage: '게시글이 정상적으로 수정되지 않았습니다.' });
    }
  } catch (err) {
    // 예외 케이스에서 처리하지 못한 에러
    console.log(err);
    res.status(400).json({ errorMessage: '게시글 수정에 실패하였습니다.' });
  }
});
// 게시글 삭제 API
router.delete('/posts/:postId', authMiddleware, async (req, res) => {
  const { postId } = req.params;
  const { nickname } = res.locals.user;
  const user = await Posts.findOne({ where: { postId } });
  try {
    if (!postId) {
      return res
        .status(404)
        .json({ errorMessage: '게시글이 존재하지 않습니다.' });
    }
    if (nickname !== user.nickname) {
      return res
        .status(403)
        .json({ errorMessage: '게시글 삭제의 권한이 존재하지 않습니다.' });
    }
    // cookie가 존재하지 않을 경우
    if (!nickname) {
      return res
        .status(403)
        .json({ errorMessage: '로그인이 필요한 경우입니다.' });
    }
    // 게시글 삭제
    // mongoose에서는 Posts.deleteOne을 사용했다.
    // destroy()메서드는 삭제된 레코드의 수를 반환한다.
    // 이 값은 단일 숫자(integer). 따라서 반환값을 배열 분할 대입
    // 없이 직접 변수에 할당할 수 있다.
    const destroyPost = await Posts.destroy({
      where: {
        [Op.and]: [{ postId }, { nickname: nickname }],
      },
    });

    // 게시글 삭제 res
    if (destroyPost > 0) {
      return res.status(200).json({ message: '게시글을 삭제하였습니다.' });
    } else {
      // 게시글 삭제 실패
      res
        .status(401)
        .json({ errorMessage: '게시글이 정상적으로 삭제되지 않았습니다.' });
    }
  } catch (err) {
    console.log(err);
    res.status(400).json({ errorMessage: '게시글 삭제에 실패하였습니다.' });
  }
});
module.exports = router;
