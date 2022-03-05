const axios = require('axios')
require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const instance = axios.create({
    baseURL: process.env.thanhatURL

});

module.exports.getTokenThanhat = async(req, response) => {
    try {
        const token = await instance.post('/api/parterauthentication', {
            username: process.env.usernameTN,
            password: process.env.passwordTN
        })
        global.options = {
            headers: {
                "Token": token.data.token
            }
        }
    } catch (error) {
        console.log(error);
        return;

    }

}

module.exports.merchantGetInvoicesSuccess = async(req, res) => {
    try {
        const mst = req.body.MST;
        const ngaythu = req.body.NGAYTHU;
        const invoices = await prisma.invoice.findMany({
            where: {
                AND: [
                    { MST: mst },

                    {
                        updateDate: ngaythu
                    }
                ]
            },
            select: {
                id: true,
                ammount: true,
                BHYT: true
            }
        });
        if (!invoices) {
            return res.status(404).json({ ok: false, message: "Something went wrong" })
        }
        if (!invoices.length > 0) {
            return res.json({ ok: false, message: "Không có hóa đơn nào" });
        }
        return res.json({ ok: true, data: invoices });
    } catch (error) {
        console.log(error);
        return res.status(404).json({ ok: false, message: "Something went wrong" })
    } finally {
        async() =>
        await prisma.$disconnect()
    }
}