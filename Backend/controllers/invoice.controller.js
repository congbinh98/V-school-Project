const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const axios = require('axios');
require('dotenv').config();


const instance = axios.create({
    baseURL: process.env.thanhatURL

});
// save invocie from thanhat
module.exports.saveFromThanhhat = async(req, response) => {
        try {
            const schoolLogin = await prisma.school.findUnique({ where: { accountId: req.user.id } });
            const month = req.body.MONTH;
            // danh sach invoidID trong DB
            var invoicesDB = [];
            var invoiceFromDB = await prisma.invoice.findMany({ select: { id: true } });
            for (let index = 0; index < invoiceFromDB.length; index++) {
                const element = invoiceFromDB[index];
                invoicesDB.push(element);
            }
            // danh sách các invoidID từ thanhNhat
            var invoicesTN = [];
            const res = await instance.post('/api/banks/nhan1truong', {
                    MST: schoolLogin.MST,
                    THANG: month
                }, global.options)
                .catch(function(error) {
                    console.log("Lấy dữ liệu thanhat thất bại!")
                    console.log(error.response.data)
                })
                // data invoice cua thanhnhat theo MST tháng hiện tại
            const invoicesFromTN = res.data.data;
            if (invoicesFromTN.length === 0) {
                return response.status(400).json({ ok: false, message: "Chưa có hóa đơn trên hệ thống!" })
            } else {
                invoicesFromTN.forEach(element => {
                    invoicesTN.push(element);
                });
            }
            // lúc này invoicesTN sẽ có tất cả các invoice trên thanhat

            // setInvoicesId là set các invoice có trong db
            const setInvoicesId = new Set(invoicesDB.map(x => x.id));
            // xóa các invoice mà invoiceID đã có trong DB
            invoicesTN = invoicesTN.filter(val => !setInvoicesId.has(val.INVOIDID));
            console.log(invoicesTN.length)
            if (invoicesTN.length === 0) {
                return response.json({ ok: false, message: "Không có hóa đơn mới nào!" })
            } else {
                var saveData = null;
                var i = 0;
                while (i < invoicesTN.length) {
                    saveData = await prisma.invoice.create({
                        data: {
                            id: invoicesTN[i].INVOIDID,
                            MST: invoicesTN[i].MST,
                            classCode: `${invoicesTN[i].MALOP}`,
                            className: invoicesTN[i].TENLOP,
                            schoolName: invoicesTN[i].TENTRUONG,
                            name: invoicesTN[i].HOTEN,
                            month: month,
                            description: invoicesTN[i].NOIDUNG,
                            ammount: invoicesTN[i].SOTIEN,
                            tel1: invoicesTN[i].TEL1,
                            tel2: invoicesTN[i].TEL2,
                            updateDate: invoicesTN[i].NGAYTHU,
                            bank: invoicesTN[i].NHTHU,
                            BHYT: invoicesTN[i].MABHYT,
                            note: invoicesTN[i].GHICHU
                        },
                    })
                    i++;
                }
                if (!saveData) {
                    return response.status(404).json({ ok: false, message: "Lưu hóa đơn thất bại!" })
                }
                return response.json({ ok: true, message: "Lưu hóa đơn tháng " + month + " thành công!" })
            }
        } catch (error) {
            console.log(error);
            return response.status(404).json({ ok: false, message: "Something went wrong" })
        } finally {
            async() =>
            await prisma.$disconnect()
        }
    }
    // order by name
async function objSortFunction(field, sort) {
    try {
        var objSort;
        switch (field) {
            case 'bhyt':
                objSort = {
                    "BHYT": sort === 'asc' ? 'asc' : 'desc',
                }
                break;
            case 'name':
                objSort = {
                    "name": sort === 'asc' ? 'asc' : 'desc',
                }
                break;
            case 'classCode':
                objSort = {
                    "classCode": sort === 'asc' ? 'asc' : 'desc',
                }
                break;
            case 'amount':
                objSort = {
                    "amount": sort === 'asc' ? 'asc' : 'desc',
                }
                break;
            default:
                break;
        }
        return objSort;
    } catch (error) {
        console.log(error);
        return null;
    } finally {
        async() =>
        await prisma.$disconnect()
    }
}