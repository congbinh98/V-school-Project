const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()
const jwt = require('jsonwebtoken')
require('dotenv').config();
const { body, validationResult } = require('express-validator');

module.exports.auth = async(req, res, next) => {
    let token;
    if (
        req.headers.authentication &&
        req.headers.authentication.startsWith("SPayment ")
    ) {
        token = req.headers.authentication.split("SPayment ")[1];
    } else {
        return res.status(401).json({ error: "UnAuthorized" });
    }

    try {
        const data = jwt.verify(token, process.env.secretOrKey);
        const user = await prisma.account.findUnique({
            where: {
                id: data.id
            },
        });

        var totalChild = null;

        if (user.accRole === "PARENT") {

            const parent = await prisma.parent.findUnique({
                where: {
                    accountId: user.id,
                },
            });
            // count child parent
            totalChild = await prisma.student.aggregate({
                where: {
                    parentId: parent.id,
                },
                count: {
                    id: true
                }
            });
        }
        if (user.accRole === "SCHOOL") {

            const school = await prisma.school.findUnique({
                where: {
                    accountId: user.id,
                },
            });
            // count child SCHOOL
            totalChild = await prisma.student.aggregate({
                where: {
                    schoolId: school.id,
                },
                count: {
                    id: true
                }
            });
        }

        if (user.accRole === "SUPERADMIN") {
            // count child ADMIN
            totalChild = await prisma.student.aggregate({
                count: {
                    id: true
                }
            });
        }

        if (!user) {
            throw new Error()
        }
        req.user = user;
        req.token = token;
        req.totalChild = totalChild.count.id;
        next()
    } catch (error) {
        res.status(403).json({ error: "UnAuthorized" })
    } finally {
        async() =>
        await prisma.$disconnect()
    }
};

module.exports.isSupperAdmin = async(req, res, next) => {
  try {
      if (!(req.user.accRole === "SUPERADMIN")) {
          throw new Error()
      }
      next();
  } catch (error) {
      res.status(403).json({ error: "Access denied" })
  }
};

module.exports.isSchool = async(req, res, next) => {
  try {
      if (!(req.user.accRole === "SCHOOL")) {
          throw new Error()
      }
      next()
  } catch (error) {
      res.status(403).json({ error: "Access denied" })
  }
};
module.exports.isParent = async(req, res, next) => {
  try {
      if (!(req.user.accRole === "PARENT")) {
          throw new Error()
      }
      next()
  } catch (error) {
      res.status(403).json({ error: "Access denied" })
  }
};

module.exports.checkEmailUpdate = [
  body('email')
  .custom(async(value, { req }) => {
      var emails = await prisma.account.findMany({ select: { email: true } });
      emails = emails.map(x => x.email);
      if ((value !== "") && emails.includes(value)) {
          throw new Error('Email đã được sử dụng!');
      }
  }),
  body('gender')
  .isIn(["UNKNOW", "MALE", "FEMALE", ""])
  .withMessage("Giới tính không hợp lệ"),
  body('address')
  .isLength({ min: 0 })
  .isLength({ min: 0, max: 50 }).withMessage('Địa chỉ quá dài'),
  body('name')
  .isLength({ min: 0, max: 30 }).withMessage('Tên quá dài'),
  body('age')
  .isLength({ min: 0, max: 3 }).withMessage('Tuổi không hợp lệ')

]

module.exports.checkUpdateProfile = function(req, res, next) {
  const simpleValidationResult = validationResult.withDefaults({
      formatter: (err) => err.msg,
  })
  const errors = simpleValidationResult(req);
  if (!errors.isEmpty()) {

      return res.status(400).json({
          ok: false,
          message: errors.mapped()
      })
  }
  next();
}
