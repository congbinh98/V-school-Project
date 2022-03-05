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
module.exports.getResult = async function(req, res) {
  try {
      var billcode = req.body.billcode;
      var cust_msisdn = req.body.cust_msisdn;
      var error_code = req.body.error_code;
      var merchant_code = req.body.merchant_code;
      var order_id = req.body.order_id;
      var payment_status = req.body.payment_status;
      var trans_amount = req.body.trans_amount;
      var vt_transaction_id = req.body.vt_transaction_id;
      var check_sum = req.body.check_sum;

      var error_code_check = "01";


      if (!(billcode === order_id)) {
          return res.status(400).json({
              error_code: error_code_check
          });
      }
      // check merchant code ton tai trong DB
      const merchant = await prisma.merchant_code_key.findUnique({ where: { merchant_code: merchant_code } });
      if (!merchant) {
          return res.status(400).json({
              error_code: error_code_check
          });
      }
      // check bill active
      const bill = await prisma.bill.findUnique({
          where: { id: order_id }
      })
      if (bill) {
          if (!(bill.status === "pending")) {
              return res.status(400).json({
                  error_code: error_code_check
              });
          }
      } else {
          return res.status(400).json({
              error_code: error_code_check
          });
      }
      //neu giao dich thanh cong
      if (error_code === "00") {

          const trans = await prisma.transaction.findUnique({
                  where: { billcode: billcode }
              })
              // Object merchant_code
              // check match check_sum
          var data = merchant.access_code + trans.billcode + cust_msisdn + error_code +
              merchant.merchant_code + trans.order_id + payment_status +
              trans.amount + vt_transaction_id;
          console.log(data);
          console.log(crypto.createHmac('SHA1', merchant.hash_key).update(data).digest('base64'));
          if (check_sum === String(crypto.createHmac('SHA1', merchant.hash_key).update(data).digest('base64'))) {
              error_code_check = "00";
          };
          // neu checksum dung
          if (error_code_check === "00") {
              // update transaction infor
              const transUpdate = await prisma.transaction.update({
                  where: {
                      billcode: billcode
                  },
                  data: {
                      error_code: error_code,
                      payment_status: payment_status,
                      vt_transaction_id: vt_transaction_id,
                      login_msisdn: cust_msisdn
                  },
              });

              // update bill success
              var status = "success";
              const updateBill = await prisma.bill.update({
                  where: {
                      id: trans.order_id,
                  },
                  data: {
                      status: status,
                  },
              });

              //list invoice
              const bill_mapping_history = await prisma.bill_mapping_history.findMany({
                  where: {
                      billId: billcode
                  }
              });
              var updateInvoiceDathu = async() => {
                  for (let index = 0; index < bill_mapping_history.length; index++) {
                      const updateInvoice = await prisma.invoice.update({
                          where: {
                              id: bill_mapping_history[index].invoiceId,
                          },
                          data: {
                              updateDate: updateBill.updateDate,
                          },
                      });
                      const updateBillMapping = await prisma.bill_mapping_history.updateMany({
                          where: {
                              billId: billcode,
                          },
                          data: {
                              status: "success",
                          },
                      });
                  };
              };
              // update da thu trong invoice
              updateInvoice = await updateInvoiceDathu();

              data = merchant.access_code + error_code_check + merchant.merchant_code + trans.order_id;
              var check_sum_result = crypto.createHmac('SHA1', merchant.hash_key).update(data).digest('base64');

              res.json({
                  error_code: "00",
                  merchant_code: merchant_code,
                  order_id: order_id,
                  return_url: "",
                  return_bill_code: "",
                  return_other_info: "",
                  check_sum: check_sum_result
              });
          } else {
              return res.status(400).json({
                  error_code: error_code_check
              });
          }
      } else {
          //neu giao dich k thanh cong

          const trans = await prisma.transaction.findUnique({
                  where: { billcode: billcode }
              })
              // check match check_sum
          var data = merchant.access_code + trans.billcode + trans.login_msisdn + error_code +
              merchant.merchant_code + trans.order_id + payment_status +
              trans.amount + vt_transaction_id;
          console.log(crypto.createHmac('SHA1', merchant.hash_key).update(data).digest('base64'));
          if (check_sum === String(crypto.createHmac('SHA1', merchant.hash_key).update(data).digest('base64'))) {
              error_code_check = "00";
          };
          // neu checksum dung
          if (error_code_check === "00") {

              // update bill cancel
              const updateBill = await prisma.bill.update({
                  where: {
                      id: trans.order_id,
                  },
                  data: {
                      status: "cancel",
                  },
              });

              //cap nhat transaction
              const transUpdate = await prisma.transaction.update({
                  where: {
                      billcode: billcode
                  },
                  data: {
                      error_code: error_code,
                      payment_status: payment_status,
                      vt_transaction_id: vt_transaction_id
                  },
              });

              data = merchant.access_code + "00" + merchant.merchant_code + trans.order_id;
              var check_sum_result = crypto.createHmac('SHA1', merchant.hash_key).update(data).digest('base64');
              res.json({
                  error_code: "00",
                  merchant_code: merchant_code,
                  order_id: order_id,
                  return_url: "",
                  return_bill_code: "",
                  return_other_info: "",
                  check_sum: check_sum_result
              });
          } else {
              return res.status(400).json({
                  error_code: error_code_check
              });
          }


      }

  } catch (error) {
      res.status(500).send({
          error_code: "01"
      });

  } finally {
      async() =>
      await prisma.$disconnect()
  }
}
module.exports.queryTrans = async function(req, res) {
  try {
      var merchant_code = req.body.merchant_code;
      var order_id = req.body.order_id;
      var check_sum = req.body.check_sum;
      var error_code_check = "01";
      // find merchant in DB
      const merchant = await prisma.merchant_code_key.findUnique({ where: { merchant_code: merchant_code } })
      if (!(merchant_code === merchant.merchant_code)) {
          return res.status(400).json({
              error_code: error_code_check
          });
      }

      const trans = await prisma.transaction.findUnique({
              where: { billcode: order_id }
          })
          // find object by merchant_code in db
      if (trans) {
          // check match check_sum
          var data = merchant.access_code + merchant.merchant_code + trans.order_id;

          console.log(crypto.createHmac('SHA1', merchant.hash_key).update(data).digest('base64'));

          // neu checksum dung'
          if (check_sum === String(crypto.createHmac('SHA1', merchant.hash_key).update(data).digest('base64'))) {
              //neu da lu giao dich thanh cong
              if (!(trans.payment_status === "-1")) {

                  data = merchant.access_code + "00" + merchant.merchant_code + trans.order_id;
                  var check_sum_result = String(crypto.createHmac('SHA1', merchant.hash_key).update(data).digest('base64'));
                  res.json({
                      error_code: "00",
                      merchant_code: merchant_code,
                      order_id: order_id,
                      return_url: "",
                      return_bill_code: "",
                      return_other_info: "",
                      check_sum: check_sum_result
                  });
              } else {
                  //luu ket qua giao dich that bai
                  data = merchant.access_code + "01" + merchant.merchant_code + trans.order_id;
                  var check_sum_result = String(crypto.createHmac('SHA1', merchant.hash_key).update(data).digest('base64'));
                  res.json({
                      error_code: "01",
                      merchant_code: merchant_code,
                      order_id: order_id,
                      return_url: "",
                      return_bill_code: "",
                      return_other_info: "",
                      check_sum: check_sum_result
                  });
              }
          } else {
              //checksum sai
              return res.status(400).json({
                  error_code: error_code_check
              });
          }
      } else {
          //trans ko ton tai
          return res.status(400).json({
              error_code: error_code_check
          });
      }
  } catch (error) {
      res.status(500).json({
          error_code: "01"
      });

  } finally {
      async() =>
      await prisma.$disconnect()
  }
}
