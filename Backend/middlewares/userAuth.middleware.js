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
