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

module.exports.findById = async function(req, res) {
  try {
      const bill = await prisma.bill.findUnique({
          where: { id: req.params.id },
          include: {
              bill_mapping_history: true,
          }
      })
      if (!bill) {
          throw new Error()
      }
      res.json({ ok: true, message: "Get bill successfully!", data: bill });
  } catch (error) {
      res.status(500).json({
          ok: false,
          error: "Bill does not exist!"
      });
  } finally {
      async() =>
      await prisma.$disconnect()
  }
}

module.exports.newBill = async function(req, res) {
  try {
      if (req.body.listInvoice.length === 0) {
          return res.status(400).json({
              ok: false,
              message: "Please enter list invoice!"
          });
      }
      var userId = req.user.id;
      var listInvoice = req.body.listInvoice;
      var listInvoiceDetail = [];
      var listInvoiceDaThu = [];
      var amount = 0;
      var invoiceError = [];
      var flag = true;

      //list invoice bi trung
      for (let index = 0; index < listInvoice.length - 1; index++) {
          for (let j = index + 1; j < listInvoice.length; j++) {
              if (listInvoice[index] === listInvoice[j]) {
                  return res.status(400).json({
                      ok: false,
                      message: "Có hóa đơn bị trùng!",
                  });
              }
          };
      };
      //find invoice ko ton tai trong invoice_mapping
      for (let index = 0; index < listInvoice.length; index++) {
          let invoice = await prisma.invoice_mapping.findUnique({
              where: {
                  invoiceId: listInvoice[index],
              },

          });
          if (!invoice) {
              invoiceError.push(listInvoice[index]);
          };
      }

      if (!(invoiceError.length === 0)) {
          return res.status(400).json({
              ok: false,
              message: "Những hóa đơn sau không tồn tại!",
              data: invoiceError
          });
      };

      //find invoice da thu
      for (let index = 0; index < listInvoice.length; index++) {
          let invoice = await prisma.invoice.findUnique({
              where: {
                  id: listInvoice[index],
              },

          });
          if (invoice.updateDate) {
              listInvoiceDaThu.push(listInvoice[index]);
          };
      }

      if (!(listInvoiceDaThu.length === 0)) {
          return res.status(400).json({
              ok: false,
              message: "Những hóa đơn sau đã thanh toán!",
              data: listInvoiceDaThu
          });
      };

      // tra ve loi neu list invoice khong cung mot hoc sinh
      for (let index = 0; index < listInvoice.length; index++) {
          let invoiceDetail = await prisma.invoice_mapping.findUnique({
              where: {
                  invoiceId: listInvoice[index],
              },
          })
          listInvoiceDetail.push(invoiceDetail);
      };

      for (let index = 0; index < listInvoiceDetail.length; index++) {
          if (!(listInvoiceDetail[index].bhyt === listInvoiceDetail[0].bhyt)) {
              invoiceError.push(listInvoice[index]);
          }
      };
      if (!(invoiceError.length === 0)) {
          return res.status(400).json({
              ok: false,
              message: "Hóa đơn không cùng một học sinh!",
              data: invoiceError
          });
      };

      // find MST
      const invoice = await prisma.invoice_mapping.findUnique({
          where: { invoiceId: listInvoice[0] },
          include: {
              student: true,
          },
      });
      const school = await prisma.school.findUnique({
          where: { id: invoice.student.schoolId }
      });
      const parent = await prisma.parent.findUnique({
          where: { accountId: userId }
      });

      // khong phai phu huynh cua invoice
      if (!(parent.id === invoice.student.parentId)) {
          return res.status(400).send({
              ok: false,
              error: "Bạn không phải phụ huynh của những invoice này!"
          });
      }

      // tinh amount bill bang api thanhnhat
      // for (let index = 0; index < listInvoice.length; index++) {
      //   let invoice = await instance.post('/api/banks/laydsdathu', {
      //     INVOIDID: listInvoice[index]
      //   }, global.options);
      //   var num = Number(invoice.data.data.SOTIEN);
      //   amount = amount + num;
      // }

      // tinh amount bill bang invoice
      for (let index = 0; index < listInvoice.length; index++) {
          let invoice = await prisma.invoice.findUnique({
              where: {
                  id: listInvoice[index],
              },
          });
          amount = amount + Number(invoice.ammount);
      }

      // create bill ID

      // count bill of this user
      const aggregations = await prisma.bill.aggregate({
          where: {
              parentId: parent.id
          },
          count: {
              id: true
          }
      });
      var billId = parent.id + "Bill" + (aggregations.count.id + 1);

      // create bill
      const bill = await prisma.bill.create({
          data: {
              id: billId,
              amount: amount,
              status: "pending",
              MST: school.MST,
              parentId: parent.id
          },
      });

      // add bill and invoce to bill_mapping History
      for (let index = 0; index < listInvoice.length; index++) {
          let billMappingHistory = await prisma.bill_mapping_history.create({
              data: {
                  billId: bill.id,
                  invoiceId: listInvoice[index],
                  status: "pending"
              }
          });
      }

      // update billID in invoice_mapping
      var updateInvoice = async() => {
          var total = 0;
          for (let index = 0; index < listInvoice.length; index++) {
              const updateInvoice = await prisma.invoice_mapping.update({
                  where: {
                      invoiceId: listInvoice[index],
                  },
                  data: {
                      billId: billId,
                  },
              })
          };
      };
      // update amount in bill
      updateInvoiceMaping = await updateInvoice();

      // create transactions
      var billcode = billId;

      // object merchant_code
      var merchant = await prisma.merchant_code_key.findUnique({
          where: {
              schoolId: school.id
          }
      });

      var data = merchant.access_code + billcode + "PAYMENT" + merchant.merchant_code + billId +
          amount + "2.0";
      var check_sum = String(crypto.createHmac('SHA1', merchant.hash_key).update(data).digest('base64'));
      const transaction = await prisma.transaction.create({
          data: {
              billcode: billcode,
              desc: "thanh toan hoa hoa don " + bill.createDate,
              merchant_code: merchant.merchant_code,
              amount: amount,
              check_sum: check_sum,
              order_id: billId,
              login_msisdn: parent.phone
          },
      });

      res.json({
          ok: true,
          message: "Create bill successfully!",
          bill: bill,
          trans: transaction
      });
  } catch (error) {
      res.status(400).json({
          ok: false,
          error: "Something went wrong!"
      });
  } finally {
      async() =>
      await prisma.$disconnect()
  }
}

module.exports.newBillNoToken = async function(req, res) {
  try {
      if (req.body.listInvoice.length === 0) {
          return res.status(400).json({
              ok: false,
              message: "Please enter list invoice!"
          });
      }
      if (!req.body.phone) {
          return res.status(400).json({
              ok: false,
              message: "Please enter phone number!"
          });
      }
      var listInvoice = req.body.listInvoice;
      var phone = req.body.phone;
      var listInvoiceDetail = [];
      var listInvoiceDaThu = [];
      var amount = 0;
      var invoiceError = [];
      var flag = true;

      //list invoice bi trung
      for (let index = 0; index < listInvoice.length - 1; index++) {
          for (let j = index + 1; j < listInvoice.length; j++) {
              if (listInvoice[index] === listInvoice[j]) {
                  return res.status(400).json({
                      ok: false,
                      message: "Có hóa đơn bị trùng!",
                  });
              }
          };
      };
      //find invoice ko ton tai trong invoice_mapping
      for (let index = 0; index < listInvoice.length; index++) {
          let invoice = await prisma.invoice_mapping.findUnique({
              where: {
                  invoiceId: listInvoice[index],
              },

          });
          if (!invoice) {
              invoiceError.push(listInvoice[index]);
          };
      }

      if (!(invoiceError.length === 0)) {
          return res.status(400).json({
              ok: false,
              message: "Những hóa đơn sau không tồn tại!",
              data: invoiceError
          });
      };

      //find invoice da thu
      for (let index = 0; index < listInvoice.length; index++) {
          let invoice = await prisma.invoice.findUnique({
              where: {
                  id: listInvoice[index],
              },

          });
          if (invoice.updateDate) {
              listInvoiceDaThu.push(listInvoice[index]);
          };
      }

      if (!(listInvoiceDaThu.length === 0)) {
          return res.status(400).json({
              ok: false,
              message: "Những hóa đơn sau đã thanh toán!",
              data: listInvoiceDaThu
          });
      };

      // tra ve loi neu list invoice khong cung mot hoc sinh
      for (let index = 0; index < listInvoice.length; index++) {
          let invoiceDetail = await prisma.invoice_mapping.findUnique({
              where: {
                  invoiceId: listInvoice[index],
              },
          })
          listInvoiceDetail.push(invoiceDetail);
      };

      for (let index = 0; index < listInvoiceDetail.length; index++) {
          if (!(listInvoiceDetail[index].bhyt === listInvoiceDetail[0].bhyt)) {
              invoiceError.push(listInvoice[index]);
          }
      };
      if (!(invoiceError.length === 0)) {
          return res.status(400).json({
              ok: false,
              message: "Hóa đơn không cùng một học sinh!",
              data: invoiceError
          });
      };

      // find MST
      const invoice = await prisma.invoice_mapping.findUnique({
          where: { invoiceId: listInvoice[0] },
          include: {
              student: true,
          },
      });
      const school = await prisma.school.findUnique({
          where: { id: invoice.student.schoolId }
      });
      const parent = await prisma.parent.findUnique({
          where: { id: invoice.student.parentId }
      });

      // tinh amount bill bang api thanhnhat
      // for (let index = 0; index < listInvoice.length; index++) {
      //     let invoice = await instance.post('/api/banks/laydsdathu', {
      //         INVOIDID: listInvoice[index]
      //     }, global.options);
      //     var num = Number(invoice.data.data.SOTIEN);
      //     amount = amount + num;
      // }

      // tinh amount bill bang invoice
      for (let index = 0; index < listInvoice.length; index++) {
          let invoice = await prisma.invoice.findUnique({
              where: {
                  id: listInvoice[index],
              },
          });
          amount = amount + Number(invoice.ammount);
      }

      // create bill ID

      // count bill of this user
      const aggregations = await prisma.bill.aggregate({
          where: {
              parentId: parent.id
          },
          count: {
              id: true
          }
      });
      var billId = parent.id + "Bill" + (aggregations.count.id + 1);

      // create bill
      const bill = await prisma.bill.create({
          data: {
              id: billId,
              amount: amount,
              status: "pending",
              MST: school.MST,
              parentId: parent.id
          },
      });

      // add bill and invoce to bill_mapping History
      for (let index = 0; index < listInvoice.length; index++) {
          let billMappingHistory = await prisma.bill_mapping_history.create({
              data: {
                  billId: bill.id,
                  invoiceId: listInvoice[index],
                  status: "pending"
              }
          });
      }

      // update billID in invoice_mapping
      var updateInvoice = async() => {
          var total = 0;
          for (let index = 0; index < listInvoice.length; index++) {
              const updateInvoice = await prisma.invoice_mapping.update({
                  where: {
                      invoiceId: listInvoice[index],
                  },
                  data: {
                      billId: billId,
                  },
              })
          };
      };
      // update amount in bill
      updateInvoiceMaping = await updateInvoice();

      // create transactions
      var billcode = billId;

      // object merchant_code
      var merchant = await prisma.merchant_code_key.findUnique({
          where: {
              schoolId: school.id
          }
      });

      var data = merchant.access_code + billcode + "PAYMENT" + merchant.merchant_code + billId +
          amount + "2.0";
      var check_sum = String(crypto.createHmac('SHA1', merchant.hash_key).update(data).digest('base64'));
      const transaction = await prisma.transaction.create({
          data: {
              billcode: billcode,
              desc: "thanh toan hoa hoa don " + bill.createDate,
              merchant_code: merchant.merchant_code,
              amount: amount,
              check_sum: check_sum,
              order_id: billId,
              login_msisdn: phone
          },
      });

      res.json({
          ok: true,
          message: "Create bill successfully!",
          bill: bill,
          trans: transaction
      });
  } catch (error) {
      res.status(400).json({
          ok: false,
          error: "Something went wrong!"
      });
  } finally {
      async() =>
      await prisma.$disconnect()
  }
}
