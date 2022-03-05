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

