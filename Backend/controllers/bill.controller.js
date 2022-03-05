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

module.exports.findAllByToken = async function(req, res) {
  try {
      if (req.user.accRole === 'PARENT') {
          const parent = await prisma.parent.findUnique({
              where: { accountId: req.user.id }
          });
          var allBill = await prisma.bill.findMany({
              where: { parentId: parent.id },
              include: {
                  bill_mapping_history: true,
              }
          });
          if (allBill.length === 0) {
              res.status(400).json({ ok: false, message: "Không tìm thấy bill nào!" });
          }
          res.json({ ok: true, message: "Get all bills successfully!", data: allBill });
      }
      if (req.user.accRole === 'SCHOOL') {
          const school = await prisma.school.findUnique({
              where: { accountId: req.user.id }
          });
          const allBill = await prisma.bill.findMany({
              where: { MST: school.MST },
              include: {
                  bill_mapping_history: true,
              }
          });
          if (allBill.length === 0) {
              res.status(400).json({ ok: false, message: "Không tìm thấy bill nào!" });
          }
          res.json({ ok: true, message: "Get all bills successfully!", data: allBill });
      }
      res.status(400).json({ ok: false, message: "Không tìm thấy bill nào!" });
  } catch (error) {
      res.status(500).json({
          ok: false,
          message: "Somthing went wrong"
      });
  } finally {
      async() =>
      await prisma.$disconnect()
  }
}

module.exports.findAllByParentId = async function(req, res) {
  try {
      if (!req.params.id) {
          res.status(400).json({
              ok: false,
              error: "Please enter parentId!"
          });
      }
      const parent = await prisma.parent.findUnique({
          where: { id: Number(req.params.id) }
      });
      if (!parent) {
          res.status(400).json({
              ok: false,
              error: "Phụ huynh không tồn tại!"
          });
      }
      const bill = await prisma.bill.findMany({
          where: { parentId: Number(req.params.id) },
          include: {
              bill_mapping_history: true,
          }
      });
      if (bill.length === 0) {
          res.status(400).json({
              ok: false,
              error: "Không tìm thấy bill nào!"
          });
      }
      res.json({ ok: true, message: "Get bill successfully!", data: bill });
  } catch (error) {
      res.status(500).json({
          ok: false,
          error: "Something went wrong!"
      });
  } finally {
      async() =>
      await prisma.$disconnect()
  }
}
