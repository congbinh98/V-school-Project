const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
require('dotenv').config();

module.exports.getOne = async function (req, res) {
    try {
        var id = req.params.id;
        var trans = await prisma.transaction.findUnique({
            where: { billcode: id }
        })

        if (!trans) {
            res.status(400).send({
                ok: false,
                error: "Không tìm thấy transaction!"
            });
        }
        res.json({ ok: true, message: "Get transaction successfully!", data: trans });
    }
    catch (error) {
        res.status(500).send({
            ok: false,
            error: "Something went wrong"
        });

    }

}