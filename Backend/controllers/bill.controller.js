const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
require('dotenv').config();
const crypto = require('crypto');
const axios = require('axios');
const { number } = require('joi');

const instance = axios.create({
    baseURL: process.env.thanhatURL

});

module.exports.findAll = async function(req, res) {
    try {
        const allBill = await prisma.bill.findMany({
            include: {
                bill_mapping_history: true,
            }
        });
        if (allBill.length === 0) {
            return res.status(400).json({ ok: false, message: "Không tìm thấy bill nào!" })
        }
        res.json({ ok: true, message: "Get all bills successfully!", data: allBill });
    } catch (error) {
        res.status(500).json({
            ok: false,
            message: "Some thing went wrong"
        });
    } finally {
        async() =>
        await prisma.$disconnect()
    }
}
