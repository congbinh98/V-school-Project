const { body, validationResult } = require('express-validator');
require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

module.exports.checkFormUpdate = [

    body('email')
    .isLength({ min: 1 })
    .withMessage('Email không để trống!')
    .isEmail().withMessage('Sai form email!')
    .custom(async(value, { req }) => {
        const loginSchool = await prisma.school.findUnique({
            where: { accountId: req.user.id },
            select: {
                account: {
                    select: {
                        email: true
                    }
                }
            }
        });
        email = await prisma.account.findUnique({ where: { email: value }, select: { email: true } });
        if ((value !== loginSchool.account.email) && email) {
            throw new Error('Email đã được sử dụng!');
        }
    }),
    body('MST')
    .isLength({ min: 1 })
    .withMessage('MST không để trống!')
    .custom(async(value, { req }) => {
        const loginSchool = await prisma.school.findUnique({
            where: { accountId: req.user.id },
            select: {
                MST: true
            }
        });
        mst = await prisma.school.findUnique({ where: { MST: value }, select: { MST: true } })
        if ((value !== loginSchool.MST) && mst) {
            throw new Error('MST đã được sử dụng!');
        }
    }),
    body('phone')
    .isLength({ min: 1 })
    .withMessage('Số điện thoại không để trống!')
    .custom(async(value, { req }) => {
        const loginSchool = await prisma.school.findUnique({
            where: { accountId: req.user.id },
            select: {
                phone: true
            }
        });
        phone = await prisma.school.findUnique({ where: { phone: value }, select: { phone: true } })
        if ((value !== loginSchool.phone) && phone) {
            throw new Error('Số điện thoại đã được sử dụng!');
        }
    }),
    body('address').isLength({ min: 1 }).withMessage('Địa chỉ không để trống!'),
]


module.exports.checkFormResetPass = [
    body('oldPassword')
    .isLength({ min: 6 })
    .withMessage('Mật khẩu cũ phải từ 6 ký tự!')
    .custom(async(value, { req }) => {
        const loginSchool = await prisma.school.findUnique({
            where: { accountId: req.user.id },
            select: {
                account: {
                    select: {
                        password: true
                    }
                }
            }
        });
        if (value !== loginSchool.account.password) {
            throw new Error('Mật khẩu không đúng!');
        }
    }),
    body('newPassword')
    .isLength({ min: 6 })
    .withMessage('Mật khẩu mới phải từ 6 ký tự!')
    .custom(async(value, { req }) => {
        if (value === req.body.oldPassword) {
            throw new Error('Mật khẩu mới trùng với mật khẩu cũ!');
        }
    }),
    body('confirmPassword')
    .custom(async(value, { req }) => {
        if (value !== req.body.newPassword) {
            throw new Error('Xác nhận mật khẩu không đúng!');
        }
    }),

]

module.exports.checkForError = function(req, res, next) {
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