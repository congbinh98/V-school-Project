const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();


//get all
module.exports.getAll = async (req, res) => {
    try {
        var count = 0;
        // role la school thì chỉ xem dc thong tin truong do
        if (req.user.accRole === 'SCHOOL') {
            const school = await prisma.school.findUnique({ where: { accountId: req.user.id }, include: { account: true } });
            // ẩn password
            school.account.password = undefined;
            return res.json({ ok: true, data: school, message: "Lấy thông tin trường thành công!" });
        }
        // role superAdmin thì xem dc tất cả
        if (req.user.accRole === 'SUPERADMIN') {
            var page = parseInt(req.query.page) || 1;
            var limit = parseInt(req.query.limit) || 3;
            const schools = await prisma.school.findMany({
                skip: (page - 1) * limit,
                take: limit,
                include: { account: true }
            });
            if (!schools) {
                return res.status(400).json({ ok: false, message: "Không tìm thấy trường nào!" });
            }
            // ẩn password
            schools.forEach(element => {
                element.account.password = undefined;
            });
            // đếm số trường
            count = await prisma.school.count();
            return res.json({ ok: true, count: count, data: schools, message: "Lấy thông tin trường thành công!" });
        } else {
            console.log("Access denied");
            return res.status(404).json({ ok: false, message: "Access denied" })
        }
    } catch (error) {
        console.log(error);
        return res.status(404).json({ ok: false, message: "Something went wrong" })
    }
}

//get all no token
module.exports.getAllNoToken = async (req, res) => {
    try {
        var page = parseInt(req.query.page) || 1;
        var limit = parseInt(req.query.limit) || 10;
        const schools = await prisma.school.findMany({
            skip: (page - 1) * limit,
            take: limit,
            select: {
                id: true,
                account: {
                    select: {
                        name: true,     
                    }
                }
            }
        });

        if (!schools) {
            return res.status(400).json({ ok: false, message: "Không tìm thấy trường nào!" });
        }

        // đếm số trường
        count = await prisma.school.count();
        return res.json({ ok: true, count: count, data: schools, message: "Lấy thông tin trường thành công!" });

    } catch (error) {
        console.log(error);
        return res.status(500).json({ ok: false, message: "Something went wrong" })
    }
}
// get one by id
module.exports.getOne = async (req, res) => {
    try {
        // parent, school role chỉ xem dc một vài dữ liệu
        const id = parseInt(req.params.id);
        var schools = null;
        if (req.user.accRole === 'PARENT' || req.user.accRole === 'SCHOOL') {
            schools = await prisma.school.findUnique({
                where: { id: id },
                select: {
                    phone: true,
                    account: {
                        select: {
                            name: true,
                            email: true,
                            address: true,

                        }
                    }
                }
            });
            if (schools === null) {
                return res.status(400).json({ ok: false, message: "Không tìm thấy trường nào!" })
            }
            return res.json({ ok: true, data: schools, message: "Lấy thông tin trường thành công!" });
        }
        // superAdmin role thì xem được toàn bộ dữ liệu
        schools = await prisma.school.findUnique({ where: { id: id }, include: { account: true } });
        if (schools === null) {
            return res.status(400).json({ ok: false, message: "Không tìm thấy trường nào!" })
        }
        schools.account.password = undefined;
        return res.json({ ok: true, data: schools, message: "Lấy thông tin trường thành công!" });
    } catch (error) {
        console.log(error);
        return res.status(404).json({ ok: false, message: "Something went wrong" })
    }
}

// ban/unban
module.exports.setStatus = async (req, res) => {
    try {
        const status = req.query.status;
        if (status !== 'active' && status !== 'deactive') {
            return res.status(400).json({ ok: false, message: "Sai trạng thái!" })
        }
        const id = parseInt(req.params.id);
        const school = await prisma.school.findUnique({
            where: {
                id: id
            },
            select: {
                account: {
                    select: {
                        id: true,
                        status: true
                    }
                }
            }
        });
        if (!school) {
            return res.status(400).json({ ok: false, message: "Không tìm thấy trường nào!" })
        }
        if (status === school.account.status) {
            return res.status(400).json({ ok: false, message: `Trường này đã ${status.toUpperCase()} trước đó` })
        }
        await prisma.account.update({ where: { id: school.account.id }, data: { status: status.toUpperCase() } })
        return res.json({ ok: true, message: `${status.toUpperCase()} trường thành công!` });
    } catch (error) {
        console.log(error);
        return res.status(404).json({ ok: false, message: "Something went wrong" })
    }
}

// update one
module.exports.update = async (req, res) => {
    try {
        const body = req.body;
        const id = req.user.id;
        const school = await prisma.school.findUnique({
            where: { accountId: id },
            select: {
                accountId: true,
            }
        });
        if (!school) {
            return res.status(400).json({ ok: false, message: "Không tìm thấy trường nào!" })
        }
        await prisma.school.update({
            where: {
                accountId: id
            },
            data: {
                MST: body.MST,
                phone: body.phone,
            }
        });
        await prisma.account.update({
            where: { id: school.accountId },
            data: {
                email: body.email,
                address: body.address,
                note: body.note
            }
        })
        return res.json({ ok: true, message: `Cập nhật trường thành công!` });
    } catch (error) {
        console.log(error);
        return res.status(404).json({ ok: false, message: "Something went wrong" })
    }
}

// reset-password
module.exports.resetPassword = async (req, res) => {
    try {
        const newPassword = req.body.confirmPassword;
        await prisma.account.update({ where: { id: req.user.id }, data: { password: newPassword } })
        return res.json({ ok: true, message: `Cập nhật mật khẩu thành công!` });
    } catch (error) {
        console.log(error);
        return res.status(404).json({ ok: false, message: "Something went wrong" })
    }
}

