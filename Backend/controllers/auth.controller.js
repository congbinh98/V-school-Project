const { PrismaClient } = require('@prisma/client');
const jwt = require('jsonwebtoken')
const validate = require('./validation');
const prisma = new PrismaClient();


module.exports.login = async (req, res) => {
    const { error } = validate.loginValidation(req.body);
    var role = req.body.role;
    var username = req.body.username;
    if (error) return res.status(400).send(error.details[0].message);
    var user = null;
    // check role
    if (role === 'PARENT') {
        const parent = await prisma.parent.findFirst({ where: { phone: username } });
        user = await checkLogin(parent, user, req, res);
    } else if (role === 'SCHOOL') {
        const school = await prisma.school.findFirst({ where: { MST: username } });
        user = await checkLogin(school, user, req, res);
    } else if (role === 'SUPERADMIN') {
        const superadmin = await prisma.super_admin.findFirst({ where: { userName: username } });
        user = await checkLogin(superadmin, user, req, res);
    } else {
        return res.status(400).json({ ok: false, message: "SAI ROLE" })
    }
    if (user) {
        // create and assign a token
        const token = jwt.sign({ id: user.id }, process.env.secretOrKey, {
            expiresIn: 28800,
        });
        res.setHeader("Authentication", token);
        res.status(200).json({
            ok: "true",
            data: { token: "SPayment " + token }
        });
    }


}

module.exports.profile = async (req, res) => {
    var id = req.user.id;
    if (id) {

        user = await prisma.account.findFirst({ where: { id }, include: { school: true, parent: true } });
        console.log(user);
        if (user.accRole === 'PARENT') {
            return res.json({
                ok: true,
                data: {
                    id: user.id,
                    name: user.name,
                    email: user.email,
                    password: user.password,
                    age: user.age,
                    address: user.address,
                    status: user.status,
                    createDate: user.createDate,
                    updateDate: user.updateDate,
                    accRole: user.accRole,
                    note: user.note,
                    gender: user.gender,
                    phone: user.parent.phone,
                    MST: user.parent.MST,
                    totalChild: req.totalChild
                },
                message: "lấy thông tin người dùng thành công"
            });
        }
        return res.json({
            ok: true,
            data: {
                id: user.id,
                name: user.name,
                email: user.email,
                password: user.password,
                age: user.age,
                address: user.address,
                status: user.status,
                createDate: user.createDate,
                updateDate: user.updateDate,
                accRole: user.accRole,
                note: user.note,
                gender: user.gender,
                phone: user.school.phone,
                MST: user.school.MST,
                totalChild: req.totalChild
            },
            message: "lấy thông tin người dùng thành công"
        });

    }

    return res.status(400).send({ ok: false, error: "không tồn tại người dùng" });
}

async function checkLogin(object, user, req, res) {
    try {
        if (!object) return res.status(400).json({ ok: false, message: 'Người dùng không tồn tại' });
        user = await prisma.account.findFirst({
            where: {
                id: object.accountId,
                password: req.body.password
            }
        });
        if (!user) {
            return res.status(400).json({ ok: false, message: 'Mật khẩu không đúng' });
        }
        return user;
    } catch (error) {
        return res.status(404).json({ ok: false, message: 'Some thing went wrong' });
    }
}

// update profile
module.exports.updateProfile = async (req, res) => {
    try {
        const body = req.body;
        const update = await prisma.account.update({
            where: { id: req.user.id },
            data: {
                email: body.email === '' ? req.user.email : body.email,
                name: body.name === '' ? req.user.name : body.name,
                age: body.age === '' ? req.user.age : body.age,
                address: body.address === '' ? req.user.address : body.address,
                gender: body.gender === '' ? req.user.gender : body.gender,
            }
        });
        if (!update) {
            return res.status(404).json({ ok: false, message: 'Cập nhật thất bại! Vui lòng thử lại sau' });
        }
        return res.json({ ok: true, message: 'Cập nhật thành công' });
    } catch (error) {
        console.log(error)
        return res.status(404).json({ ok: false, message: 'Some thing went wrong' });
    }
}