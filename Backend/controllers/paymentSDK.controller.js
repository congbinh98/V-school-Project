const { PrismaClient } = require('@prisma/client');
const { throws } = require('assert');
const prisma = new PrismaClient();
require('dotenv').config();
const crypto = require('crypto');

module.exports.verifyData = async function(req, res) {
    try {
        var billcode = req.body.billcode;
        var merchant_code = req.body.merchant_code;
        var order_id = req.body.order_id;
        var check_sum = req.body.check_sum;

        var error_code = "01";

        if (!(billcode === order_id)) {
            return res.status(400).json({
                error_code: error_code
            });
        }
        // find merchant code in DB
        const merchant = await prisma.merchant_code_key.findUnique({ where: { merchant_code: merchant_code } });
        if (!merchant) {
            return res.status(400).json({
                error_code: error_code
            });
        }

        // check bill active
        const bill = await prisma.bill.findUnique({
            where: { id: order_id }
        })
        if (bill) {
            if (!(bill.status === "pending")) {
                return res.status(400).json({
                    error_code: error_code
                });
            }
        } else {
            return res.status(400).json({
                error_code: error_code
            });
        }

        // check total bill 
        var totalBill = bill.amount;
        const listInvoice = await prisma.invoice_mapping.findMany({
            where: {
                billId: bill.id
            }
        });

        //find invoice da thu
        var listInvoiceDathu = [];
        for (let index = 0; index < listInvoice.length; index++) {
            let invoice = await prisma.invoice.findUnique({
                where: {
                    id: listInvoice[index].invoiceId,
                },
            });
            if (invoice.updateDate) {
                listInvoiceDathu.push(invoice.id)
            }
            totalBill = totalBill - invoice.ammount;
        }

        if (!(totalBill === 0)) {
            return res.status(400).json({
                error_code: error_code
            });
        };

        if (!(listInvoiceDathu.length === 0)) {
            return res.status(400).json({
                error_code: error_code
            });
        };

        const trans = await prisma.transaction.findUnique({
                where: { billcode: billcode }
            })
            // object merchant code
            // check match check_sum
        var data = merchant.access_code + trans.billcode + merchant.merchant_code + trans.order_id +
            trans.amount;
        console.log(data);
        console.log(crypto.createHmac('SHA1', merchant.hash_key).update(data).digest('base64'));
        if (check_sum === String(crypto.createHmac('SHA1', merchant.hash_key).update(data).digest('base64'))) {
            error_code = "00";
        } else {
            //sai checksum tra ve 02
            error_code = "02";
        }
        if (error_code === "00") {
            data = merchant.access_code + trans.billcode + error_code + merchant_code + trans.order_id +
                trans.amount;
            var check_sum_result = crypto.createHmac('SHA1', merchant.hash_key).update(data).digest('base64');
            res.json({
                billcode: trans.billcode,
                error_code: error_code,
                merchant_code: merchant.merchant_code,
                order_id: trans.order_id,
                trans_amount: trans.amount,
                check_sum: check_sum_result
            });
        } else {
            return res.status(400).json({
                error_code: error_code
            });
        }
    } catch (error) {
        console.log(error)
        res.status(500).json({
            error_code: "03"
        });

    } finally {
        async() =>
        await prisma.$disconnect()
    }
}
